// Template Management System
class TemplateManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.currentTemplate = null;
        this.templateElements = new Map();
    }

    async loadTemplatesData() {
        try {
            const response = await fetch('templates/templates.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data.templates;
        } catch (error) {
            console.log('Could not load templates.json, using fallback template data:', error);
            return this.getFallbackTemplates();
        }
    }

    getFallbackTemplates() {
        return [
            {
                id: "medical-camp-1",
                name: "Medical Camp",
                thumbnail: "templates/thumbnails/medical-camp-1.jpeg",
                background: {
                    image: "templates/backgrounds/medical-camp-bg.jpeg",
                    color: "#4CAF50"
                },
                dimensions: { width: 720, height: 1280 },
                textElements: [
                    {
                        id: "main-heading",
                        type: "heading",
                        defaultText: "MEDICAL CAMP",
                        position: { x: 60, y: 120 },
                        size: { width: 600, height: 100 },
                        style: {
                            fontSize: 48,
                            fontWeight: "bold",
                            color: "#ffffff",
                            textAlign: "center",
                            fontFamily: "Arial"
                        }
                    },
                    {
                        id: "subtitle",
                        type: "subtitle",
                        defaultText: "Free Health Checkup",
                        position: { x: 60, y: 220 },
                        size: { width: 600, height: 60 },
                        style: {
                            fontSize: 32,
                            fontWeight: "normal",
                            color: "#ffffff",
                            textAlign: "center",
                            fontFamily: "Arial"
                        }
                    },
                    {
                        id: "location",
                        type: "body",
                        defaultText: "Location: City Hospital\nDate: Tomorrow 10 AM",
                        position: { x: 130, y: 1000 },
                        size: { width: 460, height: 100 },
                        style: {
                            fontSize: 22,
                            fontWeight: "bold",
                            color: "#ffffff",
                            textAlign: "center",
                            fontFamily: "Arial"
                        }
                    }
                ]
            },
            {
                id: "blank-template",
                name: "Blank Canvas",
                thumbnail: null,
                background: {
                    color: "#ffffff"
                },
                dimensions: { width: 720, height: 1280 },
                textElements: []
            }
        ];
    }

    async applyTemplate(templateId) {
        const templates = await this.loadTemplatesData();
        const template = templates.find(t => t.id === templateId);

        if (!template) {
            console.error('Template not found:', templateId);
            return;
        }

        this.currentTemplate = template;
        this.clearCanvas();

        // Load background image (or color)
        await this.loadBackground(template.background);

        // Add fixed elements if any (overlays like boxes, shapes)
        if (template.fixedElements && template.fixedElements.length > 0) {
            this.createFixedElements(template.fixedElements);
        }

        // Add text elements if any
        if (template.textElements && template.textElements.length > 0) {
            this.createTextElements(template.textElements);
        }

        this.canvas.renderAll();
    }

    clearCanvas() {
        this.canvas.clear();
        this.templateElements.clear();
    }

    async loadBackground(background) {
        return new Promise((resolve, reject) => {
            // If background has an image, load it
            if (background.image) {
                console.log('Loading background image:', background.image);

                fabric.Image.fromURL(
                    background.image, 
                    (img) => {
                        if (img && img.width && img.height) {
                            // Successfully loaded image
                            console.log('Background image loaded successfully');

                            img.set({
                                left: 0,
                                top: 0,
                                scaleX: this.currentTemplate.dimensions.width / img.width,
                                scaleY: this.currentTemplate.dimensions.height / img.height,
                                selectable: false,
                                evented: false
                            });

                            this.canvas.setBackgroundImage(img, () => {
                                this.canvas.renderAll();
                                resolve();
                            });
                        } else {
                            // Image failed to load, use fallback color
                            console.warn('Failed to load background image, using fallback color');
                            this.setBackgroundColor(background.color || '#ffffff', resolve);
                        }
                    },
                    {
                        crossOrigin: 'anonymous'
                    },
                    (error) => {
                        // Error callback - use fallback color
                        console.error('Error loading background image:', error);
                        this.setBackgroundColor(background.color || '#ffffff', resolve);
                    }
                );
            } 
            // If only color is provided
            else if (background.color) {
                this.setBackgroundColor(background.color, resolve);
            } 
            // No background specified
            else {
                this.setBackgroundColor('#ffffff', resolve);
            }
        });
    }

    setBackgroundColor(color, callback) {
        this.canvas.setBackgroundColor(color, () => {
            this.canvas.renderAll();
            if (callback) callback();
        });
    }

    createTextElements(textElements) {
        textElements.forEach(element => {
            const text = new fabric.Textbox(element.defaultText, {
                left: element.position.x,
                top: element.position.y,
                width: element.size.width,
                fontSize: element.style.fontSize,
                fontWeight: element.style.fontWeight,
                fill: element.style.color,
                textAlign: element.style.textAlign,
                fontFamily: element.style.fontFamily,
                selectable: true,
                hasControls: true,
                hasBorders: true,
                cornerColor: '#667eea',
                cornerSize: 12,
                transparentCorners: false
            });

            text.templateId = element.id;
            text.templateType = element.type;
            this.canvas.add(text);
            this.templateElements.set(element.id, text);
        });
    }

    createFixedElements(fixedElements) {
        fixedElements.forEach(element => {
            if (element.type === 'rect') {
                const rect = new fabric.Rect({
                    left: element.position.x,
                    top: element.position.y,
                    width: element.size.width,
                    height: element.size.height,
                    fill: element.style.fill,
                    rx: element.style.rx || 0,
                    ry: element.style.ry || 0,
                    selectable: element.style.selectable !== undefined ? element.style.selectable : false,
                    evented: element.style.evented !== undefined ? element.style.evented : false,
                    opacity: element.style.opacity || 1
                });

                this.canvas.add(rect);
                this.templateElements.set(`fixed-${element.type}-${Date.now()}`, rect);
            }
        })
    }
}

