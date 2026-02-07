// Initialize Fabric canvas
const canvas = new fabric.Canvas('canvas', {
    preserveObjectStacking: true
});

const BASE_WIDTH = 720;
const BASE_HEIGHT = 1280;

// Initialize template system
const templateManager = new TemplateManager(canvas);

// Collage state management
const collageState = {
    size: 'square',
    dimensions: { width: 600, height: 600 },
    imageCount: 2,
    gapSize: 0,
    selectedLayout: null
};

// Resize canvas to fit viewport
function resizeCanvas() {
    const container = document.querySelector('.canvas-area');
    const containerWidth = container.clientWidth - 32;
    const containerHeight = container.clientHeight - 32;

    // Calculate scale to fit both width and height
    const scaleX = containerWidth / BASE_WIDTH;
    const scaleY = containerHeight / BASE_HEIGHT;
    const scale = Math.min(scaleX, scaleY, 1); // Don't scale up beyond 100%

    canvas.setWidth(BASE_WIDTH * scale);
    canvas.setHeight(BASE_HEIGHT * scale);
    canvas.setZoom(scale);
    canvas.renderAll();
}

function initCanvas() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    setupCanvasEvents();
}

function setupCanvasEvents() {
    canvas.on('selection:created', updatePropertiesPanel);
    canvas.on('selection:updated', updatePropertiesPanel);
    canvas.on('selection:cleared', clearPropertiesPanel);
    
    // Deselect when clicking on empty canvas
    canvas.on('mouse:down', function(options) {
        if (!options.target) {
            canvas.discardActiveObject();
            canvas.renderAll();
            console.log('=== MOUSE DOWN ===');
            console.log('Clicked on:', options.target ? 'object' : 'empty');
            console.log('Current active:', canvas.getActiveObject());
        }
    });

    // Show controls immediately on selection
    canvas.on('selection:created', function(e) {
        const obj = e.target || e.selected[0];
        if (obj) {
            obj.setCoords();
            canvas.requestRenderAll()
            console.log('=== SELECTION CREATED ===');
            console.log('Object:', obj);
            console.log('Has controls:', obj.hasControls);
        }
        updatePropertiesPanel(e);
        updateEditButtonVisibility(); // Add this line
    })

    // Show/hide edit button based on selection
    function updateEditButtonVisibility() {
        const activeObject = canvas.getActiveObject();
        const editBtn = document.getElementById('edit-text-btn');
        
        if (editBtn) {
            if (activeObject && (activeObject.type === 'textbox' || activeObject.type === 'text')) {
                editBtn.style.display = 'block';
            } else {
                editBtn.style.display = 'none';
            }
        }
    }

    canvas.on('selection:cleared', function() {
        clearPropertiesPanel();
        updateEditButtonVisibility(); // Add this line
    });

    canvas.on('selection:updated', function(e) {
      const obj = e.target || e.selected[0];
        if(obj) {
            obj.setCoords();
            canvas.requestRenderAll()
        }
        updatePropertiesPanel(e);
        updateEditButtonVisibility(); // Add this line
    })
}

function updatePropertiesPanel(e) {
    const activeObject = e.target || canvas.getActiveObject();

    if (!activeObject) return;

    if (activeObject.type !== 'textbox' || activeObject.type !== 'text') {
        return;
    }

    const fontColor = activeObject.fill || '#000000';
    const fontFamily = activeObject.fontFamily || 'Arial';

    document.getElementById('font-color').value = fontColor;
    document.getElementById('font-family').value = fontFamily;
}

function clearPropertiesPanel() {
    document.getElementById('font-color').value = '#000000';
    document.getElementById('font-family').value = 'Arial';
}

function handleImageUpload(file) {
    if (!file || !file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
    }

    const reader = new FileReader();

    reader.onload = function(e) {
        fabric.Image.fromURL(e.target.result, function(img) {
            const maxSize = 300;
            const scale = Math.min(maxSize / img.width, maxSize / img.height);

            img.set({
                left: 200,
                top: 400,
                scaleX: scale,
                scaleY: scale,
                cornerColor: '#667eea',
                cornerSize: 12,
                transparentCorners: false
            });

            canvas.add(img);
            canvas.setActiveObject(img);
            canvas.renderAll();
        });
    };

    reader.readAsDataURL(file);
}

function updateFontSize(size) {
    const activeObject = canvas.getActiveObject();
    if (activeObject && (activeObject.type === 'textbox' || activeObject.type === 'text')) {
        activeObject.set('fontSize', parseInt(size));
        canvas.renderAll();
    }
    document.getElementById('font-size-value').textContent = size + 'px';
}

