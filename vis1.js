function init() {

    // Set up width and height of the map
    var width = 1000;
    var height = 500;

    // Define a projection
    var projection = d3.geoEquirectangular()
        .center([0, 0])
        .translate([width / 2, height / 2])
        .scale(155);

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
        .translateExtent([[-10, -90], [1010, 515]])
        .filter(function (event) {
            return event.type === 'wheel' ? event.ctrlKey : !event.button;
        })
        .on("zoom", zoomed);



    svg.call(zoom);

    var map = svg.append("g")
        .attr("id", "map")

    var hoveredCountry = d3.select("#hovered-country");
    var clickedCountry = d3.select("#clicked-country");

    var MAPcolor = d3.scaleQuantize()
        .range(["rgb(158,202,225)", "rgb(107,174,214)", "rgb(66,146,198)", "rgb(33,113,181)", "rgb(8,69,148)"]);

    //load country_id data
    d3.csv("Vis1Data/data1.csv").then(function (data) {
        const countryData = {};
        var dataMap = {};
        data.forEach(function (d) {
            const country = d['country'];
            const countryCode = d['country_id'];
            const year = +d['year'];
            if (![2010, 2015, 2020].includes(year)) return;
            if (!countryData[countryCode]) {
                countryData[countryCode] = { name: country, data: {} };
            }
            countryData[countryCode].data[year] = {
                life_expectancy: +d['life_expectancy'],
                population: +d['population'],
                gdp: +d['gdp'],
                deaths: +d["deaths"]
            }
            if (d.year === "2020") {
                dataMap[d["country_id"]] = +d["life_expectancy"];
            };
        });

        // Load GeoJSON data
        d3.json("world.geojson").then(function (json) {

            var color = d3.scaleSequential(MAPcolor)
                .domain([d3.min(Object.values(dataMap)), d3.max(Object.values(dataMap))]);

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
                    const countryCode = d.id;
                    const countryInfo = countryData[countryCode];
                    const twoLetterCode = countryCodeMapping[countryCode];

                    if (countryInfo) {
                        let content = `<div class="countryName"><strong>${countryInfo.name}</strong></div><br/><br>`;
                        [2010, 2015, 2020].forEach(year => {
                            const info = countryInfo.data[year];
                            if (info) {
                                content += `<strong>${year}</strong><br/>
                                Population: ${info.population.toLocaleString()}K<br/>
                                GDP/Capita: $${info.gdp.toLocaleString()}<br/>
                                Life Expectancy: ${info.life_expectancy} years<br/>
                                Deaths: ${info.deaths}<br/><br/>`;
                            }
                        });
                        const flagImagePath = `Vis1Data/flags/${twoLetterCode}.png`;
                        d3.select("#flag1-container").html(`<img src="${flagImagePath}" alt="${countryInfo.name} flag">`);
                        hoveredCountry.html(content);
                    } else {
                        const flagImagePath = `Vis1Data/flags/${twoLetterCode}.png`;
                        d3.select("#flag1-container").html(`<img src="${flagImagePath}">`);
                        hoveredCountry.html(`<div class="countryName"><strong>${d.properties.name}</strong></div><br/>No data available`);
                    }
                })
                .on("mouseout", function (event, d) {
                    d3.select("#flag1-container").html(``);
                    hoveredCountry.html(`Hover over a country to see its data`);
                })
                .on("click", function (event, d) {
                    const countryCode = d.id;
                    const countryInfo = countryData[countryCode];
                    const twoLetterCode = countryCodeMapping[countryCode];

                    if (countryInfo) {
                        let content = `<div class="countryName"><strong>${countryInfo.name}</strong></div><br/><br>`;
                        [2010, 2015, 2020].forEach(year => {
                            const info = countryInfo.data[year];
                            if (info) {
                                content += `<strong>${year}</strong><br/>
                                Population: ${info.population.toLocaleString()}K<br/>
                                GDP/Capita: $${info.gdp.toLocaleString()}<br/>
                                Life Expectancy: ${info.life_expectancy} years<br/>
                                Deaths: ${info.deaths}<br/><br/>`;
                            }
                        });
                        const flagImagePath = `Vis1Data/flags/${twoLetterCode}.png`;
                        d3.select("#flag2-container").html(`<img src="${flagImagePath}" alt="${countryInfo.name} flag">`);
                        clickedCountry.html(content);
                    } else {
                        const flagImagePath = `Vis1Data/flags/${twoLetterCode}.png`;
                        d3.select("#flag2-container").html(`<img src="${flagImagePath}">`);
                        clickedCountry.html(`<div class="countryName"><strong>${d.properties.name}</strong></div><br/>No data available`);
                    }
                });
            function updateMapColors(selectedDataset) {

                if (selectedDataset === "life_expectancy") {
                    var dataMap = {};
                    data.forEach(function (d) {
                        if (d.year === "2020") {
                            dataMap[d["country_id"]] = +d["life_expectancy"];
                        };
                    })
                    var color = d3.scaleSequential(MAPcolor)
                        .domain([d3.min(Object.values(dataMap)), d3.max(Object.values(dataMap))]);
                    map.selectAll("path")
                        .style("fill", function (d) {
                            var value = dataMap[d.id];  // Using 'id' as the country code in GeoJSON
                            return value ? color(value) : "lightgrey";
                        })
                }
                if (selectedDataset === "population") {
                    var dataMap = {};
                    data.forEach(function (d) {
                        if (d.year === "2020") {
                            dataMap[d["country_id"]] = +d["population"];
                        };
                    })
                    var color = d3.scaleSequential(MAPcolor)
                        .domain([d3.min(Object.values(dataMap)), d3.max(Object.values(dataMap))]);
                    map.selectAll("path")
                        .style("fill", function (d) {
                            var value = dataMap[d.id];  // Using 'id' as the country code in GeoJSON
                            return value ? color(value) : "lightgrey";
                        })
                }
                if (selectedDataset === "gdp") {
                    var dataMap = {};
                    data.forEach(function (d) {
                        if (d.year === "2020") {
                            dataMap[d["country_id"]] = +d["gdp"];
                        };
                    })
                    var color = d3.scaleSequential(MAPcolor)
                        .domain([d3.min(Object.values(dataMap)), d3.max(Object.values(dataMap))]);
                    map.selectAll("path")
                        .style("fill", function (d) {
                            var value = dataMap[d.id];  // Using 'id' as the country code in GeoJSON
                            return value ? color(value) : "lightgrey";
                        })
                }
                if (selectedDataset === "deaths") {
                    var dataMap = {};
                    data.forEach(function (d) {
                        if (d.year === "2020") {
                            dataMap[d["country_id"]] = +d["deaths"];
                        };
                    })
                    var color = d3.scaleSequential(MAPcolor)
                        .domain([d3.min(Object.values(dataMap)), d3.max(Object.values(dataMap))]);
                    map.selectAll("path")
                        .style("fill", function (d) {
                            var value = dataMap[d.id];  // Using 'id' as the country code in GeoJSON
                            return value ? color(value) : "lightgrey";
                        })
                }
            }

            // Event listener for dataset select change
            d3.select("#dataset-select").on("change", function () {
                var selectedDataset = d3.select(this).property("value");
                updateMapColors(selectedDataset);
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



    const countryCodeMapping = {
        "AFG": "af",
        "ALB": "al",
        "DZA": "dz",
        "ASM": "as",
        "AND": "ad",
        "AGO": "ao",
        "AIA": "ai",
        "ATA": "aq",
        "ATG": "ag",
        "ARG": "ar",
        "ARM": "am",
        "ABW": "aw",
        "AUS": "au",
        "AUT": "at",
        "AZE": "az",
        "BHS": "bs",
        "BHR": "bh",
        "BGD": "bd",
        "BRB": "bb",
        "BLR": "by",
        "BEL": "be",
        "BLZ": "bz",
        "BEN": "bj",
        "BMU": "bm",
        "BTN": "bt",
        "BOL": "bo",
        "BIH": "ba",
        "BWA": "bw",
        "BVT": "bv",
        "BRA": "br",
        "IOT": "io",
        "BRN": "bn",
        "BGR": "bg",
        "BFA": "bf",
        "BDI": "bi",
        "CPV": "cv",
        "KHM": "kh",
        "CMR": "cm",
        "CAN": "ca",
        "CYM": "ky",
        "CAF": "cf",
        "TCD": "td",
        "CHL": "cl",
        "CHN": "cn",
        "CXR": "cx",
        "CCK": "cc",
        "COL": "co",
        "COM": "km",
        "COG": "cg",
        "COD": "cd",
        "COK": "ck",
        "CRI": "cr",
        "CIV": "ci",
        "HRV": "hr",
        "CUB": "cu",
        "CYP": "cy",
        "CZE": "cz",
        "DNK": "dk",
        "DJI": "dj",
        "DMA": "dm",
        "DOM": "do",
        "ECU": "ec",
        "EGY": "eg",
        "SLV": "sv",
        "GNQ": "gq",
        "ERI": "er",
        "EST": "ee",
        "ETH": "et",
        "FLK": "fk",
        "FRO": "fo",
        "FJI": "fj",
        "FIN": "fi",
        "FRA": "fr",
        "GUF": "gf",
        "PYF": "pf",
        "ATF": "tf",
        "GAB": "ga",
        "GMB": "gm",
        "GEO": "ge",
        "DEU": "de",
        "GHA": "gh",
        "GIB": "gi",
        "GRC": "gr",
        "GRL": "gl",
        "GRD": "gd",
        "GLP": "gp",
        "GUM": "gu",
        "GTM": "gt",
        "GGY": "gg",
        "GIN": "gn",
        "GNB": "gw",
        "GUY": "gy",
        "HTI": "ht",
        "HMD": "hm",
        "VAT": "va",
        "HND": "hn",
        "HKG": "hk",
        "HUN": "hu",
        "ISL": "is",
        "IND": "in",
        "IDN": "id",
        "IRN": "ir",
        "IRQ": "iq",
        "IRL": "ie",
        "IMN": "im",
        "ISR": "il",
        "ITA": "it",
        "JAM": "jm",
        "JPN": "jp",
        "JEY": "je",
        "JOR": "jo",
        "KAZ": "kz",
        "KEN": "ke",
        "KIR": "ki",
        "PRK": "kp",
        "KOR": "kr",
        "KWT": "kw",
        "KGZ": "kg",
        "LAO": "la",
        "LVA": "lv",
        "LBN": "lb",
        "LSO": "ls",
        "LBR": "lr",
        "LBY": "ly",
        "LIE": "li",
        "LTU": "lt",
        "LUX": "lu",
        "MAC": "mo",
        "MDG": "mg",
        "MWI": "mw",
        "MYS": "my",
        "MDV": "mv",
        "MLI": "ml",
        "MLT": "mt",
        "MHL": "mh",
        "MTQ": "mq",
        "MRT": "mr",
        "MUS": "mu",
        "MYT": "yt",
        "MEX": "mx",
        "FSM": "fm",
        "MDA": "md",
        "MCO": "mc",
        "MNG": "mn",
        "MNE": "me",
        "MSR": "ms",
        "MAR": "ma",
        "MOZ": "mz",
        "MMR": "mm",
        "NAM": "na",
        "NRU": "nr",
        "NPL": "np",
        "NLD": "nl",
        "NCL": "nc",
        "NZL": "nz",
        "NIC": "ni",
        "NER": "ne",
        "NGA": "ng",
        "NIU": "nu",
        "NFK": "nf",
        "MNP": "mp",
        "NOR": "no",
        "OMN": "om",
        "PAK": "pk",
        "PLW": "pw",
        "PSE": "ps",
        "PAN": "pa",
        "PNG": "pg",
        "PRY": "py",
        "PER": "pe",
        "PHL": "ph",
        "PCN": "pn",
        "POL": "pl",
        "PRT": "pt",
        "PRI": "pr",
        "QAT": "qa",
        "REU": "re",
        "ROU": "ro",
        "RUS": "ru",
        "RWA": "rw",
        "BLM": "bl",
        "SHN": "sh",
        "KNA": "kn",
        "LCA": "lc",
        "MAF": "mf",
        "SPM": "pm",
        "VCT": "vc",
        "WSM": "ws",
        "SMR": "sm",
        "STP": "st",
        "SAU": "sa",
        "SEN": "sn",
        "SRB": "rs",
        "SYC": "sc",
        "SLE": "sl",
        "SGP": "sg",
        "SXM": "sx",
        "SVK": "sk",
        "SVN": "si",
        "SLB": "sb",
        "SOM": "so",
        "ZAF": "za",
        "SGS": "gs",
        "SSD": "ss",
        "ESP": "es",
        "LKA": "lk",
        "SDN": "sd",
        "SUR": "sr",
        "SJM": "sj",
        "SWZ": "sz",
        "SWE": "se",
        "CHE": "ch",
        "SYR": "sy",
        "TWN": "tw",
        "TJK": "tj",
        "TZA": "tz",
        "THA": "th",
        "TLS": "tl",
        "TGO": "tg",
        "TKL": "tk",
        "TON": "to",
        "TTO": "tt",
        "TUN": "tn",
        "TUR": "tr",
        "TKM": "tm",
        "TCA": "tc",
        "TUV": "tv",
        "UGA": "ug",
        "UKR": "ua",
        "ARE": "ae",
        "GBR": "gb",
        "USA": "us",
        "URY": "uy",
        "UZB": "uz",
        "VUT": "vu",
        "VEN": "ve",
        "VNM": "vn",
        "WLF": "wf",
        "ESH": "eh",
        "YEM": "ye",
        "ZMB": "zm",
        "ZWE": "zw"
    };
}

window.onload = init;
