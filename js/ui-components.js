/**
 * UI Components for Medical Diagnostics Platform
 * Modal dialogs, wizards, and interactive components
 */

/**
 * Base Modal Class
 */
class BaseModal {
    constructor(id, options = {}) {
        this.id = id;
        this.options = {
            closable: true,
            backdrop: true,
            keyboard: true,
            ...options
        };
        this.element = null;
        this.isOpen = false;
        this.callbacks = {};
    }

    /**
     * Create modal element
     */
    createElement() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = this.id;
        modal.innerHTML = this.getTemplate();

        // Setup event listeners
        this.setupEventListeners(modal);

        return modal;
    }

    /**
     * Setup modal event listeners
     */
    setupEventListeners(modal) {
        // Close on backdrop click
        if (this.options.backdrop) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.close();
                }
            });
        }

        // Close button
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }

        // Escape key
        if (this.options.keyboard) {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.close();
                }
            });
        }
    }

    /**
     * Open modal
     */
    open(data = null) {
        if (this.isOpen) return;

        if (!this.element) {
            this.element = this.createElement();
            document.body.appendChild(this.element);
        }

        this.isOpen = true;
        this.element.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Initialize with data if provided
        if (data) {
            this.initialize(data);
        }

        this.trigger('open', data);
    }

    /**
     * Close modal
     */
    close() {
        if (!this.isOpen) return;

        this.isOpen = false;
        this.element.style.display = 'none';
        document.body.style.overflow = '';

        this.trigger('close');
    }

    /**
     * Destroy modal
     */
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
        this.isOpen = false;
    }

    /**
     * Event system
     */
    on(event, callback) {
        if (!this.callbacks[event]) {
            this.callbacks[event] = [];
        }
        this.callbacks[event].push(callback);
    }

    trigger(event, data = null) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(callback => callback(data));
        }
    }

    /**
     * Initialize modal with data (override in subclasses)
     */
    initialize(data) {
        // Override in subclasses
    }

    /**
     * Get modal template (override in subclasses)
     */
    getTemplate() {
        return `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">Modal</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <p>Modal content goes here.</p>
                </div>
            </div>
        `;
    }
}

/**
 * Upload Modal for file upload and form submission
 */
class UploadModal extends BaseModal {
    constructor() {
        super('upload-modal');
        this.currentStep = 1;
        this.totalSteps = 3;
        this.formData = {
            file: null,
            apiKey: '',
            note: ''
        };
        this.dragCounter = 0;
    }

    getTemplate() {
        return `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">New Diagnostic Request</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="wizard-steps">
                        <div class="wizard-step" data-step="1">
                            <div class="step-number">1</div>
                            <div class="step-label">Upload Image</div>
                        </div>
                        <div class="step-connector"></div>
                        <div class="wizard-step" data-step="2">
                            <div class="step-number">2</div>
                            <div class="step-label">Configuration</div>
                        </div>
                        <div class="step-connector"></div>
                        <div class="wizard-step" data-step="3">
                            <div class="step-number">3</div>
                            <div class="step-label">Review & Submit</div>
                        </div>
                    </div>
                    
                    <div class="wizard-content">
                        ${this.getStepTemplate(1)}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary btn-prev" style="display: none;">Previous</button>
                    <button class="btn btn-primary btn-next">Next</button>
                    <button class="btn btn-success btn-submit" style="display: none;">Submit Request</button>
                </div>
            </div>
        `;
    }

    setupEventListeners(modal) {
        super.setupEventListeners(modal);

        // Wizard navigation
        modal.querySelector('.btn-next').addEventListener('click', () => this.nextStep());
        modal.querySelector('.btn-prev').addEventListener('click', () => this.prevStep());
        modal.querySelector('.btn-submit').addEventListener('click', () => this.submitForm());

        // File upload events will be set up when step 1 is rendered
        this.setupStepEvents(modal);
    }

    setupStepEvents(modal) {
        if (this.currentStep === 1) {
            this.setupFileUpload(modal);
        } else if (this.currentStep === 2) {
            this.setupConfiguration(modal);
        }
    }