function updateFontColor(color) {
    const activeObject = canvas.getActiveObject();
    if (activeObject && (activeObject.type === 'textbox' || activeObject.type === 'text')) {
        activeObject.set('fill', color);
        canvas.renderAll();
    }
}

function updateFontFamily(fontFamily) {
    const activeObject = canvas.getActiveObject();
    if (activeObject && (activeObject.type === 'textbox' || activeObject.type === 'text')) {
        activeObject.set('fontFamily', fontFamily);
        canvas.renderAll();
    }
}

function addText() {
    const text = new fabric.Textbox('Tap to edit', {
        left: 100,
        top: 100,
        width: 200,
        fontSize: 20,
        fontFamily: 'Arial',
        fill: '#000000',
        textAlign: 'left',
        cornerColor: '#667eea',
        cornerSize: 12,
        transparentCorners: false,
        lockUniScaling: false,
        editable: false  // Disable inline editing
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();

    canvas.requestRenderAll();
}

// Store reference to text being edited
let textBeingEdited = null;

// Open text edit modal
function openTextEditModal(textObject) {
    if (!textObject || (textObject.type !== 'textbox' && textObject.type !== 'text')) {
        return;
    }

    textBeingEdited = textObject;
    const modal = document.getElementById('text-edit-modal');
    const textarea = document.getElementById('text-edit-textarea');
    
    // Populate textarea with current text
    textarea.value = textObject.text || '';
    
    // Show modal
    modal.style.display = 'flex';
    
    // Focus textarea after a brief delay (for mobile keyboards)
    setTimeout(() => {
        textarea.focus();
        textarea.select();
    }, 100);
}

// Close text edit modal
function closeTextEditModal() {
    const modal = document.getElementById('text-edit-modal');
    modal.style.display = 'none';
    textBeingEdited = null;
}

// Save edited text
function saveEditedText() {
    const textarea = document.getElementById('text-edit-textarea');
    const newText = textarea.value.trim();
    
    if (textBeingEdited && newText) {
        textBeingEdited.set('text', newText);
        canvas.renderAll();
    }
    
    closeTextEditModal();
}

function deleteSelected() {
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
        canvas.remove(activeObject);
        canvas.discardActiveObject();
        canvas.requestRenderAll();
    } else {
        alert('Please select an element to delete');
    }
}

function clearCanvas() {
    if (confirm('Are you sure you want to clear the canvas? This cannot be undone.')) {
        canvas.clear();
        canvas.setBackgroundColor('#ffffff', canvas.renderAll.bind(canvas));
    }
}

function downloadCanvas() {
    setTimeout(() => {
        try {
            const originalZoom = canvas.getZoom();
            const originalWidth = canvas.getWidth();
            const originalHeight = canvas.getHeight();

            canvas.setZoom(1);
            canvas.setWidth(BASE_WIDTH);
            canvas.setHeight(BASE_HEIGHT);
            canvas.renderAll();

            const dataURL = canvas.toDataURL({
                format: 'png',
                quality: 1,
                multiplier: 2
            });

            canvas.setZoom(originalZoom);
            canvas.setWidth(originalWidth);
            canvas.setHeight(originalHeight);
            canvas.renderAll();

            const link = document.createElement('a');
            link.download = `design-${Date.now()}.png`;
            link.href = dataURL;
            link.click();
        } catch (error) {
            console.error('Download failed:', error);
            alert('Download failed. Please try again.');
        }
    }, 100);
}

// Font size increment/decrement
let currentFontSize = 20;

function increaseFontSize() {
    const activeObject = canvas.getActiveObject();
    if (activeObject && (activeObject.type === 'textbox' || activeObject.type === 'text')) {
        currentFontSize = activeObject.fontSize || 20;
        currentFontSize += 2;
        if (currentFontSize > 120) currentFontSize = 120; // Max size
        activeObject.set('fontSize', currentFontSize);
        canvas.renderAll();
    } else {
        alert('Please select a text object first');
    }
}

function decreaseFontSize() {
    const activeObject = canvas.getActiveObject();
    if (activeObject && (activeObject.type === 'textbox' || activeObject.type === 'text')) {
        currentFontSize = activeObject.fontSize || 20;
        currentFontSize -= 2;
        if (currentFontSize < 12) currentFontSize = 12; // Min size
        activeObject.set('fontSize', currentFontSize);
        canvas.renderAll();
    } else {
        alert('Please select a text object first');
    }
}

// Layer control functions
function sendBackward() {
    const activeObject = canvas.getActiveObject();
    
    console.log('=== SEND BACKWARD ===');
    console.log('Active object:', activeObject);
    console.log('Current index:', canvas.getObjects().indexOf(activeObject));
    
    if (!activeObject) {
        alert('Please select an object first');
        return;
    }
    
    if (activeObject.selectable === false) {
        alert('This object cannot be moved');
        return;
    }
    
    canvas.sendBackwards(activeObject);
    canvas.renderAll();
    
    console.log('New index:', canvas.getObjects().indexOf(activeObject));
}

function bringForward() {
    const activeObject = canvas.getActiveObject();
    
    console.log('=== BRING FORWARD ===');
    console.log('Active object:', activeObject);
    console.log('Current index:', canvas.getObjects().indexOf(activeObject));
    
    if (!activeObject) {
        alert('Please select an object first');
        return;
    }
    
    if (activeObject.selectable === false) {
        alert('This object cannot be moved');
        return;
    }
    
    canvas.bringForward(activeObject);
    canvas.renderAll();
    
    console.log('New index:', canvas.getObjects().indexOf(activeObject));
}

// Collage configuration handlers
function handleSizeSelection(sizeType) {
    // Update state
    collageState.size = sizeType;

    // Set dimensions
    switch(sizeType) {
        case 'square':
            collageState.dimensions = { width: 600, height: 600 };
            break;
        case 'instagram':
            collageState.dimensions = { width: 1080, height: 1080 };
            break;
        case 'wide':
            collageState.dimensions = { width: 1200, height: 628 };
            break;
    }

    // Update UI
    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.closest('.size-btn').classList.add('active');
}

function handleCountSelection(count) {
    collageState.imageCount = parseInt(count);

    // Update UI
    document.querySelectorAll('.count-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
}

function handleGapSelection(gap) {
    collageState.gapSize = parseInt(gap);

    // Update UI
    document.querySelectorAll('.gap-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
}

function goToLayoutScreen() {
    // Hide config screen
    document.getElementById('collage-screen-config').style.display = 'none';

    // Show layout screen
    document.getElementById('collage-screen-layouts').style.display = 'block';

    // Update title
    document.getElementById('collage-title').textContent = 
        `Choose Layout (${collageState.imageCount} images)`;

    // Load and display layouts
    loadLayoutsForCount(collageState.imageCount);
}

// Store loaded layouts
let allCollageLayouts = [];

// Load layouts from JSON
async function loadCollageLayouts() {
    try {
        const response = await fetch('collage-layouts.json');
        const data = await response.json();
        allCollageLayouts = data.layouts;
        console.log('Loaded collage layouts:', allCollageLayouts);
    } catch (error) {
        console.error('Failed to load collage layouts:', error);
        alert('Failed to load collage layouts. Please check if collage-layouts.json exists.');
    }
}

// Filter and display layouts for selected image count
function loadLayoutsForCount(count) {
    const layoutsGrid = document.getElementById('layouts-grid');
    layoutsGrid.innerHTML = ''; // Clear previous layouts

    // Filter layouts by image count
    const filteredLayouts = allCollageLayouts.filter(layout => 
        layout.imageCount === count
    );

    if (filteredLayouts.length === 0) {
        layoutsGrid.innerHTML = '<p>No layouts available for this count.</p>';
        return;
    }

    // Create layout cards
    filteredLayouts.forEach(layout => {
        const card = createLayoutCard(layout);
        layoutsGrid.appendChild(card);
    });
}

// Create a visual card for each layout
function createLayoutCard(layout) {
    const card = document.createElement('div');
    card.className = 'layout-card';
    card.setAttribute('data-layout-id', layout.id);

    // Create SVG preview
    const preview = createLayoutPreviewSVG(layout);

    // Create name label
    const name = document.createElement('div');
    name.className = 'layout-name';
    name.textContent = layout.name;

    card.appendChild(preview);
    card.appendChild(name);

    // Click handler
    card.addEventListener('click', () => selectLayout(layout, card));

    return card;
}

// Generate SVG preview of layout
function createLayoutPreviewSVG(layout) {
    const container = document.createElement('div');
    container.className = 'layout-preview';

    // Create SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');

    // Draw each slot as a rectangle
    layout.slots.forEach((slot, index) => {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', slot.x * 100);
        rect.setAttribute('y', slot.y * 100);
        rect.setAttribute('width', slot.width * 100);
        rect.setAttribute('height', slot.height * 100);
        rect.setAttribute('fill', '#e0e0e0');
        rect.setAttribute('stroke', '#ffffff');
        rect.setAttribute('stroke-width', '2');

        svg.appendChild(rect);
    });

    container.appendChild(svg);
    return container;
}

// Handle layout selection
function selectLayout(layout, cardElement) {
    // Remove previous selection
    document.querySelectorAll('.layout-card').forEach(card => {
        card.classList.remove('selected');
    });

    // Mark as selected
    cardElement.classList.add('selected');
    collageState.selectedLayout = layout;

    // Enable continue button
    document.getElementById('layouts-next-btn').disabled = false;
}

// Navigate to upload screen
function goToUploadScreen() {
    if (!collageState.selectedLayout) {
        alert('Please select a layout first');
        return;
    }

    // Hide layouts screen
    document.getElementById('collage-screen-layouts').style.display = 'none';

    // Show upload screen
    document.getElementById('collage-screen-upload').style.display = 'block';

    // Update title
    document.getElementById('collage-title').textContent = 'Add Images to Collage';

    // Initialize collage preview
    initializeCollagePreview();
}

// Initialize the collage preview canvas
function initializeCollagePreview() {
    const previewCanvas = document.getElementById('collage-preview-canvas');
    const container = previewCanvas.parentElement;

    // WAIT for container to be visible and sized
    if (container.clientWidth === 0) {
        // Container not ready yet, wait a bit
        setTimeout(() => {
            initializeCollagePreview();
        }, 100);
        return;
    }

    // Set canvas size to fit container while maintaining aspect ratio
    const containerWidth = container.clientWidth - 40; // Padding
    const aspectRatio = collageState.dimensions.width / collageState.dimensions.height;

    let canvasWidth = containerWidth;
    let canvasHeight = containerWidth / aspectRatio;

    // If height exceeds container, scale by height instead
    if (canvasHeight > 400) {
        canvasHeight = 400;
        canvasWidth = canvasHeight * aspectRatio;
    }

    previewCanvas.width = canvasWidth;
    previewCanvas.height = canvasHeight;

    // Initialize Fabric canvas
    if (window.collageCanvas) {
        window.collageCanvas.dispose();
    }

    window.collageCanvas = new fabric.Canvas('collage-preview-canvas', {
        backgroundColor: '#f0f0f0',
        selection: false
    });

    // Scale factor to fit actual dimensions into preview canvas
    const scaleFactor = canvasWidth / collageState.dimensions.width;

    // Draw slots
    drawCollageSlots(scaleFactor);
}

// Draw empty slots on the collage canvas
function drawCollageSlots(scaleFactor) {
    const layout = collageState.selectedLayout;
    const dimensions = collageState.dimensions;
    const gap = collageState.gapSize;

    layout.slots.forEach((slot, index) => {
        // Calculate slot position with gap
        const x = (slot.x * dimensions.width + gap/2) * scaleFactor;
        const y = (slot.y * dimensions.height + gap/2) * scaleFactor;
        const width = (slot.width * dimensions.width - gap) * scaleFactor;
        const height = (slot.height * dimensions.height - gap) * scaleFactor;

        // Create placeholder rectangle
        const rect = new fabric.Rect({
            left: x,
            top: y,
            width: width,
            height: height,
            fill: '#e0e0e0',
            stroke: '#bdbdbd',
            strokeWidth: 2,
            selectable: false,
            evented: true,
            slotId: slot.id,
            slotIndex: index
        });

        // Add click handler to upload image to this slot
        rect.on('mousedown', function(e) {
            // Check if there's already an image in this slot
            if (window.collageSlotImages[this.slotIndex]) {
                // Show options: Replace or Remove
                if (confirm('Replace this image? (Cancel to remove)')) {
                    openImageUploadForSlot(this.slotIndex);
                } else {
                    removeImageFromSlot(this.slotIndex);
                }
            } else {
                openImageUploadForSlot(this.slotIndex);
            }
        });

        // Add "+" icon in center
        const text = new fabric.Text('+', {
            left: x + width/2,
            top: y + height/2,
            fontSize: 48 * scaleFactor,
            fill: '#9e9e9e',
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false
        });

        window.collageCanvas.add(rect);
        window.collageCanvas.add(text);
    });

    window.collageCanvas.renderAll();
}

// Store uploaded images for each slot
window.collageSlotImages = {};

// Open file picker for specific slot
function openImageUploadForSlot(slotIndex) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            addImageToCollageSlot(slotIndex, file);
        }
    };

    input.click();
}

