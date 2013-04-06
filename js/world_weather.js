  var velocity = [.008, -.002],
    t0 = Date.now(),
    projection,
    cities,
    svg,
    path,
    φ,
    λ,
    down,
    stepInterval = null;
  
  function init() { 
    var width = 800,
      height = 750;
      
    projection = d3.geo.orthographic()
      .scale(240)
      .translate([width / 2, height / 2.9])
      .clipAngle(90)
      .precision(0);
    
    path = d3.geo.path()
      .projection(projection);
    
    λ = d3.scale.linear()
      .domain([0, width])
      .range([-180, 180]);
    
    φ = d3.scale.linear()
      .domain([0, height])
      .range([90, -90]);
  
    svg = d3.select("#map").append("svg")
      .attr("width", width)
      .attr("height", height);
    
    down = false;
    svg.on('mousedown', function() {
      down = true;
    });
    
    svg.on('mouseup', function() {
      down = false;
    });
    
    svg.on("mousemove", function() {
      if (!down) return;
      var p = d3.mouse(this);
      projection.rotate([λ(p[0]), φ(p[1])]);
      d3.selectAll("circle")
        .attr("transform", function(d) {return "translate(" + projection([d.geometry.coordinates[0],d.geometry.coordinates[1]]) + ")";  })
        .attr('d', updateLine)
      svg.selectAll("path").attr("d", path);
    });
   
    // mousewheel scroll
    $('#map').mousewheel(function (event, delta, deltaX, deltaY) {
      var s = projection.scale();
      if (delta > 0) {
        projection.scale(s * 1.1);
      }
      else {
        projection.scale(s * 0.9);
      }
      svg.selectAll("path").attr("d", path);
    });
    
    addGeoms();
  }
    
  /*
   * 
   * Add world countries
   * 
   */
  function addGeoms() {
    //add countries
    d3.json("world-110m.json", function(error, world) {
      svg.append("path")
        .datum(topojson.object(world, world.objects.land))
        .attr("class", "land")
        .attr("d", path)
        .attr("d", temps);
    });
  }
  
  
  /*
   * Add cities to the map
   * 
   */
  function temps() {
    var group = svg.append('g');
    
    $.ajax({
      dataType: "json",
      url: "http://localhost:3000/temperatures",
      //url: "http://www.brendansweather.com/temperatures",
      success: function(collection) {
        cities = group.selectAll('path')
          .data(collection)
        .enter().append('path')
          .style('fill', styler)
          .on('mouseover', function(d) { 
            if (stepInterval) {
              clearInterval(stepInterval);
              stepInterval = null;
            }
            d3.select(this)
              .attr('d', hover);
          })
          .on('mouseout', function( d ) {
            step();
          });
        
        //set initial location of map
        projection.rotate([λ(550), φ(390)]);
        svg.selectAll("path").attr("d", path);
        
        setTimer();
        selectOne();
        step();
        createLegend();
      }
    });
  }
  
  /*
   * 
   * Interactions - on hover / on exit
   * 
   */
  function hover( d ) {
    exit();
    
    if (stepInterval) {
      $('#info-window').hide();
      d3.selectAll('.tip-line').remove();
    }
    
    var circle = svg.append("g")
      .attr("class", "circles")
    .selectAll("circle")
      .data([d])
    .enter().append("circle")
      .attr("transform", function(d) {return "translate(" + projection([d.geometry.coordinates[0],d.geometry.coordinates[1]]) + ")";})
      .attr("fill", styler)
      .attr('class', 'hover')
      .attr('r', 1)
      .style("fill-opacity", 0)
      .transition()
        .duration(700)
        .attr('r', 17)
        .style("fill-opacity", 0.3)
      .transition()
        .duration(400)
        .attr('r', 8)
        .style("fill-opacity", 0.5);
      
     var x2 = projection([d.geometry.coordinates[0],d.geometry.coordinates[1]])[0] + Math.floor(Math.random()*10) + 1;
    var y2 = projection([d.geometry.coordinates[0],d.geometry.coordinates[1]])[1] + Math.floor(Math.random()*40) + 25;
    
    var line = svg.append("svg:line")
      .attr('class', 'tip-line')
      .style("stroke", styler(d))
      .attr("x1", projection([d.geometry.coordinates[0],d.geometry.coordinates[1]])[0])
      .attr("y1", projection([d.geometry.coordinates[0],d.geometry.coordinates[1]])[1])
      .attr("x2", projection([d.geometry.coordinates[0],d.geometry.coordinates[1]])[0])
      .attr("y2", projection([d.geometry.coordinates[0],d.geometry.coordinates[1]])[1])
      .transition()
        .duration(1300)
        .attr("x2", x2)
        .attr("y2", y2);
      
    
    var city = d.properties.city;
    var temp = Math.floor(d.properties.temperature);
    var weather = d.properties.weather;
    $('#info-window').html( '<span class="city">' + city +' </span><span class="temp"> ' + temp + '&deg; </span><br /><span class="weather-info">'+weather+'</span>' ).css({'left' : (x2 + 160) + 'px', 'top' : (y2 - 5) + 'px'}).delay(500).fadeIn(1500);
    
    svg.selectAll("path").attr("d", path);
    
    if (!stepInterval) {
      setTimeout(function() {
        exit();
      },4000);
    }
  }
  
  function exit() {
    d3.selectAll('.hover')
      .transition()
        .style("fill-opacity", 0)
        .duration(2000)
        .remove();
    d3.selectAll('.tip-line')
      .transition()
        .style("stroke-opacity", 0)
        .duration(900)
        .remove();
    $('#info-window').fadeOut(600);
  }
  
  /*
   * 
   * Styler 
   * 
   */
  function styler( data ) {
    var temp = data.properties.temperature;
    var colors = ["rgb(78,0,0)", "rgb(103,0,31)", "rgb(178,24,43)", "rgb(214,96,77)", "rgb(244,165,130)", "rgb(253,219,199)", "rgb(247,247,247)", "rgb(209,229,240)", "rgb(146,197,222)", "rgb(67,147,195)", "rgb(33,102,172)", "rgb(5,48,97)"] 
    colors = colors.reverse();
    var color;
    
    switch ( true ) {
      case ( temp < -10 ) :
        color = colors[0];
        break;
      case ( temp < 0 ) :
        color = colors[1];
        break;
      case ( temp < 15 ) : 
        color = colors[2]
        break;
      case ( temp < 30 ) : 
        color = colors[3]
        break;
      case ( temp < 40 ) : 
        color = colors[4]
        break;
      case ( temp < 50 ) : 
        color = colors[5]
        break;
      case ( temp < 50 ) : 
        color = colors[6]
        break;
      case ( temp < 60 ) : 
        color = colors[7]
        break;
      case ( temp < 70 ) : 
        color = colors[8]
        break;
      case ( temp < 80 ) : 
        color = colors[9]
        break;
      case ( temp > 80 ) : 
        color = colors[10]
        break;
    }
    return color;
  }
  
  /*
   * Handles rotating globe
   * 
   * 
   */
  //TODO fix d="" errors when spinning (has to do with clipping?)
  function setTimer() {
    d3.timer(function() {
      var t = Date.now() - t0,
          o = [λ(450) + velocity[0] * t, φ(450) + velocity[1] * 1];
          //o = [origin[0] + velocity[0] * t, origin[1] + velocity[1] * t];
      
      if (!down) {
        projection.rotate(o);
        d3.selectAll("circle")
          .attr("transform", function(d) {return "translate(" + projection([d.geometry.coordinates[0],d.geometry.coordinates[1]]) + ")";  })
          .attr('d', updateLine)
        svg.selectAll("path").attr("d", path);
      }
    });
  }
  
  function updateLine(d) {
    d3.selectAll("line")
      .attr("x1", projection([d.geometry.coordinates[0],d.geometry.coordinates[1]])[0])
      .attr("y1", projection([d.geometry.coordinates[0],d.geometry.coordinates[1]])[1])
  }
  
  /*
   * Steps through cities
   * 
   */
  //TODO only highlight cities that are visible, not clipped
  function step() {
    stepInterval = window.setInterval(function() {
      var i = 0;
      var len = cities[0].length;
      var sel = Math.floor((Math.random()*len)+1);
      
      if (!down) {
      d3.select('g').selectAll('path')
        .attr('d', function(d) {
          i++;
          if (i == sel) {
            hover(d);
            var city = d3.select(this).data()[0].properties.city;
            var temp = d3.select(this).data()[0].properties.temperature;
            svg.selectAll("path").attr("d", path);
          }
        });
      }
    },4000)
  }
  
  function selectOne() {
    var i = 0;
    var len = cities[0].length;
    var sel = Math.floor((Math.random()*len)+1);
    
    if (!down) {
    d3.select('g').selectAll('path')
      .attr('d', function(d) {
        i++;
        if (i == sel) {
          hover(d);
          var city = d3.select(this).data()[0].properties.city;
          var temp = d3.select(this).data()[0].properties.temperature;
          svg.selectAll("path").attr("d", path);
        }
      });
    }
  }
  
  /*
   * Basic legend
   * 
   */
  function createLegend() {
    var colors = ["rgb(78,0,0)", "rgb(103,0,31)", "rgb(178,24,43)", "rgb(214,96,77)", "rgb(244,165,130)", "rgb(253,219,199)", "rgb(247,247,247)", "rgb(209,229,240)", "rgb(146,197,222)", "rgb(67,147,195)", "rgb(33,102,172)", "rgb(5,48,97)"]
    colors = colors.reverse();
    
    $.each(colors, function(i, color) {
      var div = '<div class="color" style="background:'+color+'"></div>';
      $('#legend').append(div);
    });
  }