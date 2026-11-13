// VILLAGE RIDE - MENU AND BOOKING FUNCTIONS

// Mobile navigation menu
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("open");
  });
}

// Booking map variables
let map;
let pickupMarker;
let destinationMarker;
let routeLayer;
let pickupPoint = null;
let destinationPoint = null;

const locationBtn = document.getElementById("locationBtn");
const showMapBtn = document.getElementById("showMapBtn");
const confirmDestinationBtn =
  document.getElementById("confirmDestinationBtn");
const mapArea = document.getElementById("mapArea");

function showBookingMessage(message) {
  const status = document.getElementById("bookingStatus");

  if (status) {
    status.textContent = message;
  }
}

// Get the passenger's pickup location using their device GPS
if (locationBtn) {
  locationBtn.addEventListener("click", () => {
    const status = document.getElementById("locationStatus");

    if (!navigator.geolocation) {
      status.textContent =
        "Your browser does not support location sharing.";
      return;
    }

    status.textContent =
      "Finding your location... Please allow location access.";

    navigator.geolocation.getCurrentPosition(
      (position) => {
        pickupPoint = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        document.getElementById("pickup").value =
          pickupPoint.lat.toFixed(5) +
          ", " +
          pickupPoint.lng.toFixed(5);

        status.textContent =
          "Pickup location found successfully.";

        showMapBtn.disabled = false;
      },

      (error) => {
        status.textContent =
          "Could not get your location. Allow location access and try again.";
      },

      {
        enableHighAccuracy: true,
        timeout: 15000
      }
    );
  });
}

// Open the map only after the passenger has selected pickup
if (showMapBtn) {
  showMapBtn.addEventListener("click", () => {

    if (!pickupPoint) {
      showBookingMessage(
        "Please choose your pickup location first."
      );
      return;
    }

    mapArea.classList.add("active");

    if (!map) {
      map = L.map("map").setView(
        [pickupPoint.lat, pickupPoint.lng],
        14
      );

      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap contributors"
        }
      ).addTo(map);

      map.on("click", (event) => {

        destinationPoint = {
          lat: event.latlng.lat,
          lng: event.latlng.lng
        };

        if (destinationMarker) {
          map.removeLayer(destinationMarker);
        }

        destinationMarker = L.marker(event.latlng)
          .addTo(map)
          .bindPopup("Your destination")
          .openPopup();

        confirmDestinationBtn.disabled = false;

        showBookingMessage(
          "Destination selected. Press Confirm Destination."
        );
      });
    }

    setTimeout(() => {
      map.invalidateSize();

      map.setView(
        [pickupPoint.lat, pickupPoint.lng],
        14
      );
    }, 150);
  });
}

// Confirm destination and calculate route distance and estimated fare
if (confirmDestinationBtn) {
  confirmDestinationBtn.addEventListener("click", async () => {

    if (!pickupPoint || !destinationPoint) {
      showBookingMessage(
        "Please choose a destination on the map."
      );
      return;
    }

    document.getElementById("destination").value =
      destinationPoint.lat.toFixed(5) +
      ", " +
      destinationPoint.lng.toFixed(5);

    await calculateRoute();

    mapArea.classList.remove("active");
  });
}

// Calculate route and fare
async function calculateRoute() {

  const distanceText = document.getElementById("distance");
  const fareText = document.getElementById("fare");

  showBookingMessage("Calculating your route...");

  // OSRM expects longitude first, then latitude.
  const start =
    `${pickupPoint.lng},${pickupPoint.lat}`;

  const end =
    `${destinationPoint.lng},${destinationPoint.lat}`;

  const url =
    `https://router.project-osrm.org/route/v1/driving/${start};${end}?overview=full&geometries=geojson`;

  try {

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Route service did not respond");
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      throw new Error("No driving route found");
    }

    const distanceKm =
      data.routes[0].distance / 1000;

    const estimatedFare =
      10 + (distanceKm * 3);

    distanceText.textContent =
      distanceKm.toFixed(2) + " km";

    fareText.textContent =
      "R" + estimatedFare.toFixed(2);

    showBookingMessage(
      "Your route and estimated fare are ready."
    );

    // Draw the route on the map if the passenger opens it again.
    if (routeLayer) {
      map.removeLayer(routeLayer);
    }

    routeLayer = L.geoJSON(
      data.routes[0].geometry,
      {
        style: {
          color: "#e5a900",
          weight: 6
        }
      }
    ).addTo(map);

  } catch (error) {

    distanceText.textContent = "Unavailable";
    fareText.textContent = "—";

    showBookingMessage(
      "We could not calculate the route. Please try another destination."
    );
  }
}
