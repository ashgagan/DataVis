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

    // Append SVG to the html choropleth element
    var svg = d3.select("#choropleth")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    var zoomed = function (event) {

        var transform = event.transform;
        map.attr("transform", transform);
    };

    var zoom = d3.zoom()
        .scaleExtent([1, 8])
        .translateExtent([[-10, -10], [960, 500]])
        .filter(function(event) {
            return event.type === 'wheel' ? event.ctrlKey : !event.button;
        })
        .on("zoom", zoomed);
        


    svg.call(zoom);

    var map = svg.append("g")
        .attr("id", "map")

    var infoBox = d3.select("#info-box");
    var hoveredCountry = d3.select("#hovered-country");
    var clickedCountry = d3.select("#clicked-country");

    //load country_id data
    d3.csv("Vis1Data/data1.csv").then(function (data) {

        var dataMap = {};
        data.forEach(function (d) {
            if (d.year === "2020") {
                dataMap[d["country_id"]] = +d["GDP/Capita(US$)"];
            }
        });

        // Load GeoJSON data
        d3.json("world.geojson").then(function (json) {
            // Set color scale
            var color = d3.scaleSequential(d3.interpolateBlues)
                .domain([0, d3.max(Object.values(dataMap))]);

            // Draw countries
            map.selectAll("path")
                .data(json.features)
                .enter()
                .append("path")
                .attr("d", path)
                .style("stroke", "#000")
                .style("stroke-width", "0.2px")
                .style("fill", function (d) {
                    var value = dataMap[d.id];  // Using 'id' as the country code in GeoJSON
                    return value ? color(value) : "lightgrey";
                })
                .on("mouseover", function (event, d) {
                    var countryData = dataMap[d.id];
                    hoveredCountry.text("Country: " + d.properties.name + ", GDP/Capita: " + (countryData ? countryData : "N/A"));
                    d3.select(this).style("fill", "red"); // Change color on hover
                })
                .on("mouseout", function (event, d) {
                    var value = dataMap[d.id];
                    var fillColor = value ? color(value) : "lightgrey";
                    d3.select(this).style("fill", fillColor); // Revert color on mouseout
                    hoveredCountry.text("Hover over a country to see its data");
                })
                .on("click", function (event, d) {
                    var countryData = dataMap[d.id];
                    clickedCountry.text("Country: " + d.properties.name + ", GDP/Capita: " + (countryData ? countryData : "N/A"));
                });
        });
    })

    d3.select("#reset-button")
        .on("click", function () {
            svg.transition().duration(750).call(
                zoom.transform,
                d3.zoomIdentity,
                d3.zoomTransform(svg.node()).invert([width / 2, height / 2])
            );
        });

    d3.select("#eu-button")
        .on("click", function () {
            // Coordinates of Europe
            var targetCoordinates = [10, 50];

            // Convert coordinates to pixel values
            var targetPixel = projection(targetCoordinates);

            // Calculate the new scale and translate values
            var scale = 4;
            var translate = [width / 2 - scale * targetPixel[0], height / 2 - scale * targetPixel[1]];

            // Apply the zoom transformation
            svg.transition().duration(750).call(
                zoom.transform,
                d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
            );
        });
}

window.onload = init;
