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


const drawCanvas = document.getElementById('drawCanvas');
const drawCtx = drawCanvas.getContext('2d');
const drawColor = document.getElementById('drawColor');
const drawWidth = document.getElementById('drawWidth');
const drawMode = document.getElementById('drawMode');
const drawClear = document.getElementById('drawClear');
const drawCopy = document.getElementById('drawCopy');

const MAX_HISTORY = 5;
let undoStack = [];
let redoStack = [];
let hasDrawnSomething = false;

const tempCanvas = document.createElement('canvas');
const tempCtx = tempCanvas.getContext('2d');


if (!drawCanvas || !modalImage) {
    // skip all drawing setup if either the canvas or modal image is missing
    console.warn('Drawing elements not found.');
} else {

    tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
    redrawVisibleFromTemp();

    undoStack = [];
    redoStack = [];
    hasDrawnSomething = false;

    undoStack.push(tempCanvas.toDataURL()); // initial blank state


    // Save canvas state
    function saveState() {
        if (!hasDrawnSomething) return;

        const dataURL = tempCanvas.toDataURL();
        if (!dataURL) return;

        // Limit history
        if (undoStack.length >= MAX_HISTORY) {
            undoStack.shift(); // remove oldest
        }

        undoStack.push(dataURL);
        redoStack = []; // new draw clears redo

        hasDrawnSomething = false;
    }

    // Restore a saved tempCanvas state
    function restoreTempState(dataURL) {
        const img = new Image();
        img.onload = () => {
            tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
            tempCtx.drawImage(img, 0, 0);
            redrawVisibleFromTemp();
        };
        img.src = dataURL;
    }


    function doUndo() {
        if (undoStack.length < 2) return;   // Must have at least 2 states to undo

        const currentState = undoStack.pop();
        redoStack.push(currentState);

        // Restore previous
        const previousState = undoStack[undoStack.length - 1];
        restoreTempState(previousState);
    }

    function doRedo() {
        if (redoStack.length === 0) return;

        const redoState = redoStack.pop();
        undoStack.push(redoState);

        restoreTempState(redoState);
    }


    // wire to buttons (only if they exist)
    const undoBtn = document.getElementById("drawUndo");
    const redoBtn = document.getElementById("drawRedo");
    if (undoBtn) undoBtn.addEventListener("click", doUndo);
    if (redoBtn) redoBtn.addEventListener("click", doRedo);

    // keyboard shortcuts use the functions directly
    document.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "z") {
            e.preventDefault();
            doUndo();
        }
        if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))) {
            e.preventDefault();
            doRedo();
        }
    });


    // Rest History + Canvas when modal closes
    document.getElementById("closeModal").addEventListener("click", () => {
        undoStack = [];
        redoStack = [];
        hasDrawnSomething = false;

        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    });


    let drawing = false;
    let startX = 0, startY = 0;
    let prevX = 0, prevY = 0;
    let imgNaturalW = 0, imgNaturalH = 0;
    let dpr = Math.max(window.devicePixelRatio || 1, 1);

    // Prepare canvases to match the image natural size (and scale for DPR)
    function prepareDrawCanvas() {
        if (!modalImage.complete || modalImage.naturalWidth === 0) return;

        imgNaturalW = modalImage.naturalWidth;
        imgNaturalH = modalImage.naturalHeight;
        dpr = Math.max(window.devicePixelRatio || 1, 1);

        // Internal pixel size (for high-res export)
        const internalW = Math.round(imgNaturalW * dpr);
        const internalH = Math.round(imgNaturalH * dpr);

        drawCanvas.width = internalW;
        drawCanvas.height = internalH;
        tempCanvas.width = internalW;
        tempCanvas.height = internalH;

        // Get actual visible image size & position
        const imgRect = modalImage.getBoundingClientRect();
        const containerRect = modalImage.parentElement.getBoundingClientRect();

        drawCanvas.style.position = 'absolute';
        drawCanvas.style.left = (imgRect.left - containerRect.left) + 'px';
        drawCanvas.style.top = (imgRect.top - containerRect.top) + 'px';
        drawCanvas.style.width = imgRect.width + 'px';
        drawCanvas.style.height = imgRect.height + 'px';
    }


    function updateCanvasOverlay() {
        if (!modalImage.complete) return;

        // get image visible rect
        const imgRect = modalImage.getBoundingClientRect();
        const containerRect = modalImage.parentElement.getBoundingClientRect();

        // position canvas relative to container
        drawCanvas.style.position = 'absolute';
        drawCanvas.style.left = (imgRect.left - containerRect.left) + 'px';
        drawCanvas.style.top = (imgRect.top - containerRect.top) + 'px';
        drawCanvas.style.width = imgRect.width + 'px';
        drawCanvas.style.height = imgRect.height + 'px';
    }


