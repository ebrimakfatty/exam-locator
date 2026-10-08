/* ==================================================
   FERGUSSON COLLEGE CAMPUS MAP (real map)
   Uses Leaflet + OpenStreetMap tiles (free, no API key).

   TO FIX A BUILDING'S POSITION: change its lat/lng below.
   Right-click the spot in Google Maps -> click the numbers
   at the top of the menu to copy "latitude, longitude".
================================================== */

const CAMPUS_CENTER = [18.52397, 73.83922];

const BUILDINGS = {
    "Main Building":               [18.52400, 73.83930],
    "Mathematics Department":      [18.52450, 73.83860],
    "Computer Science Department": [18.52420, 73.83830],
    "Physics Department":          [18.52330, 73.83930],
    "Chemistry Department":        [18.52320, 73.83880],
    "Geology Department":          [18.52310, 73.83970],
    "Amphitheatre":                [18.52430, 73.83975]
};

const params = new URLSearchParams(window.location.search);
const selectedBuilding = params.get('building');
const selectedFloor = params.get('floor');
const selectedRoom = params.get('room');

function labelIcon(name, selected) {
    return L.divIcon({
        className: '',
        html: '<div class="bld-label' + (selected ? ' selected' : '') + '">' +
              (selected ? '📍 ' : '') + escapeHTML(name) + '</div>',
        iconSize: null,
        iconAnchor: [0, 0]
    });
}

function escapeHTML(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function initializeCampusMap() {
    const mapEl = document.getElementById('leaflet-map');
    if (!mapEl || typeof L === 'undefined') return;

    const selectedKey = Object.keys(BUILDINGS).find(
        n => selectedBuilding && n.toLowerCase() === selectedBuilding.trim().toLowerCase()
    );
    const start = selectedKey ? BUILDINGS[selectedKey] : CAMPUS_CENTER;

    const map = L.map(mapEl, { zoomControl: true }).setView(start, 18);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    Object.keys(BUILDINGS).forEach(name => {
        if (name === selectedKey) return;
        L.marker(BUILDINGS[name], { icon: labelIcon(name, false) }).addTo(map);
    });

    if (selectedKey) {
        const floorText = selectedFloor && selectedFloor !== 'Unspecified'
            ? selectedFloor : 'Floor to be confirmed';
        const roomText = selectedRoom ? 'Room ' + selectedRoom : 'Examination Room';

        const marker = L.marker(BUILDINGS[selectedKey], {
            icon: labelIcon(selectedKey, true),
            zIndexOffset: 1000
        }).addTo(map);

        marker.bindPopup(
            '<strong>' + escapeHTML(selectedKey) + '</strong><br>' +
            escapeHTML(floorText) + '<br>' + escapeHTML(roomText)
        ).openPopup();

        L.circle(BUILDINGS[selectedKey], {
            radius: 18, color: '#013A40', fillColor: '#e63946', fillOpacity: 0.35
        }).addTo(map);

        const link = document.getElementById('google-maps-link');
        if (link) {
            const [lat, lng] = BUILDINGS[selectedKey];
            link.href = 'https://www.google.com/maps/search/?api=1&query=' + lat + ',' + lng;
            link.style.display = 'inline-block';
        }
    }

    // Leaflet needs a size refresh if the layout shifts after load.
    setTimeout(() => map.invalidateSize(), 300);
}

initializeCampusMap();
