// Demo sensor data
let rainfall = 86;
let soilMoisture = 72;
let groundMovement = 4.2;
let risk = 62;


// Get elements from the HTML
const rainfallValue = document.querySelector(
    ".card:nth-child(1) .value"
);

const soilValue = document.querySelector(
    ".card:nth-child(2) .value"
);

const movementValue = document.querySelector(
    ".card:nth-child(3) .value"
);

const riskValue = document.querySelector(
    ".card:nth-child(4) .value"
);

const progressBar = document.querySelector(
    ".progress-bar"
);

const riskHeading = document.querySelector(
    ".risk-box h3"
);

const riskText = document.querySelector(
    ".risk-box p"
);

// Update dashboard values
function updateDashboard() {

    rainfallValue.textContent = rainfall + " mm";

    soilValue.textContent = soilMoisture + "%";

    movementValue.textContent = groundMovement + " mm";

    riskValue.textContent = getRiskStatus(risk);

    progressBar.style.width = risk + "%";

    riskHeading.textContent = getRiskStatus(risk);

    riskText.textContent =
        "Current risk level is " + risk + "%. Continuous monitoring is required.";
}


// Decide risk status
function getRiskStatus(value) {

    if (value < 40) {
        return "LOW";
    }

    else if (value < 70) {
        return "MODERATE";
    }

    else {
        return "HIGH";
    }
}

// Simulate new sensor readings
function updateSensorData() {

    rainfall = Math.floor(Math.random() * 100);

    soilMoisture = Math.floor(Math.random() * 100);

    groundMovement =
        (Math.random() * 6).toFixed(1);

    risk =
        Math.floor(
            (rainfall * 0.4) +
            (soilMoisture * 0.4) +
            (groundMovement * 3)
        );

    // Keep risk between 0 and 100
    if (risk > 100) {
        risk = 100;
    }

    updateDashboard();
}

// Load dashboard when page opens
updateDashboard();

// Update demo data every 10 seconds
setInterval(updateSensorData, 10000);