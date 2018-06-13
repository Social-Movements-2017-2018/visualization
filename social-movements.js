/*
* Sources:
*   Zooming adapted from https://bl.ocks.org/ashenfad/48b4621bd3a9f1bb884a
* */
    var categories = {
        "Women's Rights": true,
        "U.S. Politics": true,
        "Racial Justice": true,
        "Religious & Cultural Justice": true,
        "LGBTQ+ Rights": true,
        "Environmental & Food Justice": true,
        "Housing Justice": true,
        "Workers & Labor Rights": true,
        "Other": true
    }

    var stateCodetoName = {
        "AL": "Alabama",
        "AK": "Alaska",
        "AZ": "Arizona",
        "AR": "Arkansas",
        "CA": "California",
        "CO": "Colorado",
        "CT": "Connecticut",
        "DE": "Delaware",
        "DC": "District of Columbia",
        "FL": "Florida",
        "GA": "Georgia",
        "HI": "Hawaii",
        "ID": "Idaho",
        "IL": "Illinois",
        "IN": "Indiana",
        "IA": "Iowa",
        "KS": "Kansas",
        "KY": "Kentucky",
        "LA": "Louisiana",
        "ME": "Maine",
        "MD": "Maryland",
        "MA": "Massachusetts",
        "MI": "Michigan",
        "MN": "Minnesota",
        "MS": "Mississippi",
        "MO": "Missouri",
        "MT": "Montana",
        "NE": "Nebraska",
        "NV": "Nevada",
        "NH": "New Hampshire",
        "NJ": "New Jersey",
        "NM": "New Mexico",
        "NY": "New York",
        "NC": "North Carolina",
        "ND": "North Dakota",
        "OH": "Ohio",
        "OK": "Oklahoma",
        "OR": "Oregon",
        "PA": "Pennsylvania",
        "RI": "Rhode Island",
        "SC": "South Carolina",
        "SD": "South Dakota",
        "TN": "Tennessee",
        "TX": "Texas",
        "UT": "Utah",
        "VT": "Vermont",
        "VA": "Virginia",
        "WA": "Washington",
        "WV": "West Virginia",
        "WI": "Wisconsin",
        "WY": "Wyoming"
    };


//Width and height
    var w = 850;
    var h = 550;
    var active = d3.select(null);
    var state = "";

//Define map projection
    var projection = d3.geoAlbersUsa()
        .translate([w / 2, h / 2])
        .scale([1000]);

// custom zoom function built off of d3 zoom with scale extent set to limit zooming, no limit on pan however
    var zoom = d3.zoom()
        .scaleExtent([1, 256])
        .on("zoom", zoomed);

//Define path generator
    var path = d3.geoPath()
        .projection(projection);

    var stateColor = d3.scaleThreshold()
        .domain([1, 10, 50, 100]) //Chosen input domain for color scale based on data
        .range(["rgb(237,248,233)", "rgb(186,228,179)", "rgb(116,196,118)", "rgb(49,163,84)", "rgb(0,109,44)"]);
    //Colors derived from ColorBrewer, by Cynthia Brewer
    //https://github.com/d3/d3-scale-chromatic

//Define color scale to sort data values into buckets of color
    var pointColor = d3.scaleThreshold()
        .domain([500, 1000, 5000, 10000]) //Chosen input domain for color scale based on data
        .range(["rgb(255,255,178", "rgb(254,204,92)", "rgb(253,141,60)", "rgb(240,59,32)", "rgb(189,0,38)"]);
    //Colors derived from ColorBrewer, by Cynthia Brewer
    //https://github.com/d3/d3-scale-chromatic

//Create main SVG element for the visualization
    var svg = d3.select(".dataviz")
        .append("svg")
        .attr("width", w)
        .attr("height", h)
        .attr("class", "map")
        .on("click", stopped, true);

//Create SVG element for information on the right
    var infoSvg = d3.select("#sidebar")
        .append("div")
        .attr("class", "legend")
        .append("svg")
        .attr("class", "infoSvg")
        .attr("width", 300)
        .attr("class", "leg");

//Tooltip div
    var div = d3.select("#sidebar").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    var g = svg.append("g");

// binds zoom function to svg and sets initial translation and scale
    svg.call(zoom) // delete this line to disable free zooming
        .call(zoom.transform, d3.zoomIdentity.translate(0, 0).scale(1));

