
const imgWidth = 6583, imgHeight = 16838;
const anchorPx = [3048, 11835];
const anchorLatLng = [40.735863, -73.991084];
const totalLonSpan = 0.120, totalLatSpan = 0.182;

// 2) Compute your imgBounds exactly as before
const degPerPxLon = totalLonSpan / imgWidth;
const degPerPxLat = totalLatSpan / imgHeight;
const [ax, ay] = anchorPx;
const [alat, alon] = anchorLatLng;
const latNorth = alat + ay * degPerPxLat;
const lonWest = alon - ax * degPerPxLon;
const latSouth = latNorth - totalLatSpan;
const lonEast = lonWest + totalLonSpan;
const imgBounds = L.latLngBounds(
    L.latLng(latSouth, lonWest),
    L.latLng(latNorth, lonEast)
);

// 3) Create the map **with a default center+zoom** (we'll override below)
const map = L.map('map', {
    center: imgBounds.getCenter(),
    attributionControl: false,
    zoom: 12,
    minZoom: 11,
    maxZoom: 24,
    maxBounds: imgBounds.pad(0.05),
    maxBoundsViscosity: 1.0,
});

// 4) Overlay your SVG
L.imageOverlay('map.svg', imgBounds).addTo(map);

// 5) Prepare the user marker (hidden until we get a fix)
const userMarker = L.circleMarker([0, 0], {
    radius: 8, fillColor: '#007AFF', color: '#fff',
    weight: 2, fillOpacity: 0.8
}).addTo(map);

// 6) Helper: on first GPS fix, center the map there
function onInitialPosition(pos) {
    const ll = [pos.coords.latitude, pos.coords.longitude];
    if (imgBounds.contains(ll)) {
        map.setView(ll, 17);            // zoom in on them
        userMarker.setLatLng(ll);
    } else {
        // outside area → keep default fitBounds
        map.fitBounds(imgBounds);
    }
    // start continuous tracking
    navigator.geolocation.watchPosition(onUpdatePosition, onPosError, {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 5000
    });
}

// 7) Continuous updates just move the marker (and optionally pan)
function onUpdatePosition(pos) {
    const ll = [pos.coords.latitude, pos.coords.longitude];
    if (imgBounds.contains(ll)) {
        userMarker.setLatLng(ll);
        // uncomment to follow them:
        // map.panTo(ll);
    }
}

function onPosError(err) {
    console.error('Geolocation error:', err);
    // fallback: show the full map
    map.fitBounds(imgBounds);
}

// 8) Kick things off: request a one-time position
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(onInitialPosition, onPosError, {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000
    });
} else {
    alert('Geolocation not supported, showing full map.');
    map.fitBounds(imgBounds);
}

const navView = document.getElementById('nav-view');

function loadNavPage(url, pushState = true) {
    fetch(url)
        .then(res => {
            if (!res.ok) throw new Error(res.statusText);
            return res.text();
        })
        .then(html => {
            navView.innerHTML = html;
            if (pushState) history.pushState({ page: url }, '', url);
        })

        .catch(err => {
            navView.innerHTML = `<p style="color:red">Error loading page.<br>${err}</p>`;
        });
}

// Attach click‐handlers to every <a class="nav-link">
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        const href = link.getAttribute('href');        // ← use href here
        loadNavPage(href);
    });
});

// Back/forward support
window.addEventListener('popstate', e => {
    if (e.state && e.state.page) {
        loadNavPage(e.state.page, false);
    }
});