// Add image to specific slot with clipping
function addImageToCollageSlot(slotIndex, file) {
    const reader = new FileReader();

    reader.onload = function(e) {
        fabric.Image.fromURL(e.target.result, function(img) {
            const layout = collageState.selectedLayout;
            const slot = layout.slots[slotIndex];
            const dimensions = collageState.dimensions;
            const gap = collageState.gapSize;

            // Get canvas scale factor
            const scaleFactor = window.collageCanvas.width / dimensions.width;

            // Calculate slot dimensions
            const slotX = (slot.x * dimensions.width + gap/2) * scaleFactor;
            const slotY = (slot.y * dimensions.height + gap/2) * scaleFactor;
            const slotWidth = (slot.width * dimensions.width - gap) * scaleFactor;
            const slotHeight = (slot.height * dimensions.height - gap) * scaleFactor;

            // Scale image to cover slot (fill mode)
            const imgAspect = img.width / img.height;
            const slotAspect = slotWidth / slotHeight;

            let scale;
            if (imgAspect > slotAspect) {
                // Image wider than slot
                scale = slotHeight / img.height;
            } else {
                // Image taller than slot
                scale = slotWidth / img.width;
            }

            img.set({
                left: slotX + slotWidth/2,
                top: slotY + slotHeight/2,
                scaleX: scale,
                scaleY: scale,
                originX: 'center',
                originY: 'center',
                hasControls: true,
                hasBorders: true,
                lockRotation: true
            });

            // Add long-press to replace image (works on desktop and mobile)
            let pressTimer;

            // Desktop: mousedown
            img.on('mousedown', function(options) {
                if (options.e.button === 0) { // Left click only
                    pressTimer = setTimeout(() => {
                        if (confirm('Replace this image?')) {
                            openImageUploadForSlot(this.slotIndex);
                        }
                    }, 800); // 800ms for more reliable detection
                }
            });

            // Mobile: touchstart
            img.on('touchstart', function() {
                pressTimer = setTimeout(() => {
                    if (confirm('Replace this image?')) {
                        openImageUploadForSlot(this.slotIndex);
                    }
                }, 800);
            });

            // Clear timer on mouseup/touchend
            img.on('mouseup', function() {
                clearTimeout(pressTimer);
            });

            img.on('touchend', function() {
                clearTimeout(pressTimer);
            });

            // Clear timer if moved away
            img.on('mouseout', function() {
                clearTimeout(pressTimer);
            });

            img.on('touchcancel', function() {
                clearTimeout(pressTimer);
            });

            // Create clipping rectangle
            const clipPath = new fabric.Rect({
                left: slotX,
                top: slotY,
                width: slotWidth,
                height: slotHeight,
                absolutePositioned: true
            });

            img.clipPath = clipPath;

            // Remove old image from this slot if exists
            if (window.collageSlotImages[slotIndex]) {
                window.collageCanvas.remove(window.collageSlotImages[slotIndex]);
            }

            // Store reference
            window.collageSlotImages[slotIndex] = img;
            img.slotIndex = slotIndex;

            // Add to canvas
            window.collageCanvas.add(img);
            window.collageCanvas.renderAll();

            // Enable "Add to Canvas" button if all slots filled
            checkIfAllSlotsFilled();
        });
    };

    reader.readAsDataURL(file);
}