//Load in movements data
    d3.csv("social-movements.csv", function (data) {

        //Load in GeoJSON data
        d3.json("unitedstates.json", function (json) {

            var state_view = false;

            d3.select("svg")
                .on("click", reset);

            //For each state in the GeoJSON
            for (var j = 0; j < json.features.length; j++) {

                var jsonState = json.features[j].properties.name;
                json.features[j].properties.women = 0;
                json.features[j].properties.politics = 0;
                json.features[j].properties.race = 0;
                json.features[j].properties.religion = 0;
                json.features[j].properties.lgbtq = 0;
                json.features[j].properties.enviro = 0;
                json.features[j].properties.housing = 0;
                json.features[j].properties.work = 0;
                json.features[j].properties.other = 0;

                //Find each direct action that occured in that state
                for (var i = 0; i < data.length; i++) {

                    var dataState = stateCodetoName[data[i].State];

                    //If match is found
                    if (dataState === jsonState) {
                        if (data[i].Movement === "Women's Rights")
                            json.features[j].properties.women += 1;
                        else if (data[i].Movement === "U.S. Politics")
                            json.features[j].properties.politics += 1;
                        else if (data[i].Movement === "Racial Justice")
                            json.features[j].properties.race += 1;
                        else if (data[i].Movement === "Religious & Cultural Justice")
                            json.features[j].properties.religion += 1;
                        else if (data[i].Movement === "LGBTQ+ Rights")
                            json.features[j].properties.lgbtq +=1;
                        else if (data[i].Movement === "Environmental & Food Justice")
                            json.features[j].properties.enviro += 1;
                        else if (data[i].Movement === "Housing Justice")
                            json.features[j].properties.housing += 1;
                        else if (data[i].Movement === "Workers & Labor Rights")
                            json.features[j].properties.work += 1;
                        else if (data[i].Movement === "Other")
                            json.features[j].properties.other += 1;
                    }

                }
            }

            //Bind data and create one path per GeoJSON feature
            var statePath = g.selectAll("path")
                .data(json.features)
                .enter()
                .append("path")
                .attr("class", "state")
                .attr("d", path)
                .on("mouseover", showPointer)
                .style("fill", state_color)
                .style("stroke", "white")
                .on("click", clicked)
                .on("mouseout", function () {
                    d3.select(this).style("opacity", "1");
                })
                .style("stroke-width", 1);

            function state_color(d) {
                if (d3.select(this).classed("active")) return "#fff8e7";
                //Get data value
                var attendance = 0;

                if (categories["Women's Rights"])
                    attendance += d.properties.women;
                if (categories["U.S. Politics"])
                    attendance += d.properties.politics;
                if (categories["Racial Justice"])
                    attendance += d.properties.race;
                if (categories["Religious & Cultural Justice"])
                    attendance += d.properties.religion;
                if (categories["LGBTQ+ Rights"])
                    attendance += d.properties.lgbtq;
                if (categories["Environmental & Food Justice"])
                    attendance += d.properties.enviro;
                if (categories["Housing Justice"])
                    attendance += d.properties.housing;
                if (categories["Workers & Labor Rights"])
                    attendance += d.properties.work;
                if (categories["Other"])
                    attendance += d.properties.other;

                return stateColor(attendance);
            }

            function showPointer(d) {
                statePath.attr("style", "cursor: pointer")
                    .style("fill", state_color)
                    .style("stroke", "white")
                    .style("stroke-width", 1)
                    .on("click", clicked);
                if (active.node() === this) return;
                d3.select(this).style("opacity", ".4");
            }

            //When a state is clicked
            function clicked(d) {
                if (active.node() === this) return reset(); //current state in view

                d3.select(".caption")
                    .text("People in Attendance");
                state_view = true;
                active.classed("active", false);
                active = d3.select(this).classed("active", true);
                state = d.properties.name;
                d3.selectAll(".state").transition()
                    .style("stroke", "white")
                    .style("stroke-width", 1)
                    .style("fill", state_color);

                // calculates necessary parameters for zoom data in order to center the state and zoom in on it
                var bounds = path.bounds(d),
                    dx = bounds[1][0] - bounds[0][0],
                    dy = bounds[1][1] - bounds[0][1],
                    x = (bounds[0][0] + bounds[1][0]) / 2,
                    y = (bounds[0][1] + bounds[1][1]) / 2,
                    scale = .9 / Math.max(dx / w, dy / h),
                    translate = [w / 2 - scale * x, h / 2 - scale * y];


                var log = d3.legendColor()
                    .labelFormat(d3.format(".0f"))
                    .labels(d3.legendHelpers.thresholdLabels)
                    .scale(pointColor);

                d3.select(".legend")
                    .call(log);

                console.log(d.properties.name);
                g.selectAll("circle")
                    .remove();

                var points = data.map(function (point) {
                    var x;
                    try {
                        x = projection([point.Lon, point.Lat])[0];
                    } catch (err) {
                        x = -1;
                    }
                    var y;
                    try {
                        y = projection([point.Lon, point.Lat])[1];
                    } catch (err) {
                        y = -1;
                    }
                    point.x = x;
                    point.y = y;
                    return point;
                });

                function getScale(x) {
                    console.log(d3.zoomTransform(svg.node()));
                    return x / d3.zoomTransform(svg.node()).k;
                }

                // zooms in on state
                svg.transition()
                    .duration(750)
                    .call(zoom.transform, d3.zoomIdentity
                        .translate(translate[0], translate[1])
                        .scale(scale))
                    .on("end", function () {
                        var sim = d3.forceSimulation(points)
                            .force("y", d3.forceY(function (point) {
                                return point.y;
                            }))
                            .force("x", d3.forceX(function (point) {
                                return point.x;
                            }))
                            .force("charge", d3.forceCollide(getScale(4)).strength(1))
                            .stop();
                        while (sim.alpha() > 0.5) {
                            sim.tick();
                        }
                        points.forEach(drawPoint)
                    });


                function drawPoint(point) {
                    if (stateCodetoName[point.State] !== d.properties.name) return;
                    console.log("drawing");
                    g.append("circle")
                        .datum(point)
                        .attr("class", "point")
                        .attr("cx", point.x)
                        .attr("cy", point.y)
                        .attr("r", getScale(4))
                        .style("fill", function () {
                            var category = point.Movement;
                            if (categories[category]) {
                                return pointColor(point.Attendance);
                            } else {
                                return "none";
                            }
                        })
                        .on("mouseover", showTooltip)
                        .on("mouseout", mouseOut);
                }

            }

            //Sets to original view by removing districts, recolorizing states, and returning to original zoom
            function reset() {
                state_view = false;
                active.classed("active", false);
                active = d3.select(null);

                d3.selectAll(".state").transition().style("fill", state_color)
                    .style("stroke", "white")
                    .style("stroke-width", 1);

                d3.selectAll(".point").remove();

                svg.transition()
                    .duration(750)
                    .call(zoom.transform, d3.zoomIdentity
                        .translate(0, 0)
                        .scale(1));

                d3.select(".caption")
                    .text("Number of Direct Actions");

                var log = d3.legendColor()
                    .labelFormat(d3.format(".0f"))
                    .labels(d3.legendHelpers.thresholdLabels)
                    .scale(stateColor);

                d3.select(".legend")
                    .call(log);
            }

            function showTooltip(d) {
                div.transition()
                    .duration(300)
                    .style("opacity", 1);
                div.html("<table id='tooltiptable'><tbody>" +
                    "<tr><td>Social Movement:</td><td class='right'>" + d.Movement + "</td></tr>" +
                    "<tr><td>Cause:</td><td class='right'>" + d.Cause + "</td></tr>" +
                    "<tr><td>Description:</td><td class='right'>" + d.Description + "</td></tr>" +
                    "<tr><td>Attendance:</td><td class='right'>" + d.Attendance + "</td></tr>" +
                    "<tr><td>City:</td><td class='right'>" + d.City + "</td></tr>" +
                    "<tr><td>Date:</td><td class='right'>" + d.Date + "</td></tr>")
                    .style("left", "970px")
                    .style("top", "600px");
                d3.select(this).style("stroke", "black");
            }

            function mouseOut(d) {
                div.transition()
                    .duration(300)
                    .style("opacity", 0);
                d3.select(this).style("stroke", "none");
            }

            //Handles checkboxes
            d3.selectAll(".movements")
                .on("click", function () {
                    if (d3.select("#all").node() === this) {
                        if (!d3.select("#all").select("input").property("checked")) {
                            d3.selectAll("input").property("checked", false);
                        }
                        else {
                            d3.selectAll("input").property("checked", true);
                        }
                    }
                    if (!d3.select("#women").select("input").property("checked")) {
                        categories["Women's Rights"] = false;
                        console.log("women = false")
                    }
                    else {
                        categories["Women's Rights"] = true;
                        console.log("women = true")
                    }
                    if (!d3.select("#politics").select("input").property("checked")) {
                        categories["U.S. Politics"] = false;
                        console.log("politics = false")
                    }
                    else {
                        categories["U.S. Politics"] = true;
                        console.log("politics = true")
                    }
                    if (!d3.select("#racial").select("input").property("checked")) {
                        categories["Racial Justice"] = false;
                        console.log("racial = false")
                    }
                    else {
                        categories["Racial Justice"] = true;
                        console.log("racial = true")
                    }
                    if (!d3.select("#religious").select("input").property("checked")) {
                        categories["Religious & Cultural Justice"] = false;
                        console.log("religious = false")
                    }
                    else {
                        categories["Religious & Cultural Justice"] = true;
                        console.log("religious = true")
                    }
                    if (!d3.select("#lgbtq").select("input").property("checked")) {
                        categories["LGBTQ+ Rights"] = false;
                        console.log("lgbtq = false")
                    }
                    else {
                        categories["LGBTQ+ Rights"] = true;
                        console.log("lgbtq = true")
                    }
                    if (!d3.select("#enviro").select("input").property("checked")) {
                        categories["Environmental & Food Justice"] = false;
                        console.log("enviro = false")
                    }
                    else {
                        categories["Environmental & Food Justice"] = true;
                        console.log("enviro = true")
                    }
                    if (!d3.select("#housing").select("input").property("checked")) {
                        categories["Housing Justice"] = false;
                        console.log("housing = false")
                    }
                    else {
                        categories["Housing Justice"] = true;
                        console.log("housing = true")
                    }
                    if (!d3.select("#workers").select("input").property("checked")) {
                        categories["Workers & Labor Rights"] = false;
                        console.log("workers = false")
                    }
                    else {
                        categories["Workers & Labor Rights"] = true;
                        console.log("workers = true")
                    }
                    if (!d3.select("#other").select("input").property("checked")) {
                        categories["Other"] = false;
                        console.log("other = false")
                    }
                    else {
                        categories["Other"] = true;
                        console.log("other = true")
                    }
                    d3.selectAll(".state")
                        .style("fill", state_color);
                    checkHandler();
                });

            function checkHandler() {
                g.selectAll(".point")
                    .style("fill", function (d) {
                        if (!state_view) return "none";
                        if (categories[d.Movement]) {
                            // console.log("turning on " + d.Movement);
                            return pointColor(d.Attendance);
                        }
                        else {
                            // console.log("turning off " + d.Movement);
                            return "none";
                        }
                    })
            }

        });

    });