function updateCanvasPosition() {
    const rect = modalImage.getBoundingClientRect();
    drawCanvas.style.width = rect.width + 'px';
    drawCanvas.style.height = rect.height + 'px';
    drawCanvas.style.left = rect.left + 'px';
    drawCanvas.style.top = rect.top + 'px';
}


window.addEventListener('resize', updateCanvasPosition);
window.addEventListener('scroll', updateCanvasPosition, true);


    function getPosFromEvent(e) {
        const rect = drawCanvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        // Map to internal pixels
        const x = ((clientX - rect.left) / rect.width) * drawCanvas.width;
        const y = ((clientY - rect.top) / rect.height) * drawCanvas.height;

        return { x, y };
    }


    function redrawVisibleFromTemp() {
        drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
        drawCtx.drawImage(tempCanvas, 0, 0);
    }

    function pushInitialState() {
        // Always push a blank state first
        const dataURL = tempCanvas.toDataURL();
        undoStack.push(dataURL);
        redoStack = [];
    }

    function onPointerDown(e) {
        if (modalVideo.style.display !== 'none') return;
        e.preventDefault();
        if (!modalImage.complete) return;

        drawing = true;
        hasDrawnSomething = false;
        const p = getPosFromEvent(e);
        startX = prevX = p.x;
        startY = prevY = p.y;

        // Copy current visible canvas to temp as baseline
        // tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        // tempCtx.drawImage(drawCanvas, 0, 0);

        redrawVisibleFromTemp();
    }

    function onPointerMove(e) {
        if (!drawing) return;
        e.preventDefault();
        const p = getPosFromEvent(e);
        const mode = drawMode.value;
        const lw = Math.max(1, Number(drawWidth.value || 1)) * dpr;
        const color = drawColor.value || '#ff0000';

        if (mode === 'free') {            

            tempCtx.strokeStyle = color;
            tempCtx.lineWidth = lw;
            tempCtx.lineCap = 'round';
            tempCtx.beginPath();
            tempCtx.moveTo(prevX, prevY);
            tempCtx.lineTo(p.x, p.y);
            tempCtx.stroke();
            prevX = p.x;
            prevY = p.y;

            hasDrawnSomething = true;
            redrawVisibleFromTemp();
            return;
        }
      

        // Shape preview
        redrawVisibleFromTemp();
        drawCtx.save();
        drawCtx.strokeStyle = color;
        drawCtx.lineWidth = lw;
        drawCtx.lineCap = 'round';

        const dx = p.x - startX;
        const dy = p.y - startY;
        const size = Math.sqrt(dx*dx + dy*dy);

        drawCtx.beginPath();
        switch(mode) {
            case 'circle':
                drawCtx.arc(startX, startY, size, 0, Math.PI * 2); break;
            case 'square':
                drawCtx.rect(startX - size, startY - size, size*2, size*2); break;
            case 'triangle':
                drawCtx.moveTo(startX, startY - size);
                drawCtx.lineTo(startX - size, startY + size);
                drawCtx.lineTo(startX + size, startY + size);
                drawCtx.closePath(); break;
            case 'hex':
                for(let i=0;i<6;i++){
                    const angle = Math.PI/3*i;
                    const px = startX + Math.cos(angle)*size;
                    const py = startY + Math.sin(angle)*size;
                    if(i===0) drawCtx.moveTo(px,py); else drawCtx.lineTo(px,py);
                }
                drawCtx.closePath(); break;
            case 'star':
                for(let i=0; i<10; i++){
                    const angle = Math.PI/5*i;
                    const radius = (i%2===0)?size:size*0.45;
                    const px = startX + Math.cos(angle)*radius;
                    const py = startY + Math.sin(angle)*radius;
                    if(i===0) drawCtx.moveTo(px,py); else drawCtx.lineTo(px,py);
                }
                drawCtx.closePath(); break;
        }
        drawCtx.stroke();
        drawCtx.restore();
    }

    function onPointerUp(e) {
        if (!drawing) return;
        drawing = false;
        const p = getPosFromEvent(e);
        const mode = drawMode.value;
        const lw = Math.max(1, Number(drawWidth.value || 1)) * dpr;
        const color = drawColor.value || '#ff0000';

        if (mode === 'free') {
            redrawVisibleFromTemp();
            saveState();
            return;
        }

        // Commit shape
        tempCtx.save();
        tempCtx.strokeStyle = color;
        tempCtx.lineWidth = lw;
        tempCtx.lineCap = 'round';
        tempCtx.beginPath();

        const dx = p.x - startX;
        const dy = p.y - startY;
        const size = Math.sqrt(dx*dx + dy*dy);

        switch(mode){
            case 'circle': tempCtx.arc(startX,startY,size,0,Math.PI*2); break;
            case 'square': tempCtx.rect(startX-size,startY-size,size*2,size*2); break;
            case 'triangle':
                tempCtx.moveTo(startX,startY-size);
                tempCtx.lineTo(startX-size,startY+size);
                tempCtx.lineTo(startX+size,startY+size);
                tempCtx.closePath(); break;
            case 'hex':
                for(let i=0;i<6;i++){
                    const angle=Math.PI/3*i;
                    const px=startX+Math.cos(angle)*size;
                    const py=startY+Math.sin(angle)*size;
                    if(i===0) tempCtx.moveTo(px,py); else tempCtx.lineTo(px,py);
                }
                tempCtx.closePath(); break;
            case 'star':
                for(let i=0;i<10;i++){
                    const angle=Math.PI/5*i;
                    const radius=(i%2===0)?size:size*0.45;
                    const px=startX+Math.cos(angle)*radius;
                    const py=startY+Math.sin(angle)*radius;
                    if(i===0) tempCtx.moveTo(px,py); else tempCtx.lineTo(px,py);
                }
                tempCtx.closePath(); break;
        }

        tempCtx.stroke();
        tempCtx.restore();
        redrawVisibleFromTemp();

        hasDrawnSomething = true;
        saveState();
    }

    // Attach pointer events (mouse + touch)
    drawCanvas.addEventListener('mousedown', onPointerDown);
    drawCanvas.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    // Touch equivalents
    drawCanvas.addEventListener('touchstart', onPointerDown, { passive: false });
    drawCanvas.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('touchend', onPointerUp);

    // Clear button: clear both temp and visible
    drawClear.addEventListener('click', () => {
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    });

    // Copy to clipboard: produce FULL-RES PNG matching image natural size
    drawCopy.addEventListener('click', async () => {
    if (!modalImage.src) return alert('No image to copy.');

    // Export canvas exactly at the image's natural resolution
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = imgNaturalW;
    exportCanvas.height = imgNaturalH;
    const exportCtx = exportCanvas.getContext('2d');

    // Draw the base image at its natural resolution
    const baseImg = new Image();
    baseImg.crossOrigin = 'anonymous';
    baseImg.src = modalImage.src;

    try {
        await baseImg.decode();
    } catch (err) {
        console.warn('Image decode failed for export', err);
    }

    exportCtx.drawImage(baseImg, 0, 0, imgNaturalW, imgNaturalH);

    // Draw tempCanvas into exportCanvas **scaled down correctly**
    // Internal canvas is natural * dpr, so we scale down by dividing by dpr
    exportCtx.drawImage(
        tempCanvas,
        0, 0, tempCanvas.width, tempCanvas.height, // source
        0, 0, imgNaturalW, imgNaturalH              // destination
    );

    exportCanvas.toBlob(async (blob) => {
        try {
            await navigator.clipboard.write([ new ClipboardItem({ 'image/png': blob }) ]);
            alert('Copied full-resolution image to clipboard.');
        } catch (err) {
            // fallback: open image in new tab
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
            alert('Clipboard failed — opened exported image in new tab.');
        }
    }, 'image/png');
});


    // ensure canvas prepared when modal image loads and when modal opens/resize
    modalImage.addEventListener('load', () => {
        prepareDrawCanvas();
        // if there is already drawing data in tempCanvas (e.g. cached), show it
        redrawVisibleFromTemp();
    });
    // window.addEventListener('resize', () => {
    //     // keep on-screen CSS size aligned, but do NOT resize internal pixel buffers (we keep internal = natural*DPR)
    //     if (modalImage.naturalWidth) {
    //         drawCanvas.style.width = modalImage.getBoundingClientRect().width + 'px';
    //         drawCanvas.style.height = modalImage.getBoundingClientRect().height + 'px';
    //     }
    // });

    window.addEventListener('resize', updateCanvasOverlay);
    window.addEventListener('scroll', updateCanvasOverlay, true);
}







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

    const biome = map.stats?.Biome || '';
    const biomeClass = map.stats?.Biome ? `${map.stats.Biome.toLowerCase()}` : '';
    const biomeIcon = biome ? `<img src="images/biome/${biomeClass}.png" alt="${biome}" class="biome-icon">` : '';
    const parking = map.stats?.["Parking Spots"] || '';
    const parkingBadge = parking 
        ? `<span class="parking-badge">${parking}</span>` 
        : '';

    card.innerHTML = `
        <div class="card-thumb-wrapper">
            <img class="thumb" src="${map.thumbnail}" alt="${map.name} thumbnail">
            ${biomeIcon}  <!-- Biome icon overlaid -->
            ${parkingBadge}  <!-- Parking spots overlay -->
        </div>
        <div class="card-body">
            <h3 class="card-title">${map.name || ''}</h3>
            <h5 class="card-title">${map.author || ''}</h5>
            <div class="meta">
                <span>${formatDate(map.stats["Release Date"] || '')}</span>                
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
    // ===== BIOME OVERVIEW MAP FULLSCREEN MODE =====
    const isBiomeMap = map.stats && (map.stats["Map Type"] || "").trim().toLowerCase() === "biome";

    const modalMain = modal.querySelector(".modal-main");
    const gallery = modal.querySelector(".gallery");
    const mediaWrap = modal.querySelector(".media-wrap");
    const details = modal.querySelector(".details");
    const prevBtn = document.getElementById("prevShot");
    const nextBtn = document.getElementById("nextShot");

    details.style.display = isBiomeMap ? "none" : "block";
    prevBtn.style.display = isBiomeMap ? "none" : "flex";
    nextBtn.style.display = isBiomeMap ? "none" : "flex";
    gallery.style.flex = isBiomeMap ? "1 1 100%" : "2 1 600px";
    mediaWrap.style.maxHeight = isBiomeMap ? "85vh" : "78vh";

    modalMain.classList.toggle("fullscreen-image", isBiomeMap);


    
    current.index = maps.indexOf(map);
    current.media = map.screenshots || (map.thumbnail ? [map.thumbnail] : []);
    current.video = map.video || null;

    showMedia(0);

    modalTitle.textContent = map.name;
    modalAuthor.textContent = map.author || '';
    modalDesc.textContent = map.description || '';

    modalStats.innerHTML = '';

    if (!isBiomeMap && map.stats) {
    Object.entries(map.stats).forEach(([key, value]) => {
        let displayValue = value;

        // Format Date
        if (key.toLowerCase() === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
            displayValue = formatDate(value);
        }

        // Format time values
        if (key === 'Round Time' || key === 'Fuel Time') {
            displayValue = secToMinSec(value);
        }

        // Create stat row
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

// Clear both canvases
function clearCanvas() {
    tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    undoStack = [];
    redoStack = [];
    hasDrawnSomething = false;
}

// ======= RESET WHEN SWITCHING IMAGES =======
function resetDrawingForNewImage() {
    clearCanvas();

    // Copy modal image into tempCanvas as the starting point
    if (modalImage.complete && modalImage.naturalWidth > 0) {
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.drawImage(modalImage, 0, 0, tempCanvas.width, tempCanvas.height);

        // Save this as the initial state
        undoStack.push(tempCanvas.toDataURL());
    }

    redrawVisibleFromTemp();
}

// Show a specific screenshot in the modal
function showMedia(idx) {
    const mediaWrap = modalImage.closest('.media-wrap');
    modalImage.style.display = '';
    modalVideo.style.display = 'none';
    modal.dataset.idx = idx;

    // Remove no-image state initially
    mediaWrap.classList.remove('no-image');

    // Set new image source
    const src = current.media[idx] || '';
    modalImage.src = src;
    modalImage.alt = `${modalTitle.textContent} screenshot ${idx + 1}`;

    // RESET DRAWING STATE FOR NEW IMAGE
    resetDrawingForNewImage();

    // Handle missing or broken image
    modalImage.onerror = () => {
        modalImage.style.display = 'none';
        mediaWrap.classList.add('no-image');
    };

    modalImage.onload = () => {
        prepareDrawCanvas();

        // Save the initial state as the image itself
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.drawImage(modalImage, 0, 0, tempCanvas.width, tempCanvas.height);
        undoStack = [tempCanvas.toDataURL()];
        redoStack = [];

        redrawVisibleFromTemp();
        mediaWrap.classList.remove('no-image');        
    };
}


lucide.createIcons();  // render icons

const shapeBtns = document.querySelectorAll("#shapeTools .shape-btn");
const drawModeSelect = document.getElementById("drawMode");

shapeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        const mode = btn.dataset.mode;

        // Update visual selected button
        shapeBtns.forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");

        // Update real drawMode value
        drawModeSelect.value = mode;
    });
});



// Show video in the modal
function showVideo() {
    if (!current.video) return;

    modalImage.style.display = 'none';
    modalVideo.parentElement.style.display = '';
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

    // Search filter (now checks map name, description, and author)
    if (query) {
        list = list.filter( m =>
            (m.name && m.name.toLowerCase().includes(query)) ||
            (m.description && m.description.toLowerCase().includes(query)) ||
            (m.author && m.author.toLowerCase().includes(query))
        );
    }

    // Biome filter
    const biome = filterEnv.value;
    if (biome) list = list.filter(m => m.stats && m.stats.Biome === biome);

    // Map Type filter
    const typeFilter = document.getElementById('mapTypeFilter')?.value;
    if (typeFilter) list = list.filter(m => m.stats && m.stats["Map Type"] === typeFilter);


    const sort = sortBy.value;
    if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'author') list.sort((a, b) => a.author.localeCompare(b.author));

    if (sort === 'date' || sort === 'dateAsc') {
        list.sort((a, b) => {
            const dateA = new Date(a.stats?.["Release Date"] || '1970-01-01');
            const dateB = new Date(b.stats?.["Release Date"] || '1970-01-01');
            return sort === 'date' ? dateB - dateA : dateA - dateB;
        });
    }

    const countLabel = document.getElementById('mapCount');
    countLabel.textContent =
        `${list.length} / ${maps.length} map${maps.length !== 1 ? 's' : ''}`;

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
    
    const TOTAL_MAPS = maps.length;
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
