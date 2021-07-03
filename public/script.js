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

function updateDisco(discoId, latitude, longitude, altitude, angle) {
    const marker = !discoOnMap[discoId] ? createMarker(latitude, longitude) : discoOnMap[discoId].marker;

    const latLng = [latitude, longitude];

    marker.bindPopup('#' + discoId + ' ' + altitude + 'm');
    marker.setLatLng(latLng);

    const icon = marker._icon;

    icon.style['transform-origin'] = '50% 50%';

    if (!icon.style.transform.includes('rotate')) {
        icon.style.transform += ` rotate(${angle}deg)`;
    } else {
        icon.style.transform = icon.style.transform.replace(/rotate\(([0-9]+)deg\)/, `rotate(${angle}deg)`);
    }

    if (follow) {
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

socket.on('update', function ({ id: discoId, location, altitude, angle }) {
    updateDisco(discoId, location.latitude, location.longitude, altitude, angle);
});

setInterval(function () {
    const discoIds = Object.keys(discoOnMap);

    for (const discoId of discoIds) {
        const difference = Date.now() - discoOnMap[discoId].updatedAt;

        const seconds = Number(Math.floor(difference / 1000).toFixed(0));
    }
}, 5000);
