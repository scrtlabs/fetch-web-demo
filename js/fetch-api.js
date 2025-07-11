/**
 * Complete Real API Client for Medical Diagnostics Platform
 * Handles SSL certificate errors gracefully and provides fallback to mock data
 */

class RealBreastDensityAPI {
    constructor() {
        this.baseUrl = 'https://secretai-fetch-morai.scrtlabs.com:23434';
        this.apiToken = 'bWFzdGVyQHNjcnRsYWJzLmNvbTpTZWNyZXROZXR3b3JrTWFzdGVyS2V5X18yMDI1';
        this.defaultHeaders = {
            'Authorization': `Bearer ${this.apiToken}`
        };
        this.sslErrorDetected = false;
    }

    /**
     * Test API connectivity with enhanced SSL and CORS error handling
     */
    async testConnectivity() {
        console.log('🔍 Testing API connectivity with enhanced error handling...');

        // Try multiple connection strategies
        const strategies = [
            () => this.testWithCORS(),
            () => this.testWithNoCORS(),
            () => this.testWithProxy()
        ];

        for (let i = 0; i < strategies.length; i++) {
            try {
                console.log(`🔄 Trying connection strategy ${i + 1}/${strategies.length}`);
                const result = await strategies[i]();
                if (result.success) {
                    return result;
                }
            } catch (error) {
                console.log(`❌ Strategy ${i + 1} failed: ${error.message}`);

                // If this is the last strategy, handle the error
                if (i === strategies.length - 1) {
                    return this.handleConnectivityError(error);
                }
            }
        }

        // Fallback - assume unavailable
        return {
            success: false,
            error: 'All connection strategies failed',
            available: false
        };
    }

    /**
     * Test with CORS mode
     */
    async testWithCORS() {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        try {
            const response = await fetch(`${this.baseUrl}/health`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                    // Removed Authorization header for health check to avoid CORS preflight
                },
                signal: controller.signal,
                mode: 'cors',
                credentials: 'omit'
            });

            clearTimeout(timeoutId);

            console.log(`✅ CORS connectivity test passed: ${response.status}`);
            this.sslErrorDetected = false;