    setupFileUpload(modal) {
        const dropZone = modal.querySelector('.drop-zone');
        const fileInput = modal.querySelector('#file-input');

        if (!dropZone || !fileInput) return;

        // File input change
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileSelect(e.target.files[0]);
            }
        });

        // Drag and drop events
        dropZone.addEventListener('click', () => fileInput.click());

        dropZone.addEventListener('dragenter', (e) => {
            e.preventDefault();
            this.dragCounter++;
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            this.dragCounter--;
            if (this.dragCounter === 0) {
                dropZone.classList.remove('drag-over');
            }
        });

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dragCounter = 0;
            dropZone.classList.remove('drag-over');

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileSelect(files[0]);
            }
        });
    }

    setupConfiguration(modal) {
        const apiKeyInput = modal.querySelector('#api-key');
        const noteInput = modal.querySelector('#note');

        if (apiKeyInput) {
            apiKeyInput.addEventListener('input', (e) => {
                this.formData.apiKey = e.target.value;
                this.validateApiKey();
            });

            // Pre-fill with demo API key
            apiKeyInput.value = 'bWFzdGVyQHNjcnRsYWJzLmNvbTpTZWNyZXROZXR3b3JrTWFzdGVyS2V5X18yMDI1';
            this.formData.apiKey = apiKeyInput.value;
        }

        if (noteInput) {
            noteInput.addEventListener('input', (e) => {
                this.formData.note = e.target.value;
            });
        }
    }

    handleFileSelect(file) {
        // Validate file
        const validation = this.validateFile(file);
        if (!validation.valid) {
            this.showError(validation.error);
            return;
        }

        this.formData.file = file;
        this.displayFilePreview(file);
        this.updateStepValidation();
    }

    validateFile(file) {
        const maxSize = 50 * 1024 * 1024; // 50MB
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/dicom'];

        if (file.size > maxSize) {
            return {
                valid: false,
                error: 'File size must be less than 50MB'
            };
        }

        if (!allowedTypes.includes(file.type)) {
            return {
                valid: false,
                error: 'Only JPEG, PNG, and DICOM files are supported'
            };
        }

        return { valid: true };
    }

    displayFilePreview(file) {
        const previewContainer = this.element.querySelector('.file-preview-container');
        if (!previewContainer) return;

        // Create preview if image
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                previewContainer.innerHTML = `
                    <div class="file-preview">
                        <img class="file-preview-thumbnail" src="${e.target.result}" alt="Preview">
                        <div class="file-preview-info">
                            <div class="file-preview-name">${file.name}</div>
                            <div class="file-preview-size">${this.formatFileSize(file.size)}</div>
                        </div>
                        <button class="file-preview-remove" type="button">&times;</button>
                    </div>
                `;

                // Remove file event
                previewContainer.querySelector('.file-preview-remove').addEventListener('click', () => {
                    this.removeFile();
                });
            };
            reader.readAsDataURL(file);
        } else {
            // Non-image file preview
            previewContainer.innerHTML = `
                <div class="file-preview">
                    <div class="file-preview-thumbnail">📄</div>
                    <div class="file-preview-info">
                        <div class="file-preview-name">${file.name}</div>
                        <div class="file-preview-size">${this.formatFileSize(file.size)}</div>
                    </div>
                    <button class="file-preview-remove" type="button">&times;</button>
                </div>
            `;

            previewContainer.querySelector('.file-preview-remove').addEventListener('click', () => {
                this.removeFile();
            });
        }
    }

    removeFile() {
        this.formData.file = null;
        const previewContainer = this.element.querySelector('.file-preview-container');
        if (previewContainer) {
            previewContainer.innerHTML = '';
        }
        this.updateStepValidation();
    }

    validateApiKey() {
        const validation = MockAPI.validateApiKey(this.formData.apiKey);
        const apiKeyInput = this.element.querySelector('#api-key');
        const errorElement = this.element.querySelector('.api-key-error');

        if (apiKeyInput) {
            apiKeyInput.classList.toggle('error', !validation.valid);
        }

        if (errorElement) {
            errorElement.textContent = validation.valid ? '' : validation.error;
        }

        return validation.valid;
    }

    nextStep() {
        if (!this.validateCurrentStep()) return;

        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.updateWizard();
        }
    }

    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateWizard();
        }
    }

    validateCurrentStep() {
        switch (this.currentStep) {
            case 1:
                if (!this.formData.file) {
                    this.showError('Please select a file to upload');
                    return false;
                }
                break;
            case 2:
                if (!this.formData.apiKey) {
                    this.showError('Please enter your API key');
                    return false;
                }
                if (!this.validateApiKey()) {
                    return false;
                }
                break;
        }
        return true;
    }

    updateWizard() {
        // Update step indicators
        const steps = this.element.querySelectorAll('.wizard-step');
        steps.forEach((step, index) => {
            const stepNumber = index + 1;
            step.classList.toggle('active', stepNumber === this.currentStep);
            step.classList.toggle('completed', stepNumber < this.currentStep);
        });

        // Update content
        const content = this.element.querySelector('.wizard-content');
        content.innerHTML = this.getStepTemplate(this.currentStep);

        // Update buttons
        const prevBtn = this.element.querySelector('.btn-prev');
        const nextBtn = this.element.querySelector('.btn-next');
        const submitBtn = this.element.querySelector('.btn-submit');

        prevBtn.style.display = this.currentStep > 1 ? 'inline-flex' : 'none';
        nextBtn.style.display = this.currentStep < this.totalSteps ? 'inline-flex' : 'none';
        submitBtn.style.display = this.currentStep === this.totalSteps ? 'inline-flex' : 'none';

        // Setup events for new step
        this.setupStepEvents(this.element);
        this.updateStepValidation();
    }

    updateStepValidation() {
        const nextBtn = this.element.querySelector('.btn-next');
        const submitBtn = this.element.querySelector('.btn-submit');

        const isValid = this.isStepValid();

        if (nextBtn) nextBtn.disabled = !isValid;
        if (submitBtn) submitBtn.disabled = !isValid;
    }

    isStepValid() {
        switch (this.currentStep) {
            case 1:
                return this.formData.file !== null;
            case 2:
                return this.formData.apiKey && this.validateApiKey();
            case 3:
                return this.formData.file && this.formData.apiKey;
        }
        return false;
    }

    getStepTemplate(step) {
        switch (step) {
            case 1:
                return `
                    <div class="form-group">
                        <label class="form-label">Select Medical Image</label>
                        <div class="drop-zone">
                            <div class="drop-zone-content">
                                <div class="drop-zone-icon">📋</div>
                                <div class="drop-zone-text">Drag & drop your image here</div>
                                <div class="drop-zone-subtext">or click to browse files</div>
                                <div class="drop-zone-subtext">Supports: JPEG, PNG, DICOM (max 50MB)</div>
                            </div>
                        </div>
                        <input type="file" id="file-input" accept="image/*,.dcm" style="display: none;">
                        <div class="file-preview-container"></div>
                    </div>
                `;
            case 2:
                return `
                    <div class="form-group">
                        <label for="api-key" class="form-label">API Key</label>
                        <input type="text" id="api-key" class="form-control" 
                               placeholder="Enter your API key" 
                               value="${this.formData.apiKey}">
                        <div class="api-key-error text-danger"></div>
                        <small class="form-text text-muted">
                            Your API key is used to authenticate with the analysis service.
                        </small>
                    </div>
                    <div class="form-group">
                        <label for="note" class="form-label">Clinical Notes (Optional)</label>
                        <textarea id="note" class="form-control" rows="4" 
                                  placeholder="Enter any relevant clinical information or notes...">${this.formData.note}</textarea>
                        <small class="form-text text-muted">
                            Additional context to help with the analysis.
                        </small>
                    </div>
                `;
            case 3:
                return `
                    <div class="review-section">
                        <h4>Review Your Request</h4>
                        <div class="review-item">
                            <strong>File:</strong> ${this.formData.file ? this.formData.file.name : 'None'}
                        </div>
                        <div class="review-item">
                            <strong>File Size:</strong> ${this.formData.file ? this.formatFileSize(this.formData.file.size) : 'N/A'}
                        </div>
                        <div class="review-item">
                            <strong>API Key:</strong> ${this.maskApiKey(this.formData.apiKey)}
                        </div>
                        <div class="review-item">
                            <strong>Notes:</strong> ${this.formData.note || 'None provided'}
                        </div>
                        <div class="review-warning">
                            <strong>⚠️ Important:</strong> Processing may take 2-10 minutes depending on image complexity.
                        </div>
                    </div>
                `;
        }
    }

    maskApiKey(apiKey) {
        if (!apiKey) return 'Not provided';
        if (apiKey.length <= 8) return '***';
        return apiKey.substring(0, 4) + '***' + apiKey.substring(apiKey.length - 4);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    submitForm() {
        if (!this.validateCurrentStep()) return;

        // Create request through app
        if (window.app) {
            const request = window.app.createRequest(this.formData);
            this.close();
            this.reset();

            // Show success message
            window.app.showToast('success', 'Request Submitted',
                `Your diagnostic request ${request.id} has been created and is being processed.`);
        }
    }

    reset() {
        this.currentStep = 1;
        this.formData = {
            file: null,
            apiKey: '',
            note: ''
        };
    }

    showError(message) {
        if (window.app) {
            window.app.showToast('error', 'Validation Error', message);
        }
    }

    open() {
        this.reset();
        super.open();
        this.updateWizard();
    }
}

