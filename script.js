
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
// const prevShot = document.getElementById('prevShot');
// const nextShot = document.getElementById('nextShot');

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
const drawMode = document.getElementById('drawMode');
const drawClear = document.getElementById('drawClear');
const drawCopy = document.getElementById('drawCopy');
const drawSave = document.getElementById('drawSave');
const imgContainer = document.querySelector('.img-container');

const presetButtons = document.querySelectorAll(".color-btn");
const colorPicker = document.getElementById("drawColor");

const expandBtn = document.getElementById('expandToggle');
const modalMain = document.querySelector('.modal-main');
const detailsCol = modalMain.querySelector('.details');
const icon = expandBtn.querySelector('i');

modalImage.addEventListener("load", () => {
});

expandBtn.addEventListener('click', () => {
    // Toggle class
    modalMain.classList.toggle('expanded');

    // Hide or show stats
    if (modalMain.classList.contains('expanded')) {
        detailsCol.style.display = 'none';
        modalMain.querySelector('.gallery').style.flex = '1 1 100%';
        icon.setAttribute('data-lucide', 'shrink');
    } else {
        detailsCol.style.display = '';
        modalMain.querySelector('.gallery').style.flex = '';
        icon.setAttribute('data-lucide', 'expand');
    }

    lucide.createIcons();
});


let brushSize = 12; // default brush size
let erasing = false;
let filling = false;
let isTextMode = false;
let activeTextInput = null;
const eraserCursor = document.getElementById("eraserCursor");
const drawTextBtn = document.getElementById("drawText");

drawCanvas.addEventListener('mousemove', (e) => {
    const useCustomCursor = erasing || drawMode.value === 'free';

    if (!useCustomCursor) {
        eraserCursor.style.display = 'none';
        drawCanvas.style.cursor = 'crosshair';
        return;
    }

    drawCanvas.style.cursor = 'none';
    eraserCursor.style.display = 'block';
    eraserCursor.style.width = `${brushSize}px`;
    eraserCursor.style.height = `${brushSize}px`;
    eraserCursor.style.left = `${e.clientX}px`;
    eraserCursor.style.top = `${e.clientY}px`;
});

drawTextBtn.addEventListener("click", () => {
    isTextMode = true;
    drawCanvas.style.cursor = "text";

    // Deselect other shape buttons
    // document.querySelectorAll("#shapeTools .shape-btn").forEach(btn => btn.classList.remove("selected"));
    document.querySelectorAll('.shape-btn, .color-btn, .tool-btn').forEach(btn => {
            if (btn !== drawTextBtn) btn.classList.remove("selected");
        });

    drawTextBtn.classList.add("selected");

    // Disable eraser
    erasing = false;
    drawEraser.classList.remove("selected");

    // highlight eraser button
    drawEraser.classList.toggle("selected", erasing);

    // Update drawMode
    drawMode.value = "text";
});

function handleCanvasClickForText(e) {
    if (!isTextMode || activeTextInput) return;

    const rect = drawCanvas.getBoundingClientRect();
    // const x = ((e.clientX - rect.left) / rect.width) * tempCanvas.width;
    // const y = ((e.clientY - rect.top) / rect.height) * tempCanvas.height;

    const scaleX = tempCanvas.width / rect.width;
    const scaleY = tempCanvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Create input box
    const input = document.createElement("input");
    input.type = "text";
    input.style.position = "absolute";
    input.style.left = `${e.clientX}px`;
    input.style.top = `${e.clientY}px`;
    input.style.fontSize = `${brushSize * 3}px`;
    input.style.color = drawColor.value;
    input.style.border = "1px dashed #888";
    input.style.background = "transparent";
    input.style.padding = "0px";
    input.style.zIndex = 1000;
    input.style.outline = "none";

    document.body.appendChild(input);
    input.focus();
    activeTextInput = input;

    function commitText() {
        if (!input.value.trim()) {
            cleanup();
            return;
        }

        tempCtx.save();
        tempCtx.fillStyle = drawColor.value;

        const fontSize = brushSize * 3 * scaleY;
        tempCtx.font = `${fontSize}px sans-serif`;
        tempCtx.textBaseline = "top";
        tempCtx.fillText(input.value, x, y);
        tempCtx.restore();

        redrawVisibleFromTemp();
        saveState();
        cleanup();
    }

    function cleanup() {
        input.remove();
        activeTextInput = null;
    }

    input.addEventListener("keydown", (evt) => {
        if (evt.key === "Enter") commitText();
        if (evt.key === "Escape") cleanup();
    });

    input.addEventListener("blur", commitText);
}