//var color = d3.scaleThreshold()
//    .domain([1, 10, 50, 200, 500, 1000, 2000, 4000])
//    .range(d3.schemeOrRd[9]);

//var x = d3.scaleSqrt()
//    .domain([0, ])
//    .rangeRound([440, 950]);
//
//var key = svg.append("g")
//    .attr("class", "key")
//    .attr("transform", "translate(0,40)");
//
//key.selectAll("rect")
//  .data(pointColor.range().map(function(d) {
//      d = pointColor.invertExtent(d);
//      if (d[0] == null) d[0] = x.domain()[0];
//      if (d[1] == null) d[1] = x.domain()[1];
//      return d;
//    }))
//  .enter().append("rect")
//    .attr("height", 8)
//    .attr("x", function(d) { return x(d[0]); })
//    .attr("width", function(d) { return x(d[1]) - x(d[0]); })
//    .attr("fill", function(d) { return pointColor(d[0]); });
//
//key.append("text")
//    .attr("class", "caption")
//    .attr("x", x.range()[0])
//    .attr("y", -6)
//    .attr("fill", "#000")
//    .attr("text-anchor", "start")
//    .text("People in Attendance");

//Yearly Attendance Legend
    var log = d3.legendColor()
        .labelFormat(d3.format(".0f"))
        .labels(d3.legendHelpers.thresholdLabels)
        .scale(stateColor);

    var legend = infoSvg.append("g")
        .attr("class", "legend")
        .attr("transform", "translate(5,20)")
        .call(log);

    legend.append("text")
        .attr("class", "caption")
        .attr("x", -5)
        .attr("y", -8)
        .attr("fill", "#000")
        .attr("text-anchor", "start")
        .text("Number of Direct Actions");

//Enables zooming for the map
    function zoomed() {
        g.style("stroke-width", 1.5 / d3.event.transform.k + "px");
        g.attr("transform", d3.event.transform);
        d3.selectAll(".point")
            .attr("r", function () {
                return 4 / d3.event.transform.k
            })
    }

    function stopped() {
        if (d3.event.defaultPrevented) d3.event.stopPropagation();
    }
