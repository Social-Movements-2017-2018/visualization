//Width and height
var w = 800;
var h = 650;

//Define map projection
var projection = d3.geoAlbersUsa()
                       .translate([w/2, h/2.5])
                       .scale([1000]);

//Define path generator
var path = d3.geoPath()
                 .projection(projection);

//Define color scale to sort data values into buckets of color
var color = d3.scaleThreshold()
              .domain([100,1000,5000,10000]) //Chosen input domain for color scale based on data
              .range(["rgb(237,248,233)","rgb(186,228,179)","rgb(116,196,118)","rgb(49,163,84)","rgb(0,109,44)"]);
              //Colors derived from ColorBrewer, by Cynthia Brewer
              //https://github.com/d3/d3-scale-chromatic

//Create SVG element
var svg = d3.select("body")
            .append("svg")
            .attr("width", w)
            .attr("height", h);

//Load in agriculture data
d3.csv("data.csv", function(data) {

    //Load in GeoJSON data
    d3.json("unitedstates.json", function(json) {

        //Merge the ag. data and GeoJSON
        //Loop through once for each ag. data value
        for (var i = 0; i < data.length; i++) {

            var dataMovement = data[i].Movement;
            var dataCause = data[i].Cause;
            var dataAttendance = data[i].Attendance;
            var dataCity = data[i].City;
            var dataState = data[i].State;
            var dataDate = data[i].Date;
            

            //Find the corresponding state inside the GeoJSON
            for (var j = 0; j < json.features.length; j++) {

                var jsonState = json.features[j].properties.name;

                if (dataState == jsonState) {

                    //Copy the data value into the JSON
                    json.features[j].properties.movement = dataMovement;
                    json.features[j].properties.cause = dataCause;
                    json.features[j].properties.attendance = dataAttendance;
                    json.features[j].properties.city = dataCity;
                    json.features[j].properties.state = dataState;
                    json.features[j].properties.date = dataDate;

                    //Stop looking through the JSON
                    break;

                }
            }		
        }

        //Bind data and create one path per GeoJSON feature
        svg.selectAll("path")
           .data(json.features)
           .enter()
           .append("path")
           .attr("d", path)
           .style("fill", function(d) {
                //Get data value
                var attendance = d.properties.attendance;

                if (attendance) {
                    //If value exists…
                    return color(attendance);
                } else {
                    //If value is undefined…
                    return "black";
                }
           });

    });

});

//Attendance Legend
var color = d3.scaleThreshold()
    .domain([100, 1000, 5000, 10000])
    .range(["rgb(237,248,233)","rgb(186,228,179)","rgb(116,196,118)","rgb(49,163,84)","rgb(0,109,44)"]);

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