// Attach click listener
drawCanvas.addEventListener("click", handleCanvasClickForText);


drawCanvas.addEventListener('mouseleave', () => {
    eraserCursor.style.display = 'none';
});


const sizeButtons = document.querySelectorAll(".size-btn");

sizeButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        const size = Number(btn.dataset.size);

        brushSize = size;

        // highlight selected
        sizeButtons.forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
    });
});

// Select default button visually
sizeButtons.forEach(b => b.classList.remove("selected"));
document.querySelector('.size-btn[data-size="9"]').classList.add("selected");

presetButtons.forEach(btn => {
    const color = btn.dataset.color;
    btn.style.background = color;

    btn.addEventListener("click", () => {
        // Highlight selected preset
        presetButtons.forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");

        // Update drawing color
        colorPicker.value = color;
    });
});

// If user chooses a color manually, unselect preset buttons
colorPicker.addEventListener("input", () => {
    presetButtons.forEach(b => b.classList.remove("selected"));
});


// *** Eraser Button *****************************************
const drawEraser = document.getElementById("drawEraser");
const freeButton = document.querySelector('#shapeTools .shape-btn[data-mode="free"]');

drawEraser.addEventListener("click", () => {
    disableTextMode();
    erasing = !erasing;

    // highlight eraser button
    drawEraser.classList.toggle("selected", erasing);

    if (erasing) {
        // Deselect all other tools
        document.querySelectorAll('.shape-btn, .color-btn, .tool-btn').forEach(btn => {
            if (btn !== drawEraser) btn.classList.remove("selected");
        });
        
    } else {        
        freeButton.classList.add("selected");       
        drawCanvas.style.cursor = 'crosshair';
        eraserCursor.style.display = 'none';
    }

    // Force freehand mode when toggling erase button
    drawMode.value = "free"; 
});



drawFill.addEventListener('click', () => {
    disableTextMode();
    drawMode.value = "fill";
    erasing = false;
    filling = true;
    updateActiveButton(drawFill);
});


function drawEraserCursor(x, y) {
    if (!erasing) return; // only show when erasing

    redrawVisibleFromTemp(); // clear previous

    drawCtx.save();
    drawCtx.strokeStyle = 'rgba(0,0,0,0.8)';
    drawCtx.lineWidth = 1;
    drawCtx.setLineDash([4, 2]);
    drawCtx.beginPath();
    drawCtx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    drawCtx.stroke();
    drawCtx.restore();
}


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
    let dpr = Math.max(window.devicePixelRatio || 1, 1);

    // Prepare canvases to match the image natural size (and scale for DPR)
    function prepareDrawCanvas() {
        const w = modalImage.naturalWidth * devicePixelRatio;
        const h = modalImage.naturalHeight * devicePixelRatio;

        // ONLY HERE internal resolution is set
        tempCanvas.width = w;
        tempCanvas.height = h;
        drawCanvas.width = w;
        drawCanvas.height = h;

        syncCanvasToImage();
    }

    modalImage.addEventListener("load", prepareDrawCanvas);
    window.addEventListener("resize", syncCanvasToImage);

    function syncCanvasToImage() {
        if (!modalImage.complete) return;

        // match canvas CSS to image CSS
        const imgRect = modalImage.getBoundingClientRect();
        const parentRect = modalImage.parentElement.getBoundingClientRect();

        drawCanvas.style.position = "absolute";
        drawCanvas.style.left = (imgRect.left - parentRect.left) + "px";
        drawCanvas.style.top = (imgRect.top - parentRect.top) + "px";
        drawCanvas.style.width = imgRect.width + "px";
        drawCanvas.style.height = imgRect.height + "px";

        // redraw visible canvas (scaled)
        redrawVisibleFromTemp();
        }

    function updateCanvasOverlay() {
        syncCanvasToImage();
    }

    // Store current annotations as an offscreen canvas
    let annotations = document.createElement('canvas');
    // let annotationsCtx = annotations.getContext('2d');

    expandBtn.addEventListener('click', () => {
        modal.classList.toggle("expanded");
        setTimeout(() => {
            syncCanvasToImage();
        }, 310);
    });


