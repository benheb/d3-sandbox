var width = 730,
    height = 600,
    velocity = [.008, -.002],
    t0 = Date.now();

function initSnowTotals() {

  var projection = d3.geo.albers()
      .rotate([104, 1])
      .center([0, 41])
      .scale(6000)
      .translate([width / 2, height / 2])
      .precision(.1);
      
  var path = d3.geo.path()
      .projection(projection);
  
  var graticule = d3.geo.graticule()
      .extent([[-98 - 45, 38 - 45], [-98 + 45, 38 + 45]])
      .step([5, 5]);
  
  var svg = d3.select("#snow-totals-03-23-13").append("svg")
      .attr("width", width)
      .attr("height", height)
      .call(d3.behavior.zoom()
        .translate(projection.translate())
        .scale(projection.scale())
        .on("zoom", redraw));
  
  svg.append("path")
      .datum(graticule)
      .attr("class", "graticule")
      .attr("d", path);
  
  d3.json("/data/us.json", function(error, us) {
    svg.insert("path", ".graticule")
        .datum(topojson.object(us, us.objects.land))
        .attr("class", "land")
        .attr("d", path)
  
    svg.insert("path", ".graticule")
        .datum(topojson.mesh(us, us.objects.counties, function(a, b) { return a !== b && !(a.id / 1000 ^ b.id / 1000); }))
        .attr("class", "county-boundary")
        .attr("d", path);
  
    svg.insert("path", ".graticule")
        .datum(topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
        .attr("class", "state-boundary")
        .attr("d", path);
  });
  
  var circle;
  d3.json("/data/snow_totals_032313.json", function(error, data) {
    circle = svg.append("g")
    .attr("class", "circles")
    .selectAll("circle")
      .data( data.features )
    .enter().append("circle")
      .attr("stroke", "#00E5EE")
      .attr("stroke-width", 3)
      .attr("fill", '#fff')
      .attr("transform", function(d) { 
          return "translate(" + projection(d.geometry.coordinates) + ")"; 
      })
      .attr('r', function(d) { return d.properties.report.amount })
      .on('mouseover', function(d) {
        d3.select(this)
          .transition()
            .attr('r', function(d) {return d.properties.report.amount + 4})
            
          var city = d3.select(this).data()[0].properties.report.location;
          var amount = d3.select(this).data()[0].properties.report.amount;
          var county = d3.select(this).data()[0].properties.report.county;
          $('#blurb').hide();
          $('#infowin-totals').html( city + ': ' + amount + '"' );
          $('#infowin-county').html( county + ' County, CO' );
      })
      .on('mouseout', function(d) {
        d3.select(this) 
          .transition()
            .attr('r', function(d) { return d.properties.report.amount })
      });
  });
  
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
  
  var down = false;
  svg.on('mousedown', function() {
    down = true;
  });
  
  svg.on('mouseup', function() {
    down = false;
  });
  
  svg.on('mousemove', function() {
    if (!down) return;
    redraw();
  });
  
  
  function redraw() {
    if (d3.event) {
      projection
        .translate(d3.event.translate)
        .scale(d3.event.scale);
    }
    svg.selectAll("path").attr("d", path);
    d3.selectAll('circle')
      .attr("transform", function(d) { 
        return "translate(" + projection(d.geometry.coordinates) + ")"; 
      })
  }
  
}