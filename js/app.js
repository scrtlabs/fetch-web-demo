/**
 * Medical Diagnostics Platform - Main Application
 * Handles application initialization, routing, and core functionality
 */

class MedicalApp {
    constructor() {
        this.currentView = 'dashboard';
        this.requests = [];
        this.filters = {
            status: 'all',
            search: ''
        };
        this.modals = new Map();

        // Initialize app when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    /**
     * Initialize the application
     */
    init() {
        console.log('🚀 Initializing Medical Diagnostics Platform...');

        // Load data and setup
        this.loadRequestsFromStorage();
        this.setupEventListeners();
        this.initializeComponents();
        this.loadSampleData();

        // Initial render
        this.render();

        console.log('✅ Application initialized successfully');
    }

    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        // Navigation events
        document.addEventListener('click', (e) => this.handleGlobalClick(e));
        document.addEventListener('keydown', (e) => this.handleGlobalKeydown(e));

        // Window events
        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('beforeunload', () => this.saveRequestsToStorage());

        // Hash change for routing
        window.addEventListener('hashchange', () => this.handleRouteChange());
    }

    /**
     * Initialize UI components
     */
    initializeComponents() {
        // Initialize toast container
        if (!document.querySelector('.toast-container')) {
            const toastContainer = document.createElement('div');
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }

        // Initialize modals
        this.initializeModals();

        // Setup filter tabs
        this.setupFilterTabs();

        // Setup search functionality
        this.setupSearch();
    }