function updateCanvasPosition() {
    syncCanvasToImage();
}



window.addEventListener('resize', updateCanvasPosition);
window.addEventListener('scroll', updateCanvasPosition, true);


async function copyAnnotatedImageToClipboard() {
    if (!modalImage.src) return alert("No image to copy.");

    const canvas = document.createElement("canvas");
    canvas.width = modalImage.naturalWidth;
    canvas.height = modalImage.naturalHeight;
    const ctx = canvas.getContext("2d");

    // Draw base image
    ctx.drawImage(modalImage, 0, 0, canvas.width, canvas.height);

    // Draw annotations scaled to the full size
    ctx.drawImage(
        tempCanvas,
        0, 0, tempCanvas.width, tempCanvas.height, 
        0, 0, canvas.width, canvas.height
    );

    canvas.toBlob(async (blob) => {
        if (!blob) return alert("Failed to generate image.");
        try {
            await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
            alert("Copied annotated image to clipboard");
        } catch (err) {
            console.error(err);
            // Fallback: open in new tab
            const url = URL.createObjectURL(blob);
            window.open(url, "_blank");
            alert("Clipboard copy failed - opened exported image in new tab.");
        }
    }, "image/png");
}


function saveAnnotatedImageJPG() {
    if (!modalImage.src) {
        alert("No image to save.");
        return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = modalImage.naturalWidth;
    canvas.height = modalImage.naturalHeight;
    const ctx = canvas.getContext("2d");

    // Draw base image
    ctx.drawImage(modalImage, 0, 0, canvas.width, canvas.height);

    // Draw annotations
    ctx.drawImage(
        tempCanvas,
        0, 0, tempCanvas.width, tempCanvas.height,
        0, 0, canvas.width, canvas.height
    );

    // ---- Build filename ----
    const now = new Date();
    const pad = n => n.toString().padStart(2, "0");

    const year = now.getFullYear();
    const month = pad(now.getMonth() + 1);
    const day = pad(now.getDate());

    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    const seconds = pad(now.getSeconds());

    const timeString = `${year}-${month}-${day} @${hours}:${minutes}:${seconds}`;
    const safeMapName = (currentMapName || "Map").trim();
    const filename = `${timeString} - ${safeMapName}.jpg`;

    // ---- Export JPG ----
    canvas.toBlob((blob) => {
        if (!blob) {
            alert("Failed to create JPG file.");
            return;
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;

        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);
        URL.revokeObjectURL(url);

    }, "image/jpeg", 0.85);
}


    function getPosFromEvent(e) {
        const rect = drawCanvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        // Map CSS coordinates - natural resolution
        const x = ((clientX - rect.left) / rect.width) * tempCanvas.width;
        const y = ((clientY - rect.top) / rect.height) * tempCanvas.height;

        return { x, y };
    }


    function redrawVisibleFromTemp() {
        drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
        drawCtx.drawImage(
            tempCanvas,
            0, 0, tempCanvas.width, tempCanvas.height, // source full-res
            0, 0, drawCanvas.width, drawCanvas.height  // scaled to CSS size
        );
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
// console.log("Start drawing mode 1:", drawMode.value);
        const mode = drawMode.value;
        const color = drawColor.value;
// console.log("Start drawing mode 2:", mode);

        if (mode === "fill") {
            // convert pointer internal canvas coordinates
            const x = Math.round(startX);
            const y = Math.round(startY);

            floodFillAt(x, y, color);

            hasDrawnSomething = true;
            saveState();

            redrawVisibleFromTemp();
            drawing = false;
            return;
        }

        redrawVisibleFromTemp();
    }


    function onPointerMove(e) {
        if (erasing && drawMode.value !== "free") return;
        if (!drawing) return;
        e.preventDefault();
        const p = getPosFromEvent(e);
        const mode = drawMode.value;
        const lw = brushSize;
        const color = drawColor.value || '#f94144';

        if (drawMode.value === 'free') {
            tempCtx.lineWidth = brushSize * dpr;
            tempCtx.lineCap = 'round';
            tempCtx.lineJoin = 'round';

            if (erasing) {
                // Eraser mode
                drawEraserCursor(p.x, p.y);
                tempCtx.globalCompositeOperation = 'destination-out';
                tempCtx.strokeStyle = 'rgba(0,0,0,1)';
            } else {
                // Normal drawing
                tempCtx.globalCompositeOperation = 'source-over';
                tempCtx.strokeStyle = drawColor.value || '#f94144';
            }

            tempCtx.beginPath();
            tempCtx.moveTo(prevX, prevY);
            tempCtx.lineTo(p.x, p.y);
            tempCtx.stroke();
            tempCtx.closePath();
            tempCtx.globalCompositeOperation = erasing ? 'destination-out' : 'source-over';

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
        drawCtx.lineWidth = lw * dpr;
        drawCtx.lineCap = 'round';
        drawCtx.lineJoin = 'miter';

        const dx = p.x - startX;
        const dy = p.y - startY;
        const size = Math.sqrt(dx*dx + dy*dy);

        drawCtx.beginPath();
        switch(mode) {
            case 'circle':
                drawCtx.save(); // save context
                drawCtx.beginPath();
                drawCtx.arc(startX, startY, size, 0, Math.PI * 2);
                if (shiftPressed) {
                    drawCtx.fillStyle = color;
                    drawCtx.fill();
                }
                drawCtx.strokeStyle = color;
                drawCtx.lineWidth = lw * dpr;
                drawCtx.stroke();
                drawCtx.restore();
                break;
            // case 'square':
            //     drawCtx.rect(startX - size, startY - size, size*2, size*2);
            //     break;
            case 'rectangle':
                drawCtx.save();
                drawCtx.strokeStyle = color;
                drawCtx.lineWidth = lw * dpr;
                drawCtx.beginPath();
                const rectX = startX;
                const rectY = startY;
                const rectW = p.x - startX;
                const rectH = p.y - startY;
                drawCtx.rect(rectX, rectY, rectW, rectH);
                if (shiftPressed) {
                    drawCtx.fillStyle = color;
                    drawCtx.fill();
                }
                drawCtx.strokeStyle = color;
                drawCtx.lineWidth = lw * dpr;
                drawCtx.stroke();
                drawCtx.restore();
                break;
            case 'triangle':
                drawCtx.save();
                drawCtx.beginPath();
                drawCtx.moveTo(startX, startY - size);
                drawCtx.lineTo(startX - size, startY + size);
                drawCtx.lineTo(startX + size, startY + size);
                drawCtx.closePath();
                if (shiftPressed) drawCtx.fillStyle = color, drawCtx.fill();
                drawCtx.strokeStyle = color;
                drawCtx.lineWidth = lw * dpr;
                drawCtx.stroke();
                drawCtx.restore();
                break;

            case 'hex':
                drawCtx.save();
                drawCtx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = Math.PI / 3 * i;
                    const px = startX + Math.cos(angle) * size;
                    const py = startY + Math.sin(angle) * size;
                    if (i === 0) drawCtx.moveTo(px, py);
                    else drawCtx.lineTo(px, py);
                }
                drawCtx.closePath();
                if (shiftPressed) drawCtx.fillStyle = color, drawCtx.fill();
                drawCtx.strokeStyle = color;
                drawCtx.lineWidth = lw * dpr;
                drawCtx.stroke();
                drawCtx.restore();
                break;

            case 'star':
                drawCtx.save();
                drawCtx.beginPath();
                for (let i = 0; i < 10; i++) {
                    const angle = Math.PI / 5 * i;
                    const radius = (i % 2 === 0) ? size : size * 0.45;
                    const px = startX + Math.cos(angle) * radius;
                    const py = startY + Math.sin(angle) * radius;
                    if (i === 0) drawCtx.moveTo(px, py);
                    else drawCtx.lineTo(px, py);
                }
                drawCtx.closePath();
                if (shiftPressed) drawCtx.fillStyle = color, drawCtx.fill();
                drawCtx.strokeStyle = color;
                drawCtx.lineWidth = lw * dpr;
                drawCtx.stroke();
                drawCtx.restore();
                break;
        }
        drawCtx.stroke();
        drawCtx.restore();
    }

    
    function floodFillAt(sx, sy, fillColor) {
        const ctx = tempCtx; // fill on the master canvas
        const w = tempCanvas.width;
        const h = tempCanvas.height;

        // safety
        if (sx < 0 || sy < 0 || sx >= w || sy >= h) return;

        const img = ctx.getImageData(0, 0, w, h);
        const data = img.data;

        // target color = pixel at start
        const idx = (sy * w + sx) * 4;
        const targetR = data[idx];
        const targetG = data[idx + 1];
        const targetB = data[idx + 2];
        const targetA = data[idx + 3];

        // convert CSS color → rgba
        const fill = hexToRGBA(fillColor);

        // If target == fill, nothing to do
        if (
            targetR === fill.r &&
            targetG === fill.g &&
            targetB === fill.b &&
            targetA === data[idx + 3] // compare to itself, or ignore alpha
        ) return;

        // const stack = [[sx, sy]];

        // while (stack.length) {
        const queue = [[sx, sy]];

        while(queue.length) {
            const [x, y] = queue.shift();
            const i = (y * w + x) * 4;

            // skip if not the target color
            if (
                data[i] !== targetR ||
                data[i + 1] !== targetG ||
                data[i + 2] !== targetB ||
                data[i + 3] !== targetA
            ) continue;

            // fill it
            data[i] = fill.r;
            data[i + 1] = fill.g;
            data[i + 2] = fill.b;
            data[i + 3] = 255;

            // push neighbors
            if (x + 1 < w) queue.push([x + 1, y]);
            if (x - 1 >= 0) queue.push([x - 1, y]);
            if (y + 1 < h) queue.push([x, y + 1]);
            if (y - 1 >= 0) queue.push([x, y - 1]);
        }

        ctx.putImageData(img, 0, 0);
    }


    function hexToRGBA(hex) {
        const c = hex.replace('#', '');
        return {
            r: parseInt(c.substring(0, 2), 16),
            g: parseInt(c.substring(2, 4), 16),
            b: parseInt(c.substring(4, 6), 16),
            a: 255
        };
    }


    function onPointerUp(e) {
        if (!drawing) return;
        drawing = false;

        const p = getPosFromEvent(e);
        const mode = drawMode.value;
        const lw = brushSize;
        const color = drawColor.value || '#f94144';

        // FREEHAND: already drawn segments onto tempCtx during move
        // ensure visible canvas shows final result and save state
        if (mode === 'free') {
            // finalize any preview/overlays then save if something has changed
            redrawVisibleFromTemp();  
            tempCtx.globalCompositeOperation = 'source-over';   
            
            const after = tempCanvas.toDataURL();
            const before = undoStack.length ? undoStack[undoStack.length-1] : null;

            if (!before || before !== after) {
                hasDrawnSomething = true;
                saveState();
            }

                return;
        }

        // If erasing somehow became active outside 'free', treat it like freehand commit
        if (erasing) {
            redrawVisibleFromTemp();
            const after = tempCanvas.toDataURL();
            const before = undoStack.length ? undoStack[undoStack.length-1] : null;

            if (!before || before !== after) {
                hasDrawnSomething = true;
                saveState();
            }
            return;
        }


        // SHAPE final commit: draw the final shape into tempCtx (internal co-ords)
        // then update visible canvas and save state
        tempCtx.save();
        tempCtx.globalCompositeOperation = 'source-over';
        tempCtx.strokeStyle = color;
        tempCtx.lineWidth = lw * dpr;
        tempCtx.lineCap = 'round';
        tempCtx.lineJoin = 'miter';
        tempCtx.beginPath();

        const dx = p.x - startX;
        const dy = p.y - startY;
        const size = Math.sqrt(dx*dx + dy*dy);

        switch (mode) {
            case 'circle':
                tempCtx.save(); // save context
                tempCtx.beginPath();
                tempCtx.arc(startX, startY, size, 0, Math.PI * 2);
                if (shiftPressed) {
                    tempCtx.fillStyle = color;
                    tempCtx.fill();
                }
                tempCtx.strokeStyle = color;
                tempCtx.lineWidth = lw * dpr;
                tempCtx.stroke();
                tempCtx.restore();
                break;
            // case 'square': tempCtx.rect(startX - size, startY - size, size*2, size*2); break;
            case 'rectangle':
                tempCtx.save();
                tempCtx.strokeStyle = color;
                tempCtx.lineWidth = lw * dpr;
                tempCtx.beginPath();
                const rectX2 = startX;
                const rectY2 = startY;
                const rectW2 = p.x - startX;
                const rectH2 = p.y - startY;
                tempCtx.rect(rectX2, rectY2, rectW2, rectH2);
                if (shiftPressed) {
                    tempCtx.fillStyle = color;
                    tempCtx.fill();
                }
                tempCtx.strokeStyle = color;
                tempCtx.lineWidth = lw * dpr;
                tempCtx.stroke();
                tempCtx.restore();
                break;
            case 'triangle':
                tempCtx.save();
                tempCtx.beginPath();
                tempCtx.moveTo(startX, startY - size);
                tempCtx.lineTo(startX - size, startY + size);
                tempCtx.lineTo(startX + size, startY + size);
                tempCtx.closePath();
                if (shiftPressed) tempCtx.fillStyle = color, tempCtx.fill();
                tempCtx.strokeStyle = color;
                tempCtx.lineWidth = lw * dpr;
                tempCtx.stroke();
                tempCtx.restore();
                break;
            case 'hex':
                tempCtx.save();
                tempCtx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = Math.PI / 3 * i;
                    const px = startX + Math.cos(angle) * size;
                    const py = startY + Math.sin(angle) * size;
                    if (i === 0) tempCtx.moveTo(px, py);
                    else tempCtx.lineTo(px, py);
                }
                tempCtx.closePath();
                if (shiftPressed) tempCtx.fillStyle = color, tempCtx.fill();
                tempCtx.strokeStyle = color;
                tempCtx.lineWidth = lw * dpr;
                tempCtx.stroke();
                tempCtx.restore();
                break;
            case 'star':
                tempCtx.save();
                tempCtx.beginPath();
                for (let i = 0; i < 10; i++) {
                    const angle = Math.PI / 5 * i;
                    const radius = (i % 2 === 0) ? size : size * 0.45;
                    const px = startX + Math.cos(angle) * radius;
                    const py = startY + Math.sin(angle) * radius;
                    if (i === 0) tempCtx.moveTo(px, py);
                    else tempCtx.lineTo(px, py);
                }
                tempCtx.closePath();
                if (shiftPressed) tempCtx.fillStyle = color, tempCtx.fill();
                tempCtx.strokeStyle = color;
                tempCtx.lineWidth = lw * dpr;
                tempCtx.stroke();
                tempCtx.restore();
                break;
        }

        tempCtx.stroke();
        tempCtx.restore();

        // Show final result and save
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

        copyAnnotatedImageToClipboard();       
    });

    // Save to disk: produce FULL-RES PNG matching image natural size
    drawSave.addEventListener('click', async () => {
        if (!modalImage.src) return alert('No image to copy.');

        saveAnnotatedImageJPG();       
    });

