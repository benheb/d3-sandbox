  var width = 650,
    height = 750,
    velocity = [.008, -.002],
    t0 = Date.now();
  
  var scales = {
    "armadillo" : 185,
    "azimuthalEqualArea" : 185,
    "lagrange" : 200,
    "orthographic" : 285, 
    "eisenlohr" : 285
  }
    
  function init() { 
    var projection = d3.geo.orthographic()
    //var projection = d3.geo.eisenlohr()
        .scale(285)
        .translate([width / 2, height / 2.5])
        .clipAngle(90)
        .precision(0);
    
    var path = d3.geo.path()
        .projection(projection);
    
    var λ = d3.scale.linear()
        .domain([0, width])
        .range([-180, 180]);
    
    var φ = d3.scale.linear()
        .domain([0, height])
        .range([90, -90]);
    
    var svg = d3.select("body").append("svg")
        .attr("width", width)
        .attr("height", height);
    
    /*
    var down = false;
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
      svg.selectAll("path").attr("d", path);
    });
    */
   
    $(window).mousewheel(function (event, delta, deltaX, deltaY) {
      var s = projection.scale();
      if (delta > 0) {
        projection.scale(s * 1.1);
      }
      else {
        projection.scale(s * 0.9);
      }
      svg.selectAll("path").attr("d", path);
    });
    
    //change projection
    /*
    d3.select("select").on("change", function() {
      projection = d3.geo[this.value]()
        .scale(scales[this.value])
        .translate([width / 2, height / 2.5])
        .clipAngle(90)
        .rotate([λ(450), φ(390)]);
        
      path = d3.geo.path()
        .projection(projection);
      
      svg.selectAll("path")
        .transition()
          .duration(300)
          .attr("d", path);
    });
    */
   
    //add countries
    d3.json("world-110m.json", function(error, world) {
      svg.append("path")
        .datum(topojson.object(world, world.objects.land))
        .attr("class", "land")
        .attr("d", path)
        .attr("d", temps);
    });
    
    function temps() {
      var group = svg.append('g');
      
      $.ajax({
        dataType: "json",
        //url: "../sandbox/data/temperatures",
        url: "http://www.brendansweather.com/temperatures",
        success: function(collection) {
          //console.log('features!', collection)
         
          group.selectAll('path')
            .data(collection)
          .enter().append('path')
            .style('fill', styler)
            .on('mouseover', function(d) { 
              d3.select(this)
                .attr('d', hover);
                
              var city = d3.select(this).data()[0].properties.city;
              var temp = d3.select(this).data()[0].properties.temperature;
              $('#info-window').html( '<span class="city">' + city +' </span><span class="temp"> ' + temp + '&deg; </span>' ).show();
              svg.selectAll("path").attr("d", path);
              
            })
            .on('mouseout', function(d) {
              d3.select(this)
                .attr('d', exit); 
              $('#infowin').css('display', 'none');
              svg.selectAll("path").attr("d", path);
            });
          
          //set initial location of map
          projection.rotate([λ(450), φ(390)]);
          svg.selectAll("path").attr("d", path);
          
          setTimer();
        }
      });
    }
    
    function hover(d) {
      
      var circle = svg.append("g")
        .attr("class", "circles")
      .selectAll("circle")
        .data([d])
      .enter().append("circle")
        .attr("transform", function(d) {return "translate(" + projection([d.geometry.coordinates[0],d.geometry.coordinates[1]]) + ")";})
        .attr("fill", styler)
        //.transition()
        //  .duration(100)
          .attr('class', 'hover')
          .attr('r', 10)
          .style("fill-opacity", 0.5)
    }
    
    function exit() {
      d3.selectAll('.hover')
        .transition()
          .style("fill-opacity", 0)
          .duration(1500)
          .remove();
    }
    
    function styler(data) {
      
      var temp = data.properties.temperature;
      var colors = ["rgb(103,0,31)", "rgb(178,24,43)", "rgb(214,96,77)", "rgb(244,165,130)", "rgb(253,219,199)", "rgb(247,247,247)", "rgb(209,229,240)", "rgb(146,197,222)", "rgb(67,147,195)", "rgb(33,102,172)", "rgb(5,48,97)"] 
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
    
    function setTimer() {
      d3.timer(function() {
        var t = Date.now() - t0,
            o = [λ(450) + velocity[0] * t, φ(450) + velocity[1] * 1];
            //o = [origin[0] + velocity[0] * t, origin[1] + velocity[1] * t];
        projection.rotate(o);
        d3.selectAll("circle")
          .attr("transform", function(d) {return "translate(" + projection([d.geometry.coordinates[0],d.geometry.coordinates[1]]) + ")";})
        svg.selectAll("path").attr("d", path);
      });
    }
  }