/**
 * Report Modal for viewing diagnostic reports
 */
class ReportModal extends BaseModal {
    constructor() {
        super('report-modal', {
            closable: true,
            backdrop: true,
            keyboard: true
        });
        this.currentRequest = null;
        this.imageZoom = 1;
        this.imagePosition = { x: 0, y: 0 };
        this.isDragging = false;
    }

    getTemplate() {
        return `
            <div class="modal" style="max-width: 95vw; max-height: 95vh; width: 1400px;">
                <div class="modal-header">
                    <h3 class="modal-title">Diagnostic Report</h3>
                    <div class="report-actions">
                        <button class="btn btn-sm btn-secondary" id="print-report">🖨️ Print</button>
                        <button class="btn btn-sm btn-secondary" id="export-report">📄 Export</button>
                        <button class="modal-close">&times;</button>
                    </div>
                </div>
                <div class="modal-body" style="padding: 0; overflow: auto; max-height: calc(95vh - 120px);">
                    <div class="report-container">
                        <div class="image-panel">
                            <div class="image-viewer">
                                <div class="image-viewer-header">
                                    <h4 class="image-title">Medical Image</h4>
                                    <div class="image-controls">
                                        <button class="image-control-btn" id="zoom-out" title="Zoom Out">−</button>
                                        <button class="image-control-btn" id="zoom-reset" title="Reset Zoom">⌂</button>
                                        <button class="image-control-btn" id="zoom-in" title="Zoom In">+</button>
                                        <button class="image-control-btn" id="fullscreen" title="Fullscreen">⛶</button>
                                    </div>
                                </div>
                                <div class="image-display">
                                    <img class="medical-image" alt="Medical Image">
                                    <div class="zoom-indicator">100%</div>
                                </div>
                            </div>
                        </div>
                        <div class="report-panel">
                            <div class="report-header">
                                <h3 class="report-title">Diagnostic Analysis</h3>
                                <div class="report-meta">
                                    <div class="report-meta-item">
                                        <span class="medical-icon report"></span>
                                        <span>Report ID: <span id="report-id"></span></span>
                                    </div>
                                    <div class="report-meta-item">
                                        <span class="medical-icon calendar"></span>
                                        <span>Date: <span id="report-date"></span></span>
                                    </div>
                                    <div class="report-meta-item">
                                        <span class="medical-icon patient"></span>
                                        <span>Status: <span id="report-status"></span></span>
                                    </div>
                                </div>
                            </div>
                            <div class="report-content">
                                <div class="medical-report" id="report-markdown">
                                    <!-- Markdown content will be rendered here -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners(modal) {
        super.setupEventListeners(modal);

        // Image controls
        modal.querySelector('#zoom-in').addEventListener('click', () => this.zoomIn());
        modal.querySelector('#zoom-out').addEventListener('click', () => this.zoomOut());
        modal.querySelector('#zoom-reset').addEventListener('click', () => this.resetZoom());
        modal.querySelector('#fullscreen').addEventListener('click', () => this.toggleFullscreen());

        // Image drag functionality
        const imageDisplay = modal.querySelector('.image-display');
        const medicalImage = modal.querySelector('.medical-image');

        imageDisplay.addEventListener('mousedown', (e) => this.startDrag(e));
        imageDisplay.addEventListener('mousemove', (e) => this.drag(e));
        imageDisplay.addEventListener('mouseup', () => this.endDrag());
        imageDisplay.addEventListener('mouseleave', () => this.endDrag());

        // Mouse wheel zoom
        imageDisplay.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY < 0) {
                this.zoomIn();
            } else {
                this.zoomOut();
            }
        });

        // Action buttons
        modal.querySelector('#print-report').addEventListener('click', () => this.printReport());
        modal.querySelector('#export-report').addEventListener('click', () => this.exportReport());
    }

    initialize(request) {
        this.currentRequest = request;
        this.updateContent();
    }

    updateContent() {
        if (!this.currentRequest) return;

        const modal = this.element;

        // Update header info
        modal.querySelector('#report-id').textContent = this.currentRequest.id;
        modal.querySelector('#report-date').textContent = new Date(this.currentRequest.timestamp).toLocaleDateString();
        modal.querySelector('#report-status').textContent = this.currentRequest.status;

        // Update image
        const medicalImage = modal.querySelector('.medical-image');
        const imageTitle = modal.querySelector('.image-title');

        if (this.currentRequest.imageData) {
            medicalImage.src = this.currentRequest.imageData;
            medicalImage.alt = this.currentRequest.filename;
            imageTitle.textContent = this.currentRequest.filename;
        }

        // Update report content
        const reportContent = modal.querySelector('#report-markdown');
        if (this.currentRequest.report) {
            reportContent.innerHTML = this.renderMarkdown(this.currentRequest.report);
        } else {
            reportContent.innerHTML = this.getReportPlaceholder();
        }
    }

    renderMarkdown(markdown) {
        // Simple markdown renderer for demo purposes
        let html = markdown
            // Headers
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            // Bold
            .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
            // Italic
            .replace(/\*(.*)\*/gim, '<em>$1</em>')
            // Line breaks
            .replace(/\n\n/gim, '</p><p>')
            .replace(/\n/gim, '<br>')
            // Lists
            .replace(/^\- (.*$)/gim, '<li>$1</li>')
            // Code
            .replace(/`([^`]*)`/gim, '<code>$1</code>')
            // Links
            .replace(/\[([^\]]*)\]\(([^)]*)\)/gim, '<a href="$2">$1</a>');