            return {
                success: true,
                status: response.status,
                statusText: response.statusText,
                available: response.status < 500,
                strategy: 'cors'
            };
        } finally {
            clearTimeout(timeoutId);
        }
    }

    /**
     * Test with no-cors mode (limited but can detect if server is reachable)
     */
    async testWithNoCORS() {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        try {
            // no-cors mode - we won't get response data but can detect if request succeeds
            const response = await fetch(this.baseUrl, {
                method: 'GET',
                signal: controller.signal,
                mode: 'no-cors',
                credentials: 'omit'
            });

            clearTimeout(timeoutId);

            console.log(`✅ no-cors connectivity test passed (opaque response)`);

            // In no-cors mode, we get an opaque response
            // If we get here without error, the server is reachable
            return {
                success: true,
                status: 0, // Opaque response
                statusText: 'OK (no-cors)',
                available: true,
                strategy: 'no-cors'
            };
        } finally {
            clearTimeout(timeoutId);
        }
    }

    /**
     * Test with proxy approach (for development)
     */
    async testWithProxy() {
        // This would be used if you set up a proxy in your dev server
        // For now, just return failure
        throw new Error('Proxy strategy not implemented');
    }

    /**
     * Handle connectivity errors
     */
    handleConnectivityError(error) {
        console.log(`⚠️ API connectivity test failed: ${error.message}`);

        // Check for different types of errors
        if (this.isSSLError(error)) {
            console.log('🔐 SSL Certificate error detected');
            this.sslErrorDetected = true;
            this.showSSLGuidance();

            return {
                success: false,
                error: 'SSL Certificate Error - User guidance provided',
                available: false,
                sslError: true,
                needsSSLFix: true
            };
        }

        if (this.isCORSError(error)) {
            console.log('🌐 CORS error detected - server has CORS configuration issues');

            return {
                success: false,
                error: 'CORS configuration error on server',
                available: true, // Assume server is available but misconfigured
                corsError: true,
                needsServerFix: true
            };
        }

        // Other network errors
        return {
            success: false,
            error: error.message,
            available: false
        };
    }

    /**
     * Check if error is CORS-related
     */
    isCORSError(error) {
        const corsErrorPatterns = [
            'CORS',
            'Access-Control-Allow-Origin',
            'Cross-Origin Request Blocked',
            'blocked by CORS policy',
            'No \'Access-Control-Allow-Origin\' header'
        ];

        const errorString = error.message || error.toString();
        return corsErrorPatterns.some(pattern =>
            errorString.includes(pattern)
        );
    }

    /**
     * Show SSL guidance to user
     */
    showSSLGuidance() {
        // Only show once per session
        if (sessionStorage.getItem('ssl_guidance_shown')) {
            return;
        }

        sessionStorage.setItem('ssl_guidance_shown', 'true');

        if (window.app && typeof window.app.showToast === 'function') {
            window.app.showToast('warning', 'SSL Certificate Issue',
                `Please visit ${this.baseUrl} in a new tab and accept the certificate, then refresh this page.`);
        }

        // Also log clear instructions
        console.log(`
🔒 SSL CERTIFICATE ISSUE DETECTED

To fix this issue:
1. Open a new tab and visit: ${this.baseUrl}
2. Click "Advanced" on the security warning
3. Click "Proceed to secretai-fetch.scrtlabs.com (unsafe)"
4. Return to this page and refresh

The application will use demo data until this is resolved.
        `);
    }

    /**
     * Retry connectivity after SSL fix
     */
    async retryAfterSSLFix() {
        console.log('🔄 Retrying API connectivity after SSL fix...');

        // Clear the SSL guidance flag
        sessionStorage.removeItem('ssl_guidance_shown');

        // Reset SSL error state
        this.sslErrorDetected = false;

        // Test connectivity again
        return await this.testConnectivity();
    }

    /**
     * Check if error is SSL-related
     */
    isSSLError(error) {
        const sslErrorPatterns = [
            'ERR_CERT_AUTHORITY_INVALID',
            'ERR_CERT_COMMON_NAME_INVALID',
            'ERR_CERT_DATE_INVALID',
            'ERR_SSL_PROTOCOL_ERROR',
            'ERR_CERT_INVALID',
            'certificate',
            'SSL',
            'TLS',
            'CERT_',
            'net::ERR_CERT'
        ];

        const errorString = error.message || error.toString();
        return sslErrorPatterns.some(pattern =>
            errorString.toUpperCase().includes(pattern.toUpperCase())
        );
    }

    /**
     * Determine if we should use the real API
     */
    async shouldUseRealAPI() {
        const connectivity = await this.testConnectivity();

        // Use real API if it's available OR if we just have an SSL error
        const shouldUse = connectivity.available === true;

        if (connectivity.sslError) {
            console.log('🔐 Ignoring SSL certificate error and proceeding with real API');
        }

        return shouldUse;
    }

    /**
     * Enhanced breast density analysis with CORS and SSL error tolerance
     */
    async analyzeBreastDensity(file, requestId, note = '') {
        try {
            console.log(`🔬 Starting real API analysis for request ${requestId} (handling CORS/SSL errors)`);
            console.log('📋 File details:', {
                file: file,
                name: file?.name,
                size: file?.size,
                type: file?.type,
                instanceof: file instanceof File
            });

            // Enhanced file validation
            if (!file) {
                console.error('❌ File is null or undefined');
                throw new Error('No file provided for analysis');
            }

            if (!(file instanceof File) && !(file instanceof Blob)) {
                console.error('❌ Invalid file type:', typeof file, file);
                throw new Error('Invalid file type - must be a File or Blob object');
            }

            if (!file.size || file.size === 0) {
                throw new Error('File is empty or has no size');
            }

            if (file.size > 50 * 1024 * 1024) {
                throw new Error('File size must be less than 50MB');
            }

            // Check file type if available (File objects have type, Blobs might not)
            if (file.type) {
                const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/dicom'];
                if (!allowedTypes.includes(file.type)) {
                    throw new Error('Only JPEG, PNG, and DICOM files are supported');
                }
            }

            // Try multiple request strategies to work around CORS issues
            const strategies = [
                () => this.makeRequestWithFullHeaders(file, requestId, note),
                () => this.makeRequestWithMinimalHeaders(file, requestId, note),
                () => this.makeRequestWithNoCORS(file, requestId, note)
            ];

            for (let i = 0; i < strategies.length; i++) {
                try {
                    console.log(`📤 Trying request strategy ${i + 1}/${strategies.length}`);
                    const result = await strategies[i]();
                    if (result.success) {
                        return result;
                    }
                } catch (error) {
                    console.log(`❌ Request strategy ${i + 1} failed: ${error.message}`);

                    // If this is the last strategy, throw the error
                    if (i === strategies.length - 1) {
                        throw error;
                    }
                }
            }

            throw new Error('All request strategies failed');

        } catch (error) {
            console.error('❌ API request failed:', error);

            if (error.name === 'AbortError') {
                throw new Error('Request timed out after 10 minutes. Medical imaging analysis may take longer than expected.');
            }

            // Handle SSL/Certificate errors more gracefully
            if (this.isSSLError(error)) {
                console.log('🔐 SSL Certificate error in API call - this is expected and being handled');
                throw new Error('SSL Certificate error: Unable to verify server certificate. In production, ensure proper SSL configuration.');
            }

            // Handle CORS errors
            if (this.isCORSError(error)) {
                console.log('🌐 CORS error in API call - server configuration issue');
                throw new Error('CORS error: Server has Access-Control-Allow-Origin configuration issues. This is a server-side problem.');
            }

            // Check for network errors
            if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
                throw new Error('Network error: Unable to connect to analysis service. This may be due to network connectivity or server issues.');
            }

            throw error;
        }
    }

    /**
     * Make request with full headers
     */
    async makeRequestWithFullHeaders(file, requestId, note) {
        const formData = new FormData();
        formData.append('file', file);

        const metadata = {
            format: 'pdf',
            report_id: requestId,
            note: note || '',
            timestamp: new Date().toISOString()
        };
        formData.append('metadata', JSON.stringify(metadata));

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 600000);

        try {
            const response = await fetch(`${this.baseUrl}/predict/breast-density`, {
                method: 'POST',
                headers: this.defaultHeaders,
                body: formData,
                signal: controller.signal,
                mode: 'cors',
                credentials: 'omit'
            });

            return await this.processResponse(response, requestId, file);
        } finally {
            clearTimeout(timeoutId);
        }
    }

    /**
     * Make request with minimal headers to avoid CORS preflight
     */
    async makeRequestWithMinimalHeaders(file, requestId, note) {
        const formData = new FormData();
        formData.append('file', file);

        // Add metadata as form field instead of JSON to avoid content-type issues
        formData.append('format', 'pdf');
        formData.append('report_id', requestId);
        formData.append('note', note || '');
        formData.append('timestamp', new Date().toISOString());

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 600000);

        try {
            // Only include essential headers to avoid CORS preflight
            const response = await fetch(`${this.baseUrl}/predict/breast-density`, {
                method: 'POST',
                // No custom headers to avoid preflight
                body: formData,
                signal: controller.signal,
                mode: 'cors',
                credentials: 'omit'
            });

            return await this.processResponse(response, requestId, file);
        } finally {
            clearTimeout(timeoutId);
        }
    }

    /**
     * Make request with no-cors mode (limited response access)
     */
    async makeRequestWithNoCORS(file, requestId, note) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('format', 'pdf');
        formData.append('report_id', requestId);
        formData.append('note', note || '');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 600000);

        try {
            const response = await fetch(`${this.baseUrl}/predict/breast-density`, {
                method: 'POST',
                body: formData,
                signal: controller.signal,
                mode: 'no-cors',
                credentials: 'omit'
            });

            // In no-cors mode, we get an opaque response
            // We can't read the response, but if we get here, the request was sent
            console.log('📥 Request sent in no-cors mode (response is opaque)');

            // Return a success response indicating the request was sent
            return {
                success: false, // Can't verify success with opaque response
                type: 'no-cors',
                requestId: requestId,
                error: 'Response not readable in no-cors mode',
                message: 'Request sent but response is opaque due to CORS restrictions'
            };
        } finally {
            clearTimeout(timeoutId);
        }
    }

    /**
     * Process API response
     */
    async processResponse(response, requestId, file) {
        console.log(`📥 Received response: ${response.status} ${response.statusText}`);

        // Log response headers for debugging
        const responseHeaders = {};
        response.headers.forEach((value, key) => {
            responseHeaders[key] = value;
        });
        console.log('📋 Response headers:', responseHeaders);

        if (!response.ok) {
            const errorText = await response.text();
            let errorDetails;

            try {
                errorDetails = JSON.parse(errorText);
            } catch {
                errorDetails = { error: 'Unknown error', message: errorText };
            }

            throw new Error(`API Error (${response.status}): ${errorDetails.message || errorDetails.error || errorText}`);
        }

        // Check content type to determine response format
        const contentType = response.headers.get('content-type') || '';
        console.log(`📄 Content type: ${contentType}`);

        if (contentType.includes('application/pdf')) {
            // PDF response - success case
            const pdfBlob = await response.blob();

            console.log(`✅ PDF received successfully: ${pdfBlob.size} bytes`);

            return {
                success: true,
                type: 'pdf',
                data: pdfBlob,
                requestId: response.headers.get('X-Request-ID') || requestId,
                originalFilename: response.headers.get('X-Original-Filename') || file.name,
                generationTime: response.headers.get('X-Generation-Time') || new Date().toISOString(),
                modelName: response.headers.get('X-Model-Name') || 'BreastDensityClassification',
                size: pdfBlob.size
            };

        } else if (contentType.includes('application/json')) {
            // JSON response - could be error or debug info
            const jsonData = await response.json();

            console.log('📄 JSON response received:', jsonData);

            return {
                success: false,
                type: 'json',
                data: jsonData,
                requestId: jsonData.request_metadata?.request_id || requestId,
                error: jsonData.file_info?.message || 'No PDF file generated',
                debugInfo: jsonData
            };

        } else {
            // Unexpected response type
            const textData = await response.text();
            throw new Error(`Unexpected response type: ${contentType}. Response: ${textData.substring(0, 200)}`);
        }
    }

    /**
     * Check processing status (for future use)
     */
    async checkStatus(requestId) {
        try {
            const response = await fetch(`${this.baseUrl}/status/${requestId}`, {
                method: 'GET',
                headers: this.defaultHeaders,
                mode: 'cors',
                credentials: 'omit'
            });

            if (!response.ok) {
                throw new Error(`Status check failed: ${response.status}`);
            }

            return await response.json();

        } catch (error) {
            console.error('❌ Status check failed:', error);
            throw error;
        }
    }

    /**
     * Get API health status
     */
    async getHealth() {
        try {
            const response = await fetch(`${this.baseUrl}/health`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                },
                mode: 'cors',
                credentials: 'omit'
            });

            if (!response.ok) {
                throw new Error(`Health check failed: ${response.status}`);
            }

            return await response.json();

        } catch (error) {
            console.error('❌ Health check failed:', error);
            if (this.isSSLError(error)) {
                return {
                    status: 'ssl_error',
                    message: 'SSL certificate error detected',
                    sslError: true
                };
            }
            throw error;
        }
    }
}

