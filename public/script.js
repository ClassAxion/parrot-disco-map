const socket = io({ autoConnect: true, reconnection: true });

const defaultPosition = {
    lat: 53.34912,
    lon: 17.64003,
};

const map = L.map('map').setView([defaultPosition.lat, defaultPosition.lon], 15);

L.tileLayer('http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}', {
    attribution: 'Parrot Disco Live Map',
    maxZoom: 20,
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
}).addTo(map);

const discoOnMap = {};

const discoIcon = L.icon({
    iconUrl: '/disco.png',
    iconSize: [64, 64],
});

function createMarker(latitude, longitude) {
    const marker = L.marker([latitude, longitude], { icon: discoIcon }).addTo(map);

    return marker;
}

let follow = true;

function deleteDisco(discoId) {
    const marker = discoOnMap[discoId].marker;

    if (!marker) return;

    map.removeLayer(marker);

    delete discoOnMap[discoId];
}

function updateDisco(discoId, location, altitude, angle, speed) {
    if (!location) return;

    const { latitude, longitude } = location;

    if (!altitude) altitude = 0;
    if (!angle) angle = 0;
    if (!speed) speed = 0;

    const isNew = !discoOnMap[discoId];

    if (isNew) {
        console.debug(`Creating new disco marker..`);
    }

    const marker = isNew ? createMarker(latitude, longitude) : discoOnMap[discoId].marker;

    const latLng = [latitude, longitude];

    const kmh = (speed * 3.6).toFixed(0);

    marker.bindPopup('#' + discoId + ' ' + altitude.toFixed(0) + 'm' + ' ' + kmh + ' km/h');
    marker.setLatLng(latLng);

    const icon = marker._icon;

    icon.style['transform-origin'] = '50% 50%';

    if (!icon.style.transform.includes('rotate')) {
        icon.style.transform += ` rotate(${angle}deg)`;
    } else {
        icon.style.transform = icon.style.transform.replace(/rotate\(([0-9]+)deg\)/, `rotate(${angle}deg)`);
    }

    if (follow || follow === discoId) {
        map.panTo(latLng, {
            animate: true,
        });
    }

    discoOnMap[discoId] = {
        location: {
            latitude,
            longitude,
        },
        altitude,
        marker,
        updatedAt: Date.now(),
    };
}

function removeExpired() {
    const ids = Object.keys(discoOnMap);
    const timeoutMs = 10000;

    for (const discoId of ids) {
        const updatedAt = discoOnMap[discoId].updatedAt;

        if (Date.now() - updatedAt > timeoutMs) {
            deleteDisco(discoId);

            console.debug(`Removed expired disco marker..`);
        }
    }
}

socket.on('update', function (data) {
    console.log(data);

    const { id: discoId, location, altitude, angle, speed } = data;

    updateDisco(discoId, location, altitude, angle, speed);
});

setInterval(function () {
    removeExpired();

    const discoIds = Object.keys(discoOnMap);

    for (const discoId of discoIds) {
        const difference = Date.now() - discoOnMap[discoId].updatedAt;

        const seconds = Number(Math.floor(difference / 1000).toFixed(0));
    }
}, 5000);
