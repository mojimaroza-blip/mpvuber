
// VILLAGE RIDE PRICING
const baseFare = 10;
const pricePerKm = 3;

// MAP STARTS AT MPHANAMA
const map = L.map("map").setView(
    [-24.0, 29.0],
    13
);

// LOAD OPENSTREETMAP
L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
    }
).addTo(map);


// VARIABLES
let pickupLocation = null;
let destinationLocation = null;

let pickupMarker = null;
let destinationMarker = null;
let routeLine = null;


// GET HTML ELEMENTS
const locationBtn =
    document.getElementById("locationBtn");

const locationStatus =
    document.getElementById("locationStatus");

const pickupInput =
    document.getElementById("pickup");

const destinationInput =
    document.getElementById("destination");

const distanceDisplay =
    document.getElementById("distance");

const fareDisplay =
    document.getElementById("fare");


// FIND CURRENT LOCATION
locationBtn.addEventListener("click", function () {

    if (!navigator.geolocation) {

        locationStatus.innerText =
            "Your browser does not support GPS.";

        return;
    }

    locationStatus.innerText =
        "Finding your location...";

    navigator.geolocation.getCurrentPosition(

        function (position) {

            const latitude =
                position.coords.latitude;

            const longitude =
                position.coords.longitude;

            pickupLocation = [
                latitude,
                longitude
            ];

            // REMOVE OLD PICKUP MARKER
            if (pickupMarker) {
                map.removeLayer(pickupMarker);
            }

            // ADD NEW PICKUP MARKER
            pickupMarker = L.marker(
                pickupLocation
            ).addTo(map);

            pickupMarker.bindPopup(
                "Your pickup location"
            ).openPopup();

            // MOVE MAP TO PASSENGER
            map.setView(pickupLocation, 15);

            pickupInput.value =
                latitude.toFixed(5) + ", " +
                longitude.toFixed(5);

            locationStatus.innerText =
                "Your current location was found!";

            // RESET PREVIOUS DESTINATION AND ROUTE
            destinationLocation = null;

            destinationInput.value = "";

            distanceDisplay.innerText =
                "Distance: Not calculated";

            fareDisplay.innerText =
                "Your fare: R0.00";

            if (destinationMarker) {
                map.removeLayer(destinationMarker);
                destinationMarker = null;
            }

            if (routeLine) {
                map.removeLayer(routeLine);
                routeLine = null;
            }

        },

        function (error) {

            locationStatus.innerText =
                "Could not find your location. Allow location access and try again.";

        },

        {
            enableHighAccuracy: true,
            timeout: 15000
        }

    );

});


// PASSENGER SELECTS DESTINATION BY TAPPING MAP
map.on("click", function (event) {

    if (!pickupLocation) {

        alert("Please select your current location first.");

        return;
    }

    destinationLocation = [
        event.latlng.lat,
        event.latlng.lng
    ];

    // REMOVE OLD DESTINATION MARKER
    if (destinationMarker) {
        map.removeLayer(destinationMarker);
    }

    // ADD DESTINATION MARKER
    destinationMarker = L.marker(
        destinationLocation
    ).addTo(map);

    destinationMarker.bindPopup(
        "Your destination"
    ).openPopup();

    destinationInput.value =
        destinationLocation[0].toFixed(5) +
        ", " +
        destinationLocation[1].toFixed(5);

    // CALCULATE ROAD ROUTE
    calculateRoute();

});


// CALCULATE ROAD DISTANCE AND FARE
async function calculateRoute() {

    if (!pickupLocation || !destinationLocation) {
        return;
    }

    distanceDisplay.innerText =
        "Distance: Calculating...";

    fareDisplay.innerText =
        "Your fare: Calculating...";

    const start =
        pickupLocation[1] + "," +
        pickupLocation[0];

    const end =
        destinationLocation[1] + "," +
        destinationLocation[0];

    const routeURL =
        "https://router.project-osrm.org/route/v1/driving/" +
        start + ";" + end +
        "?overview=full&geometries=geojson";

    try {

        const response = await fetch(routeURL);

        const data = await response.json();

        if (
            !response.ok ||
            data.code !== "Ok" ||
            !data.routes ||
            data.routes.length === 0
        ) {

            throw new Error("Route not found");

        }

        // GET ROAD DISTANCE IN KILOMETRES
        const metres =
            data.routes[0].distance;

        const kilometres =
            metres / 1000;

        // CALCULATE FARE
        const total =
            baseFare + (kilometres * pricePerKm);

        // DISPLAY DISTANCE
        distanceDisplay.innerText =
            "Distance: " +
            kilometres.toFixed(2) +
            " km";

        // DISPLAY FARE
        fareDisplay.innerText =
            "Your fare: R" +
            total.toFixed(2);

        // REMOVE OLD ROUTE
        if (routeLine) {
            map.removeLayer(routeLine);
        }

        // DRAW ROAD ROUTE ON MAP
        routeLine = L.geoJSON(
            data.routes[0].geometry,
            {
                style: {
                    color: "#16834a",
                    weight: 6
                }
            }
        ).addTo(map);

        // SHOW THE COMPLETE ROUTE
        map.fitBounds(
            routeLine.getBounds(),
            {
                padding: [30, 30]
            }
        );

    }

    catch (error) {

        distanceDisplay.innerText =
            "Distance: Could not calculate";

        fareDisplay.innerText =
            "Please select another destination.";

        console.error(error);

    }

}
