
// VILLAGE RIDE PRICING
const baseFare = 10;
const pricePerKm = 3;

// MAP
const map = L.map("map").setView(
    [-24.0, 29.0],
    13
);

L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        attribution: "&copy; OpenStreetMap contributors"
    }
).addTo(map);


// VARIABLES
let pickupLocation = null;
let destinationLocation = null;

let pickupMarker = null;
let destinationMarker = null;
let routeLine = null;


// HTML ELEMENTS
const locationBtn = document.getElementById("locationBtn");
const showMapBtn = document.getElementById("showMapBtn");
const confirmBtn = document.getElementById("confirmDestinationBtn");

const mapArea = document.getElementById("mapArea");

const pickupInput = document.getElementById("pickup");
const destinationInput = document.getElementById("destination");

const locationStatus = document.getElementById("locationStatus");

const distanceDisplay = document.getElementById("distance");
const fareDisplay = document.getElementById("fare");


// FIND CURRENT LOCATION
locationBtn.addEventListener("click", function () {

    if (!navigator.geolocation) {
        locationStatus.innerText = "GPS is not supported.";
        return;
    }

    locationStatus.innerText = "Finding your location...";

    navigator.geolocation.getCurrentPosition(

        function (position) {

            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            pickupLocation = [lat, lng];

            if (pickupMarker) {
                map.removeLayer(pickupMarker);
            }

            pickupMarker = L.marker(pickupLocation)
                .addTo(map)
                .bindPopup("Your pickup location");

            pickupInput.value =
                lat.toFixed(5) + ", " + lng.toFixed(5);

            map.setView(pickupLocation, 15);

            locationStatus.innerText =
                "Pickup location found!";

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

        function () {
            locationStatus.innerText =
                "Location not found. Please allow GPS permission.";
        }

    );

});


// OPEN DESTINATION MAP
showMapBtn.addEventListener("click", function () {

    if (!pickupLocation) {
        alert("Please select your pickup location first.");
        return;
    }

    mapArea.classList.add("active");

    // LET LEAFLET RECOGNISE THE NEW MAP SIZE
    setTimeout(function () {
        map.invalidateSize();
        map.setView(pickupLocation, 15);
    }, 100);

});


// SELECT DESTINATION
map.on("click", function (event) {

    if (!mapArea.classList.contains("active")) {
        return;
    }

    destinationLocation = [
        event.latlng.lat,
        event.latlng.lng
    ];

    if (destinationMarker) {
        map.removeLayer(destinationMarker);
    }

    destinationMarker = L.marker(destinationLocation)
        .addTo(map)
        .bindPopup("Selected destination")
        .openPopup();

});


// CONFIRM DESTINATION
confirmBtn.addEventListener("click", async function () {

    if (!destinationLocation) {
        alert("Please tap the map to choose your destination.");
        return;
    }

    destinationInput.value =
        destinationLocation[0].toFixed(5) +
        ", " +
        destinationLocation[1].toFixed(5);

    mapArea.classList.remove("active");

    await calculateRoute();

});


// CALCULATE ROAD DISTANCE
async function calculateRoute() {

    const start =
        pickupLocation[1] + "," + pickupLocation[0];

    const end =
        destinationLocation[1] + "," + destinationLocation[0];

    const url =
        "https://router.project-osrm.org/route/v1/driving/" +
        start + ";" + end +
        "?overview=full&geometries=geojson";

    distanceDisplay.innerText = "Distance: Calculating...";
    fareDisplay.innerText = "Your fare: Calculating...";

    try {

        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok || data.code !== "Ok") {
            throw new Error("Route unavailable");
        }

        const km = data.routes[0].distance / 1000;

        const total = baseFare + (km * pricePerKm);

        distanceDisplay.innerText =
            "Distance: " + km.toFixed(2) + " km";

        fareDisplay.innerText =
            "Your fare: R" + total.toFixed(2);

        if (routeLine) {
            map.removeLayer(routeLine);
        }

        routeLine = L.geoJSON(
            data.routes[0].geometry,
            {
                style: {
                    color: "#16834a",
                    weight: 6
                }
            }
        ).addTo(map);

    } catch (error) {

        distanceDisplay.innerText =
            "Distance: Could not calculate";

        fareDisplay.innerText =
            "Route unavailable. Please try again.";

        console.error(error);

    }

}