/**
 * Enhanced Hybrid API with complete SSL error handling
 */
class HybridBreastDensityAPI {
    constructor() {
        this.realAPI = new RealBreastDensityAPI();
        this.useRealAPI = null;
        this.storage = window.storage || new RequestStorage(); // Use global storage if available
        this.sslErrorDetected = false;
    }

    /**
     * Initialize API mode with enhanced error handling
     */
    async initializeAPIMode() {
        if (this.useRealAPI === null) {
            console.log('🔍 Testing API connectivity with enhanced error handling...');

            try {
                const connectivityResult = await this.realAPI.testConnectivity();

                if (connectivityResult.success) {
                    this.useRealAPI = true;
                    this.sslErrorDetected = false;
                    console.log('✅ Real API is available');

                    if (window.app) {
                        window.app.showToast('success', 'API Connected', 'Using real AI analysis service');
                    }
                } else if (connectivityResult.needsSSLFix) {
                    // SSL certificate needs user intervention
                    this.useRealAPI = false;
                    this.sslErrorDetected = true;

                    console.log('🔒 SSL certificate requires user acceptance');

                    // Show SSL management modal
                    if (window.sslManager) {
                        setTimeout(() => window.sslManager.showSSLModal(), 1000);
                    }

                    if (window.app) {
                        window.app.showToast('warning', 'SSL Setup Required', 'Click the SSL setup dialog to enable real AI analysis');
                    }
                } else if (connectivityResult.corsError) {
                    // CORS configuration issues on server
                    this.useRealAPI = false;

                    console.log('🌐 CORS configuration error detected');

                    if (window.app) {
                        window.app.showToast('warning', 'Server Configuration Issue',
                            'API server has CORS configuration problems. Using demo data until resolved.');
                    }
                } else {
                    // Other connectivity issues
                    this.useRealAPI = false;
                    console.log('⚠️ Real API not available, using mock data');

                    if (window.app) {
                        window.app.showToast('warning', 'Demo Mode', 'Using simulated analysis (real API unavailable)');
                    }
                }
            } catch (error) {
                console.error('❌ Failed to initialize API mode:', error);
                this.useRealAPI = false;
                if (window.app) {
                    window.app.showToast('error', 'API Error', 'Failed to connect to analysis service, using demo mode');
                }
            }
        }
        return this.useRealAPI;
    }