const expandToggleBtn = document.getElementById('expandToggle');
    if (expandToggleBtn) {
        expandToggleBtn.addEventListener('click', () => {
            const modalMain = document.querySelector(".modal-main");
        modalMain.classList.toggle("fullscreen-image");

        const details = document.querySelector(".details");
        details.style.display = modalMain.classList.contains("fullscreen-image")
            ? "none"
            : "";

        // resize VISUAL canvas only
        requestAnimationFrame(syncCanvasToImage);
    });
}
    // ensure canvas prepared when modal image loads and when modal opens/resize
    modalImage.addEventListener('load', () => {
        prepareDrawCanvas();
        // if there is already drawing data in tempCanvas (e.g. cached), show it
        requestAnimationFrame(syncCanvasToImage);
    });   

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

const tooltip = document.getElementById("globalTooltip");

document.addEventListener("mouseover", (e) => {
    const tipTarget = e.target.closest("[data-tooltip]");
    if (tipTarget) {
        const rect = tipTarget.getBoundingClientRect();

        tooltip.textContent = tipTarget.dataset.tooltip;
        tooltip.style.left = (rect.left + rect.width / 2) + "px";
        tooltip.style.top = (rect.top - 28) + "px";
        tooltip.style.opacity = 1;
    }
});

document.addEventListener("mouseout", (e) => {
    const tipTarget = e.target.closest("[data-tooltip]");
    if (tipTarget) {
        tooltip.style.opacity = 0;
    }
});




