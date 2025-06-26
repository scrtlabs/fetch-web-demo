/**
 * Demo Page Main JavaScript
 * Handles all demo-specific functionality and interactions
 */

class DemoPage {
    constructor() {
        this.currentWorkflowStep = 0;
        this.isSimulating = false;
        this.animationIntervals = [];
        this.observers = [];
        this.init();
    }

    init() {
        try {
            this.setupEventListeners();
            this.startAnimations();
            this.setupScrollAnimations();
            this.setupParallax();
            console.log('✅ DemoPage initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing DemoPage:', error);
        }
    }

    setupEventListeners() {
        try {
            // Demo tour button
            const demoTourBtn = document.getElementById('demo-tour-btn');
            if (demoTourBtn) {
                demoTourBtn.addEventListener('click', () => this.startDemoTour());
            }

            // Sample report button - check both possible IDs
            const sampleReportBtn = document.getElementById('sample-report-btn');
            if (sampleReportBtn) {
                sampleReportBtn.addEventListener('click', () => this.showSampleReport());
            }

            // Contact button
            const contactBtn = document.getElementById('contact-btn');
            if (contactBtn) {
                contactBtn.addEventListener('click', () => this.showContactModal());
            }

            // Modal close buttons
            document.querySelectorAll('.modal-close, #close-contact').forEach(btn => {
                btn.addEventListener('click', () => this.closeModals());
            });

            // Send contact form
            const sendContactBtn = document.getElementById('send-contact');
            if (sendContactBtn) {
                sendContactBtn.addEventListener('click', () => this.sendContact());
            }

            // ROI Calculator
            const calculateROIBtn = document.getElementById('calculate-roi');
            if (calculateROIBtn) {
                calculateROIBtn.addEventListener('click', () => this.calculateROI());
            }

            // Newsletter form
            const newsletterForm = document.querySelector('.newsletter-form');
            if (newsletterForm) {
                newsletterForm.addEventListener('submit', (e) => this.handleNewsletter(e));
            }

            // Smooth scrolling for anchor links
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetId = anchor.getAttribute('href').substring(1);
                    const target = document.getElementById(targetId);
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth' });
                    }
                });
            });

            // Keyboard shortcuts
            document.addEventListener('keydown', (e) => this.handleKeyboard(e));

            // Window events
            window.addEventListener('beforeunload', () => this.cleanup());

        } catch (error) {
            console.error('❌ Error setting up event listeners:', error);
        }
    }

    startAnimations() {
        try {
            // Animate workflow steps
            this.animateWorkflow();

            // Start hero stats animation after delay
            setTimeout(() => this.animateHeroStats(), 2000);
        } catch (error) {
            console.error('❌ Error starting animations:', error);
        }
    }

    animateWorkflow() {
        const steps = document.querySelectorAll('.workflow-step');
        if (steps.length === 0) return;

        try {
            const animateStep = () => {
                steps.forEach(step => step.classList.remove('active'));
                if (steps[this.currentWorkflowStep]) {
                    steps[this.currentWorkflowStep].classList.add('active');
                }
                this.currentWorkflowStep = (this.currentWorkflowStep + 1) % steps.length;
            };

            // Initial animation
            animateStep();

            // Continue animating every 3 seconds
            const interval = setInterval(animateStep, 3000);
            this.animationIntervals.push(interval);
        } catch (error) {
            console.error('❌ Error in workflow animation:', error);
        }
    }

    animateHeroStats() {
        const statNumbers = document.querySelectorAll('.hero-stats .stat-number');

        statNumbers.forEach((stat, index) => {
            setTimeout(() => {
                try {
                    this.animateNumber(stat, stat.textContent);
                } catch (error) {
                    console.error(`❌ Error animating stat ${index}:`, error);
                }
            }, index * 300);
        });
    }

    animateNumber(element, finalValue) {
        if (!element || !finalValue) return;

        try {
            const isPercentage = finalValue.includes('%');
            const hasLessThan = finalValue.includes('<');
            const hasPlus = finalValue.includes('+');
            const numericMatch = finalValue.match(/[\d.]+/);
            const numericValue = numericMatch ? parseFloat(numericMatch[0]) : 0;

            if (isNaN(numericValue) || numericValue === 0) {
                element.textContent = finalValue;
                return;
            }

            let current = 0;
            const increment = numericValue / 60;

            const timer = setInterval(() => {
                try {
                    current += increment;

                    if (current >= numericValue) {
                        clearInterval(timer);
                        element.textContent = finalValue;
                    } else {
                        let display = '';

                        if (finalValue === 'BI-RADS') {
                            display = finalValue;
                        } else if (hasLessThan) {
                            display = '<' + Math.floor(current) + 's';
                        } else if (hasPlus) {
                            display = Math.floor(current / 1000) + 'K+';
                        } else if (isPercentage) {
                            display = (Math.floor(current * 10) / 10) + '%';
                        } else {
                            display = Math.floor(current).toString();
                        }

                        element.textContent = display;
                    }
                } catch (error) {
                    clearInterval(timer);
                    element.textContent = finalValue;
                }
            }, 50);
        } catch (error) {
            console.error('❌ Error in number animation:', error);
            element.textContent = finalValue;
        }
    }

    setupScrollAnimations() {
        try {
            const observerOptions = {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            }, observerOptions);

            this.observers.push(observer);

            // Add scroll animation class to elements
            const animateElements = document.querySelectorAll('.feature-card, .spec-category, .demo-visual');
            animateElements.forEach(el => {
                el.classList.add('animate-on-scroll');
                observer.observe(el);
            });
        } catch (error) {
            console.error('❌ Error setting up scroll animations:', error);
        }
    }

    setupParallax() {
        try {
            let ticking = false;

            const updateParallax = () => {
                const scrolled = window.pageYOffset;
                const parallax = document.querySelector('.hero-background');

                if (parallax) {
                    const speed = scrolled * 0.5;
                    parallax.style.transform = `translateY(${speed}px)`;
                }
                ticking = false;
            };

            window.addEventListener('scroll', () => {
                if (!ticking) {
                    requestAnimationFrame(updateParallax);
                    ticking = true;
                }
            });
        } catch (error) {
            console.error('❌ Error setting up parallax:', error);
        }
    }

    startDemoTour() {
        try {
            const steps = [
                {
                    element: '.hero-title',
                    message: '🚀 Welcome to our AI Medical Diagnostics Platform!',
                    duration: 3000
                },
                {
                    element: '.features-grid',
                    message: '🧠 Explore our cutting-edge AI capabilities and features',
                    duration: 4000
                },
                {
                    element: '.demo-workflow',
                    message: '⚡ See how easy it is to get diagnostic results in 3 steps',
                    duration: 4000
                },
                {
                    element: '.specs-grid',
                    message: '📊 Review our technical specifications and performance metrics',
                    duration: 4000
                },
                {
                    element: '.cta-section',
                    message: '🎯 Ready to get started? Launch the platform or contact our team!',
                    duration: 3000
                }
            ];

            let currentStep = 0;

            const showStep = () => {
                if (currentStep < steps.length) {
                    try {
                        const step = steps[currentStep];
                        const element = document.querySelector(step.element);

                        if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'center' });

                            setTimeout(() => {
                                this.showTooltip(element, step.message, step.duration);
                            }, 800);
                        }

                        currentStep++;
                        setTimeout(showStep, step.duration + 1000);
                    } catch (error) {
                        console.error(`❌ Error in tour step ${currentStep}:`, error);
                        currentStep++;
                        setTimeout(showStep, 1000);
                    }
                } else {
                    this.showToast('success', 'Tour Complete!', 'Thank you for taking the demo tour. Ready to try our platform?');
                }
            };

            this.showToast('info', 'Demo Tour Starting', 'Sit back and let us show you around our platform!');
            setTimeout(showStep, 1000);
        } catch (error) {
            console.error('❌ Error starting demo tour:', error);
            this.showToast('error', 'Tour Error', 'Sorry, there was an issue starting the tour.');
        }
    }

    showTooltip(element, message, duration = 3000) {
        try {
            // Remove existing tooltips
            document.querySelectorAll('.demo-tooltip').forEach(tip => tip.remove());

            const tooltip = document.createElement('div');
            tooltip.className = 'demo-tooltip';
            tooltip.innerHTML = `
                <div class="tooltip-content">
                    <p style="margin: 0; padding-right: var(--spacing-md);">${message}</p>
                    <button class="tooltip-close" style="background: none; border: none; color: white; font-size: 1.25rem; cursor: pointer; padding: 0; line-height: 1;">&times;</button>
                </div>
            `;

            document.body.appendChild(tooltip);

            const rect = element.getBoundingClientRect();
            const tooltipWidth = 300;
            const left = Math.max(20, Math.min(rect.left, window.innerWidth - tooltipWidth - 20));
            const top = Math.max(20, rect.top - 80);

            tooltip.style.left = left + 'px';
            tooltip.style.top = top + 'px';
            tooltip.style.maxWidth = Math.min(tooltipWidth, window.innerWidth - 40) + 'px';

            // Close button event
            tooltip.querySelector('.tooltip-close').addEventListener('click', () => {
                tooltip.remove();
            });

            // Auto remove
            setTimeout(() => {
                if (tooltip.parentNode) {
                    tooltip.style.opacity = '0';
                    setTimeout(() => tooltip.remove(), 300);
                }
            }, duration);
        } catch (error) {
            console.error('❌ Error showing tooltip:', error);
        }
    }

    showSampleReport() {
        try {
            // Generate a sample report ID and redirect
            const sampleId = 'SAMPLE-' + Date.now().toString(36).toUpperCase();

            // Create a sample report in storage if storage is available
            if (typeof window.storage !== 'undefined' && window.storage) {
                const sampleRequest = {
                    id: sampleId,
                    timestamp: new Date().toISOString(),
                    status: 'completed',
                    filename: 'sample_mammogram.jpg',
                    fileSize: 2048000,
                    fileType: 'image/jpeg',
                    imageData: this.generateSampleImageData(),
                    note: 'Sample diagnostic analysis for demonstration purposes',
                    report: this.generateSampleReport(sampleId)
                };

                window.storage.saveRequest(sampleRequest);
            }

            // Open in new tab
            window.open(`report.html?id=${sampleId}`, '_blank');

            this.showToast('info', 'Sample Report', 'Opening sample diagnostic report in a new tab...');
        } catch (error) {
            console.error('❌ Error showing sample report:', error);
            this.showToast('error', 'Error', 'Failed to generate sample report. Please try again.');
        }
    }

    generateSampleReport(sampleId) {
        return `# Breast Density Analysis Report - Sample

## Executive Summary
This sample report demonstrates the comprehensive analysis capabilities of our AI diagnostic platform. The analysis was completed in 23 seconds with high confidence.

## Patient Information
- **Report ID:** ${sampleId}
- **Analysis Date:** ${new Date().toLocaleDateString()}
- **Image File:** sample_mammogram.jpg
- **Analysis Method:** AI-Assisted Density Classification

## Findings

### Primary Finding
**BI-RADS Density Category: B**
- **Description:** Scattered fibroglandular densities
- **Population Prevalence:** 40-50%

### Detailed Analysis
The mammographic images demonstrate scattered fibroglandular densities throughout both breasts. This classification is based on the proportion of fibroglandular tissue relative to fatty tissue visible on the mammogram.

#### Quantitative Measurements
- **Fibroglandular Tissue:** 35%
- **Fatty Tissue:** 65%
- **Density Distribution:** Symmetric

## Assessment
**BI-RADS Category 1:** Negative

No mammographic evidence of malignancy. The breast composition shows scattered fibroglandular densities, which is within normal limits for this patient population.

## Recommendations
1. **Follow-up:** Routine annual screening mammography
2. **Self-examination:** Continue monthly breast self-examinations
3. **Clinical correlation:** Any new palpable findings should prompt clinical evaluation

## Technical Details
- **Algorithm Version:** v2.1.3
- **Confidence Score:** 0.967
- **Processing Time:** 23 seconds
- **Quality Metrics:** All parameters within acceptable ranges

---

**Report generated by:** AI Diagnostic System  
**Analysis Date:** ${new Date().toLocaleDateString()}  
**Report ID:** ${sampleId}

*This is a sample report for demonstration purposes only and should not be used for actual medical diagnosis.*`;
    }

    generateSampleImageData() {
        try {
            // Create a simple placeholder image using canvas
            const canvas = document.createElement('canvas');
            canvas.width = 400;
            canvas.height = 300;
            const ctx = canvas.getContext('2d');

            // Create gradient background
            const gradient = ctx.createLinearGradient(0, 0, 400, 300);
            gradient.addColorStop(0, '#f0f0f0');
            gradient.addColorStop(1, '#d0d0d0');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 400, 300);

            // Add some medical-looking shapes
            ctx.fillStyle = '#888';
            ctx.beginPath();
            ctx.arc(200, 150, 60, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#aaa';
            ctx.beginPath();
            ctx.arc(160, 120, 25, 0, Math.PI * 2);
            ctx.fill();

            // Add filename text
            ctx.fillStyle = '#333';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Sample Mammogram', 200, 280);

            return canvas.toDataURL('image/jpeg', 0.8);
        } catch (error) {
            console.error('❌ Error generating sample image:', error);
            return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+CiAgPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzMzMyIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlNhbXBsZSBJbWFnZTwvdGV4dD4KPC9zdmc+';
        }
    }

    showContactModal() {
        try {
            const modal = document.getElementById('contact-modal');
            if (modal) {
                modal.style.display = 'flex';

                // Focus on first input
                setTimeout(() => {
                    const firstInput = modal.querySelector('input[type="text"]');
                    if (firstInput) firstInput.focus();
                }, 100);
            }
        } catch (error) {
            console.error('❌ Error showing contact modal:', error);
        }
    }

    closeModals() {
        try {
            document.querySelectorAll('.modal-overlay').forEach(modal => {
                modal.style.display = 'none';
            });
        } catch (error) {
            console.error('❌ Error closing modals:', error);
        }
    }

    sendContact() {
        try {
            const form = document.querySelector('.contact-form');
            if (!form) return;

            const nameInput = form.querySelector('input[type="text"]');
            const emailInput = form.querySelector('input[type="email"]');

            if (!nameInput || !emailInput) {
                this.showToast('error', 'Form Error', 'Contact form elements not found.');
                return;
            }

            if (!nameInput.value || !emailInput.value) {
                this.showToast('error', 'Required Fields', 'Please fill in your name and email address.');
                return;
            }

            // Simple email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailInput.value)) {
                this.showToast('error', 'Invalid Email', 'Please enter a valid email address.');
                return;
            }

            // Simulate form submission
            this.showToast('success', 'Message Sent!', 'Thank you for your interest. Our sales team will contact you within 24 hours.');
            this.closeModals();

            // Reset form
            form.reset();
        } catch (error) {
            console.error('❌ Error sending contact:', error);
            this.showToast('error', 'Error', 'Failed to send message. Please try again.');
        }
    }

    calculateROI() {
        try {
            const monthlyMammogramsInput = document.getElementById('monthly-mammograms');
            const readingTimeInput = document.getElementById('reading-time');
            const hourlyRateInput = document.getElementById('hourly-rate');

            if (!monthlyMammogramsInput || !readingTimeInput || !hourlyRateInput) {
                this.showToast('error', 'Calculator Error', 'ROI calculator inputs not found.');
                return;
            }

            const monthlyMammograms = parseInt(monthlyMammogramsInput.value) || 500;
            const readingTime = parseInt(readingTimeInput.value) || 15;
            const hourlyRate = parseInt(hourlyRateInput.value) || 200;

            // Validate inputs
            if (monthlyMammograms <= 0 || readingTime <= 0 || hourlyRate <= 0) {
                this.showToast('error', 'Invalid Input', 'Please enter valid positive numbers for all fields.');
                return;
            }

            // Our platform reduces reading time by 80%
            const timeSavedPerImage = readingTime * 0.8; // minutes
            const totalTimeSavedPerMonth = (monthlyMammograms * timeSavedPerImage) / 60; // hours
            const monthlySavings = totalTimeSavedPerMonth * hourlyRate;
            const annualSavings = monthlySavings * 12;

            // Display results with animation
            this.animateROIResults(monthlySavings, annualSavings, totalTimeSavedPerMonth);

            const roiOutput = document.getElementById('roi-output');
            if (roiOutput) {
                roiOutput.style.display = 'block';
            }

            this.showToast('success', 'ROI Calculated', `You could save $${monthlySavings.toLocaleString()} per month with our platform!`);
        } catch (error) {
            console.error('❌ Error calculating ROI:', error);
            this.showToast('error', 'Calculation Error', 'Failed to calculate ROI. Please try again.');
        }
    }

    animateROIResults(monthly, annual, timeSaved) {
        try {
            const monthlyEl = document.getElementById('monthly-savings');
            const annualEl = document.getElementById('annual-savings');
            const timeEl = document.getElementById('time-saved');

            if (monthlyEl) {
                this.animateValue(monthlyEl, 0, monthly, '$', 1000);
            }

            if (annualEl) {
                setTimeout(() => {
                    this.animateValue(annualEl, 0, annual, '$', 1000);
                }, 300);
            }

            if (timeEl) {
                setTimeout(() => {
                    this.animateValue(timeEl, 0, timeSaved, 'h', 1000);
                }, 600);
            }
        } catch (error) {
            console.error('❌ Error animating ROI results:', error);
        }
    }

    animateValue(element, start, end, suffix = '', duration = 1000) {
        if (!element) return;

        try {
            const startTime = performance.now();

            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                const current = start + (end - start) * this.easeOutCubic(progress);

                if (suffix === '$') {
                    element.textContent = '$' + Math.floor(current).toLocaleString();
                } else if (suffix === 'h') {
                    element.textContent = Math.floor(current) + 'h';
                } else {
                    element.textContent = Math.floor(current) + suffix;
                }

                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };

            requestAnimationFrame(animate);
        } catch (error) {
            console.error('❌ Error animating value:', error);
            element.textContent = Math.floor(end) + suffix;
        }
    }

    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    handleNewsletter(e) {
        try {
            e.preventDefault();
            const emailInput = e.target.querySelector('input[type="email"]');

            if (!emailInput) return;

            const email = emailInput.value;

            if (email) {
                // Simple email validation
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (emailRegex.test(email)) {
                    this.showToast('success', 'Subscribed!', 'Thank you for subscribing to our newsletter.');
                    emailInput.value = '';
                } else {
                    this.showToast('error', 'Invalid Email', 'Please enter a valid email address.');
                }
            }
        } catch (error) {
            console.error('❌ Error handling newsletter:', error);
        }
    }

    handleKeyboard(e) {
        try {
            // Escape key to close modals
            if (e.key === 'Escape') {
                this.closeModals();
            }

            // Ctrl/Cmd + K to start demo tour
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.startDemoTour();
            }
        } catch (error) {
            console.error('❌ Error handling keyboard:', error);
        }
    }

    showToast(type, title, message, duration = 5000) {
        try {
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.innerHTML = `
                <div class="toast-content">
                    <div class="toast-title">${title}</div>
                    <div class="toast-message">${message}</div>
                </div>
                <button class="toast-close">&times;</button>
            `;

            let container = document.querySelector('.toast-container');
            if (!container) {
                container = document.createElement('div');
                container.className = 'toast-container';
                container.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 9999;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                `;
                document.body.appendChild(container);
            }

            container.appendChild(toast);

            // Close button event
            const closeBtn = toast.querySelector('.toast-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    this.removeToast(toast);
                });
            }

            // Auto remove
            setTimeout(() => {
                if (toast.parentNode) {
                    this.removeToast(toast);
                }
            }, duration);
        } catch (error) {
            console.error('❌ Error showing toast:', error);
        }
    }

    removeToast(toast) {
        try {
            if (toast && toast.parentNode) {
                toast.style.animation = 'toastOut 0.3s ease-out forwards';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }
        } catch (error) {
            console.error('❌ Error removing toast:', error);
        }
    }

    cleanup() {
        try {
            // Clear intervals
            this.animationIntervals.forEach(interval => clearInterval(interval));
            this.animationIntervals = [];

            // Disconnect observers
            this.observers.forEach(observer => observer.disconnect());
            this.observers = [];

            console.log('✅ DemoPage cleanup completed');
        } catch (error) {
            console.error('❌ Error during cleanup:', error);
        }
    }
}

// Additional CSS for tooltips and animations
const additionalStyles = `
.demo-tooltip {
    position: fixed;
    background: rgba(20, 20, 20, 0.95);
    color: white;
    padding: 1rem;
    border-radius: 8px;
    z-index: 1000;
    max-width: 300px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    animation: tooltipIn 0.3s ease-out;
    backdrop-filter: blur(10px);
}

@keyframes tooltipIn {
    from {
        opacity: 0;
        transform: translateY(10px) scale(0.9);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

@keyframes toastOut {
    to {
        opacity: 0;
        transform: translateX(100%);
    }
}

.tooltip-content {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
}

.toast {
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    padding: 1rem;
    min-width: 300px;
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    border-left: 4px solid #0066cc;
    animation: toastIn 0.3s ease-out;
}

.toast.success { border-left-color: #17a2b8; }
.toast.error { border-left-color: #dc3545; }
.toast.info { border-left-color: #0066cc; }

@keyframes toastIn {
    from {
        opacity: 0;
        transform: translateX(100%);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

.toast-content {
    flex: 1;
}

.toast-title {
    font-weight: 600;
    margin-bottom: 4px;
    color: #333;
}

.toast-message {
    font-size: 0.875rem;
    color: #666;
    margin: 0;
}

.toast-close {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    padding: 0;
    font-size: 1.25rem;
    line-height: 1;
    transition: color 0.15s ease;
}

.toast-close:hover {
    color: #333;
}
`;

// Add styles to document
try {
    const existingStyle = document.getElementById('demo-additional-styles');
    if (existingStyle) {
        existingStyle.remove();
    }

    const styleSheet = document.createElement('style');
    styleSheet.id = 'demo-additional-styles';
    styleSheet.textContent = additionalStyles;
    document.head.appendChild(styleSheet);
} catch (error) {
    console.error('❌ Error adding styles:', error);
}

// Export for global use
window.DemoPage = DemoPage;

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Only initialize if not already initialized
        if (!window.demoPageInstance) {
            window.demoPageInstance = new DemoPage();
        }
    });
} else {
    // DOM is already ready
    if (!window.demoPageInstance) {
        window.demoPageInstance = new DemoPage();
    }
}