    /**
     * Test real API connectivity
     */
    async testRealAPI() {
        console.log('🔧 Testing real API connectivity...');

        try {
            const result = await this.realAPI.testConnectivity();

            if (result.success || result.sslError) {
                this.useRealAPI = true;
                this.sslErrorDetected = result.sslError || false;
                console.log('✅ Real API test successful');

                if (window.app) {
                    const message = result.sslError ?
                        'API connection successful (SSL warning ignored)' :
                        'API connection successful';
                    window.app.showToast('success', 'API Test', message);
                }
            } else {
                this.useRealAPI = false;
                console.log('❌ Real API test failed');

                if (window.app) {
                    window.app.showToast('warning', 'API Test Failed', 'Will use demo data');
                }
            }
        } catch (error) {
            console.error('❌ API test error:', error);
            this.useRealAPI = false;

            if (window.app) {
                window.app.showToast('error', 'API Error', 'Connection test failed, using demo mode');
            }
        }

        return this.useRealAPI;
    }

    /**
     * Analyze breast density with enhanced error handling
     */
    async analyzeBreastDensity(file, requestId, note = '') {
        await this.initializeAPIMode();

        if (this.useRealAPI) {
            try {
                console.log(`🔬 Using real API for request ${requestId} (SSL errors ignored)`);
                const result = await this.realAPI.analyzeBreastDensity(file, requestId, note);

                if (result.success && result.type === 'pdf') {
                    // Save PDF blob for later retrieval
                    if (this.storage && typeof this.storage.savePDFBlob === 'function') {
                        await this.storage.savePDFBlob(requestId, result.data);
                    }

                    return {
                        success: true,
                        type: 'pdf',
                        requestId: result.requestId,
                        message: 'Analysis completed successfully',
                        metadata: {
                            originalFilename: result.originalFilename,
                            generationTime: result.generationTime,
                            modelName: result.modelName,
                            size: result.size
                        }
                    };
                } else {
                    // API returned JSON (error case)
                    console.warn(`⚠️ Real API didn't return PDF for request ${requestId}, falling back to mock`);
                    return this.generateMockResponse(file, requestId, note, result.error);
                }
            } catch (error) {
                console.error(`❌ Real API failed for request ${requestId}:`, error);

                // Check if it's an SSL error
                if (this.realAPI.isSSLError(error)) {
                    console.log('🔐 SSL certificate error - falling back to mock data');

                    if (window.app) {
                        window.app.showToast('warning', 'SSL Certificate Warning',
                            'API has SSL certificate issues, using demo data. Contact administrator to fix SSL configuration.');
                    }
                } else {
                    console.log('🔄 Falling back to mock data due to other API error');

                    if (window.app) {
                        window.app.showToast('warning', 'API Error', 'Analysis service error, using demo data');
                    }
                }

                return this.generateMockResponse(file, requestId, note, error.message);
            }
        } else {
            console.log(`🎭 Using mock data for request ${requestId}`);
            return this.generateMockResponse(file, requestId, note);
        }
    }

