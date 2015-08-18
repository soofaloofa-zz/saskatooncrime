define(function(require) {
  var d3 = require('d3');
  var queue = require('queue');
  var colorbrewer = require('colorbrewer');

  var width = 880;
  var height = 800;

  // Create SVG element
  var svg = d3.select("#map")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

  // Create an initial projection and path
  var projection = d3.geo.albers().scale(1).translate([0, 0]);
  var path = d3.geo.path().projection(projection);

  queue()
    .defer(d3.json, 'data/saskatoon-geo.json')
    .defer(d3.csv, 'data/crimes-year-neighbourhood.csv')
    .await(visualize);

  function visualize(error, geojson, data) {
    // Center the map:
    // http://stackoverflow.com/questions/14492284/center-a-map-in-d3-given-a-geojson-object
    var b = path.bounds(geojson);  // Compute the bounds of the feature
    var s = 0.95 / Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height);  // Compute scale by comparing aspect ratio
    var t = [(width - s * (b[1][0] + b[0][0])) / 2, (height - s * (b[1][1] + b[0][1])) / 2];  // Translate to center of bouding box

    // Update projection using correct scale and translation
    projection.scale(s).translate(t);


    // Merge crime data with GeoJSON data
    // Value of the GeoJSON property will hold an array of Year/Crimes,
    for (var i = 0; i < geojson.features.length; i++) {
      geojson.features[i].properties.Value = [];
      for (var j = 0; j < data.length; j++) {
        var dataNeighbourhood = data[j].Neighbourhood;
        var dataCrimes = parseInt(data[j].Crimes);
        var dataYear = parseInt(data[j].Year.split("-")[0]);

        if (dataNeighbourhood === geojson.features[i].properties.Name) {
          geojson.features[i].properties.Value.push({
            crimes: dataCrimes,
            year: dataYear
          });
        }
      }
    }

    // Quantize scale
    var quantize = d3.scale.quantize()
        .domain([0, 2000])  // TODO: Use max of actual dataset for that year. Probably recalculate each time
        .range(colorbrewer.Blues[9]);

    // Create the map
    // TODO: Change year with slider
    // Call this as a function on each update
    // Call this when starting
    var year = 2012;
    svg.selectAll("path")
       .data(geojson.features)
       .enter()
       .append("path")
       .attr("d", path)
       .style("fill", function(d) {
         var crimesYear = d.properties.Value.filter(function(x) { return x.year == year; } );
         var numCrimes = crimesYear.map(function(x) { return x.crimes; } );
         return quantize(d3.sum(numCrimes));
       });

    // TODO: Show/hide labels (on mouseover?)
    svg.selectAll("text")
       .data(geojson.features)
       .enter()
       .append("text")
       .text(function(d) {
         return d.properties.Name;
       })
       .attr("x", function(d) {
         return path.centroid(d)[0];
       })
       .attr("y", function(d) {
         return path.centroid(d)[1];
       })
       .attr("text-anchor", "middle")
       .attr("font-size", "6pt");
  }
});