// Check if all slots have images
function checkIfAllSlotsFilled() {
    const totalSlots = collageState.selectedLayout.slots.length;
    const filledSlots = Object.keys(window.collageSlotImages).length;

    const addBtn = document.getElementById('add-to-canvas-btn');
    if (filledSlots > 0) {
        addBtn.disabled = false;
    }
}

// Remove image from slot
function removeImageFromSlot(slotIndex) {
    if (window.collageSlotImages[slotIndex]) {
        window.collageCanvas.remove(window.collageSlotImages[slotIndex]);
        delete window.collageSlotImages[slotIndex];
        window.collageCanvas.renderAll();

        // Update button state
        checkIfAllSlotsFilled();
    }
}

function addCollageToMainCanvas() {
    try {
        if (Object.keys(window.collageSlotImages).length === 0) {
            alert('Please add at least one image to the collage');
            return;
        }

        // Create temporary canvas at actual size
        const tempCanvas = document.createElement('canvas');
        const actualWidth = collageState.dimensions.width;
        const actualHeight = collageState.dimensions.height;

        tempCanvas.width = actualWidth;
        tempCanvas.height = actualHeight;

        // Initialize Fabric canvas at actual size
        const fabricTempCanvas = new fabric.Canvas(tempCanvas, {
            backgroundColor: '#ffffff'
        });

        // Scale factor
        const previewWidth = window.collageCanvas.width;
        const scaleToActual = actualWidth / previewWidth;

        // Counter for loaded images
        let loadedCount = 0;
        const totalImages = Object.keys(window.collageSlotImages).length;

        // Clone each image to temp canvas at actual size
        Object.values(window.collageSlotImages).forEach(img => {
            fabric.Image.fromURL(img.getSrc(), function(newImg) {
                newImg.set({
                    left: img.left * scaleToActual,
                    top: img.top * scaleToActual,
                    scaleX: img.scaleX * scaleToActual,
                    scaleY: img.scaleY * scaleToActual,
                    originX: img.originX,
                    originY: img.originY
                });

                // Handle clipPath
                if (img.clipPath) {
                    const clipRect = new fabric.Rect({
                        left: img.clipPath.left * scaleToActual,
                        top: img.clipPath.top * scaleToActual,
                        width: img.clipPath.width * scaleToActual,
                        height: img.clipPath.height * scaleToActual,
                        absolutePositioned: true
                    });
                    newImg.clipPath = clipRect;
                }

                fabricTempCanvas.add(newImg);
                loadedCount++;

                // When all images loaded, convert to JPG
                if (loadedCount === totalImages) {
                    fabricTempCanvas.renderAll();

                    // Small delay to ensure rendering is complete
                    setTimeout(() => {
                        convertCanvasToImage(fabricTempCanvas, actualWidth, actualHeight);
                    }, 100);
                }
            });
        });

    } catch (error) {
        console.error('Error adding collage to canvas:', error);
        alert('Failed to add collage. Please try again.');
    }
}

