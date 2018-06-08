/*
* Sources:
*   Zooming adapted from https://bl.ocks.org/ashenfad/48b4621bd3a9f1bb884a
* */

var womenClicked = true;
var politicsClicked = true;
var racialClicked = true;
var religiousClicked = true;
var lgbtqClicked = true;
var enviroClicked = true;
var housingClicked = true;
var workersClicked = true;
var otherClicked = true;

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
var h = 600;
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

var stateColor = d3.scaleThreshold()
    .domain([5,10,50,100]) //Chosen input domain for color scale based on data
    .range(["rgb(237,248,233)","rgb(186,228,179)","rgb(116,196,118)","rgb(49,163,84)","rgb(0,109,44)"]);
    //Colors derived from ColorBrewer, by Cynthia Brewer
    //https://github.com/d3/d3-scale-chromatic

//Define color scale to sort data values into buckets of color
var pointColor = d3.scaleThreshold()
              .domain([500,1000,5000,10000]) //Chosen input domain for color scale based on data
              .range(["rgb(255,255,178","rgb(254,204,92)","rgb(253,141,60)","rgb(240,59,32)","rgb(189,0,38)"]);
              //Colors derived from ColorBrewer, by Cynthia Brewer
              //https://github.com/d3/d3-scale-chromatic

//Create main SVG element for the visualization
var svg = d3.select("body")
            .append("svg")
            .attr("width", w)
            .attr("height", h)
            .on("click", stopped, true);

//Create SVG element for information on the right
var infoSvg = d3.select("body")
            .append("svg")
            .attr("class", "infoSvg")
            .attr("width", 300)
            .attr("height", h);

//Tooltip div
var div = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

var g = svg.append("g");

// binds zoom function to svg and sets initial translation and scale
svg.call(zoom) // delete this line to disable free zooming
    .call(zoom.transform, d3.zoomIdentity.translate(0,0).scale(1));

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
                    stateYearlyAttendance += 1;
                }
                
            }
            //Add total yearly attendance into JSON file that that state
            json.features[j].properties.yearlyAttendance = stateYearlyAttendance;
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
            .style("stroke-width", 1)
           .on("click", clicked);

        function state_color(d) {
            if (d3.select(this).classed("active")) return "#fff8e7";
            //Get data value
            var attendance = d.properties.yearlyAttendance;

            if (attendance) {
                //If value exists…
                return stateColor(attendance);
            } else {
                //If value is undefined…
                return "black";
            }
        }
        
        function showPointer(d) {
            statePath.attr("style", "cursor: pointer")
                     .style("fill", state_color)
                    .style("stroke", "white")
                    .style("stroke-width", 1)
                     .on("click", clicked);
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

            // zooms in on state
            svg.transition()
                .duration(750)
                .call(zoom.transform, d3.zoomIdentity
                    .translate(translate[0], translate[1])
                    .scale(scale));

            var log = d3.legendColor()
                .labelFormat(d3.format(".0f"))
                .labels(d3.legendHelpers.thresholdLabels)
                .scale(pointColor);

            d3.select(".legend")
                .call(log);
            
//            var dotsData = data;
//            if(womenClicked) {
//                dotsData.forEach() {
//                    if (d.Movement === "Women's Rights") {
//                        console.log("movement: women");
//                    }     
//                }
//            }
            
            var movementCircle = g.selectAll("circle")
                .data(data)
                .enter()
                .append("circle")
                .attr("class", "point")
                .attr("cx", function (point) {
                    try {
                        return projection([point.Lon, point.Lat])[0];
                    } catch (err) {
                        console.log(point);
                        return -1;
                    }
                })
                .attr("cy", function (point) {
                    try {
                        return projection([point.Lon, point.Lat])[1];
                    } catch (err) {
                        console.log(point);
                        return -1;
                    }
                })
                .attr("r", 2)
                .style("fill", function (point) {
                    if (stateCodetoName[point.State] === d.properties.name) {
                        return pointColor(point.Attendance);
                    } else {
                        return "none";
                    }
                })
                .on("mouseover", showTooltip)
                .on("mouseout", mouseOut);
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
                    .translate(0,0)
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
            div.html("Social Movement: " + d.Movement + "<br/>" + 
                     "Cause: " + d.Cause + "<br/>" +
                     "Description: " + d.Description + "<br/>" +
                     "Attendance: " + d.Attendance + "<br/>" +
                     "City: " + d.City + "<br/>" +
                     "Date: " + d.Date)	
               .style("left", "890px")
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
        document.getElementById("women").onclick = function (d) {
            if (womenClicked) { 
                womenClicked = false;
                console.log("women = false")
            }
            else if (!womenClicked) {
                womenClicked = true;
                console.log("women = true")
            }
        }
        document.getElementById("politics").onclick = function (d) {
            if (politicsClicked) { 
                politicsClicked = false;
                console.log("politics = false")
            }
            else if (!politicsClicked) {
                politicsClicked = true;
                console.log("politics = true")
            }
        }
        document.getElementById("racial").onclick = function (d) {
            if (racialClicked) { 
                racialClicked = false;
                console.log("racial = false")
            }
            else if (!racialClicked) {
                racialClicked = true;
                console.log("racial = true")
            }
        }
        document.getElementById("religious").onclick = function (d) {
            if (religiousClicked) { 
                religiousClicked = false;
                console.log("religious = false")
            }
            else if (!religiousClicked) {
                religiousClicked = true;
                console.log("religious = true")
            }
        }
        document.getElementById("lgbtq+").onclick = function (d) {
            if (lgbtqClicked) { 
                lgbtqClicked = false;
                console.log("lgbtq+ = false")
            }
            else if (!lgbtqClicked) {
                lgbtqClicked = true;
                console.log("lgbtq+ = true")
            }
        }
        document.getElementById("enviro").onclick = function (d) {
            if (enviroClicked) { 
                enviroClicked = false;
                console.log("enviro = false")
            }
            else if (!enviroClicked) {
                enviroClicked = true;
                console.log("enviro = true")
            }
        }
        document.getElementById("housing").onclick = function (d) {
            if (housingClicked) { 
                housingClicked = false;
                console.log("housing = false")
            }
            else if (!housingClicked) {
                housingClicked = true;
                console.log("housing = true")
            }
        }
        document.getElementById("workers").onclick = function (d) {
            if (workersClicked) { 
                workersClicked = false;
                console.log("workers = false")
            }
            else if (!workersClicked) {
                workersClicked = true;
                console.log("workers = true")
            }
        }
        document.getElementById("other").onclick = function (d) {
            if (otherClicked) { 
                otherClicked = false;
                console.log("other = false")
            }
            else if (!otherClicked) {
                otherClicked = true;
                console.log("other = true")
            }
        }

    });

});

//Yearly Attendance Legend
var log = d3.legendColor()
    .labelFormat(d3.format(".0f"))
    .labels(d3.legendHelpers.thresholdLabels)
    .scale(stateColor);

var legend = infoSvg.append("g")
    .attr("class", "legend")
    .attr("transform", "translate(30,30)")
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
}

function stopped() {
    if (d3.event.defaultPrevented) d3.event.stopPropagation();
}