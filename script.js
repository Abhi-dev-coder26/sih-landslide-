const siteData = [
    { name: 'Assam Hill Zone', state: 'Assam', coords: [26.1445, 91.7362], rainfall: 86, moisture: 72, movement: 4.2 },
    { name: 'Mizoram Ridge', state: 'Mizoram', coords: [23.1645, 92.9376], rainfall: 64, moisture: 58, movement: 2.8 },
    { name: 'Arunachal Slope', state: 'Arunachal Pradesh', coords: [28.2180, 94.7278], rainfall: 92, moisture: 78, movement: 5.5 },
    { name: 'Meghalaya Crest', state: 'Meghalaya', coords: [25.4670, 91.3662], rainfall: 75, moisture: 69, movement: 3.9 }
];

const mapStyles = {
    osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
};

const rainfallValue = document.getElementById('rainfallValue');
const soilValue = document.getElementById('soilValue');
const movementValue = document.getElementById('movementValue');
const riskValue = document.getElementById('riskValue');
const progressBar = document.getElementById('progressBar');
const riskHeading = document.getElementById('riskHeading');
const riskText = document.getElementById('riskText');
const alertList = document.getElementById('alertList');
const locationList = document.getElementById('locationList');
const activeSites = document.getElementById('activeSites');
const alertCount = document.getElementById('alertCount');
const heroStatus = document.getElementById('heroStatus');
const mapStyleSelect = document.getElementById('mapStyle');
const thresholdSelect = document.getElementById('riskThreshold');
const intervalSelect = document.getElementById('refreshInterval');
const enableAlerts = document.getElementById('enableAlerts');
const refreshBtn = document.getElementById('refreshBtn');
const quickAlertBtn = document.getElementById('quickAlertBtn');

let map;
let baseLayer;
let markerLayer;
let refreshTimer;

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function getRiskStatus(value) {
    if (value < 40) return 'LOW';
    if (value < 70) return 'MODERATE';
    return 'HIGH';
}

function getRiskColor(value) {
    if (value < 40) return '#2ebb8f';
    if (value < 70) return '#f2af45';
    return '#ee5d4f';
}

function computeRisk(site) {
    const weightedRisk = Math.round(
        (site.rainfall * 0.38) +
        (site.moisture * 0.35) +
        (site.movement * 12)
    );
    return clamp(weightedRisk, 0, 100);
}

function updateDashboard() {
    const averageRainfall = Math.round(siteData.reduce((sum, site) => sum + site.rainfall, 0) / siteData.length);
    const averageMoisture = Math.round(siteData.reduce((sum, site) => sum + site.moisture, 0) / siteData.length);
    const averageMovement = (siteData.reduce((sum, site) => sum + site.movement, 0) / siteData.length).toFixed(1);
    const topRisk = Math.max(...siteData.map(site => computeRisk(site)));

    rainfallValue.textContent = `${averageRainfall} mm`;
    soilValue.textContent = `${averageMoisture}%`;
    movementValue.textContent = `${averageMovement} mm`;

    const riskStatus = getRiskStatus(topRisk);
    riskValue.textContent = riskStatus;
    riskHeading.textContent = `${riskStatus} Risk`;
    progressBar.style.width = `${topRisk}%`;
    riskText.textContent = `Current risk level is ${topRisk}%. Continuous monitoring is required.`;

    heroStatus.textContent = `${riskStatus} Risk`;
    activeSites.textContent = String(siteData.length);

    const criticalSites = siteData.filter(site => computeRisk(site) >= Number(thresholdSelect.value)).length;
    alertCount.textContent = String(criticalSites);

    const riskTone = riskStatus.toLowerCase();
    const statusColors = {
        low: '#2ebb8f',
        moderate: '#f2af45',
        high: '#ee5d4f'
    };

    document.documentElement.style.setProperty('--warning', statusColors[riskTone] || '#f2af45');
    progressBar.style.background = `linear-gradient(90deg, ${statusColors[riskTone] || '#f2af45'}, #f6c76d)`;
    riskHeading.style.color = statusColors[riskTone] || '#f2af45';
}