// Convert temp canvas to single JPG image and add to main canvas
function convertCanvasToImage(fabricTempCanvas, actualWidth, actualHeight) {
    // Export as data URL
    const dataURL = fabricTempCanvas.toDataURL({
        format: 'jpeg',
        quality: 0.95
    });

    // Create Fabric image from data URL
    fabric.Image.fromURL(dataURL, function(collageImg) {
        collageImg.set({
            left: (BASE_WIDTH - actualWidth) / 2,
            top: (BASE_HEIGHT - actualHeight) / 2,
            selectable: true,
            hasControls: true
        });

        // Add to main canvas
        canvas.add(collageImg);
        canvas.setActiveObject(collageImg);
        canvas.requestRenderAll();

        // Dispose temp canvas
        fabricTempCanvas.dispose();

        // Close modal
        closeCollageModal();

        console.log('Collage added successfully as image!');
    });
}

// Close modal and reset state
function closeCollageModal() {
    // Hide modal
    document.getElementById('collage-modal').style.display = 'none';

    // Reset to first screen
    document.getElementById('collage-screen-upload').style.display = 'none';
    document.getElementById('collage-screen-layouts').style.display = 'none';
    document.getElementById('collage-screen-config').style.display = 'block';
    document.getElementById('collage-title').textContent = 'Create Collage';

    /// PROPERLY reset state to defaults
    collageState.size = 'square';
    collageState.dimensions = { width: 600, height: 600 };
    collageState.imageCount = 2;
    collageState.gapSize = 0;
    collageState.selectedLayout = null;
    window.collageSlotImages = {};

    // Dispose collage canvas
    if (window.collageCanvas) {
        window.collageCanvas.clear();
    }

    // Reset ALL button states to match defaults
    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-size') === 'square') {
            btn.classList.add('active');
        }
    });

    document.querySelectorAll('.count-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-count') === '2') {
            btn.classList.add('active');
        }
    });

    document.querySelectorAll('.gap-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-gap') === '0') {
            btn.classList.add('active');
        }
    });

    // Clear layout grid
    document.getElementById('layouts-grid').innerHTML = '';

    document.getElementById('layouts-next-btn').disabled = true;
    document.getElementById('add-to-canvas-btn').disabled = true;
}

