define(function(require) {
  var d3 = require('d3');
  var queue = require('queue');

  var width = 960;
  var height = 800;

  // Create SVG element
  var svg = d3.select("body")
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

    // Create the map
    svg.selectAll("path")
       .data(geojson.features)
       .enter()
       .append("path")
       .attr("d", path);

    // Merge crime data with GeoJSON data
    // Value of the GeoJSON property will hold an array of Year, Crimes,
    // Neighbourhood
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
  }
});