// Open modal for a specific map
function openModal(map) {
    resetModal();
    window.currentMapName = map.name || "Map";
    // ===== BIOME OVERVIEW MAP FULLSCREEN MODE =====
    const isBiomeMap = map.stats && (map.stats["Map Type"] || "").trim().toLowerCase() === "biome";

    const modalMain = modal.querySelector(".modal-main");
    const gallery = modal.querySelector(".gallery");
    const mediaWrap = modal.querySelector(".media-wrap");
    const modalStats = document.getElementById("modalStats");

    if (modalStats) modalStats.style.display = isBiomeMap ? "none" : "block";

    current.index = maps.indexOf(map);
    current.media = map.screenshots || (map.thumbnail ? [map.thumbnail] : []);
    current.video = map.video || null;

    showMedia(0);

    modalTitle.textContent = map.name;
    modalAuthor.textContent = map.author || '';
    modalDesc.textContent = map.description || '';

    if (!isBiomeMap && map.stats) {
        modalStats.innerHTML = '';  
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

function resetModal() {
    const modalMain = document.querySelector(".modal-main");
    const gallery = document.querySelector(".gallery");
    const detailsCol = document.querySelector(".details");
    const icon = document.querySelector("#expandToggle i");

    // remove expanded state
    modalMain.classList.remove("expanded");

    // Restore gallery width
    if (gallery) gallery.style.flex = "2 1 600px";

    // Restore details
    if (detailsCol) detailsCol.style.display = "";

    // Reset icon
    if (icon) icon.setAttribute("data-lucide", "expand");

    lucide.createIcons();
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


function disableTextMode() {
    if (!isTextMode) return;
    isTextMode = false;    

    drawTextBtn.classList.remove("selected");

    if (activeTextInput) {
        activeTextInput.remove();
        activeTextInput = null;
    }

    drawCanvas.style.cursor = "crosshair";
    drawMode.value = "free";
}


// Show a specific screenshot in the modal
function showMedia(idx) {
    const mediaWrap = modalImage.closest('.media-wrap');
    modalImage.style.display = '';
    modalVideo.style.display = 'none';
    mediaWrap.classList.remove('video-active');
    modalVideo.src = '';
    modal.dataset.idx = idx;

    // Show draw tools for images
    const drawTools = document.getElementById('drawTools');
    if (drawTools) drawTools.style.display = '';

    // Reset canvas for drawing
    const canvas = document.getElementById('drawCanvas');
    if (canvas) canvas.style.display = 'block';

    const details = document.querySelector('.details');
    if (details) details.style.display = '';

    mediaWrap.style.height = '';
    mediaWrap.style.maxHeight = '';
    mediaWrap.style.flex = '';

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
        imgNaturalW = modalImage.naturalWidth;
        imgNaturalH = modalImage.naturalHeight;
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

window.addEventListener("DOMContentLoaded", () => {
    // render icons
    if (window.lucide) {
        lucide.createIcons();
    } else {
        console.warn("Lucide failed to load.");
    }

    const shapeBtns = document.querySelectorAll("#shapeTools .shape-btn");
    const drawModeSelect = document.getElementById("drawMode");

    shapeBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            disableTextMode();
            const mode = btn.dataset.mode;

            // Highlight selected button
            document.querySelectorAll('.shape-btn, .color-btn, .tool-btn').forEach(btn => {
               btn.classList.remove("selected");
            });
            btn.classList.add("selected");

            // Update hidden <select> so your drawing code still works
            drawModeSelect.value = mode;

            erasing = false;
            drawEraser.classList.remove("selected");

            // update cursor immediately
            if (mode === 'free') {
                drawCanvas.style.cursor = 'none';
                eraserCursor.style.display = 'block';
            } else {
                drawCanvas.style.cursor = 'crosshair';
                eraserCursor.style.display = 'none';
            }
        });
    });
});