// Template Modal Management
function openTemplateModal() {
    const modal = document.getElementById('template-modal');
    modal.style.display = 'flex';
    loadTemplatesIntoModal();
}

function closeTemplateModal() {
    const modal = document.getElementById('template-modal');
    modal.style.display = 'none';
}

// Load templates into the modal
async function loadTemplatesIntoModal() {
    const grid = document.getElementById('template-grid');
    grid.innerHTML = '<div class="loading-templates">Loading templates...</div>';

    try {
        const templates = await templateManager.loadTemplatesData();
        renderTemplateGrid(templates);
    } catch (error) {
        console.error('Failed to load templates:', error);
        grid.innerHTML = '<div class="loading-templates">Failed to load templates</div>';
    }
}

// Render template cards in grid
function renderTemplateGrid(templates) {
    const grid = document.getElementById('template-grid');
    grid.innerHTML = '';

    templates.forEach(template => {
        const card = createTemplateCard(template);
        grid.appendChild(card);
    });
}

// Create template card element
function createTemplateCard(template) {
    const card = document.createElement('div');
    card.className = 'template-item';

    // Add special class for blank template
    if (template.id === 'blank-template') {
        card.classList.add('blank-template');
    }

    // Thumbnail
    const thumbnail = document.createElement('div');
    thumbnail.className = 'template-thumbnail';

    if (template.thumbnail) {
        const img = document.createElement('img');
        img.src = template.thumbnail;
        img.alt = template.name;
        img.onerror = function() {
            this.parentElement.innerHTML = '';
        };
        thumbnail.appendChild(img);
    }

    // Info
    const info = document.createElement('div');
    info.className = 'template-info';

    const name = document.createElement('div');
    name.className = 'template-name';
    name.textContent = template.name;

    info.appendChild(name);

    card.appendChild(thumbnail);
    card.appendChild(info);

    // Click handler
    card.addEventListener('click', () => {
        applyTemplateAndClose(template.id);
    });

    return card;
}

