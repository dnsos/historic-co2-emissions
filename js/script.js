console.log("D3.js:", d3);

window.onload = () => {

  /* ----------------------------------------------------
  -- GLOBAL VARIABLES */
  let timespanStart = 1751, timespanEnd = 2013,
      selectedLocations = [
        {location: "Berlin", coordinates: [193,37], events: ["In 1945 Germany was defeated in WW2. Industry was ...", "Event 2"]},
        {location: "London", coordinates: [179,38]},
        {location: "Shanghai", coordinates: [301,58]},
        {location: "New York A", coordinates: [105,48]},
        {location: "New York B", coordinates: [106,49]},
        {location: "Moscow", coordinates: [217,34]},
        {location: "São Paulo", coordinates: [133,113]}
      ];

  /*
  London: long:179 lat:38
  New York: long:106 lat:49
  Shanghai: long:301 lat:58
  Berlin: long:193 lat:37
  Moscow: long:217 lat:34
  Tokyo: long:319 lat:54
  */

  /* ----------------------------------------------------
  -- DATA */
  d3.json('data/C02_full_1751-2013.json', (err, data) => {

    // helper logs
    console.log("Total timespan: ", data.startYear, "-", data.startYear + data.data.length);
    console.log("Number of years: ", data.data.length);

    // log selected timespan
    console.log("Selected timespan: ", timespanStart, "-", timespanEnd);

    let a = timespanStart - data.startYear;
    let b = timespanEnd - data.startYear - 1;

    let selectedTimespan = data.data.splice(a, b - a + 1);

    for (let location of selectedLocations) {

      let emissions = new Array();

      let long = location.coordinates[0],
          lat = location.coordinates[1];

      let initialEmissionValue = selectedTimespan[0][long][lat];
      let previousEmissionValue = initialEmissionValue;

      for (let year of selectedTimespan) {
        let emissionValue = year[long][lat];
        let o = new Object();
        o.value = emissionValue;
        o.deviation = getPercentageChange(previousEmissionValue, emissionValue).toFixed(3);
        emissions.push(o)

        previousEmissionValue = emissionValue;
      }
      location.emissions = emissions;
    }

    console.log("Selected are:", selectedLocations);

    /* ----------------------------------------------------
    -- SVG VARIABLES */
    let svgWidth = 1350,
        svgHeight = 950;

    let cellWidth = svgWidth / selectedLocations[0].emissions.length,
        cellHeight = 50;

    let color = chroma.scale(["white", "rgb(0, 0, 0)"]).domain([0, 57], "log");

    let previousValue = selectedLocations[0].emissions[0];

    /* ----------------------------------------------------
    -- VIZ */
    let tooltip = d3.select(document.getElementById("viz")).append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    let svg = d3.select(document.getElementById("viz"))
      .append("svg")
      .attr("width", svgWidth)
      .attr("height", svgHeight);

    let gradient = svg.append("defs")
      .append("linearGradient")
        .attr("id", "faded")
        .attr("x1", "0")
        .attr("y1", "0")
        .attr("x2", "0")
        .attr("y2", "1");
    gradient
      .append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "white");
    gradient
      .append("stop")
        .attr("offset", "50%")
        .attr("stop-color", "rgb(221, 120, 62)");

    let grid = svg.selectAll("g")
      .data(selectedLocations)
      .enter()
      .append("g")
      .attr("transform", (d, i) => {
        return "translate(0, " + (i * 120 + 80) +")"
      });

    let location = grid.append("text")
      .attr("x", 0)
      .attr("y", -5)
      .text((d) => {
        return d.location + " [" + d.coordinates + "]*";
      })
      .attr("fill", "rgb(118, 141, 155)");

    let cellWrapper = grid.selectAll("g")
      .data((d) => {
        return d.emissions;
      })
      .enter()
      .append("g");

    cellWrapper.on("mouseover", (d, i) => {
       tooltip.transition()
         .duration(200)
         .style("opacity", 1);
       tooltip.html(() => {
         //console.log("Test historical event:", selectedLocations[0].events[0]);
         return "<p><span>" + (timespanStart + i) + "</span></p><p>Emissions: <span>" + d.value + "</span> GtC</p><p>Deviation: <span>" + d.deviation + "</span> %";
       })
         .style("left", (d3.event.pageX) + 20 + "px")
         .style("top", (d3.event.pageY - 80) + "px");
       })
     .on("mouseout", (d) => {
       tooltip.transition()
         .duration(200)
         .style("opacity", 0);
       });

    let cell = cellWrapper.append("rect")
      .attr("x", (d, i) => {
        return cellWidth * i;
      })
      .attr("y", 0)
      .attr("width", cellWidth)
      .attr("height", cellHeight)
      .style("stroke", (d) => {
        return color(d.value);
      })
      .style("stroke-width", .2)
      .style("fill", (d) => {
        return color(d.value);
      });

  d3.select("#toggleDeviation").on("click", () => {
    d3.selectAll("rect")
      .transition()
      .duration(500)
      .attr("y", cellHeight / 2)
      .attr("height", (d) => {
        if (isNaN(d.deviation)) {
          return 0;
        } else {
          if (isFinite(d.deviation) && (d.deviation >= -100 && d.deviation <= 100)) {
            return Math.abs(d.deviation) / 2;
          } else {
            return cellHeight + 40;
          }
        }
      })
      .attr("transform", (d) => {
        if (d.deviation > 0) {
          if (d.deviation >= 100) {
            return "translate(0,-" + (cellHeight + 40) + ")";
          } else {
            return "translate(0,-" + Math.abs(d.deviation) / 2 + ")";
          }
        } else {
          return "translate(0,0)";
        }
      })
      .style("fill", (d) => {
        if (d.deviation >= 100 || d.deviation === Infinity) {
          return "url(#faded)";
        } else {
          return "rgb(221, 120, 62)";
        }
      });
  })
  });

}

/* ----------------------------------------------------
-- FUNCTIONS */
function getPercentageChange(previousValue, currentValue) {
  let changeValue = previousValue - currentValue;

  return - (changeValue / previousValue) * 100;
}

console.log("Script executed");
