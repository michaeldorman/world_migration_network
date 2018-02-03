	    
// Disable cache
$.ajaxSetup({
    cache: false
})
// Loading data and initializing map
$.getJSON("locations.json", function(data) {
    locations = data;
    $.getJSON("flow.json", function(data) {
        flow = data;
        $.getJSON("total_in.json", function(data) {
            total_in = data;
            $.getJSON("total_out.json", function(data) {
                total_out = data;
                make_map();
            });
        }); 
    });
});
// Define radius and line-width constants
var radius_old_min = 0; 
var radius_old_max = 7000000;
var radius_new_min = 5;
var radius_new_max = 25;
var width_old_min = 0; 
var width_old_max = 8000000;
var width_new_min = 0.1;
var width_new_max = 120;
// Define map variable
var map = L.map('map').setView([0, 0], 2);
// Add empty dropdown menu
var legend = L.control({position: 'topright'});
legend.onAdd = function (map) {
    var div = L.DomUtil.create('div', 'info legend');
    div.innerHTML += '<b>Click on Country to<br>Display Migration Flow</b><hr>';
    div.innerHTML += 'Flow direction<br>';
    div.innerHTML += '<input type="radio" name="flow_type" value="in"> In<br>';
    div.innerHTML += '<input type="radio" name="flow_type" value="out" checked> Out<br>';
    div.innerHTML += '<hr>Time period<br>';
    div.innerHTML += '<input type="radio" name="year" value="1990"> 1990<br>';
    div.innerHTML += '<input type="radio" name="year" value="1995"> 1995<br>';
    div.innerHTML += '<input type="radio" name="year" value="2000"> 2000<br>';
    div.innerHTML += '<input type="radio" name="year" value="2005" checked> 2005<br>';
    return div;
};
legend.addTo(map);
// Add tile layer
L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
// Define layer group for flow lines
var flow_group = L.layerGroup().addTo(map);
var locations_layer = L.layerGroup().addTo(map);
var total;
// Link type
$("input[name='flow_type']").change(make_map).change(show_flow_lines);
$("input[name='year']").change(make_map).change(show_flow_lines);
function make_map() {
    locations_layer.clearLayers();
    type = $("input[name='flow_type']:checked").val();
    year = $("input[name='year']:checked").val();
    if(type === "out") {from = "orig"; to = "dest";}
    if(type === "in") {from = "dest"; to = "orig";}
    if(type === "out") {total = total_out;}
    if(type === "in") {total = total_in;}
    $.each(locations, function(key, value) {
    
        coords = [value.lat, value.lon];
        current_country = $(total).filter(function (i, n) {return n[from] === value.name});
        v = current_country[0]['flow_' + year];
        radius = (radius_new_max - radius_new_min) / (radius_old_max - radius_old_min) * (v - radius_old_min) + radius_new_min
        layer = L.circleMarker(coords, {radius: radius})
        layer._leaflet_id = value.name;  // Set country name ID
        layer.on({
            click: show_flow_lines, // On mouseover: show flow lines
        });            
        layer.addTo(locations_layer);
        
});
}
// Function to load flow lines on click
function show_flow_lines(e) {
    flow_group.clearLayers();
    
    target = e.target;
    
        if(!target.type) { // Click NOT on radio buttons 
            current = target; // Current clicked location
        }
        
        if(typeof current != "undefined") {
        
        id = current._leaflet_id; // Current location ID
        console.log(id);
        destinations = $(flow).filter(function (i, n) { // Get current origins / destinations
            return n[from] === id;
        });
        $.each( // For each destination...
            destinations, 
            function(key, value) {
                dest = $(locations).filter(function (i, n) {return n.name === value[to];}); // Get location data
                var v = value['flow_' + year];
                var width = (width_new_max - width_new_min) / (width_old_max - width_old_min) * (v - width_old_min) + width_new_min
                if(type === "out") {path = [current._latlng, [dest[0].lat, dest[0].lon]];}
                if(type === "in") {path = [[dest[0].lat, dest[0].lon], current._latlng];}
                L.polyline.antPath(path, {interactive: false, weight: width, color: "red"})
                .addTo(flow_group); // Draw polyline
        });
        
    }
    
}