// Apply template and close modal
async function applyTemplateAndClose(templateId) {
    await templateManager.applyTemplate(templateId);
    closeTemplateModal();
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    initCanvas();

    // Load collage layouts
    loadCollageLayouts();

    // Show template modal on page load
    setTimeout(() => {
        openTemplateModal();
    }, 300);

    // Collage button - opens modal
    const collageBtn = document.getElementById('collage-btn');
    const collageModal = document.getElementById('collage-modal');
    const collageCloseBtn = document.getElementById('collage-close-btn');

    if (collageBtn) {
        collageBtn.addEventListener('click', () => {
            collageModal.style.display = 'flex';
        });
    }

    if (collageCloseBtn) {
        collageCloseBtn.addEventListener('click', closeCollageModal);
    }

    // Close modal when clicking outside
    if (collageModal) {
        collageModal.addEventListener('click', (e) => {
            if (e.target === collageModal) {
                closeCollageModal();
            }
        });
    }

    // Configuration screen - Size selection
    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const size = btn.getAttribute('data-size');
            handleSizeSelection(size);
        });
    });

    // Configuration screen - Count selection
    document.querySelectorAll('.count-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const count = btn.getAttribute('data-count');
            handleCountSelection(count);
        });
    });

    // Configuration screen - Gap selection
    document.querySelectorAll('.gap-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const gap = btn.getAttribute('data-gap');
            handleGapSelection(gap);
        });
    });

    // Config screen - Next button
    const configNextBtn = document.getElementById('config-next-btn');
    if (configNextBtn) {
        configNextBtn.addEventListener('click', goToLayoutScreen);
    }

    // Layouts screen - Back button
    const layoutsBackBtn = document.getElementById('layouts-back-btn');
    if (layoutsBackBtn) {
        layoutsBackBtn.addEventListener('click', () => {
            document.getElementById('collage-screen-layouts').style.display = 'none';
            document.getElementById('collage-screen-config').style.display = 'block';
            document.getElementById('collage-title').textContent = 'Create Collage';
        });
    }

    // Layouts screen - Continue button
    const layoutsNextBtn = document.getElementById('layouts-next-btn');
    if (layoutsNextBtn) {
        layoutsNextBtn.addEventListener('click', goToUploadScreen);
    }

    // Upload screen - Back button
    const uploadBackBtn = document.getElementById('upload-back-btn');
    if (uploadBackBtn) {
        uploadBackBtn.addEventListener('click', () => {
            document.getElementById('collage-screen-upload').style.display = 'none';
            document.getElementById('collage-screen-layouts').style.display = 'block';
            document.getElementById('collage-title').textContent = 
                `Choose Layout (${collageState.imageCount} images)`;
        });
    }

    // Upload all images button
    const uploadAllBtn = document.getElementById('upload-all-btn');
    if (uploadAllBtn) {
        uploadAllBtn.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.multiple = true;

            input.onchange = (e) => {
                const files = Array.from(e.target.files);
                files.forEach((file, index) => {
                    if (index < collageState.selectedLayout.slots.length) {
                        addImageToCollageSlot(index, file);
                    }
                });
            };

            input.click();
        });
    }

    // Add to canvas button
    const addToCanvasBtn = document.getElementById('add-to-canvas-btn');
    if (addToCanvasBtn) {
        addToCanvasBtn.addEventListener('click', addCollageToMainCanvas);
    }

    // Image upload
    const imageUploadBtn = document.getElementById('image-upload-btn');
    const imageUpload = document.getElementById('image-upload');

    if (imageUploadBtn && imageUpload) {
        imageUploadBtn.addEventListener('click', () => imageUpload.click());
        imageUpload.addEventListener('change', function(e) {
            if (e.target.files.length > 0) {
                handleImageUpload(e.target.files[0]);
                e.target.value = '';
            }
        });
    }

    // Add text button
    const addTextBtn = document.getElementById('add-text-btn');
    if (addTextBtn) {
        addTextBtn.addEventListener('click', addText);
    }

    // Font size buttons
    document.getElementById('increase-font-btn')?.addEventListener('click', increaseFontSize);
    document.getElementById('decrease-font-btn')?.addEventListener('click', decreaseFontSize);
    
    // Move layer up-down buttons
    document.getElementById('btn-send-backward')?.addEventListener('click', sendBackward);
    document.getElementById('btn-bring-forward')?.addEventListener('click', bringForward);


    // Native color picker
    const fontColor = document.getElementById('font-color');
    if (fontColor) {
        fontColor.addEventListener('input', (e) => {
            updateFontColor(e.target.value);
        });
    }

    // Trigger native inputs when clicking labels
    const colorLabel = document.querySelector('label[for="font-color"]');
    if (colorLabel) {
        colorLabel.addEventListener('click', function(e) {
            if (e.target.tagName !== 'INPUT') {
                document.getElementById('font-color').click();
            }
        });
    }

    const fontLabel = document.querySelector('label[for="font-family"]');
    if (fontLabel) {
        fontLabel.addEventListener('click', function(e) {
            if (e.target.tagName !== 'SELECT') {
                document.getElementById('font-family').click();
            }
        });
    }

    // Font family selector
    const fontFamily = document.getElementById('font-family');
    if (fontFamily) {
        fontFamily.addEventListener('change', (e) => {
            const value = e.target.value
            if (value) {
                updateFontFamily(value);
                const activeObject = canvas.getActiveObject();
                if (activeObject) {
                    canvas.requestRenderAll();
                }
            }
        });
    }

    // Delete button
    const deleteBtn = document.getElementById('delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', deleteSelected);
    }

    // Clear canvas button
    const clearBtn = document.getElementById('clear-canvas-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearCanvas);
    }

    // Download button
    const downloadBtn = document.getElementById('download-btn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadCanvas);
    }

    // Template modal - Close button
    const templateCloseBtn = document.getElementById('template-close-btn');
    const templateModal = document.getElementById('template-modal');

    if (templateCloseBtn) {
        templateCloseBtn.addEventListener('click', closeTemplateModal);
    }

    // Close modal when clicking outside
    if (templateModal) {
        templateModal.addEventListener('click', (e) => {
            if (e.target === templateModal) {
                closeTemplateModal();
            }
        });
    }

    // Template button - opens modal
    const templatesBtn = document.getElementById('templates-btn');
    if (templatesBtn) {
        templatesBtn.addEventListener('click', openTemplateModal);
    }

    // Edit text button
    const editTextBtn = document.getElementById('edit-text-btn');
    if (editTextBtn) {
        editTextBtn.addEventListener('click', () => {
            const activeObject = canvas.getActiveObject();
            openTextEditModal(activeObject);
        });
    }

    // Text edit modal - Save button
    const textEditSaveBtn = document.getElementById('text-edit-save-btn');
    if (textEditSaveBtn) {
        textEditSaveBtn.addEventListener('click', saveEditedText);
    }

    // Text edit modal - Cancel button
    const textEditCancelBtn = document.getElementById('text-edit-cancel-btn');
    if (textEditCancelBtn) {
        textEditCancelBtn.addEventListener('click', closeTextEditModal);
    }

    // Text edit modal - Close button
    const textEditCloseBtn = document.getElementById('text-edit-close-btn');
    if (textEditCloseBtn) {
        textEditCloseBtn.addEventListener('click', closeTextEditModal);
    }

    // Text edit modal - Close on outside click
    const textEditModal = document.getElementById('text-edit-modal');
    if (textEditModal) {
        textEditModal.addEventListener('click', (e) => {
            if (e.target === textEditModal) {
                closeTextEditModal();
            }
        });
    }
});
