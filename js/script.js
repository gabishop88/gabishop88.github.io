// Initialize the map with the University of Illinois campus in Urbana
var map = L.map('map').setView([40.1018, -88.2272], 15); // Centered on University of Illinois campus, zoom level 15

// Add a tile layer (map background)
L.tileLayer('https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Map data &copy; <a href="https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer">ArcGIS World Imagery</a> contributors',
    maxZoom: 18,
}).addTo(map);

// Load data from trees.json
fetch('data/trees.json')
    .then(response => response.json())
    .then(data => {
        // Process data and add markers to the map
        data.forEach(tree => {
            L.marker([tree.latitude, tree.longitude])
                .bindPopup(`<b>${tree.name}</b><br>${tree.description}`)
                .addTo(map);
        });
    });

// Function to handle user's location
function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                // User's location
                var userLat = position.coords.latitude;
                var userLng = position.coords.longitude;

                // Add marker for user's location
                var userMarker = L.marker([userLat, userLng]).addTo(map);
                
                // Calculate distances and handle proximity interactions
                // You can implement this part based on your requirements
            },
            error => {
                console.error(error.message);
                // Display a message to the user indicating that their location could not be retrieved
            }
        );
    } else {
        // Geolocation is not supported by the browser
        console.error("Geolocation is not supported by your browser");
        // Display a message to the user indicating that geolocation is not supported
    }
}

// Call getUserLocation function to get the user's location
getUserLocation();