    /**
     * Setup filter tabs functionality
     */
    setupFilterTabs() {
        const filterTabs = document.querySelectorAll('.filter-tab');
        filterTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const status = tab.dataset.status || 'all';
                this.setFilter('status', status);
            });
        });
    }

    /**
     * Setup search functionality
     */
    setupSearch() {
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.setFilter('search', e.target.value.trim());
                }, 300);
            });
        }
    }

    /**
     * Initialize modal components
     */
    initializeModals() {
        // Create upload modal
        const uploadModal = new UploadModal();
        this.modals.set('upload', uploadModal);

        // Create report modal
        const reportModal = new ReportModal();
        this.modals.set('report', reportModal);
    }

    /**
     * Handle global click events
     */
    handleGlobalClick(e) {
        // Close modals on overlay click
        if (e.target.classList.contains('modal-overlay')) {
            this.closeAllModals();
        }

        // Handle action buttons
        if (e.target.classList.contains('btn-diagnose')) {
            e.preventDefault();
            this.openUploadModal();
        }

        // Handle request card clicks
        const requestCard = e.target.closest('.request-card');
        if (requestCard) {
            const requestId = requestCard.dataset.requestId;
            if (requestId) {
                this.viewRequest(requestId);
            }
        }

        // Handle modal close buttons
        if (e.target.classList.contains('modal-close')) {
            e.preventDefault();
            this.closeAllModals();
        }
    }

    /**
     * Handle global keyboard events
     */
    handleGlobalKeydown(e) {
        // Close modals on Escape
        if (e.key === 'Escape') {
            this.closeAllModals();
        }

        // Open upload modal on Ctrl+N
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            this.openUploadModal();
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Adjust layouts if needed
        this.adjustLayoutForViewport();
    }

    /**
     * Handle route changes
     */
    handleRouteChange() {
        const hash = window.location.hash.slice(1);
        if (hash.startsWith('request/')) {
            const requestId = hash.split('/')[1];
            this.viewRequest(requestId);
        } else {
            this.currentView = hash || 'dashboard';
            this.render();
        }
    }

    /**
     * Set filter and re-render
     */
    setFilter(type, value) {
        this.filters[type] = value;
        this.updateFilterTabs();
        this.renderRequests();

        // Update URL if needed
        this.updateURL();
    }

    /**
     * Update filter tabs visual state
     */
    updateFilterTabs() {
        const filterTabs = document.querySelectorAll('.filter-tab');
        filterTabs.forEach(tab => {
            const status = tab.dataset.status || 'all';
            if (status === this.filters.status) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }

            // Update count
            const count = this.getRequestCountByStatus(status);
            const countElement = tab.querySelector('.filter-count');
            if (countElement) {
                countElement.textContent = count;
            }
        });
    }

    /**
     * Get request count by status
     */
    getRequestCountByStatus(status) {
        if (status === 'all') {
            return this.requests.length;
        }
        return this.requests.filter(req => req.status === status).length;
    }

    /**
     * Get filtered requests
     */
    getFilteredRequests() {
        let filtered = [...this.requests];

        // Filter by status
        if (this.filters.status !== 'all') {
            filtered = filtered.filter(req => req.status === this.filters.status);
        }

        // Filter by search
        if (this.filters.search) {
            const search = this.filters.search.toLowerCase();
            filtered = filtered.filter(req =>
                req.filename.toLowerCase().includes(search) ||
                req.note.toLowerCase().includes(search) ||
                req.id.toLowerCase().includes(search)
            );
        }

        // Sort by timestamp (newest first)
        filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        return filtered;
    }

    /**
     * Open upload modal
     */
    openUploadModal() {
        const uploadModal = this.modals.get('upload');
        if (uploadModal) {
            uploadModal.open();
        }
    }

    /**
     * View specific request
     */
    viewRequest(requestId) {
        const request = this.requests.find(req => req.id === requestId);
        if (!request) {
            this.showToast('error', 'Request not found', `Request with ID ${requestId} does not exist.`);
            return;
        }

        // Navigate to report view
        window.location.hash = `request/${requestId}`;

        // Open report modal or navigate to report page
        const reportModal = this.modals.get('report');
        if (reportModal) {
            reportModal.open(request);
        }
    }

    /**
     * Close all modals
     */
    closeAllModals() {
        this.modals.forEach(modal => modal.close());
    }


    /**
     * Create new diagnostic request
     */
    /**
     * Create new diagnostic request
     */
    createRequest(formData) {
        console.log('🏗️ MedicalApp.createRequest called with:', {
            hasFile: !!formData.file,
            fileName: formData.file?.name,
            fileSize: formData.file?.size,
            fileType: formData.file?.type,
            apiKey: formData.apiKey ? 'Present' : 'Missing',
            note: formData.note
        });

        try {
            // Validate form data
            if (!formData) {
                throw new Error('Form data is required');
            }

            if (!formData.file || !(formData.file instanceof File)) {
                throw new Error('Valid file is required for analysis');
            }

            if (!formData.apiKey) {
                throw new Error('API key is required');
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
                note: formData.note || '',
                progress: 0,
                report: null,
                error: null
            };

            console.log('📋 Request object created:', request);

            // Process the file for preview
            this.processFile(request, formData.file);

            // Add to requests array
            if (!this.requests) {
                this.requests = [];
            }
            this.requests.unshift(request);

            console.log('📊 Total requests now:', this.requests.length);

            // Save to storage
            this.saveRequestsToStorage();

            // Update UI
            this.renderRequests();
            this.updateFilterTabs();

            // Start analysis with the actual file object
            console.log('🚀 Starting analysis...');
            this.startAnalysis(request, formData.file);

            return request;

        } catch (error) {
            console.error('❌ Error in createRequest:', error);
            throw error;
        }
    }

    /**
     * Start analysis for a request
     */
    async startAnalysis(request, file) {
        try {
            console.log('🔬 MedicalApp.startAnalysis called for request:', request.id);
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

            if (!window.hybridAPI) {
                throw new Error('Hybrid API not available');
            }

            request.status = 'processing';
            request.progress = 10;
            this.updateRequestCard(request);
            this.saveRequestsToStorage();

            console.log('📤 Calling hybridAPI.analyzeBreastDensity...');

            // Use hybrid API for analysis
            const result = await window.hybridAPI.analyzeBreastDensity(file, request.id, request.note);

            console.log('📥 Analysis result received:', result);

            if (result && result.success) {
                request.status = 'completed';
                request.progress = 100;

                if (result.type === 'pdf') {
                    request.pdfAvailable = true;
                    request.report = 'PDF report generated successfully';
                    request.metadata = result.metadata;
                } else if (result.type === 'mock') {
                    request.report = result.report;
                    request.metadata = result.metadata;
                } else {
                    request.report = result.report || 'Analysis completed';
                }

                this.showToast('success', 'Analysis Complete',
                    `Analysis for ${request.filename} completed successfully.`);

            } else {
                request.status = 'failed';
                request.error = result?.error || 'Analysis failed for unknown reason';
                this.showToast('error', 'Analysis Failed',
                    `Analysis for ${request.filename} failed: ${request.error}`);
            }

        } catch (error) {
            console.error('❌ Analysis error in startAnalysis:', error);
            request.status = 'failed';
            request.error = error.message;
            this.showToast('error', 'Analysis Error',
                `Analysis failed: ${error.message}`);
        } finally {
            // Always update UI and save state
            this.saveRequestsToStorage();
            this.renderRequests();
            this.updateFilterTabs();
        }
    }

    /**
     * Process uploaded file for preview
     */
    async processFile(request, file) {
        try {
            console.log('🖼️ Processing file for preview:', file.name);

            // Create file preview for images
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    request.imageData = e.target.result;
                    this.saveRequestsToStorage();
                    this.renderRequests();
                    console.log('✅ File preview generated');
                };
                reader.onerror = (error) => {
                    console.error('❌ Error reading file for preview:', error);
                };
                reader.readAsDataURL(file);
            } else {
                console.log('ℹ️ Non-image file, no preview generated');
            }
        } catch (error) {
            console.error('❌ Error processing file:', error);
            request.error = 'Failed to process uploaded file: ' + error.message;
        }
    }

    /**
     * Update specific request card in UI
     */
    updateRequestCard(request) {
        try {
            const card = document.querySelector(`[data-request-id="${request.id}"]`);
            if (card) {
                const progressBar = card.querySelector('.progress-fill');
                const statusBadge = card.querySelector('.status-badge');

                if (progressBar) {
                    progressBar.style.width = `${request.progress || 0}%`;
                }

                if (statusBadge) {
                    statusBadge.className = `status-badge ${request.status}`;
                    statusBadge.innerHTML = `
                    <span class="status-icon ${request.status}"></span>
                    ${request.status}
                `;
                }

                console.log('🔄 Updated request card for:', request.id);
            } else {
                console.log('ℹ️ Request card not found for:', request.id);
            }

            this.saveRequestsToStorage();
        } catch (error) {
            console.error('❌ Error updating request card:', error);
        }
    }

    /**
     * Add method to download PDF for real API results
     */
    // Add this to MedicalApp class in js/app.js

    async downloadPDFReport(requestId) {
        try {
            const request = this.requests.find(r => r.id === requestId);
            if (!request) {
                throw new Error('Request not found');
            }

            if (!request.hasRealPDF) {
                this.showToast('warning', 'No PDF Available',
                    'This request does not have a real PDF report available.');
                return;
            }

            // Get PDF blob from storage
            const pdfBlob = await window.hybridAPI.getPDFBlob(requestId);

            if (!pdfBlob) {
                throw new Error('PDF file not found in storage');
            }

            // Create download link
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `breast_density_report_${requestId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            this.showToast('success', 'Download Started',
                'PDF report download has started.');

        } catch (error) {
            console.error('❌ PDF download failed:', error);
            this.showToast('error', 'Download Failed',
                `Failed to download PDF: ${error.message}`);
        }
    }

    /**
     * Process uploaded file
     */
    async processFile(request, file) {
        try {
            // Create file preview
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    request.imageData = e.target.result;
                    this.saveRequestsToStorage();
                    this.renderRequests();
                };
                reader.readAsDataURL(file);
            }
        } catch (error) {
            console.error('Error processing file:', error);
            request.error = 'Failed to process uploaded file';
            request.status = 'failed';
        }
    }

    /**
     * Start mock processing simulation
     */
    startMockProcessing(request) {
        const steps = [
            { progress: 10, status: 'uploading', message: 'Uploading image...' },
            { progress: 30, status: 'processing', message: 'Analyzing image...' },
            { progress: 60, status: 'processing', message: 'Running AI diagnostics...' },
            { progress: 85, status: 'processing', message: 'Generating report...' },
            { progress: 100, status: 'completed', message: 'Analysis complete!' }
        ];

        let currentStep = 0;

        const progressInterval = setInterval(() => {
            if (currentStep >= steps.length) {
                clearInterval(progressInterval);
                this.completeRequest(request);
                return;
            }

            const step = steps[currentStep];
            request.progress = step.progress;
            request.status = step.status;

            // Update UI
            this.updateRequestCard(request);

            currentStep++;
        }, 2000 + Math.random() * 3000); // 2-5 seconds per step
    }

    /**
     * Complete request processing
     */
    completeRequest(request) {
        request.status = 'completed';
        request.progress = 100;
        request.report = MockAPI.generateMedicalReport(request);

        this.saveRequestsToStorage();
        this.renderRequests();
        this.updateFilterTabs();

        // Show completion toast
        this.showToast('success', 'Analysis Complete', `Diagnostic report for ${request.filename} is ready.`);
    }

    /**
     * Update specific request card
     */
    updateRequestCard(request) {
        const card = document.querySelector(`[data-request-id="${request.id}"]`);
        if (card) {
            const progressBar = card.querySelector('.progress-fill');
            const statusBadge = card.querySelector('.status-badge');

            if (progressBar) {
                progressBar.style.width = `${request.progress}%`;
            }

            if (statusBadge) {
                statusBadge.className = `status-badge ${request.status}`;
                statusBadge.innerHTML = `
                    <span class="status-icon ${request.status}"></span>
                    ${request.status}
                `;
            }
        }

        this.saveRequestsToStorage();
    }

    /**
     * Generate unique request ID
     */
    generateRequestId() {
        return 'REQ-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
    }

    /**
     * Show toast notification
     */
    showToast(type, title, message, duration = 5000) {
        const container = document.querySelector('.toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">&times;</button>
        `;

        // Add event listener for close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.removeToast(toast);
        });

        container.appendChild(toast);

        // Auto remove after duration
        setTimeout(() => {
            if (toast.parentNode) {
                this.removeToast(toast);
            }
        }, duration);
    }

    /**
     * Remove toast notification
     */
    removeToast(toast) {
        toast.style.animation = 'toastOut 0.3s ease-out forwards';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    /**
     * Adjust layout for current viewport
     */
    adjustLayoutForViewport() {
        const width = window.innerWidth;

        // Add responsive classes
        document.body.classList.toggle('mobile', width < 768);
        document.body.classList.toggle('tablet', width >= 768 && width < 1024);
        document.body.classList.toggle('desktop', width >= 1024);
    }

    /**
     * Update URL without page reload
     */
    updateURL() {
        const params = new URLSearchParams();

        if (this.filters.status !== 'all') {
            params.set('status', this.filters.status);
        }

        if (this.filters.search) {
            params.set('search', this.filters.search);
        }

        const newURL = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
        window.history.replaceState({}, '', newURL);
    }

    /**
     * Load sample data for demo
     */
    loadSampleData() {
        if (this.requests.length === 0) {
            const sampleData = MockAPI.getSampleRequests();
            this.requests = sampleData;
            this.saveRequestsToStorage();
        }
    }

    /**
     * Load requests from localStorage
     */
    loadRequestsFromStorage() {
        try {
            const stored = localStorage.getItem('medical_requests');
            if (stored) {
                this.requests = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading requests from storage:', error);
            this.requests = [];
        }
    }

    /**
     * Save requests to localStorage
     */
    saveRequestsToStorage() {
        try {
            localStorage.setItem('medical_requests', JSON.stringify(this.requests));
        } catch (error) {
            console.error('Error saving requests to storage:', error);
        }
    }

    /**
     * Main render method
     */
    render() {
        this.renderRequests();
        this.updateFilterTabs();
        this.adjustLayoutForViewport();
    }

    /**
     * Render requests grid
     */
    renderRequests() {
        const container = document.querySelector('.requests-grid');
        if (!container) return;

        const filteredRequests = this.getFilteredRequests();

        if (filteredRequests.length === 0) {
            container.innerHTML = this.renderEmptyState();
            return;
        }

        container.innerHTML = filteredRequests.map(request =>
            this.renderRequestCard(request)
        ).join('');
    }

    /**
     * Render empty state
     */
    renderEmptyState() {
        const hasFilters = this.filters.status !== 'all' || this.filters.search;

        return `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <h3 class="empty-title">${hasFilters ? 'No matching requests' : 'No diagnostic requests yet'}</h3>
                <p class="empty-description">
                    ${hasFilters
                ? 'Try adjusting your filters or search terms.'
                : 'Start by creating your first diagnostic request.'}
                </p>
                ${!hasFilters ? '<button class="btn btn-primary btn-diagnose">Create First Request</button>' : ''}
            </div>
        `;
    }

    /**
     * Render individual request card
     */
    renderRequestCard(request) {
        const timeAgo = this.getTimeAgo(request.timestamp);
        const fileSize = this.formatFileSize(request.fileSize);

        return `
            <div class="request-card glass-card" data-request-id="${request.id}">
                <div class="card-header">
                    <span class="request-id">${request.id}</span>
                    <div class="status-badge ${request.status}">
                        <span class="status-icon ${request.status}"></span>
                        ${request.status}
                    </div>
                </div>
                <div class="card-body">
                    <div class="file-info">
                        <div class="file-thumbnail" style="background-image: url('${request.imageData || ''}')"></div>
                        <div class="file-details">
                            <h4>${request.filename}</h4>
                            <div class="file-meta">${fileSize} • ${timeAgo}</div>
                        </div>
                    </div>
                    <div class="request-note">${request.note}</div>
                </div>
                <div class="card-footer">
                    <div class="timestamp">
                        <span class="medical-icon time"></span>
                        ${timeAgo}
                    </div>
                    ${request.status !== 'completed' && request.status !== 'failed' ? `
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${request.progress}%"></div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Format file size in human readable format
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Get time ago string
     */
    getTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffInSeconds = Math.floor((now - time) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;

        return time.toLocaleDateString();
    }
}

// Initialize app
const app = new MedicalApp();

// Make app globally available
window.app = app;

console.log('🔧 App.js methods check:', {
    hasCreateRequest: typeof MedicalApp.prototype.createRequest === 'function',
    hasStartAnalysis: typeof MedicalApp.prototype.startAnalysis === 'function',
    hasProcessFile: typeof MedicalApp.prototype.processFile === 'function',
    hasUpdateRequestCard: typeof MedicalApp.prototype.updateRequestCard === 'function'
});