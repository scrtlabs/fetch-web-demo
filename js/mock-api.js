/**
 * Mock API for Medical Diagnostics Platform
 * Simulates backend responses and generates realistic medical reports
 */

class MockAPI {
    /**
     * Simulate API request with realistic delays
     */
    static async simulateRequest(url, options = {}) {
        const delay = options.delay || (1000 + Math.random() * 3000); // 1-4 seconds

        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Simulate random failures (5% chance)
                if (Math.random() < 0.05) {
                    reject(new Error('Network error or server unavailable'));
                    return;
                }

                resolve({
                    ok: true,
                    status: 200,
                    json: () => Promise.resolve(options.response || {})
                });
            }, delay);
        });
    }

    /**
     * Generate sample diagnostic requests for demo
     */
    static getSampleRequests() {
        const sampleImages = [
            'mammogram_001.jpg',
            'mammogram_002.jpg',
            'mammogram_003.jpg',
            'breast_mri_001.jpg',
            'ultrasound_001.jpg'
        ];

        const sampleNotes = [
            'Routine annual screening mammogram for 45-year-old patient.',
            'Follow-up imaging after palpable lump detected during clinical exam.',
            'Screening mammogram with family history of breast cancer.',
            'Diagnostic imaging for breast pain and density assessment.',
            'Post-treatment follow-up imaging after benign biopsy.'
        ];

        const statuses = [
            { status: 'completed', weight: 3 },
            { status: 'pending', weight: 1 },
            { status: 'processing', weight: 1 },
            { status: 'failed', weight: 0.2 }
        ];

        return Array.from({ length: 5 }, (_, index) => {
            const timestamp = new Date(Date.now() - (index * 24 * 60 * 60 * 1000 + Math.random() * 12 * 60 * 60 * 1000));
            const status = this.weightedRandom(statuses);
            const filename = sampleImages[index % sampleImages.length];

            const request = {
                id: `REQ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
                timestamp: timestamp.toISOString(),
                status: status,
                filename: filename,
                fileSize: 2048000 + Math.random() * 3072000, // 2-5MB
                fileType: 'image/jpeg',
                imageData: this.generateSampleImageData(filename),
                apiKey: 'bWFzdGVyQHNjcnRsYWJzLmNvbTpTZWNyZXROZXR3b3JrTWFzdGVyS2V5X18yMDI1',
                note: sampleNotes[index % sampleNotes.length],
                progress: status === 'completed' ? 100 : status === 'failed' ? 0 : Math.floor(Math.random() * 90) + 10,
                report: status === 'completed' ? this.generateMedicalReport({
                    id: `REQ-${index}`,
                    filename: filename,
                    timestamp: timestamp.toISOString()
                }) : null,
                error: status === 'failed' ? 'Processing failed due to poor image quality' : null
            };

            return request;
        });
    }

    /**
     * Weighted random selection
     */
    static weightedRandom(items) {
        const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
        let random = Math.random() * totalWeight;

        for (const item of items) {
            random -= item.weight;
            if (random <= 0) {
                return item.status;
            }
        }

        return items[0].status;
    }

    /**
     * Generate sample image data URL
     */
    static generateSampleImageData(filename) {
        // Create a simple placeholder image using canvas
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');

        // Create gradient background
        const gradient = ctx.createLinearGradient(0, 0, 300, 200);
        gradient.addColorStop(0, '#f0f0f0');
        gradient.addColorStop(1, '#d0d0d0');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 300, 200);

        // Add some medical-looking shapes
        ctx.fillStyle = '#888';
        ctx.beginPath();
        ctx.arc(150, 100, 50, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#aaa';
        ctx.beginPath();
        ctx.arc(120, 80, 20, 0, Math.PI * 2);
        ctx.fill();

        // Add filename text
        ctx.fillStyle = '#333';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(filename, 150, 180);

        return canvas.toDataURL('image/jpeg', 0.8);
    }

    /**
     * Generate realistic medical report in markdown format
     */
    static generateMedicalReport(request) {
        const reportTemplates = [
            this.generateBreastDensityReport,
            this.generateRoutineScreeningReport,
            this.generateDiagnosticReport,
            this.generateFollowUpReport
        ];

        // const template = reportTemplates[Math.floor(Math.random() * reportTemplates.length)];
        const template = this.generateDiagnosticReport;
        return template.call(this, request);
    }

    /**
     * Generate breast density classification report
     */
    static generateBreastDensityReport(request) {
        const densityCategories = [
            { category: 'A', description: 'Almost entirely fatty', percentage: '5-10%' },
            { category: 'B', description: 'Scattered fibroglandular densities', percentage: '40-50%' },
            { category: 'C', description: 'Heterogeneously dense', percentage: '35-40%' },
            { category: 'D', description: 'Extremely dense', percentage: '5-10%' }
        ];

        const selectedDensity = densityCategories[Math.floor(Math.random() * densityCategories.length)];
        const reportDate = new Date(request.timestamp).toLocaleDateString();

        return `# Breast Density Analysis Report

## Patient Information
- **Report ID:** ${request.id}
- **Study Date:** ${reportDate}
- **Image File:** ${request.filename}
- **Analysis Method:** AI-Assisted Density Classification

## Executive Summary

This mammographic study has been analyzed using advanced artificial intelligence algorithms for breast density assessment. The analysis provides objective measurements and clinical correlations to support diagnostic decision-making.

## Breast Density Classification

### Primary Finding
**BI-RADS Density Category: ${selectedDensity.category}**
- **Description:** ${selectedDensity.description}
- **Population Prevalence:** ${selectedDensity.percentage}

### Detailed Analysis

The mammographic images demonstrate ${selectedDensity.description.toLowerCase()} breast tissue composition. This classification is based on the proportion of fibroglandular tissue relative to fatty tissue visible on the mammogram.

#### Quantitative Measurements
- **Fibroglandular Tissue:** ${Math.floor(Math.random() * 40) + 20}%
- **Fatty Tissue:** ${Math.floor(Math.random() * 40) + 40}%
- **Density Distribution:** ${Math.random() > 0.5 ? 'Symmetric' : 'Asymmetric'}

## Clinical Implications

### Screening Recommendations
${selectedDensity.category === 'C' || selectedDensity.category === 'D' ?
                `Given the dense breast tissue composition, consideration should be given to:
- **Supplemental Screening:** Breast ultrasound or MRI may be beneficial
- **Increased Vigilance:** Dense tissue can mask small lesions
- **Annual Follow-up:** Continued annual mammographic screening recommended` :
                `Standard screening protocols are appropriate:
- **Annual Mammography:** Continue routine annual screening
- **Self-Examination:** Monthly breast self-examinations
- **Clinical Examination:** Annual clinical breast examination`}

### Risk Assessment
${selectedDensity.category === 'C' || selectedDensity.category === 'D' ?
                `Dense breast tissue is associated with:
- **Increased Cancer Risk:** 1.2-2.1 fold increased risk
- **Masking Effect:** Potential for decreased mammographic sensitivity
- **Supplemental Screening:** May benefit from additional imaging modalities` :
                `Current breast density does not significantly impact:
- **Cancer Detection:** Standard mammography provides excellent sensitivity
- **Screening Interval:** Annual mammography remains appropriate`}

## Technical Details

### Image Quality Assessment
- **Positioning:** Adequate
- **Compression:** Appropriate
- **Contrast:** ${Math.random() > 0.3 ? 'Optimal' : 'Adequate'}
- **Artifacts:** ${Math.random() > 0.8 ? 'Minor motion artifact noted' : 'None detected'}

### AI Analysis Parameters
- **Algorithm Version:** v2.1.3
- **Confidence Score:** ${(Math.random() * 0.15 + 0.85).toFixed(3)}
- **Processing Time:** ${Math.floor(Math.random() * 45) + 15} seconds
- **Quality Metrics:** All parameters within acceptable ranges

## Recommendations

1. **Clinical Correlation:** Results should be correlated with physical examination findings
2. **Follow-up:** ${selectedDensity.category === 'C' || selectedDensity.category === 'D' ? 'Consider supplemental screening modalities' : 'Routine annual screening appropriate'}
3. **Patient Education:** Discuss breast density implications with patient
4. **Documentation:** Include density category in patient records

## Limitations

- Analysis based on digital mammographic images only
- Clinical correlation always recommended
- AI analysis supplements but does not replace radiologist interpretation
- Results may vary with technical factors and patient positioning

---

**Report generated by:** AI Diagnostic System  
**Analysis Date:** ${new Date().toLocaleDateString()}  
**Report ID:** ${request.id}

*This report is for demonstration purposes only and should not be used for actual medical diagnosis.*`;
    }

    /**
     * Generate routine screening report
     */
    static generateRoutineScreeningReport(request) {
        const findings = [
            'No suspicious masses or calcifications identified',
            'Benign-appearing calcifications noted',
            'Stable benign findings compared to prior studies',
            'Normal mammographic appearance for age'
        ];

        const selectedFinding = findings[Math.floor(Math.random() * findings.length)];
        const reportDate = new Date(request.timestamp).toLocaleDateString();
        const biradsCategory = Math.random() > 0.8 ? '2' : '1';

        return `# Routine Screening Mammography Report

## Study Information
- **Report ID:** ${request.id}
- **Examination Date:** ${reportDate}
- **Study Type:** Bilateral Digital Mammography
- **Clinical Indication:** Routine screening

## Clinical History
Asymptomatic patient presenting for routine annual mammographic screening. No current breast complaints or palpable abnormalities.

## Technique
Standard bilateral mammographic views obtained including:
- Craniocaudal (CC) projections bilaterally
- Mediolateral oblique (MLO) projections bilaterally

## Findings

### Breast Composition
Breast composition demonstrates heterogeneously dense fibroglandular tissue (BI-RADS C), which may lower the sensitivity of mammography.

### Mammographic Findings
**Right Breast:** ${selectedFinding}

**Left Breast:** ${selectedFinding}

No masses, architectural distortion, or suspicious calcifications are identified in either breast.

### Comparison
${Math.random() > 0.5 ? 'Current study shows stable appearance compared to prior mammogram from previous year.' : 'No prior studies available for comparison.'}

## Assessment

**BI-RADS Category ${biradsCategory}:** ${biradsCategory === '1' ? 'Negative' : 'Benign'}

${biradsCategory === '1' ?
                'No mammographic evidence of malignancy. Routine screening mammography is recommended.' :
                'Benign mammographic findings. Continue routine screening mammography.'}

## Recommendations

1. **Follow-up:** Routine annual screening mammography
2. **Self-examination:** Continue monthly breast self-examinations
3. **Clinical correlation:** Any new palpable findings should prompt clinical evaluation

## Quality Assurance
- Image quality: Adequate for diagnostic interpretation
- Positioning: Appropriate
- Compression: Adequate
- Patient cooperation: Excellent

---

**Interpreting Radiologist:** Dr. Sarah Johnson, MD  
**Report Date:** ${new Date().toLocaleDateString()}  
**Study ID:** ${request.id}

*This is a computer-generated sample report for demonstration purposes only.*`;
    }

    /**
    * Generate diagnostic mammography report using template
    */
    static generateDiagnosticReport(request) {
        const reportDate = new Date(request.timestamp).toLocaleDateString();
        const currentDate = new Date().toLocaleDateString();
        const currentTime = new Date().toLocaleTimeString();

        // Generate dynamic values for the report
        const probabilityScores = {
            benign: (Math.random() * 0.15 + 0.85).toFixed(4), // 0.85-1.0
            malignant: (Math.random() * 0.3 + 0.7).toFixed(4), // 0.7-1.0
            inflammatory: (Math.random() * 0.1).toFixed(4), // 0.0-0.1
            artefactual: (Math.random() * 0.05).toFixed(4) // 0.0-0.05
        };

        const noduleSize = Math.floor(Math.random() * 15) + 8; // 8-22mm
        const followUpMonths = Math.random() > 0.5 ? 3 : 6;

        // Template from assets/template.md with variable substitution
        const template = `# Medical Imaging Report

## Patient Information
- **Report ID:** ${request.id}
- **Study Date:** ${reportDate}
- **Report Generated:** ${currentDate} at ${currentTime}
- **Image File:** ${request.filename}
- **Analysis Method:** AI-Assisted Breast Density Classification

## Model Details

**Model Name:** Deep Convolutional Neural Network (DCNN) for Breast Density Classification
**Model Output:** Probabilistic scores across four categories: Benign (${probabilityScores.benign}), Malignant (${probabilityScores.malignant}), Inflammatory (${probabilityScores.inflammatory}), and Artefactual (${probabilityScores.artefactual})

## Findings
**Key Observation 1: High probability of Benign Classification**
- The model assigns a high probability score (${probabilityScores.benign}) to the category "Benign," indicating that the breast tissue characteristics, as analyzed by DCNN, are most consistent with normal fibroglandular tissue in this case.
- This finding suggests minimal risk for malignancy based on imaging features; however, clinical correlation and further evaluation remain crucial, as per BI-RADS guidelines (1).
- **Key Observation 2: Elevated probability consideration**
- Despite the dominant benign classification, the model also returns a notable score (${probabilityScores.malignant}) for tissue density assessment, indicating that some breast tissue features require careful consideration for screening recommendations.
- This elevated density probability mandates careful consideration of supplemental screening modalities, as dense breast tissue can mask potential lesions (2).
**Overall Assessment:**
- Given the model's output, this mammographic study is categorized primarily as showing normal breast tissue composition but with density characteristics that warrant ongoing surveillance. This classification reflects the complexity of radiological interpretation in breast imaging and necessitates appropriate follow-up recommendations.

## Clinical Context
**Breast Density Category:** ${['A - Almost entirely fatty', 'B - Scattered fibroglandular densities', 'C - Heterogeneously dense', 'D - Extremely dense'][Math.floor(Math.random() * 4)]}
**Tissue Composition:** Fibroglandular tissue comprises approximately ${Math.floor(Math.random() * 40) + 20}% of breast volume
**Bilateral Symmetry:** ${Math.random() > 0.3 ? 'Symmetric density distribution' : 'Mild asymmetric density noted'}

## Impression/Conclusion
**Summary of Key Observations:** The DCNN-based analysis indicates normal breast tissue composition (${(parseFloat(probabilityScores.benign) * 100).toFixed(1)}% probability) with appropriate density classification for patient age and demographics.
**Clinical Significance and Potential Implications:**
- Studies have shown that accurate density assessment is crucial for determining appropriate screening intervals and supplemental imaging needs (3).
- The model's classification supports standard screening protocols while highlighting the importance of individualized risk assessment based on breast density patterns (4).
**Screening Recommendations:** Current imaging demonstrates findings appropriate for routine screening mammography with consideration of breast density in determining screening strategy.
**Recommendations for Further Evaluation/Follow-up:**
- Continue routine annual screening mammography as clinically indicated (1).
- Consider discussion of supplemental screening options if breast density warrants additional evaluation (5).

## Recommendations
**Screening Protocol:** Annual bilateral mammography recommended per current guidelines
**Supplemental Imaging:** ${parseFloat(probabilityScores.benign) < 0.9 ? 'Consider breast ultrasound or MRI if clinically indicated' : 'Standard mammographic screening sufficient at this time'}
**Clinical Follow-up:** Routine clinical breast examination and patient education regarding breast self-awareness
**Next Study:** Recommend follow-up mammography in 12 months unless clinical changes warrant earlier evaluation

## Technical Quality Assessment
**Image Quality:** ${Math.random() > 0.2 ? 'Adequate for diagnostic interpretation' : 'Good technical quality with optimal positioning'}
**Positioning:** ${Math.random() > 0.15 ? 'Appropriate' : 'Adequate with minor positioning considerations'}
**Compression:** Adequate breast compression achieved
**Artifacts:** ${Math.random() > 0.8 ? 'Minimal motion artifact noted' : 'No significant artifacts identified'}

## Limitations
**Factors Limiting Interpretation:** This report relies on AI-assisted analysis and should be correlated with clinical findings and radiologist interpretation.
**Inherent Model Limitations:** The DCNN's performance may be affected by image quality, positioning, and individual patient factors that require clinical correlation.
**Clinical Context Required:** Automated classification should always be interpreted within the context of patient history, physical examination, and clinical risk factors.

## Quality Assurance
**Algorithm Version:** DCNN v2.1.3
**Processing Time:** ${Math.floor(Math.random() * 45) + 15} seconds
**Confidence Metrics:** All quality parameters within acceptable ranges
**Validation Status:** Model performance validated on diverse dataset representative of screening population

## References
1. D'Orsi CJ, et al. (2013). ACR BI-RADS Atlas, Breast Imaging Reporting and Data System. Reston, VA: American College of Radiology.
2. Boyd NF, et al. (2007). Mammographic breast density as an intermediate phenotype for breast cancer. Lancet Oncol, 8(12), 1072-1081.
3. Kerlikowske K, et al. (2010). Identifying women with dense breasts at high risk for interval cancer: a cohort study. Ann Intern Med, 152(1), 10-17.
4. McCormack VA, et al. (2006). Breast density and parenchymal patterns as markers of breast cancer risk: a meta-analysis. Cancer Epidemiol Biomarkers Prev, 15(6), 1159-1169.
5. Berg WA, et al. (2012). Detection of breast cancer with addition of annual screening ultrasound or a single screening MRI to mammography in women with elevated breast cancer risk. JAMA, 307(13), 1394-1404.

---

**Report Status:** ${request.status === 'completed' ? 'Final Report' : 'Preliminary Analysis'}  
**Generated:** ${currentDate} ${currentTime}  
**Report ID:** ${request.id}  
**System:** Medical Diagnostics Platform v2.1.3

*This report has been generated using AI-assisted analysis for demonstration purposes. In clinical practice, all AI-generated reports should be reviewed and validated by qualified medical professionals.*`;

        return template;
    }

    /**
     * Generate follow-up report
     */
    static generateFollowUpReport(request) {
        const comparisonResults = [
            'stable appearance',
            'decreased in size',
            'slight increase in size',
            'no significant change'
        ];

        const comparison = comparisonResults[Math.floor(Math.random() * comparisonResults.length)];
        const reportDate = new Date(request.timestamp).toLocaleDateString();
        const priorDate = new Date(Date.now() - (6 * 30 * 24 * 60 * 60 * 1000)).toLocaleDateString(); // 6 months ago

        return `# Follow-up Mammography Report

## Study Information
- **Report ID:** ${request.id}
- **Current Study Date:** ${reportDate}
- **Prior Study Date:** ${priorDate}
- **Study Type:** Bilateral mammography with comparison

## Clinical Indication
Follow-up examination for previously identified benign-appearing finding in the right breast.

## Comparison Studies
Current examination compared to mammography dated ${priorDate}.

## Current Findings

### Breast Composition
Breast composition demonstrates scattered fibroglandular densities, unchanged from prior study.

### Right Breast
The previously noted ${Math.random() > 0.5 ? 'oval mass' : 'focal asymmetry'} in the upper inner quadrant shows ${comparison} compared to the prior examination.

**Current measurements:** ${Math.floor(Math.random() * 12) + 6} mm (prior: ${Math.floor(Math.random() * 12) + 6} mm)

### Left Breast
No mammographic abnormalities. Stable appearance compared to prior study.

## Interval Changes
${comparison === 'stable appearance' || comparison === 'no significant change' ?
                'No significant interval changes identified. Findings remain stable and benign-appearing.' :
                comparison === 'decreased in size' ?
                    'Interval decrease in size of the previously noted finding, consistent with benign etiology.' :
                    'Slight interval increase noted. While this may represent normal tissue variation, continued surveillance is recommended.'}

## Assessment

**BI-RADS Category:** ${comparison === 'slight increase in size' ? '3' : '2'}

${comparison === 'slight increase in size' ?
                'Probably benign finding with slight interval change. Continued short-term follow-up recommended.' :
                'Benign mammographic findings. Return to routine screening appropriate.'}

## Recommendations

${comparison === 'slight increase in size' ?
                'Continue short-term mammographic follow-up in 6 months to ensure continued stability.' :
                'Return to routine annual screening mammography. No additional follow-up required for the previously noted finding.'}

## Comparison Summary
- Prior finding: Present and stable
- New findings: None identified
- Overall assessment: ${comparison === 'slight increase in size' ? 'Continued surveillance needed' : 'Return to routine screening'}

---

**Interpreting Physician:** Dr. Lisa Rodriguez, MD  
**Report Generated:** ${new Date().toLocaleDateString()}  
**Report ID:** ${request.id}

*Computer-generated follow-up report for demonstration purposes only.*`;
    }

    /**
     * Simulate file upload to backend
     */
    static async uploadFile(file, apiKey, note, reportId) {
        const formData = new FormData();
        formData.append('file', file);

        const requestBody = {
            format: 'markdown',
            report_id: reportId,
            note: note
        };

        // Simulate the curl request structure
        const response = await this.simulateRequest('/predict/breast-density', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'multipart/form-data'
            },
            body: formData,
            data: requestBody,
            delay: 5000 + Math.random() * 10000, // 5-15 seconds
            response: {
                success: true,
                request_id: reportId,
                status: 'processing',
                message: 'File uploaded successfully and analysis started'
            }
        });

        return response.json();
    }

    /**
     * Check processing status
     */
    static async checkStatus(requestId) {
        const statuses = ['processing', 'analyzing', 'generating_report', 'completed'];
        const currentStatus = statuses[Math.floor(Math.random() * statuses.length)];

        const response = await this.simulateRequest(`/status/${requestId}`, {
            delay: 1000,
            response: {
                request_id: requestId,
                status: currentStatus,
                progress: Math.floor(Math.random() * 100),
                estimated_completion: currentStatus === 'completed' ? null : '2-5 minutes'
            }
        });

        return response.json();
    }

    /**
     * Get completed report
     */
    static async getReport(requestId) {
        const request = { id: requestId, filename: 'sample.jpg', timestamp: new Date().toISOString() };
        const report = this.generateMedicalReport(request);

        const response = await this.simulateRequest(`/report/${requestId}`, {
            delay: 500,
            response: {
                request_id: requestId,
                status: 'completed',
                report: report,
                format: 'markdown',
                generated_at: new Date().toISOString()
            }
        });

        return response.json();
    }

    /**
     * Validate API key format
     */
    static validateApiKey(apiKey) {
        // Simple validation for demo purposes
        if (!apiKey || apiKey.length < 20) {
            return {
                valid: false,
                error: 'API key must be at least 20 characters long'
            };
        }

        // Check for base64-like pattern
        const base64Pattern = /^[A-Za-z0-9+/]+=*$/;
        if (!base64Pattern.test(apiKey)) {
            return {
                valid: false,
                error: 'API key format appears invalid'
            };
        }

        return {
            valid: true,
            message: 'API key format is valid'
        };
    }

    /**
     * Generate error responses for testing
     */
    static generateError(type = 'random') {
        const errors = {
            auth: {
                status: 401,
                error: 'Authentication failed',
                message: 'Invalid API key or expired token'
            },
            file_format: {
                status: 400,
                error: 'Invalid file format',
                message: 'Only JPEG, PNG, and DICOM files are supported'
            },
            file_size: {
                status: 413,
                error: 'File too large',
                message: 'Maximum file size is 50MB'
            },
            server_error: {
                status: 500,
                error: 'Internal server error',
                message: 'Analysis service temporarily unavailable'
            },
            network: {
                status: 503,
                error: 'Service unavailable',
                message: 'Unable to connect to analysis service'
            }
        };

        if (type === 'random') {
            const errorTypes = Object.keys(errors);
            type = errorTypes[Math.floor(Math.random() * errorTypes.length)];
        }

        return errors[type] || errors.server_error;
    }

    /**
     * Simulate network conditions
     */
    static simulateNetworkConditions(condition = 'normal') {
        const conditions = {
            fast: { delay: 500, failureRate: 0.01 },
            normal: { delay: 2000, failureRate: 0.05 },
            slow: { delay: 8000, failureRate: 0.15 },
            unreliable: { delay: 5000, failureRate: 0.25 }
        };

        return conditions[condition] || conditions.normal;
    }
}