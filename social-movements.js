/*
* Sources:
*   Zooming adapted from https://bl.ocks.org/ashenfad/48b4621bd3a9f1bb884a
* */
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
}


//Width and height
var w = 800;
var h = 650;
var active = d3.select(null);

//Define map projection
var projection = d3.geoAlbersUsa()
                       .translate([w/2, h/2.5])
                       .scale([1000]);

// custom zoom function built off of d3 zoom with scale extent set to limit zooming, no limit on pan however
var zoom = d3.zoom()
    .scaleExtent([1, 32])
    .on("zoom", zoomed);

//Define path generator
var path = d3.geoPath()
                 .projection(projection);

//Define color scale to sort data values into buckets of color
var color = d3.scaleThreshold()
              .domain([500,5000,50000,500000]) //Chosen input domain for color scale based on data
              .range(["rgb(237,248,233)","rgb(186,228,179)","rgb(116,196,118)","rgb(49,163,84)","rgb(0,109,44)"]);
              //Colors derived from ColorBrewer, by Cynthia Brewer
              //https://github.com/d3/d3-scale-chromatic

//Create SVG element
var svg = d3.select("body")
            .append("svg")
            .attr("width", w)
            .attr("height", h)
            .on("click", stopped, true);

var g = svg.append("g");

// binds zoom function to svg and sets initial translation and scale
svg
    .call(zoom) // delete this line to disable free zooming
    .call(zoom.transform, d3.zoomIdentity
        .translate(0,0)
        .scale(1));

//Load in movements data
d3.csv("social-movements.csv", function(data) {

    //Load in GeoJSON data
    d3.json("unitedstates.json", function(json) {

        var state_view = false;

        d3.select("svg").insert("rect", "g")
            .attr("class", "background")
            .attr("fill", "white")
            .attr("width", w)
            .attr("height", h)
            .on("click", reset);
        
        //For each state in the GeoJSON
        for (var j = 0; j < json.features.length; j++) {

            var jsonState = json.features[j].properties.name;
            var stateYearlyAttendance = 0;
             
            //Find each direct action that occured in that state
            for (var i = 0; i < data.length; i++) {

                var dataMovement = data[i].Movement;
                var dataCause = data[i].Cause;
                var dataDescription = data[i].Description;
                var dataAttendance = +data[i].Attendance;
                var dataCity = data[i].City;
                var dataState = stateCodetoName[data[i].State];
                var dataDate = data[i].Date;
            
                //If match is found
                if (dataState === jsonState) {
                    stateYearlyAttendance += dataAttendance;
                    console.log(dataState + stateYearlyAttendance);
                }
                
            }
            //Add total yearly attendance into JSON file that that state
            json.features[j].properties.yearlyAttendance = stateYearlyAttendance;
        }

        //Bind data and create one path per GeoJSON feature
        g.selectAll("path")
           .data(json.features)
           .enter()
           .append("path")
           .attr("class", "state")
           .attr("d", path)
           .style("fill", state_color)
           .on("click", clicked);

        function state_color(d) {
            if (state_view) return "#ddd";
            //Get data value
            var attendance = d.properties.yearlyAttendance;

            if (attendance) {
                //If value exists…
                console.log(d.properties.name + " " + attendance);
                return color(attendance);
            } else {
                //If value is undefined…
                return "black";
            }
        }

        function clicked(d) {
            if (active.node() === this) return reset(); // which state is currently being viewed. If you click on the
            // state which is active, it will return to the original view

            state_view = true;
            active.classed("active", false); // sets css active class to false on old active state
            active = d3.select(this).classed("active", true); // sets css active class to true on current state
            d3.select(this).transition().style("fill", state_color);

            // calculates necessary parameters for zoom data in order to center the state and zoom in on it
            var bounds = path.bounds(d),
                dx = bounds[1][0] - bounds[0][0],
                dy = bounds[1][1] - bounds[0][1],
                x = (bounds[0][0] + bounds[1][0]) / 2,
                y = (bounds[0][1] + bounds[1][1]) / 2,
                scale = .9 / Math.max(dx / w, dy / h),
                translate = [w / 2 - scale * x, h / 2 - scale * y];

            // zooms in on state
            svg.transition()
                .duration(750)
                .call(zoom.transform, d3.zoomIdentity
                    .translate(translate[0], translate[1])
                    .scale(scale));
        }

        // sets to original view by removing districts, recolorizing states, and returning to original zoom
        function reset() {
            state_view = false;
            active.classed("active", false);
            active = d3.select(null);

            d3.selectAll(".state").transition().style("fill", state_color);

            svg.transition()
                .duration(750)
                .call(zoom.transform, d3.zoomIdentity
                    .translate(0,0)
                    .scale(1));
        }

    });

});

//Attendance Legend
// var colorForLegend = d3.scaleThreshold()
//     .domain([500, 1000, 5000, 10000])
//     .range(["rgb(237,248,233)","rgb(186,228,179)","rgb(116,196,118)","rgb(49,163,84)","rgb(0,109,44)"]);

var log = d3.legendColor()
    .labelFormat(d3.format(".0f"))
    .labels(d3.legendHelpers.thresholdLabels)
    .scale(color);

var legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", "translate(450,550)")
    .call(log);

legend.append("text")
    .attr("class", "caption")
    .attr("x", -5)
    .attr("y", -3)
    .attr("fill", "#000")
    .attr("text-anchor", "start")
    .attr("font-weight", "bold")
    .text("People in Attendance at Direct Actions");

// function for zooming the map
function zoomed() {
    g.style("stroke-width", 1.5 / d3.event.transform.k + "px");
    g.attr("transform", d3.event.transform);
}

function stopped() {
    if (d3.event.defaultPrevented) d3.event.stopPropagation();
}