// Template Selector Component
class TemplateSelector {
    constructor(templateManager) {
        this.templateManager = templateManager;
        this.selectedTemplate = null;
        this.init();
    }

    async init() {
        await this.loadTemplateGrid();
        this.attachEventListeners();
    }

    async loadTemplateGrid() {
        const grid = document.getElementById('template-selector');

        if (!grid) {
            console.error('Template selector element not found');
            return;
        }

        grid.innerHTML = '<div class="loading-templates">Loading templates...</div>';

        try {
            const templates = await this.templateManager.loadTemplatesData();
            this.renderTemplateGrid(templates);
        } catch (error) {
            console.error('Failed to load templates:', error);
            grid.innerHTML = '<div class="loading-templates">Failed to load templates</div>';
        }
    }

    renderTemplateGrid(templates) {
        const grid = document.getElementById('template-selector');
        grid.innerHTML = '';

        templates.forEach(template => {
            const templateCard = document.createElement('div');
            templateCard.className = 'template-card';
            templateCard.dataset.templateId = template.id;

            // Use thumbnail if available, otherwise generate placeholder
            const thumbnailSrc = template.thumbnail 
                ? template.thumbnail 
                : this.getPlaceholderThumbnail(template);

            templateCard.innerHTML = `
                <img src="${thumbnailSrc}" 
                     alt="${template.name}"
                     onerror="this.src='${this.getPlaceholderThumbnail(template)}'">
                <div class="template-name">${template.name}</div>
            `;

            grid.appendChild(templateCard);
        });
    }

    getPlaceholderThumbnail(template) {
        // Create a canvas to generate placeholder thumbnail
        const canvas = document.createElement('canvas');
        canvas.width = 120;
        canvas.height = 160;
        const ctx = canvas.getContext('2d');

        // Use template background color or default gradient
        const color = template.background?.color || '#667eea';
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 120, 160);

        // Add template name text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Split long names into multiple lines
        const name = template.name;
        if (name.length > 12) {
            const words = name.split(' ');
            let line = '';
            let y = 70;

            words.forEach(word => {
                if ((line + word).length > 12) {
                    ctx.fillText(line, 60, y);
                    line = word + ' ';
                    y += 15;
                } else {
                    line += word + ' ';
                }
            });
            ctx.fillText(line, 60, y);
        } else {
            ctx.fillText(name, 60, 80);
        }

        return canvas.toDataURL();
    }

    attachEventListeners() {
        const grid = document.getElementById('template-selector');
        if (!grid) return;

        grid.addEventListener('click', (e) => {
            const templateCard = e.target.closest('.template-card');
            if (templateCard) {
                this.selectTemplate(templateCard);
            }
        });
    }

    selectTemplate(templateCard) {
        // Remove previous selection
        const previousSelected = document.querySelector('.template-card.selected');
        if (previousSelected) {
            previousSelected.classList.remove('selected');
        }

        // Add selection to clicked template
        templateCard.classList.add('selected');

        const templateId = templateCard.dataset.templateId;
        this.selectedTemplate = templateId;

        // Apply the template to canvas
        this.templateManager.applyTemplate(templateId);

        console.log('Applied template:', templateId);
    }

    selectTemplateById(templateId) {
        const templateCard = document.querySelector(`[data-template-id="${templateId}"]`);
        if (templateCard) {
            this.selectTemplate(templateCard);
        }
    }
}