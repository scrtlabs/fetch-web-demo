/**
 * Integration Setup for Real API
 * Add this file as js/real-api-integration.js
 * Include it after your existing JS files in index.html
 */

// Enhanced request card rendering to show real vs demo status
function enhanceRequestCardRendering() {
    if (window.app && window.app.renderRequestCard) {
        const originalRenderRequestCard = window.app.renderRequestCard.bind(window.app);

        window.app.renderRequestCard = function (request) {
            const timeAgo = this.getTimeAgo(request.timestamp);
            const fileSize = this.formatFileSize(request.fileSize);

            // Add status indicators for real vs demo
            let statusIndicator = '';
            if (request.status === 'completed') {
                if (request.hasRealPDF) {
                    statusIndicator = '<span class="api-indicator real">🤖 AI Analysis</span>';
                } else {
                    statusIndicator = '<span class="api-indicator demo">🎭 Demo Data</span>';
                }
            }

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
                                ${statusIndicator}
                            </div>
                        </div>
                        <div class="request-note">${request.note}</div>
                        ${request.statusMessage ? `<div class="status-message">${request.statusMessage}</div>` : ''}
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
        };
    }
}

// Add styles for API indicators
function addAPIIndicatorStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .api-indicator {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 500;
            margin-top: 4px;
        }
        
        .api-indicator.real {
            background: linear-gradient(45deg, #4CAF50, #45a049);
            color: white;
        }
        
        .api-indicator.demo {
            background: linear-gradient(45deg, #FF9800, #F57C00);
            color: white;
        }
        
        .status-message {
            font-size: 0.75rem;
            color: var(--primary-blue);
            margin-top: 0.5rem;
            font-style: italic;
        }
        
        .demo-banner {
            background: linear-gradient(135deg, #fff3cd, #ffeaa7);
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 1rem;
            margin: 1rem 0;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .demo-icon {
            font-size: 1.5rem;
        }
        
        .demo-text {
            flex: 1;
        }
        
        .pdf-report-viewer {
            width: 100%;
        }
        
        .pdf-controls {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1rem;
            padding: 1rem;
            background: var(--light-gray);
            border-radius: 8px;
        }
        
        .pdf-info {
            margin-left: auto;
            font-size: 0.875rem;
            color: var(--dark-gray);
        }
        
        .pdf-container {
            border-radius: 8px;
            overflow: hidden;
            box-shadow: var(--shadow-md);
        }
        
        .pdf-metadata {
            margin-top: 1rem;
            padding: 1rem;
            background: var(--off-white);
            border-radius: 8px;
        }
        
        .metadata-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 0.5rem;
            margin-top: 0.5rem;
        }
        
        .metadata-grid > div {
            font-size: 0.875rem;
        }
        
        @media (max-width: 768px) {
            .pdf-controls {
                flex-direction: column;
                align-items: stretch;
            }
            
            .pdf-info {
                margin-left: 0;
                text-align: center;
            }
            
            .metadata-grid {
                grid-template-columns: 1fr;
            }
        }
    `;
    document.head.appendChild(style);
}

// Enhanced mock API to handle the hybrid approach
function enhanceMockAPI() {
    if (window.MockAPI) {
        // Store original method
        const originalGenerateMedicalReport = window.MockAPI.generateMedicalReport;

        // Override to add real API status information
        window.MockAPI.generateMedicalReport = function (request) {
            const baseReport = originalGenerateMedicalReport.call(this, request);

            // Add note about real API status if this is being used as fallback
            const apiStatusNote = `

---

## Analysis Method

This report was generated using ${window.hybridAPI && window.hybridAPI.useRealAPI === false ?
                    'simulated data for demonstration purposes. The real AI analysis service was not available at the time of processing.' :
                    'demonstration data. In a production environment, this would be replaced with actual AI-generated analysis.'
                }

### Real AI Analysis Features
When the real analysis service is available, reports include:
- Advanced deep learning model analysis
- Precise breast density measurements  
- BI-RADS classification with confidence scores
- Quantitative tissue composition analysis
- Clinical recommendations based on AI findings
- Quality metrics and validation scores

*To access real AI analysis, ensure the analysis service is running and accessible.*`;

            return baseReport + apiStatusNote;
        };
    }
}

// Initialize real API integration
function initializeRealAPIIntegration() {
    console.log('🔧 Initializing Real API Integration...');

    // Add styles
    addAPIIndicatorStyles();

    // Enhance rendering
    enhanceRequestCardRendering();

    // Enhance mock API
    enhanceMockAPI();

    // Test API connectivity on startup
    if (window.hybridAPI) {
        window.hybridAPI.initializeAPIMode().then(useRealAPI => {
            console.log(`🚀 API Integration initialized. Real API: ${useRealAPI ? 'Available' : 'Unavailable'}`);
        }).catch(error => {
            console.error('❌ Failed to initialize API integration:', error);
        });
    }

    // Add global function to refresh API status
    window.refreshAPIStatus = async function () {
        if (window.hybridAPI) {
            const useRealAPI = await window.hybridAPI.refreshAPIStatus();
            window.app.showToast('info', 'API Status Refreshed',
                `Real API is ${useRealAPI ? 'available' : 'unavailable'}`);
            return useRealAPI;
        }
    };

    // Add global function to force demo mode
    window.forceDemoMode = function () {
        if (window.hybridAPI) {
            window.hybridAPI.useRealAPI = false;
            window.app.showToast('info', 'Demo Mode Enabled',
                'Forced to use demonstration data');
        }
    };

    // Add global function to test API
    window.testAPIConnection = async function () {
        if (window.hybridAPI && window.hybridAPI.realAPI) {
            try {
                const result = await window.hybridAPI.realAPI.testConnectivity();
                console.log('API Test Result:', result);

                if (result.success) {
                    window.app.showToast('success', 'API Test Successful',
                        `Connection to analysis service successful (HTTP ${result.status})`);
                } else {
                    window.app.showToast('error', 'API Test Failed',
                        `Cannot connect to analysis service: ${result.error}`);
                }

                return result;
            } catch (error) {
                window.app.showToast('error', 'API Test Error', error.message);
                return { success: false, error: error.message };
            }
        }
    };

    console.log('✅ Real API Integration setup complete');
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeRealAPIIntegration);
} else {
    initializeRealAPIIntegration();
}

// Also initialize when app is ready
document.addEventListener('DOMContentLoaded', function () {
    // Wait for app to be initialized
    const checkAppReady = setInterval(() => {
        if (window.app && window.hybridAPI) {
            clearInterval(checkAppReady);

            // Clean up old PDFs on startup
            if (window.hybridAPI.storage && window.hybridAPI.storage.cleanupOldPDFs) {
                window.hybridAPI.storage.cleanupOldPDFs();
            }

            console.log('🎯 App and Real API integration ready');
        }
    }, 100);

    // Timeout after 10 seconds
    setTimeout(() => {
        clearInterval(checkAppReady);
    }, 10000);
});

// Export for debugging
window.realAPIIntegration = {
    initializeRealAPIIntegration,
    enhanceRequestCardRendering,
    addAPIIndicatorStyles,
    enhanceMockAPI
};