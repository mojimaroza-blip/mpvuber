
function calculateFare() {

    // Our Village Ride pricing
    let baseFare = 10;
    let pricePerKm = 3;

    // Get the distance entered by the passenger
    let distance = Number(
        document.getElementById("distance").value
    );

    // Check whether the distance is valid
    if (!Number.isFinite(distance) || distance <= 0) {

        document.getElementById("fare").innerText =
            "Please enter a valid distance";

        return;
    }

    // Calculate the total fare
    let total = baseFare + (distance * pricePerKm);

    // Display the fare
    document.getElementById("fare").innerText =
        "Your fare: R" + total.toFixed(2);
}