        // Wrap in paragraphs
        html = '<p>' + html + '</p>';

        // Clean up empty paragraphs
        html = html.replace(/<p><\/p>/gim, '');
        html = html.replace(/<p><h/gim, '<h');
        html = html.replace(/h><\/p>/gim, 'h>');

        return html;
    }

    getReportPlaceholder() {
        return `
            <div class="findings-section">
                <div class="findings-title">
                    <span class="severity-indicator severity-medium"></span>
                    Processing in Progress
                </div>
                <p>Your diagnostic analysis is currently being processed. This typically takes 2-10 minutes depending on image complexity.</p>
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text" style="width: 60%;"></div>
            </div>
        `;
    }

    // Image viewer functionality
    zoomIn() {
        this.imageZoom = Math.min(this.imageZoom * 1.2, 5);
        this.updateImageTransform();
    }

    zoomOut() {
        this.imageZoom = Math.max(this.imageZoom / 1.2, 0.1);
        this.updateImageTransform();
    }

    resetZoom() {
        this.imageZoom = 1;
        this.imagePosition = { x: 0, y: 0 };
        this.updateImageTransform();
    }

    updateImageTransform() {
        const image = this.element.querySelector('.medical-image');
        const zoomIndicator = this.element.querySelector('.zoom-indicator');

        if (image) {
            image.style.transform = `translate(${this.imagePosition.x}px, ${this.imagePosition.y}px) scale(${this.imageZoom})`;
            image.classList.toggle('zoomed', this.imageZoom > 1);
        }

        if (zoomIndicator) {
            zoomIndicator.textContent = Math.round(this.imageZoom * 100) + '%';
        }
    }

    startDrag(e) {
        if (this.imageZoom > 1) {
            this.isDragging = true;
            this.lastMousePos = { x: e.clientX, y: e.clientY };
            e.preventDefault();
        }
    }

    drag(e) {
        if (this.isDragging && this.imageZoom > 1) {
            const deltaX = e.clientX - this.lastMousePos.x;
            const deltaY = e.clientY - this.lastMousePos.y;

            this.imagePosition.x += deltaX;
            this.imagePosition.y += deltaY;

            this.lastMousePos = { x: e.clientX, y: e.clientY };
            this.updateImageTransform();
        }
    }

    endDrag() {
        this.isDragging = false;
    }

    toggleFullscreen() {
        const imagePanel = this.element.querySelector('.image-panel');
        imagePanel.classList.toggle('fullscreen');
    }

    printReport() {
        if (this.currentRequest && this.currentRequest.report) {
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Medical Report - ${this.currentRequest.id}</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
                        h1, h2, h3 { color: #0066cc; border-bottom: 1px solid #ccc; padding-bottom: 8px; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .meta { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
                        @media print { body { margin: 20px; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>Medical Diagnostic Report</h1>
                        <p>Report ID: ${this.currentRequest.id}</p>
                        <p>Generated: ${new Date().toLocaleDateString()}</p>
                    </div>
                    <div class="meta">
                        <p><strong>File:</strong> ${this.currentRequest.filename}</p>
                        <p><strong>Date:</strong> ${new Date(this.currentRequest.timestamp).toLocaleDateString()}</p>
                        <p><strong>Status:</strong> ${this.currentRequest.status}</p>
                    </div>
                    <div class="report-content">
                        ${this.renderMarkdown(this.currentRequest.report)}
                    </div>
                </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
        }
    }

    exportReport() {
        if (this.currentRequest && this.currentRequest.report) {
            const blob = new Blob([this.currentRequest.report], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `medical_report_${this.currentRequest.id}.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }
}

/**
 * Toast Notification System
 */
class ToastManager {
    constructor() {
        this.container = this.createContainer();
        this.toasts = [];
    }

    createContainer() {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    show(type, title, message, duration = 5000) {
        const toast = this.createToast(type, title, message);
        this.container.appendChild(toast);
        this.toasts.push(toast);

        // Auto remove
        setTimeout(() => {
            this.remove(toast);
        }, duration);

        return toast;
    }

    createToast(type, title, message) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">&times;</button>
        `;

        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.remove(toast);
        });

        return toast;
    }

    remove(toast) {
        if (toast.parentNode) {
            toast.style.animation = 'toastOut 0.3s ease-out forwards';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
                this.toasts = this.toasts.filter(t => t !== toast);
            }, 300);
        }
    }

    clear() {
        this.toasts.forEach(toast => this.remove(toast));
    }
}

// Export classes for global use
window.UploadModal = UploadModal;
window.ReportModal = ReportModal;
window.ToastManager = ToastManager;