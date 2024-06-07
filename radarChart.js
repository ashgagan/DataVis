function init() {
    // Load the data
    d3.csv("./vis2Data/health.csv").then(function(data) {
        // Parse health data
        const nestedData = d3.group(data, d => d.Country, d => d.Year);
        const countries = Array.from(nestedData.keys());
        const years = Array.from(new Set(data.map(d => d.Year)));

        // Load and parse life expectancy data
        d3.csv("./vis2Data/lifeExp.csv").then(function(lifeExpData) {
            const lifeExpNested = d3.group(lifeExpData, d => d.Country, d => d.Year);

            // Populate dropdowns
            const countrySelect = d3.select("#country");
            const yearSelect = d3.select("#year");

            countrySelect.selectAll("option")
                .data(countries)
                .enter()
                .append("option")
                .text(d => d)
                .attr("value", d => d);

            yearSelect.selectAll("option")
                .data(years)
                .enter()
                .append("option")
                .text(d => d)
                .attr("value", d => d);

            // Configuration variables for the radar chart
            const chartSize = 600; // Overall size of the chart
            const margin = { top: 50, right: 50, bottom: 50, left: 50 }; // Margins for the chart
            const width = chartSize - margin.left - margin.right; // Width of the chart area
            const height = chartSize - margin.top - margin.bottom; // Height of the chart area
            const levels = 5; // Number of concentric circles
            const labelFactor = 1.15; // Factor for positioning labels
            const opacityArea = 0.35; // Opacity for the filled area

            // Color scale for different entities
            const color = d3.scaleOrdinal(d3.schemeCategory10);

            // Create the SVG container for the radar chart
            const radarChart = d3.select("#chart")
                .append("svg")
                .attr("width", chartSize)
                .attr("height", chartSize + 50) // Added space for the color bar
                .append("g")
                .attr("transform", `translate(${chartSize / 2},${chartSize / 2})`);

            // Calculate the angle for each axis (one per variable)
            const angleSlice = Math.PI * 2 / 3; // 3 variables, so divide 360 degrees by 3

            // Calculate the radius for the chart
            const radius = Math.min(width / 2, height / 2);

            // Get the max values for each variable
            const maxValues = {
                "Sugar supply": d3.max(data.filter(d => d.Variable === "Sugar supply"), d => +d.Value),
                "Tobacco consumption": d3.max(data.filter(d => d.Variable === "Tobacco consumption"), d => +d.Value),
                "Total fat supply": d3.max(data.filter(d => d.Variable === "Total fat supply"), d => +d.Value)
            };

            // Scales for converting data values to radial distances for each variable
            const scales = {
                "Sugar supply": d3.scaleLinear().range([0, radius]).domain([0, maxValues["Sugar supply"]]),
                "Tobacco consumption": d3.scaleLinear().range([0, radius]).domain([0, maxValues["Tobacco consumption"]]),
                "Total fat supply": d3.scaleLinear().range([0, radius]).domain([0, maxValues["Total fat supply"]])
            };

            // Line generator for the radar chart
            const radarLine = d3.lineRadial()
                .curve(d3.curveLinearClosed) // Smooth curves between points
                .radius((d, i) => scales[d.axis](d.value)) // Map data value to radius
                .angle((d, i) => i * angleSlice); // Map index to angle

            // Draw the circular grid levels
            radarChart.selectAll(".levels")
                .data(d3.range(1, levels + 1).reverse())
                .enter().append("circle")
                .attr("class", "gridCircle")
                .attr("r", d => radius / levels * d)
                .style("fill", "#CDCDCD")
                .style("stroke", "#CDCDCD")
                .style("fill-opacity", opacityArea);

            // Create a wrapper for the axis lines and labels
            const axisGrid = radarChart.append("g").attr("class", "axisWrapper");

            // Draw the axis lines (one for each variable)
            axisGrid.selectAll(".axis")
                .data(["Sugar supply", "Tobacco consumption", "Total fat supply"])
                .enter()
                .append("g")
                .attr("class", "axis")
                .append("line")
                .attr("x1", 0)
                .attr("y1", 0)
                .attr("x2", (d, i) => radius * Math.cos(angleSlice * i - Math.PI / 2))
                .attr("y2", (d, i) => radius * Math.sin(angleSlice * i - Math.PI / 2))
                .attr("class", "line")
                .style("stroke", "white")
                .style("stroke-width", "2px");

            // Add labels for each axis
            axisGrid.selectAll(".axisLabel")
                .data(["Sugar supply", "Tobacco consumption", "Total fat supply"])
                .enter().append("text")
                .attr("class", "axisLabel")
                .attr("text-anchor", "middle")
                .attr("dy", "0.35em")
                .attr("x", (d, i) => radius * labelFactor * Math.cos(angleSlice * i - Math.PI / 2))
                .attr("y", (d, i) => radius * labelFactor * Math.sin(angleSlice * i - Math.PI / 2))
                .text(d => d);

            // Add a linear gradient for the color bar
            const defs = radarChart.append("defs");

            // Calculate the min and max life expectancy values
            const maxLifeExpectancy = d3.max(lifeExpData, d => +d.Value);
            const minLifeExpectancy = d3.min(lifeExpData, d => +d.Value);

            // Map life expectancy to color using d3.interpolateBlues
            const colorScaleBar = d3.scaleSequential(d3.interpolateBlues)
                .domain([minLifeExpectancy, maxLifeExpectancy]); // Define color scale based on min and max life expectancy

            const gradient = defs.append("linearGradient")
                .attr("id", "color-gradient")
                .attr("x1", "0%")
                .attr("x2", "100%")
                .attr("y1", "0%")
                .attr("y2", "0%");

            gradient.append("stop")
                .attr("offset", "0%")
                .attr("stop-color", colorScaleBar(minLifeExpectancy)); // Start of gradient

            gradient.append("stop")
                .attr("offset", "100%")
                .attr("stop-color", colorScaleBar(maxLifeExpectancy)); // End of gradient

            // Add the color bar
            const colorBarWidth = 300;
            const colorBarHeight = 20;
            const colorBarX = -colorBarWidth / 2;
            const colorBarY = radius + margin.bottom / 2;

            radarChart.append("rect")
                .attr("x", colorBarX)
                .attr("y", colorBarY)
                .attr("width", colorBarWidth)
                .attr("height", colorBarHeight)
                .style("fill", "url(#color-gradient)");

            // Add labels for the color bar
            radarChart.append("text")
                .attr("x", colorBarX)
                .attr("y", colorBarY + colorBarHeight + 15)
                .attr("text-anchor", "start")
                .text(minLifeExpectancy.toFixed(2));

            radarChart.append("text")
                .attr("x", colorBarX + colorBarWidth)
                .attr("y", colorBarY + colorBarHeight + 15)
                .attr("text-anchor", "end")
                .text(maxLifeExpectancy.toFixed(2));

            // Function to update the chart
            function updateChart() {
                const selectedCountry = countrySelect.node().value;
                const selectedYear = yearSelect.node().value;

                const countryData = nestedData.get(selectedCountry).get(selectedYear);

                const lifeExpDataForCountryYear = lifeExpNested.get(selectedCountry).get(selectedYear);

                const lifeExpectancy = lifeExpDataForCountryYear ? +lifeExpDataForCountryYear[0].Value : 0;

                const variables = ["Sugar supply", "Tobacco consumption", "Total fat supply"];
                const chartData = variables.map(variable => {
                    const record = countryData.find(d => d.Variable === variable);
                    return {
                        axis: variable,
                        value: record ? +record.Value : 0
                    };
                });

                // Function to show all data to console
                console.log("Data for " + selectedCountry + " in " + selectedYear + ":");
                console.log(chartData);

                // Function to show life expectancy to console
                console.log("Life Expectancy for " + selectedCountry + " in " + selectedYear + ": " + lifeExpectancy);

                // Update the conclusion section
                const conclusionElement = document.getElementById('conclusion');
                conclusionElement.innerHTML = `
                    The data for <strong>${selectedCountry}</strong> in the year <strong>${selectedYear}</strong> shows the following values:
                    <ul>
                        <li>Sugar Supply: ${chartData.find(d => d.axis === "Sugar supply").value} kilos per capita per year</li>
                        <li>Tobacco Consumption: ${chartData.find(d => d.axis === "Tobacco consumption").value} grams per capita</li>
                        <li>Total Fat Supply: ${chartData.find(d => d.axis === "Total fat supply").value} grams per capita per day</li>
                    </ul>
                    The life expectancy for this year and country is <strong>${lifeExpectancy.toFixed(2)} years</strong>.
                `;

                drawRadarChart(chartData, lifeExpectancy);
            }

            // Function to draw the radar chart
            function drawRadarChart(data, lifeExpectancy) {
                radarChart.selectAll(".radarArea").remove();
                radarChart.selectAll(".radarStroke").remove();
                radarChart.selectAll(".tooltip").remove();

                // Create a tooltip div
                const tooltip = d3.select("body").append("div")
                    .attr("class", "tooltip")
                    .style("opacity", 0);

                // Find the maximum life expectancy for the color scale domain
                const maxLifeExpectancy = d3.max(lifeExpData, d => +d.Value);

                // Find the minimum life expectancy for the color scale domain
                const minLifeExpectancy = d3.min(lifeExpData, d => +d.Value);

                // Map life expectancy to color using d3.interpolateBlues
                const colorScale = d3.scaleSequential(d3.interpolateBlues)
                    .domain([minLifeExpectancy, maxLifeExpectancy]); // Define color scale based on max life expectancy
                const colorString = colorScale(lifeExpectancy); // Get color from scale

                // Draw the filled area of the radar chart
                radarChart.append("path")
                    .datum(data)
                    .attr("class", "radarArea")
                    .attr("d", radarLine)
                    .attr("fill", colorString) // Apply the calculated color
                    .on("mouseover", function(event, d) {
                        tooltip.transition().duration(200).style("opacity", .9);
                        tooltip.html(`
                            <strong>Life Expectancy:</strong> ${lifeExpectancy.toFixed(2)} years<br/>
                            <strong>Total Fat Supply:</strong> ${data[2].value} grams per capita per day<br/>
                            <strong>Tobacco Consumption:</strong> ${data[1].value} grams per capita<br/>
                            <strong>Sugar Supply:</strong> ${data[0].value} kilos per capita per year
                        `)
                        .style("left", (event.pageX) + "px")
                        .style("top", (event.pageY - 28) + "px");
                    })
                    .on("mouseout", function(d) {
                        tooltip.transition().duration(500).style("opacity", 0);
                    });

                // Draw the stroke (outline) of the radar chart
                radarChart.append("path")
                    .datum(data)
                    .attr("class", "radarStroke")
                    .attr("d", radarLine)
                    .style("stroke-width", "2px")
                    .style("stroke", color(0))
                    .style("fill", "none");
            }

            // Event listeners for dropdowns
            countrySelect.on("change", updateChart);
            yearSelect.on("change", updateChart);

            // Initial chart update
            updateChart();
        });
    });
}

window.onload = init;
