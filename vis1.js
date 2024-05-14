function init() {

    // Set up width and height of the map
    var width = 960;
    var height = 500;

    // Define a projection
    var projection = d3.geoEquirectangular()
        .center([0, 0])
        .translate([width / 2, height / 2])
        .scale(150);

    // Path generator
    var path = d3.geoPath()
        .projection(projection);

    // Append SVG to the map container
    var svg = d3.select("#choropleth")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Load GeoJSON data
    d3.json("world.geojson").then(function(json) {
        // Draw countries
        svg.selectAll("path")
            .data(json.features)
            .enter()
            .append("path")
            .attr("d", path)
            .style("stroke", "#000")
            .style("stroke-width", "0.2px")
            .style("fill", "lightgreen");
    });
}

window.onload = init;
