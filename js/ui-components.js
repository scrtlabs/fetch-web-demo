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

    /**
     * Submit form with real API integration
     */
    async submitForm() {
        if (!this.validateCurrentStep()) return;

        try {
            // Create request through app first
            const request = window.app.createRequest(this.formData);

            // Close modal and reset
            this.close();
            this.reset();

            // Show initial submission message
            window.app.showToast('info', 'Request Submitted',
                `Diagnostic request ${request.id} is being processed...`);

            // Start real analysis
            await this.performRealAnalysis(request);

        } catch (error) {
            console.error('❌ Form submission failed:', error);
            window.app.showToast('error', 'Submission Failed', error.message);
        }
    }

    /**
      * Perform real API analysis
      */
    async performRealAnalysis(request) {
        try {
            // Update request status
            request.status = 'processing';
            request.progress = 5;
            request.statusMessage = 'Initializing analysis...';
            window.app.updateRequestCard(request);
            window.app.saveRequestsToStorage();

            console.log(`🔬 Starting real analysis for request ${request.id}`);

            // Initialize API and check availability
            await window.hybridAPI.initializeAPIMode();

            // Update progress
            request.progress = 10;
            request.statusMessage = 'Connecting to analysis service...';
            window.app.updateRequestCard(request);

            // Perform the analysis
            const result = await window.hybridAPI.analyzeBreastDensity(
                this.formData.file,
                request.id,
                this.formData.note
            );

            console.log(`📊 Analysis result for ${request.id}:`, result);

            if (result.success) {
                // Update request with results
                request.status = 'completed';
                request.progress = 100;
                request.statusMessage = 'Analysis complete';

                if (result.type === 'pdf') {
                    // Real API success - PDF generated
                    request.report = this.generateReportFromMetadata(result);
                    request.hasRealPDF = true;
                    request.apiMetadata = result.metadata;

                    window.app.showToast('success', 'Analysis Complete',
                        `Real AI analysis completed for ${request.filename}`);

                } else if (result.type === 'mock') {
                    // Fallback to mock data
                    request.report = result.report;
                    request.hasRealPDF = false;
                    request.mockReason = result.message;

                    window.app.showToast('warning', 'Demo Analysis Complete',
                        result.message);

                } else {
                    // Unexpected result type
                    throw new Error(`Unexpected result type: ${result.type}`);
                }

                // Save updated request
                window.app.updateRequestCard(request);
                window.app.saveRequestsToStorage();

            } else {
                throw new Error(result.error || 'Analysis failed with unknown error');
            }

        } catch (error) {
            console.error(`❌ Analysis failed for request ${request.id}:`, error);

            // Update request status to failed
            request.status = 'failed';
            request.progress = 0;
            request.error = error.message;
            request.statusMessage = 'Analysis failed';

            window.app.updateRequestCard(request);
            window.app.saveRequestsToStorage();

            // Determine error type and show appropriate message
            if (error.message.includes('timed out')) {
                window.app.showToast('error', 'Analysis Timeout',
                    'The analysis took too long to complete. Please try again with a smaller image.');
            } else if (error.message.includes('Network error') || error.message.includes('CORS')) {
                window.app.showToast('error', 'Connection Error',
                    'Unable to connect to the analysis service. Please check your internet connection.');
            } else if (error.message.includes('File size')) {
                window.app.showToast('error', 'File Too Large',
                    'The uploaded file is too large. Please use a file smaller than 50MB.');
            } else {
                window.app.showToast('error', 'Analysis Failed',
                    `Analysis failed: ${error.message}`);
            }
        }
    }

    /**
     * Generate markdown report from API metadata when real PDF is available
     */
    generateReportFromMetadata(result) {
        const metadata = result.metadata || {};
        const timestamp = new Date().toLocaleString();

        return `# Breast Density Analysis Report

## Report Summary
This analysis was completed using our advanced AI diagnostic system. The full detailed report is available as a PDF document.

## Request Information
- **Report ID:** ${result.requestId}
- **Original Filename:** ${metadata.originalFilename || 'Unknown'}
- **Analysis Date:** ${timestamp}
- **Model Used:** ${metadata.modelName || 'Breast Density Classification'}
- **Report Size:** ${metadata.size ? this.formatBytes(metadata.size) : 'Unknown'}

## Analysis Status
✅ **Analysis Completed Successfully**

The AI system has processed your medical image and generated a comprehensive diagnostic report. The detailed findings, measurements, and clinical recommendations are available in the PDF report.

## Key Features of AI Analysis
- Advanced deep learning model trained on medical imaging data
- Breast density classification according to BI-RADS standards  
- Quantitative measurements and statistical analysis
- Clinical recommendations based on findings
- Quality metrics and confidence scores

## Accessing Your Report
Click the "Download PDF Report" button in the report viewer to access the complete diagnostic analysis.

## Technical Details
- **Processing Method:** AI-Assisted Medical Image Analysis
- **Generation Time:** ${metadata.generationTime || timestamp}
- **Quality Status:** Analysis completed successfully
- **Validation:** Automated quality checks passed

---

**Note:** This analysis was performed by an AI system and should be reviewed by a qualified medical professional. The complete diagnostic details are available in the PDF report.

*Report generated on ${timestamp}*`;
    }

    /**
     * Format bytes for display
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
        this.currentPDFUrl = null;
    }

    getTemplate() {
        return `
            <div class="modal" style="max-width: 95vw; max-height: 95vh; width: 1400px;">
                <div class="modal-header">
                    <h3 class="modal-title">Diagnostic Report</h3>
                    <div class="report-actions">
                        <button class="btn btn-sm btn-secondary" id="print-report">🖨️ Print</button>
                        <button class="btn btn-sm btn-secondary" id="export-report">📄 Export</button>
                        <button class="btn btn-sm btn-primary" id="download-pdf-report" style="display: none;">📥 Download PDF</button>
                        <button class="modal-close">&times;</button>
                    </div>
                </div>
                <div class="modal-body" style="padding: 0; overflow: auto; max-height: calc(95vh - 120px);">
                    <div class="report-container">
                        <!-- PDF Viewer Section -->
                        <div id="pdf-viewer-section" style="display: none;">
                            <div class="pdf-viewer-header" style="padding: 1rem; background: #f8f9fa; border-bottom: 1px solid #ddd;">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <div>
                                        <h4 style="margin: 0; color: #2c5aa0;">📄 AI Medical Analysis Report</h4>
                                        <p style="margin: 0.25rem 0 0 0; font-size: 0.875rem; color: #666;">
                                            Real-time AI analysis • Generated from actual API response
                                        </p>
                                    </div>
                                    <div class="pdf-actions">
                                        <button class="btn btn-sm btn-secondary" onclick="window.app.downloadPDFReport('${this.currentRequest?.id}')">
                                            📥 Download
                                        </button>
                                        <button class="btn btn-sm btn-secondary" onclick="this.openPDFInNewWindow()">
                                            🔗 Open in New Tab
                                        </button>
                                        <button class="btn btn-sm btn-secondary" onclick="this.switchToSummaryView()">
                                            📋 Summary View
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div class="pdf-container" style="height: 70vh; overflow: hidden;">
                                <iframe id="pdf-iframe" 
                                        src="" 
                                        width="100%" 
                                        height="100%"
                                        style="border: none;">
                                    <div style="padding: 2rem; text-align: center;">
                                        <p>Your browser does not support PDF viewing.</p>
                                        <button class="btn btn-primary" onclick="window.app.downloadPDFReport('${this.currentRequest?.id}')">
                                            📥 Download PDF Instead
                                        </button>
                                    </div>
                                </iframe>
                            </div>
                        </div>

                        <!-- Summary/Markdown Section -->
                        <div id="summary-viewer-section">
                            <div class="image-panel" style="width: 300px; flex-shrink: 0; border-right: 1px solid #eee;">
                                <div class="image-viewer">
                                    <div class="image-viewer-header">
                                        <h4>Medical Image</h4>
                                        <div class="image-controls">
                                            <button class="btn btn-sm btn-secondary" id="zoom-in">🔍+</button>
                                            <button class="btn btn-sm btn-secondary" id="zoom-out">🔍-</button>
                                            <button class="btn btn-sm btn-secondary" id="reset-zoom">⟲</button>
                                        </div>
                                    </div>
                                    <div class="image-container">
                                        <img class="medical-image" src="" alt="Medical Image" id="medical-image">
                                        <div class="image-overlay">
                                            <div class="image-title" id="image-title">Loading...</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="report-panel" style="flex: 1; padding: 0;">
                                <div class="report-header" style="padding: 1rem; background: #f8f9fa; border-bottom: 1px solid #ddd;">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <div>
                                            <h4 style="margin: 0;">Report Summary</h4>
                                            <p style="margin: 0.25rem 0 0 0; font-size: 0.875rem; color: #666;" id="report-meta">
                                                Report ID: <span id="report-id">Loading...</span> • 
                                                Date: <span id="report-date">Loading...</span>
                                            </p>
                                        </div>
                                        <div id="pdf-available-indicator" style="display: none;">
                                            <button class="btn btn-sm btn-primary" onclick="this.switchToPDFView()">
                                                📄 View Full PDF Report
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div class="report-content" style="padding: 1rem; height: calc(70vh - 100px); overflow-y: auto;">
                                    <!-- Processing State -->
                                    <div id="processing-state" style="display: none;">
                                        <div style="text-align: center; padding: 2rem;">
                                            <div class="loading-spinner" style="margin: 0 auto 1rem;"></div>
                                            <h4>Processing Analysis...</h4>
                                            <p id="processing-message">Please wait while we analyze your medical image.</p>
                                            <div class="progress-bar" style="margin-top: 1rem;">
                                                <div class="progress-fill" id="progress-fill" style="width: 0%;"></div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Completed Report -->
                                    <div id="completed-report" style="display: none;">
                                        <div id="medical-report-content">
                                            <!-- Report content will be inserted here -->
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Initialize modal with request data
     */
    initialize(request) {
        this.currentRequest = request;
        console.log('📋 Initializing ReportModal with request:', request.id);

        this.updateContent();
        this.setupEventListeners();

        // Check if PDF is available and display accordingly
        if (request.hasRealPDF && window.app && window.app.getPDFBlob) {
            console.log('📄 PDF available - setting up PDF viewer');
            this.setupPDFViewer();
        } else {
            console.log('📋 No PDF available - showing summary view');
            this.showSummaryView();
        }
    }

    /**
     * Setup PDF viewer
     */
    async setupPDFViewer() {
        try {
            const pdfBlob = window.app.getPDFBlob(this.currentRequest.id);

            if (pdfBlob) {
                console.log('📄 Setting up PDF viewer with blob:', pdfBlob.size, 'bytes');

                // Create object URL for the PDF
                this.currentPDFUrl = URL.createObjectURL(pdfBlob);

                // Show PDF viewer section
                this.showPDFView();

                // Load PDF in iframe
                const iframe = this.element.querySelector('#pdf-iframe');
                if (iframe) {
                    iframe.src = this.currentPDFUrl;
                }

                // Show PDF download button
                const downloadBtn = this.element.querySelector('#download-pdf-report');
                if (downloadBtn) {
                    downloadBtn.style.display = 'inline-block';
                    downloadBtn.onclick = () => window.app.downloadPDFReport(this.currentRequest.id);
                }

                // Show PDF available indicator in summary view
                const indicator = this.element.querySelector('#pdf-available-indicator');
                if (indicator) {
                    indicator.style.display = 'block';
                }

            } else {
                console.warn('⚠️ PDF blob not found, falling back to summary view');
                this.showSummaryView();
            }

        } catch (error) {
            console.error('❌ Error setting up PDF viewer:', error);
            this.showSummaryView();
        }
    }

    /**
     * Show PDF view
     */
    showPDFView() {
        const pdfSection = this.element.querySelector('#pdf-viewer-section');
        const summarySection = this.element.querySelector('#summary-viewer-section');

        if (pdfSection && summarySection) {
            pdfSection.style.display = 'block';
            summarySection.style.display = 'none';
        }
    }

    /**
     * Show summary view
     */
    showSummaryView() {
        const pdfSection = this.element.querySelector('#pdf-viewer-section');
        const summarySection = this.element.querySelector('#summary-viewer-section');

        if (pdfSection && summarySection) {
            pdfSection.style.display = 'none';
            summarySection.style.display = 'flex';
        }
    }

    /**
     * Switch to PDF view (button handler)
     */
    switchToPDFView() {
        if (this.currentRequest.hasRealPDF) {
            this.showPDFView();
        }
    }

    /**
     * Switch to summary view (button handler)
     */
    switchToSummaryView() {
        this.showSummaryView();
    }

    /**
     * Open PDF in new window
     */
    openPDFInNewWindow() {
        if (this.currentPDFUrl) {
            window.open(this.currentPDFUrl, '_blank', 'width=1024,height=768,scrollbars=yes,resizable=yes');
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const modal = this.element;

        // Print button
        const printBtn = modal.querySelector('#print-report');
        if (printBtn) {
            printBtn.onclick = () => this.printReport();
        }

        // Export button
        const exportBtn = modal.querySelector('#export-report');
        if (exportBtn) {
            exportBtn.onclick = () => this.exportReport();
        }

        // Image zoom controls
        const zoomInBtn = modal.querySelector('#zoom-in');
        const zoomOutBtn = modal.querySelector('#zoom-out');
        const resetZoomBtn = modal.querySelector('#reset-zoom');

        if (zoomInBtn) zoomInBtn.onclick = () => this.zoomImage(1.2);
        if (zoomOutBtn) zoomOutBtn.onclick = () => this.zoomImage(0.8);
        if (resetZoomBtn) resetZoomBtn.onclick = () => this.resetImageZoom();
    }

    /**
     * Update modal content
     */
    updateContent() {
        if (!this.currentRequest) return;

        const modal = this.element;

        // Update header info
        const reportId = modal.querySelector('#report-id');
        const reportDate = modal.querySelector('#report-date');

        if (reportId) reportId.textContent = this.currentRequest.id;
        if (reportDate) reportDate.textContent = new Date(this.currentRequest.timestamp).toLocaleDateString();

        // Update image
        const medicalImage = modal.querySelector('#medical-image');
        const imageTitle = modal.querySelector('#image-title');

        if (this.currentRequest.imageData && medicalImage && imageTitle) {
            medicalImage.src = this.currentRequest.imageData;
            medicalImage.alt = this.currentRequest.filename;
            imageTitle.textContent = this.currentRequest.filename;
        }

        // Display report content
        this.displayReportContent();
    }

    /**
     * Display appropriate report content
     */
    displayReportContent() {
        const processingState = this.element.querySelector('#processing-state');
        const completedReport = this.element.querySelector('#completed-report');
        const reportContent = this.element.querySelector('#medical-report-content');

        if (this.currentRequest.status === 'completed' && this.currentRequest.report) {
            // Show completed report
            if (processingState) processingState.style.display = 'none';
            if (completedReport) completedReport.style.display = 'block';

            // Add status indicator for real vs demo
            const statusBanner = this.currentRequest.hasRealPDF ?
                `<div class="status-banner real-analysis" style="background: #e8f5e8; border: 1px solid #4caf50; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="font-size: 1.5rem;">✅</span>
                        <div>
                            <strong style="color: #2e7d32;">Real AI Analysis Complete</strong>
                            <div style="font-size: 0.875rem; color: #666; margin-top: 0.25rem;">
                                Analysis performed by our AI system • PDF report available for download
                            </div>
                        </div>
                    </div>
                </div>` :
                `<div class="status-banner demo-analysis" style="background: #fff3e0; border: 1px solid #ff9800; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="font-size: 1.5rem;">🎭</span>
                        <div>
                            <strong style="color: #f57c00;">Demo Mode Analysis</strong>
                            <div style="font-size: 0.875rem; color: #666; margin-top: 0.25rem;">
                                ${this.currentRequest.mockReason || 'Using simulated analysis data for demonstration'}
                            </div>
                        </div>
                    </div>
                </div>`;

            const renderedMarkdown = this.renderMarkdown(this.currentRequest.report);

            if (reportContent) {
                reportContent.innerHTML = statusBanner + renderedMarkdown;
            }

        } else {
            // Show processing state
            if (processingState) processingState.style.display = 'block';
            if (completedReport) completedReport.style.display = 'none';
            this.updateProcessingState();
        }
    }

    /**
     * Clean up when closing modal
     */
    close() {
        // Cleanup PDF URL to prevent memory leaks
        if (this.currentPDFUrl) {
            URL.revokeObjectURL(this.currentPDFUrl);
            this.currentPDFUrl = null;
        }

        super.close();
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

    /**
     * Download PDF report from assets
     */
    downloadPDFReport() {
        try {
            // Create a link to download the static PDF file
            const link = document.createElement('a');
            link.href = 'assets/report.pdf';
            link.download = `medical_report_${this.currentRequest ? this.currentRequest.id : 'sample'}.pdf`;
            link.style.display = 'none';

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Show success toast if available
            if (window.app && typeof window.app.showToast === 'function') {
                window.app.showToast('success', 'Download Started', 'PDF report download has been initiated.');
            }
        } catch (error) {
            console.error('❌ Error downloading PDF:', error);

            // Show error toast if available
            if (window.app && typeof window.app.showToast === 'function') {
                window.app.showToast('error', 'Download Failed', 'Failed to download PDF report. Please try again.');
            }
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

/**
 * Confirmation Modal for critical actions
 */
class ConfirmationModal extends BaseModal {
    constructor() {
        super('confirmation-modal');
        this.confirmCallback = null;
        this.cancelCallback = null;
    }

    getTemplate() {
        return `
            <div class="modal" style="max-width: 500px;">
                <div class="modal-header">
                    <h3 class="modal-title" id="confirm-title">Confirm Action</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="confirm-content">
                        <div class="confirm-icon" id="confirm-icon">⚠️</div>
                        <div class="confirm-message" id="confirm-message">
                            Are you sure you want to perform this action?
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="confirm-cancel">Cancel</button>
                    <button class="btn btn-danger" id="confirm-ok">Confirm</button>
                </div>
            </div>
        `;
    }

    setupEventListeners(modal) {
        super.setupEventListeners(modal);

        modal.querySelector('#confirm-cancel').addEventListener('click', () => {
            this.close();
            if (this.cancelCallback) {
                this.cancelCallback();
            }
        });

        modal.querySelector('#confirm-ok').addEventListener('click', () => {
            this.close();
            if (this.confirmCallback) {
                this.confirmCallback();
            }
        });
    }

    show(options = {}) {
        const {
            title = 'Confirm Action',
            message = 'Are you sure you want to perform this action?',
            icon = '⚠️',
            confirmText = 'Confirm',
            cancelText = 'Cancel',
            confirmClass = 'btn-danger',
            onConfirm = null,
            onCancel = null
        } = options;

        this.confirmCallback = onConfirm;
        this.cancelCallback = onCancel;

        this.open();

        // Update content
        const modal = this.element;
        modal.querySelector('#confirm-title').textContent = title;
        modal.querySelector('#confirm-message').textContent = message;
        modal.querySelector('#confirm-icon').textContent = icon;
        modal.querySelector('#confirm-ok').textContent = confirmText;
        modal.querySelector('#confirm-cancel').textContent = cancelText;

        // Update button style
        const confirmBtn = modal.querySelector('#confirm-ok');
        confirmBtn.className = `btn ${confirmClass}`;
    }
}

/**
 * Loading Modal for long-running operations
 */
class LoadingModal extends BaseModal {
    constructor() {
        super('loading-modal', {
            closable: false,
            backdrop: false,
            keyboard: false
        });
        this.progress = 0;
    }

    getTemplate() {
        return `
            <div class="modal" style="max-width: 400px;">
                <div class="modal-body" style="text-align: center; padding: var(--spacing-xxl);">
                    <div class="loading-content">
                        <div class="loading-spinner" style="margin: 0 auto var(--spacing-lg);"></div>
                        <h3 id="loading-title">Processing...</h3>
                        <p id="loading-message">Please wait while we process your request.</p>
                        <div class="progress-bar" id="loading-progress-bar" style="display: none;">
                            <div class="progress-fill" id="loading-progress-fill" style="width: 0%;"></div>
                        </div>
                        <div id="loading-percentage" style="margin-top: var(--spacing-md); display: none;">0%</div>
                    </div>
                </div>
            </div>
        `;
    }

    show(options = {}) {
        const {
            title = 'Processing...',
            message = 'Please wait while we process your request.',
            showProgress = false
        } = options;

        this.open();

        const modal = this.element;
        modal.querySelector('#loading-title').textContent = title;
        modal.querySelector('#loading-message').textContent = message;

        const progressBar = modal.querySelector('#loading-progress-bar');
        const percentage = modal.querySelector('#loading-percentage');

        if (showProgress) {
            progressBar.style.display = 'block';
            percentage.style.display = 'block';
        } else {
            progressBar.style.display = 'none';
            percentage.style.display = 'none';
        }

        this.progress = 0;
        this.updateProgress(0);
    }

    updateProgress(progress) {
        this.progress = Math.max(0, Math.min(100, progress));

        const modal = this.element;
        const progressFill = modal.querySelector('#loading-progress-fill');
        const percentage = modal.querySelector('#loading-percentage');

        if (progressFill) {
            progressFill.style.width = `${this.progress}%`;
        }

        if (percentage) {
            percentage.textContent = `${Math.round(this.progress)}%`;
        }
    }

    updateMessage(message) {
        const modal = this.element;
        const messageElement = modal.querySelector('#loading-message');
        if (messageElement) {
            messageElement.textContent = message;
        }
    }
}

/**
 * Image Preview Modal for viewing medical images
 */
class ImagePreviewModal extends BaseModal {
    constructor() {
        super('image-preview-modal');
        this.imageZoom = 1;
        this.imagePosition = { x: 0, y: 0 };
        this.isDragging = false;
        this.currentImage = null;
    }

    getTemplate() {
        return `
            <div class="modal" style="max-width: 90vw; max-height: 90vh; width: 1000px;">
                <div class="modal-header">
                    <h3 class="modal-title" id="image-preview-title">Image Preview</h3>
                    <div class="image-preview-controls">
                        <button class="btn btn-sm btn-secondary" id="zoom-out-preview">−</button>
                        <button class="btn btn-sm btn-secondary" id="zoom-reset-preview">⌂</button>
                        <button class="btn btn-sm btn-secondary" id="zoom-in-preview">+</button>
                        <button class="btn btn-sm btn-secondary" id="download-image-preview">⬇</button>
                        <button class="modal-close">&times;</button>
                    </div>
                </div>
                <div class="modal-body" style="padding: 0; background: #000;">
                    <div class="image-preview-container" style="position: relative; min-height: 400px; display: flex; align-items: center; justify-content: center;">
                        <img id="preview-image" class="preview-image" alt="Medical Image Preview" style="max-width: 100%; max-height: 70vh; object-fit: contain; transition: transform 0.3s ease;">
                        <div class="zoom-indicator-preview" style="position: absolute; bottom: 20px; left: 20px; background: rgba(0,0,0,0.7); color: white; padding: 8px 12px; border-radius: 4px; font-family: monospace;">100%</div>
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners(modal) {
        super.setupEventListeners(modal);

        // Zoom controls
        modal.querySelector('#zoom-in-preview').addEventListener('click', () => this.zoomIn());
        modal.querySelector('#zoom-out-preview').addEventListener('click', () => this.zoomOut());
        modal.querySelector('#zoom-reset-preview').addEventListener('click', () => this.resetZoom());
        modal.querySelector('#download-image-preview').addEventListener('click', () => this.downloadImage());

        // Image interaction
        const container = modal.querySelector('.image-preview-container');
        container.addEventListener('mousedown', (e) => this.startDrag(e));
        container.addEventListener('mousemove', (e) => this.drag(e));
        container.addEventListener('mouseup', () => this.endDrag());
        container.addEventListener('mouseleave', () => this.endDrag());

        // Mouse wheel zoom
        container.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY < 0) {
                this.zoomIn();
            } else {
                this.zoomOut();
            }
        });
    }

    show(imageData, title = 'Medical Image') {
        this.currentImage = imageData;
        this.open();

        const modal = this.element;
        modal.querySelector('#image-preview-title').textContent = title;
        modal.querySelector('#preview-image').src = imageData;

        this.resetZoom();
    }

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
        const image = this.element.querySelector('#preview-image');
        const zoomIndicator = this.element.querySelector('.zoom-indicator-preview');

        if (image) {
            image.style.transform = `translate(${this.imagePosition.x}px, ${this.imagePosition.y}px) scale(${this.imageZoom})`;
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

    downloadImage() {
        if (this.currentImage) {
            const link = document.createElement('a');
            link.href = this.currentImage;
            link.download = 'medical_image.jpg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}

/**
 * Settings Modal for application configuration
 */
class SettingsModal extends BaseModal {
    constructor() {
        super('settings-modal');
        this.settings = {
            theme: 'light',
            notifications: true,
            autoRefresh: true,
            defaultView: 'grid',
            itemsPerPage: 20
        };
    }

    getTemplate() {
        return `
            <div class="modal" style="max-width: 600px;">
                <div class="modal-header">
                    <h3 class="modal-title">Settings</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="settings-content">
                        <div class="settings-section">
                            <h4>Appearance</h4>
                            <div class="form-group">
                                <label class="form-label">Theme</label>
                                <select id="theme-select" class="form-control">
                                    <option value="light">Light</option>
                                    <option value="dark">Dark</option>
                                    <option value="auto">Auto</option>
                                </select>
                            </div>
                        </div>

                        <div class="settings-section">
                            <h4>Notifications</h4>
                            <div class="form-group">
                                <label class="form-check">
                                    <input type="checkbox" id="notifications-check" class="form-check-input">
                                    <span class="form-check-label">Enable notifications</span>
                                </label>
                            </div>
                        </div>

                        <div class="settings-section">
                            <h4>Dashboard</h4>
                            <div class="form-group">
                                <label class="form-check">
                                    <input type="checkbox" id="auto-refresh-check" class="form-check-input">
                                    <span class="form-check-label">Auto-refresh data</span>
                                </label>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Default view</label>
                                <select id="default-view-select" class="form-control">
                                    <option value="grid">Grid</option>
                                    <option value="list">List</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Items per page</label>
                                <select id="items-per-page-select" class="form-control">
                                    <option value="10">10</option>
                                    <option value="20">20</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="settings-cancel">Cancel</button>
                    <button class="btn btn-primary" id="settings-save">Save Settings</button>
                </div>
            </div>
        `;
    }

    setupEventListeners(modal) {
        super.setupEventListeners(modal);

        modal.querySelector('#settings-save').addEventListener('click', () => this.saveSettings());
        modal.querySelector('#settings-cancel').addEventListener('click', () => this.close());
    }

    open() {
        super.open();
        this.loadSettings();
        this.updateForm();
    }

    loadSettings() {
        if (window.storage) {
            this.settings = window.storage.loadSettings();
        }
    }

    updateForm() {
        const modal = this.element;
        modal.querySelector('#theme-select').value = this.settings.theme;
        modal.querySelector('#notifications-check').checked = this.settings.notifications;
        modal.querySelector('#auto-refresh-check').checked = this.settings.autoRefresh;
        modal.querySelector('#default-view-select').value = this.settings.defaultView;
        modal.querySelector('#items-per-page-select').value = this.settings.itemsPerPage;
    }

    saveSettings() {
        const modal = this.element;

        this.settings = {
            theme: modal.querySelector('#theme-select').value,
            notifications: modal.querySelector('#notifications-check').checked,
            autoRefresh: modal.querySelector('#auto-refresh-check').checked,
            defaultView: modal.querySelector('#default-view-select').value,
            itemsPerPage: parseInt(modal.querySelector('#items-per-page-select').value)
        };

        if (window.storage) {
            window.storage.saveSettings(this.settings);
        }

        if (window.app && typeof window.app.showToast === 'function') {
            window.app.showToast('success', 'Settings Saved', 'Your preferences have been updated.');
        }

        this.close();
    }
}


/**
 * Fix for UI Components - File Handling
 * Add this to your ui-components.js or replace the relevant methods
 */

// Fix for UploadModal.submitForm method
UploadModal.prototype.submitForm = function () {
    console.log('🚀 Submitting form...');

    // Validate current step
    if (!this.validateCurrentStep()) {
        console.error('❌ Form validation failed');
        return;
    }

    // Debug: Log form data state
    console.log('📋 Form data state:', {
        hasFile: !!this.formData.file,
        fileName: this.formData.file?.name,
        fileSize: this.formData.file?.size,
        fileType: this.formData.file?.type,
        apiKey: this.formData.apiKey ? 'Present' : 'Missing',
        note: this.formData.note
    });

    // Ensure we have a file
    if (!this.formData.file) {
        console.error('❌ No file selected');
        this.showError('Please select a file to upload');
        return;
    }

    // Validate file is actually a File object
    if (!(this.formData.file instanceof File)) {
        console.error('❌ Invalid file object:', typeof this.formData.file, this.formData.file);
        this.showError('Invalid file selected. Please try selecting the file again.');
        return;
    }

    // Create request through app
    if (window.app) {
        try {
            console.log('📤 Creating request through app...');
            const request = window.app.createRequest(this.formData);
            this.close();
            this.reset();

            // Show success message
            window.app.showToast('success', 'Request Submitted',
                `Your diagnostic request ${request.id} has been created and is being processed.`);
        } catch (error) {
            console.error('❌ Failed to create request:', error);
            this.showError('Failed to create request: ' + error.message);
        }
    } else {
        console.error('❌ App instance not available');
        this.showError('Application error. Please refresh the page and try again.');
    }
};

// Fix for file handling in UploadModal
UploadModal.prototype.handleFileSelect = function (file) {
    console.log('📁 File selected:', {
        name: file?.name,
        size: file?.size,
        type: file?.type,
        instanceof: file instanceof File
    });

    // Validate file
    const validation = this.validateFile(file);
    if (!validation.valid) {
        console.error('❌ File validation failed:', validation.error);
        this.showError(validation.error);
        return;
    }

    // Store the file (make sure it's the actual File object)
    this.formData.file = file;
    console.log('✅ File stored in formData:', {
        hasFile: !!this.formData.file,
        isFileInstance: this.formData.file instanceof File
    });

    // Display file preview
    this.displayFilePreview(file);
    this.updateStepValidation();
};

// Enhanced file validation
UploadModal.prototype.validateFile = function (file) {
    if (!file) {
        return {
            valid: false,
            error: 'No file provided'
        };
    }

    if (!(file instanceof File)) {
        return {
            valid: false,
            error: 'Invalid file object'
        };
    }

    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/dicom'];

    if (file.size > maxSize) {
        return {
            valid: false,
            error: 'File size must be less than 50MB'
        };
    }

    if (file.size === 0) {
        return {
            valid: false,
            error: 'File appears to be empty'
        };
    }

    if (!allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: 'Only JPEG, PNG, and DICOM files are supported'
        };
    }

    return { valid: true };
};

// Add method to perform real analysis with proper error handling
UploadModal.prototype.performRealAnalysis = async function (request, file) {
    try {
        console.log('🔬 Starting real analysis for request', request.id);

        // Validate inputs
        if (!request || !request.id) {
            throw new Error('Invalid request object');
        }

        if (!file || !(file instanceof File)) {
            throw new Error('Invalid file for analysis');
        }

        console.log('📋 Analysis inputs:', {
            requestId: request.id,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type
        });

        // Use hybrid API for analysis
        if (!window.hybridAPI) {
            throw new Error('Hybrid API not available');
        }

        const result = await window.hybridAPI.analyzeBreastDensity(file, request.id, request.note);

        console.log('✅ Analysis result:', result);
        return result;

    } catch (error) {
        console.error('❌ Analysis failed for request', request?.id, ':', error);
        throw error;
    }
};

// Fix for MedicalApp.createRequest method
if (window.MedicalApp) {
    MedicalApp.prototype.createRequest = function (formData) {
        console.log('🏗️ Creating request with form data:', {
            hasFile: !!formData.file,
            fileName: formData.file?.name,
            fileSize: formData.file?.size,
            fileType: formData.file?.type,
            apiKey: formData.apiKey ? 'Present' : 'Missing',
            note: formData.note
        });

        // Validate form data
        if (!formData.file || !(formData.file instanceof File)) {
            throw new Error('Valid file is required for analysis');
        }

        const request = {
            id: this.generateRequestId(),
            timestamp: new Date().toISOString(),
            status: 'pending',
            filename: formData.file.name,
            fileSize: formData.file.size,
            fileType: formData.file.type,
            imageData: null, // Will be set after file processing
            apiKey: formData.apiKey,
            note: formData.note,
            progress: 0,
            report: null,
            error: null
        };

        // Process the file for preview
        this.processFile(request, formData.file);

        // Add to requests
        this.requests.unshift(request);
        this.saveRequestsToStorage();

        // Update UI
        this.renderRequests();
        this.updateFilterTabs();

        // Start analysis with the actual file object
        this.startAnalysis(request, formData.file);

        return request;
    };

    // Enhanced startAnalysis method
    MedicalApp.prototype.startAnalysis = async function (request, file) {
        try {
            console.log('🔬 Starting analysis for request:', request.id);
            console.log('📁 File for analysis:', {
                name: file?.name,
                size: file?.size,
                type: file?.type,
                instanceof: file instanceof File
            });

            // Validate inputs
            if (!file || !(file instanceof File)) {
                throw new Error('Invalid file object for analysis');
            }

            request.status = 'processing';
            this.updateRequestCard(request);

            // Use hybrid API for analysis
            const result = await window.hybridAPI.analyzeBreastDensity(file, request.id, request.note);

            if (result.success) {
                request.status = 'completed';
                request.progress = 100;

                if (result.type === 'pdf') {
                    request.pdfAvailable = true;
                    request.report = 'PDF report generated successfully';
                } else if (result.type === 'mock') {
                    request.report = result.report;
                } else {
                    request.report = result.report || 'Analysis completed';
                }

                this.showToast('success', 'Analysis Complete', `Analysis for ${request.filename} completed successfully.`);
            } else {
                request.status = 'failed';
                request.error = result.error || 'Analysis failed';
                this.showToast('error', 'Analysis Failed', `Analysis for ${request.filename} failed: ${result.error}`);
            }

        } catch (error) {
            console.error('❌ Analysis error:', error);
            request.status = 'failed';
            request.error = error.message;
            this.showToast('error', 'Analysis Error', `Analysis failed: ${error.message}`);
        }

        this.saveRequestsToStorage();
        this.renderRequests();
        this.updateFilterTabs();
    };
}

// Debugging helper function
window.debugFileUpload = function () {
    const uploadModal = document.querySelector('.modal-overlay');
    if (uploadModal) {
        const formData = window.uploadModalInstance?.formData;
        console.log('🔍 Debug Upload Modal State:', {
            modalVisible: uploadModal.style.display !== 'none',
            formData: formData,
            hasFile: !!formData?.file,
            fileDetails: formData?.file ? {
                name: formData.file.name,
                size: formData.file.size,
                type: formData.file.type,
                instanceof: formData.file instanceof File
            } : 'No file'
        });
    }
};




// Export classes for global use
window.BaseModal = BaseModal;
window.UploadModal = UploadModal;
window.ReportModal = ReportModal;
window.ToastManager = ToastManager;
window.ConfirmationModal = ConfirmationModal;
window.LoadingModal = LoadingModal;
window.ImagePreviewModal = ImagePreviewModal;
window.SettingsModal = SettingsModal;