// Show video in the modal
function showVideo() {
    if (!current.video) return;

    const mediaWrap = modalVideo.closest('.media-wrap');
    const canvas = document.getElementById('drawCanvas');

    // Hide image and canvas
    modalImage.style.display = 'none';
    if (canvas) canvas.style.display = 'none';

    // Hide draw tools for videos
    const drawTools = document.getElementById('drawTools');
    if (drawTools) drawTools.style.display = 'none';

    modalVideo.style.display = 'block';
    mediaWrap.classList.add('video-active');  // << add class

    // Set iframe src
    let url = current.video;
    if (url.includes('watch?v=')) url = url.replace('watch?v=', 'embed/');
    if (url.includes('youtu.be/')) url = url.replace('youtu.be/', 'www.youtube.com/embed/');
    modalVideo.src = url + '?autoplay=1&rel=0';
}



// Close modal
function closeModalFn() {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    modalVideo.src = '';

    // Reset expand/fullscreen state
    const modalMain = modal.querySelector('.modal-main');
    if (modalMain) {
        modalMain.classList.remove('expanded', 'fullscreen-image');
    }

    // Reset details visibility
    const details = modal.querySelector('.details');
    if (details) details.style.display = '';

    // Reset expand icon
    if (expandBtn) {
        const icon = expandBtn.querySelector('i');
        if (icon) icon.setAttribute('data-lucide', 'expand');
        lucide.createIcons();
    }
}


let shiftPressed = false;

window.addEventListener('keydown', e => {
    if (e.key === "Shift") shiftPressed = true;
});

window.addEventListener('keyup', e => {
    if (e.key === "Shift") shiftPressed = false;
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