function renderLocationCards() {
    locationList.innerHTML = siteData.map((site) => {
        const risk = computeRisk(site);
        const status = getRiskStatus(risk).toLowerCase();
        return `
            <article class="location-card">
                <h3>${site.name}</h3>
                <p>${site.state}</p>
                <span class="tag ${status}">${status} risk</span>
            </article>
        `;
    }).join('');
}

function renderAlerts() {
    const highRiskSites = siteData.filter(site => computeRisk(site) >= Number(thresholdSelect.value));

    if (!highRiskSites.length) {
        alertList.innerHTML = '<li>No active alerts at the current threshold.</li>';
        return;
    }

    alertList.innerHTML = highRiskSites.map((site) => {
        const risk = computeRisk(site);
        return `<li>${site.name}: risk at ${risk}% with ${site.rainfall} mm rainfall and ${site.moisture}% soil moisture.</li>`;
    }).join('');
}

function setMapStyle(style) {
    if (!map) return;

    if (baseLayer) {
        map.removeLayer(baseLayer);
    }

    baseLayer = L.tileLayer(mapStyles[style] || mapStyles.osm, {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
}

function initializeMap() {
    map = L.map('map').setView([27.7, 94.6], 6.5);
    markerLayer = L.layerGroup().addTo(map);
    setMapStyle(mapStyleSelect.value);
    renderMapMarkers();
}

function renderMapMarkers() {
    if (!map || !markerLayer) return;

    markerLayer.clearLayers();

    siteData.forEach((site) => {
        const risk = computeRisk(site);
        const status = getRiskStatus(risk);
        const color = getRiskColor(risk);

        const marker = L.circleMarker(site.coords, {
            radius: 14,
            color,
            fillColor: color,
            fillOpacity: 0.8,
            weight: 2
        });

        marker.bindPopup(`
            <div>
                <strong>${site.name}</strong><br>
                ${site.state}<br>
                Risk: ${risk}%<br>
                Rainfall: ${site.rainfall} mm<br>
                Soil moisture: ${site.moisture}%
            </div>
        `);

        marker.addTo(markerLayer);
    });
}

function simulateSensorData() {
    siteData.forEach((site) => {
        site.rainfall = clamp(site.rainfall + Math.floor(Math.random() * 26) - 10, 30, 140);
        site.moisture = clamp(site.moisture + Math.floor(Math.random() * 22) - 8, 30, 95);
        site.movement = Number((site.movement + (Math.random() * 3.6 - 1.2)).toFixed(1));
        site.movement = clamp(site.movement, 0.8, 7.5);
    });

    updateDashboard();
    renderLocationCards();
    renderAlerts();
    renderMapMarkers();
}

function triggerAlert() {
    if (!enableAlerts.checked) {
        return;
    }

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(660, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.12, audioContext.currentTime + 0.06);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.45);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.45);
}

mapStyleSelect.addEventListener('change', (event) => {
    setMapStyle(event.target.value);
});

thresholdSelect.addEventListener('change', () => {
    updateDashboard();
    renderAlerts();
});

intervalSelect.addEventListener('change', () => {
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(simulateSensorData, Number(intervalSelect.value));
});

refreshBtn.addEventListener('click', () => {
    simulateSensorData();
    triggerAlert();
});

quickAlertBtn.addEventListener('click', () => {
    triggerAlert();
    const currentStatus = getRiskStatus(Math.max(...siteData.map(computeRisk)));
    riskHeading.textContent = `${currentStatus} Risk`;
    riskText.textContent = 'Emergency alert triggered. Local teams are reviewing the critical slope zone.';
});

updateDashboard();
renderLocationCards();
renderAlerts();
initializeMap();
refreshTimer = setInterval(simulateSensorData, Number(intervalSelect.value));