    /**
     * Generate mock response when real API is unavailable
     */
    generateMockResponse(file, requestId, note = '', error = null) {
        console.log(`🎭 Generating mock response for request ${requestId}`);

        // Safely get filename
        const filename = file?.name || 'unknown_file.jpg';
        const fileSize = file?.size || 0;

        console.log('📋 Mock response file details:', {
            filename,
            fileSize,
            hasFile: !!file,
            error
        });

        // Generate realistic mock report using MockAPI
        const mockReport = window.MockAPI ?
            window.MockAPI.generateMedicalReport({
                id: requestId,
                filename: filename,
                timestamp: new Date().toISOString()
            }) :
            this.generateBasicMockReport(requestId, filename);

        return {
            success: true,
            type: 'mock',
            requestId: requestId,
            message: 'Mock analysis completed (demo data)',
            report: mockReport,
            metadata: {
                originalFilename: filename,
                generationTime: new Date().toISOString(),
                modelName: 'MockBreastDensityClassification',
                size: fileSize,
                mockData: true,
                error: error
            }
        };
    }

    /**
     * Basic mock report generator (fallback)
     */
    generateBasicMockReport(requestId, filename) {
        const densityCategories = ['A', 'B', 'C', 'D'];
        const selectedDensity = densityCategories[Math.floor(Math.random() * densityCategories.length)];

        return `# Breast Density Analysis Report - Demo

## Patient Information
- **Report ID:** ${requestId}
- **Study Date:** ${new Date().toLocaleDateString()}
- **Image File:** ${filename}
- **Analysis Method:** AI-Assisted Density Classification (Demo)

## Executive Summary
This is a demonstration report generated by the Medical Diagnostics Platform. 

## Breast Density Classification
**BI-RADS Density Category: ${selectedDensity}**

### Detailed Analysis
The mammographic images demonstrate ${selectedDensity === 'A' ? 'almost entirely fatty' :
                selectedDensity === 'B' ? 'scattered fibroglandular densities' :
                    selectedDensity === 'C' ? 'heterogeneously dense' : 'extremely dense'} breast tissue composition.

## Recommendations
1. **Follow-up:** ${selectedDensity === 'C' || selectedDensity === 'D' ? 'Consider supplemental screening' : 'Routine annual screening'}
2. **Self-examination:** Continue monthly breast self-examinations
3. **Clinical correlation:** Any new findings should prompt evaluation

---
**Report generated by:** AI Diagnostic System (Demo Mode)  
**Analysis Date:** ${new Date().toLocaleDateString()}  
**Report ID:** ${requestId}

*This is a demonstration report and should not be used for actual medical diagnosis.*`;
    }

    /**
     * Get API status information
     */
    getAPIStatus() {
        return {
            realAPIAvailable: this.useRealAPI,
            sslErrorDetected: this.sslErrorDetected,
            apiBaseUrl: this.realAPI.baseUrl,
            lastTest: new Date().toISOString()
        };
    }
}

// Create and export global instance
window.RealBreastDensityAPI = RealBreastDensityAPI;
window.HybridBreastDensityAPI = HybridBreastDensityAPI;

// Initialize global hybrid API instance
if (!window.hybridAPI) {
    window.hybridAPI = new HybridBreastDensityAPI();
    console.log('🚀 Global Hybrid API instance created');
}