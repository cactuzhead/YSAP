// DOM Elements
const grid = document.getElementById('grid');
const searchInput = document.getElementById('search');
const filterEnv = document.getElementById('filterEnv');
const sortBy = document.getElementById('sortBy');
const themeToggle = document.getElementById('themeToggle');

const modal = document.getElementById('modal');
const modalBackdrop = document.getElementById('modalBackdrop');
const closeModal = document.getElementById('closeModal');
const modalImage = document.getElementById('modalImage');
const modalVideo = document.getElementById('modalVideo');
const modalTitle = document.getElementById('modalTitle');
const modalAuthor = document.getElementById('modalAuthor');
const modalStats = document.getElementById('modalStats');
const modalDesc = document.getElementById('modalDesc');
const thumbs = document.getElementById('thumbs');
const prevShot = document.getElementById('prevShot');
const nextShot = document.getElementById('nextShot');

// State
let maps = [];
let current = {
    index: 0,
    media: [],
    video: null
};

// Convert seconds to "minutes:seconds" format
function secToMinSec(seconds) {
    const minutes = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${minutes}:${sec < 10 ? '0' : ''}${sec}`;
}

function renderCard(map) {
  const card = document.createElement('article');
  card.className = 'card';
  card.tabIndex = 0;

  card.innerHTML = `
    <img class="thumb" src="${map.thumbnail}" alt="${map.name} thumbnail">
    <div class="card-body">
        <h3 class="card-title">${map.name || ''}</h3>
        <h5 class="card-title">${map.author || ''}</h5>
        <div class="meta">
            <span>${formatDate(map.stats.Date || '')}</span>
            <span>${map.stats.Biome || ''}</span>
            <span>${map.stats.Difficulty || ''}</span>
            <span>${map.stats.Mode || ''}</span>
        </div>
    </div>
  `;

  // Open modal passing the map object directly
  card.addEventListener('click', () => openModal(map));
  card.addEventListener('keyup', (e) => { if (e.key === 'Enter') openModal(map); });

  return card;
}


// Populate biome filter dropdown
function populateFilters(maps) {
    const biomes = new Set();
    maps.forEach(map => {
        if (map.stats && map.stats.Biome) biomes.add(map.stats.Biome);
    });

    Array.from(biomes).sort().forEach(biome => {
        const option = document.createElement('option');
        option.value = biome;
        option.textContent = biome;
        filterEnv.appendChild(option);
    });

    // --- Map Type filter ---
    const mapTypeSelect = document.getElementById('mapTypeFilter');
    if (mapTypeSelect) {
        // Clear old options (except the first "All" one)
        mapTypeSelect.innerHTML = `<option value="">All Map Types</option>`;

        const mapTypes = new Set();
        maps.forEach(map => {
            if (map.stats && map.stats["Map Type"]) mapTypes.add(map.stats["Map Type"]);
        });

        Array.from(mapTypes).sort().forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            mapTypeSelect.appendChild(option);
        });
    }
}

// Render the grid of map cards
function renderGrid(list){
    grid.innerHTML = '';
    if(list.length === 0){
        grid.innerHTML = '<p style="padding:40px;text-align:center;color:var(--muted)">No maps found.</p>';
        return;
    }
    list.forEach(map => grid.appendChild(renderCard(map)));
}

// Open modal for a specific map
function openModal(map) {
    current.index = maps.indexOf(map); // optional if you need the index
    current.media = map.screenshots || (map.thumbnail ? [map.thumbnail] : []);
    current.video = map.video || null;

    showMedia(0);

    modalTitle.textContent = map.name;
    modalAuthor.textContent = map.author || '';
    modalDesc.textContent = map.description || '';

    modalStats.innerHTML = '';
    if (map.stats) {
        Object.entries(map.stats).forEach(([key, value]) => {
            let displayValue = value;
            if (key === 'Round Time' || key === 'Fuel Time') displayValue = secToMinSec(value);
            // Format date (YYYY-MM-DD format)
            if (key.toLowerCase() === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
                displayValue = formatDate(value);
            }      
            const statRow = document.createElement('div');
            statRow.className = 'stat-row';
            statRow.innerHTML = `<strong>${key}</strong><span>${displayValue}</span>`;
            modalStats.appendChild(statRow);
        });
    }
    // Thumbnails and video buttons
    thumbs.innerHTML = '';
    current.media.forEach((src, i) => {
        const thumb = document.createElement('img');
        thumb.src = src;
        thumb.className = 'thumb-btn';
        thumb.alt = `${map.name} screenshot ${i + 1}`;
        thumb.addEventListener('click', () => showMedia(i));
        thumbs.appendChild(thumb);
    });

    if (current.video) {
        const videoBtn = document.createElement('button');
        videoBtn.textContent = 'Video';
        videoBtn.className = 'thumb-btn';
        videoBtn.addEventListener('click', showVideo);
        thumbs.appendChild(videoBtn);
    }

    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
}


// Show a specific screenshot in the modal
function showMedia(idx) {
    modalImage.style.display = '';
    modalVideo.style.display = 'none';

    modalImage.src = current.media[idx] || '';
    modalImage.alt = `${modalTitle.textContent} screenshot ${idx + 1}`;
    modal.dataset.idx = idx;
}

// Show video in the modal
function showVideo() {
    if (!current.video) return;

    modalImage.style.display = 'none';
    modalVideo.style.display = '';

    let url = current.video;

    // Convert standard YouTube URLs to embed format
    if (url.includes('watch?v=')) url = url.replace('watch?v=', 'embed/');
    if (url.includes('youtu.be/')) url = url.replace('youtu.be/', 'www.youtube.com/embed/');

    modalVideo.src = url + '?autoplay=1&rel=0';
}

// Close modal
function closeModalFn() {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    modalVideo.src = '';
}

// Modal navigation
prevShot.addEventListener('click', () => {
    const i = Number(modal.dataset.idx || 0);
    showMedia((i - 1 + current.media.length) % current.media.length);
});

nextShot.addEventListener('click', () => {
    const i = Number(modal.dataset.idx || 0);
    showMedia((i + 1) % current.media.length);
});

// Close modal events
closeModal.addEventListener('click', closeModalFn);
modalBackdrop.addEventListener('click', closeModalFn);
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModalFn();
});

// Search, filter, and sort
function applyControls() {
    let list = [...maps];
    const query = searchInput.value.trim().toLowerCase();

    if (query) {
        list = list.filter(
        m => (m.name && m.name.toLowerCase().includes(query)) ||
            (m.description && m.description.toLowerCase().includes(query))
        );
    }

    const biome = filterEnv.value;
    if (biome) list = list.filter(m => m.stats && m.stats.Biome === biome);

    const sort = sortBy.value;
    if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'author') list.sort((a, b) => a.author.localeCompare(b.author));
    // if (sort === 'date') list.sort((a, b) => new Date(b.stats.Date) - new Date(a.stats.Date));
    if (sort === 'date') {
        list.sort((a, b) => {
            const dateA = a.stats?.Date ? new Date(a.stats.Date) : new Date('1970-01-01');
            const dateB = b.stats?.Date ? new Date(b.stats.Date) : new Date('1970-01-01');
            return dateB - dateA; // newest first
        });
    }

    if (sort === 'dateAsc') {
        list.sort((a, b) => {
            const dateA = a.stats?.Date ? new Date(a.stats.Date) : new Date('1970-01-01');
            const dateB = b.stats?.Date ? new Date(b.stats.Date) : new Date('1970-01-01');
            return dateA - dateB; // oldest first
        });
    }

    if (sort === 'round') list.sort((a, b) => (a.stats?.["Round Time"] || 0) - (b.stats?.["Round Time"] || 0));
    if (sort === 'fuel') list.sort((a, b) => (a.stats?.["Fuel Time"] || 0) - (b.stats?.["Fuel Time"] || 0));

    renderGrid(list);
}

// Event listeners for controls
searchInput.addEventListener('input', applyControls);
filterEnv.addEventListener('change', applyControls);
sortBy.addEventListener('change', applyControls);
document.getElementById('mapTypeFilter').addEventListener('change', applyControls);

// Dark/light theme toggle
function setTheme(isDark) {
    if (isDark) document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
    try {
        localStorage.setItem('dm_theme', isDark ? 'dark' : 'light');
    } catch (e) {}
}

function formatDate(str) {
    const date = new Date(str);
    const day = date.getDate();
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
}

themeToggle.addEventListener('change', () => setTheme(themeToggle.checked));

(function initTheme() {
    const saved = localStorage.getItem('dm_theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved ? saved === 'dark' : prefersDark;
    themeToggle.checked = isDark;
    setTheme(isDark);
})();

// Load maps.json
fetch('maps.json')
    .then(res => res.json())
    .then(data => {
        maps = data;

    const IMAGE_PATH = 'images/';
        maps.forEach(map => {
        if (map.base && !map.thumbnail && !map.screenshots) {
            map.thumbnail = `${IMAGE_PATH}/${map.base}/${map.base}_thumb.jpg`;
            map.screenshots = [`${IMAGE_PATH}/${map.base}/${map.base}_full.jpg`];

            if (map.extra_screenshots && Array.isArray(map.extra_screenshots)) {
            map.extra_screenshots.forEach(suffix => {
                map.screenshots.push(`${IMAGE_PATH}/${map.base}/${map.base}_${suffix}.jpg`);
            });
            }
        }
        });

        populateFilters(maps);
        applyControls();
    })
    .catch(err => {
        console.error('Failed to load maps.json', err);
        grid.innerHTML = '<p style="padding:40px;text-align:center;color:var(--muted)">Failed to load maps.json</p>';
    });
