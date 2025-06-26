/**
 * Enhanced Markdown Renderer for Medical Reports
 * Provides medical-specific formatting and rendering
 */

class MarkdownRenderer {
    constructor(options = {}) {
        this.options = {
            medicalFormatting: true,
            tableSupport: true,
            codeHighlighting: true,
            linkProcessing: true,
            ...options
        };
    }

    /**
     * Render markdown to HTML with medical formatting
     */
    render(markdown) {
        if (!markdown) return '';

        let html = markdown;

        // Process in order of complexity
        html = this.processCodeBlocks(html);
        html = this.processTables(html);
        html = this.processHeaders(html);
        html = this.processLists(html);
        html = this.processBlockquotes(html);
        html = this.processInlineFormatting(html);
        html = this.processLinks(html);
        html = this.processParagraphs(html);
        html = this.processMedicalSections(html);

        return html;
    }

    /**
     * Process code blocks and inline code
     */
    processCodeBlocks(text) {
        // Multi-line code blocks
        text = text.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
            const lang = language || '';
            return `<pre class="code-block ${lang}"><code>${this.escapeHtml(code.trim())}</code></pre>`;
        });

        // Inline code
        text = text.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

        return text;
    }

    /**
     * Process markdown tables
     */
    processTables(text) {
        if (!this.options.tableSupport) return text;

        // Simple table processing
        const tableRegex = /\n(\|.+\|\n)+\|[-\s|]+\|\n(\|.+\|\n)+/g;

        return text.replace(tableRegex, (match) => {
            const lines = match.trim().split('\n');
            const headerLine = lines[0];
            const separatorLine = lines[1];
            const dataLines = lines.slice(2);

            // Parse header
            const headers = headerLine.split('|').slice(1, -1).map(h => h.trim());

            // Parse data rows
            const rows = dataLines.map(line =>
                line.split('|').slice(1, -1).map(cell => cell.trim())
            );

            // Build table HTML
            let tableHtml = '<table class="medical-table">\n<thead>\n<tr>\n';
            headers.forEach(header => {
                tableHtml += `<th>${header}</th>\n`;
            });
            tableHtml += '</tr>\n</thead>\n<tbody>\n';

            rows.forEach(row => {
                tableHtml += '<tr>\n';
                row.forEach(cell => {
                    tableHtml += `<td>${this.processInlineFormatting(cell)}</td>\n`;
                });
                tableHtml += '</tr>\n';
            });

            tableHtml += '</tbody>\n</table>\n';
            return tableHtml;
        });
    }

    /**
     * Process headers with medical styling
     */
    processHeaders(text) {
        // H1
        text = text.replace(/^# (.+)$/gm, '<h1 class="medical-h1">$1</h1>');

        // H2
        text = text.replace(/^## (.+)$/gm, '<h2 class="medical-h2">$1</h2>');

        // H3
        text = text.replace(/^### (.+)$/gm, '<h3 class="medical-h3">$1</h3>');

        // H4
        text = text.replace(/^#### (.+)$/gm, '<h4 class="medical-h4">$1</h4>');

        // H5
        text = text.replace(/^##### (.+)$/gm, '<h5 class="medical-h5">$1</h5>');

        // H6
        text = text.replace(/^###### (.+)$/gm, '<h6 class="medical-h6">$1</h6>');

        return text;
    }

    /**
     * Process lists (ordered and unordered)
     */
    processLists(text) {
        // Unordered lists
        text = text.replace(/(?:^|\n)((?:[ ]*[-*+][ ]+.+(?:\n|$))+)/g, (match, listContent) => {
            const items = listContent.trim().split('\n').map(line => {
                const content = line.replace(/^[ ]*[-*+][ ]+/, '');
                return `<li>${this.processInlineFormatting(content)}</li>`;
            }).join('\n');

            return `\n<ul class="medical-list">\n${items}\n</ul>\n`;
        });

        // Ordered lists
        text = text.replace(/(?:^|\n)((?:[ ]*\d+\.[ ]+.+(?:\n|$))+)/g, (match, listContent) => {
            const items = listContent.trim().split('\n').map(line => {
                const content = line.replace(/^[ ]*\d+\.[ ]+/, '');
                return `<li>${this.processInlineFormatting(content)}</li>`;
            }).join('\n');

            return `\n<ol class="medical-list">\n${items}\n</ol>\n`;
        });

        return text;
    }

    /**
     * Process blockquotes
     */
    processBlockquotes(text) {
        text = text.replace(/^> (.+)$/gm, '<blockquote class="medical-quote">$1</blockquote>');
        return text;
    }

    /**
     * Process inline formatting (bold, italic, etc.)
     */
    processInlineFormatting(text) {
        // Bold
        text = text.replace(/\*\*([^*]+)\*\*/g, '<strong class="medical-bold">$1</strong>');
        text = text.replace(/__([^_]+)__/g, '<strong class="medical-bold">$1</strong>');

        // Italic
        text = text.replace(/\*([^*]+)\*/g, '<em class="medical-italic">$1</em>');
        text = text.replace(/_([^_]+)_/g, '<em class="medical-italic">$1</em>');

        // Strikethrough
        text = text.replace(/~~([^~]+)~~/g, '<del class="medical-strikethrough">$1</del>');

        return text;
    }

    /**
     * Process links
     */
    processLinks(text) {
        if (!this.options.linkProcessing) return text;

        // Markdown links [text](url)
        text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="medical-link" target="_blank">$1</a>');

        // Auto-link URLs
        text = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" class="medical-link" target="_blank">$1</a>');

        return text;
    }

    /**
     * Process paragraphs
     */
    processParagraphs(text) {
        // Split by double newlines and wrap non-HTML content in paragraphs
        const blocks = text.split(/\n\s*\n/);

        return blocks.map(block => {
            block = block.trim();
            if (!block) return '';

            // Don't wrap block elements in paragraphs
            if (this.isBlockElement(block)) {
                return block;
            }

            return `<p class="medical-paragraph">${block}</p>`;
        }).join('\n\n');
    }

    /**
     * Process medical-specific sections and formatting
     */
    processMedicalSections(text) {
        if (!this.options.medicalFormatting) return text;

        // BI-RADS categories
        text = text.replace(/BI-RADS\s+(\d[A-Z]?)/g, '<span class="birads-category">BI-RADS $1</span>');

        // Medical measurements
        text = text.replace(/(\d+(?:\.\d+)?)\s*(mm|cm|kg|lbs|mg|ml)/g, '<span class="medical-measurement">$1 $2</span>');

        // Percentages
        text = text.replace(/(\d+(?:\.\d+)?)\s*%/g, '<span class="medical-percentage">$1%</span>');

        // Medical findings sections
        text = text.replace(/\*\*(Assessment|Findings|Recommendations|Impression|Conclusion):\*\*/g,
            '<h4 class="medical-section-header">$1:</h4>');

        // Risk indicators
        text = text.replace(/\b(low|moderate|high)\s+risk\b/gi, (match, level) => {
            return `<span class="risk-indicator risk-${level.toLowerCase()}">${match}</span>`;
        });

        // Severity indicators
        text = text.replace(/\b(mild|moderate|severe|critical)\b/gi, (match, severity) => {
            return `<span class="severity-indicator severity-${severity.toLowerCase()}">${match}</span>`;
        });

        return text;
    }

    /**
     * Check if a text block is a block element
     */
    isBlockElement(text) {
        const blockElements = [
            'div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'ul', 'ol', 'li', 'blockquote', 'pre', 'table',
            'thead', 'tbody', 'tr', 'th', 'td'
        ];

        return blockElements.some(tag =>
            text.startsWith(`<${tag}`) || text.startsWith(`</${tag}`)
        );
    }

    /**
     * Escape HTML entities
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Render medical report with enhanced formatting
     */
    renderMedicalReport(markdown) {
        const html = this.render(markdown);

        // Wrap in medical report container
        return `<div class="medical-report-content">${html}</div>`;
    }

    /**
     * Extract table of contents from markdown
     */
    extractTableOfContents(markdown) {
        const headers = [];
        const headerRegex = /^(#{1,6})\s+(.+)$/gm;
        let match;

        while ((match = headerRegex.exec(markdown)) !== null) {
            const level = match[1].length;
            const title = match[2].trim();
            const id = this.generateHeaderId(title);

            headers.push({
                level,
                title,
                id,
                anchor: `#${id}`
            });
        }

        return headers;
    }

    /**
     * Generate header ID for table of contents
     */
    generateHeaderId(title) {
        return title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    /**
     * Render table of contents
     */
    renderTableOfContents(headers) {
        if (!headers || headers.length === 0) return '';

        let html = '<nav class="table-of-contents"><h4>Table of Contents</h4><ul>';

        headers.forEach(header => {
            const indent = 'toc-level-' + header.level;
            html += `<li class="${indent}"><a href="${header.anchor}">${header.title}</a></li>`;
        });

        html += '</ul></nav>';
        return html;
    }

    /**
     * Add syntax highlighting to code blocks
     */
    highlightCode(code, language) {
        // Simple syntax highlighting for common languages
        if (!language) return this.escapeHtml(code);

        switch (language.toLowerCase()) {
            case 'json':
                return this.highlightJson(code);
            case 'xml':
            case 'html':
                return this.highlightXml(code);
            default:
                return this.escapeHtml(code);
        }
    }

    /**
     * Simple JSON syntax highlighting
     */
    highlightJson(code) {
        let highlighted = this.escapeHtml(code);

        // Strings
        highlighted = highlighted.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, '<span class="json-string">"$1"</span>');

        // Numbers
        highlighted = highlighted.replace(/:\s*(-?\d+\.?\d*)/g, ': <span class="json-number">$1</span>');

        // Booleans
        highlighted = highlighted.replace(/\b(true|false)\b/g, '<span class="json-boolean">$1</span>');

        // Null
        highlighted = highlighted.replace(/\bnull\b/g, '<span class="json-null">null</span>');

        return highlighted;
    }

    /**
     * Simple XML/HTML syntax highlighting
     */
    highlightXml(code) {
        let highlighted = this.escapeHtml(code);

        // Tags
        highlighted = highlighted.replace(/&lt;(\/?[^&gt;]+)&gt;/g, '&lt;<span class="xml-tag">$1</span>&gt;');

        // Attributes
        highlighted = highlighted.replace(/(\w+)=("[^"]*")/g, '<span class="xml-attr">$1</span>=<span class="xml-value">$2</span>');

        return highlighted;
    }
}

/**
 * Medical Report Formatter
 * Specialized formatter for medical diagnostic reports
 */
class MedicalReportFormatter {
    constructor() {
        this.renderer = new MarkdownRenderer({
            medicalFormatting: true,
            tableSupport: true,
            codeHighlighting: false
        });
    }

    /**
     * Format a complete medical report
     */
    formatReport(reportData) {
        const { markdown, metadata = {} } = reportData;

        const html = this.renderer.renderMedicalReport(markdown);
        const toc = this.generateTableOfContents(markdown);

        return {
            html,
            toc,
            metadata: this.formatMetadata(metadata),
            wordCount: this.getWordCount(markdown),
            readingTime: this.estimateReadingTime(markdown)
        };
    }

    /**
     * Generate enhanced table of contents
     */
    generateTableOfContents(markdown) {
        const headers = this.renderer.extractTableOfContents(markdown);
        return this.renderer.renderTableOfContents(headers);
    }

    /**
     * Format report metadata
     */
    formatMetadata(metadata) {
        return {
            reportId: metadata.reportId || 'N/A',
            patientId: metadata.patientId || 'Anonymous',
            studyDate: metadata.studyDate ? new Date(metadata.studyDate).toLocaleDateString() : new Date().toLocaleDateString(),
            modality: metadata.modality || 'Unknown',
            physician: metadata.physician || 'AI System',
            ...metadata
        };
    }

    /**
     * Get word count from markdown
     */
    getWordCount(markdown) {
        // Remove markdown syntax and count words
        const plainText = markdown
            .replace(/[#*_`~\[\]()]/g, '')
            .replace(/\n+/g, ' ')
            .trim();

        return plainText ? plainText.split(/\s+/).length : 0;
    }

    /**
     * Estimate reading time (average 200 words per minute)
     */
    estimateReadingTime(markdown) {
        const wordCount = this.getWordCount(markdown);
        const minutes = Math.ceil(wordCount / 200);
        return minutes === 1 ? '1 minute' : `${minutes} minutes`;
    }

    /**
     * Extract key findings from report
     */
    extractKeyFindings(markdown) {
        const findings = [];

        // Look for common medical findings patterns
        const patterns = [
            /(?:Finding|Observation|Result):\s*(.+)/gi,
            /BI-RADS\s+(\d[A-Z]?)\s*:\s*(.+)/gi,
            /Assessment:\s*(.+)/gi,
            /Impression:\s*(.+)/gi
        ];

        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(markdown)) !== null) {
                findings.push({
                    type: 'finding',
                    content: match[1] || match[2],
                    context: match[0]
                });
            }
        });

        return findings;
    }

    /**
     * Generate report summary
     */
    generateSummary(markdown, maxLength = 200) {
        // Extract first paragraph or executive summary
        const summaryMatch = markdown.match(/(?:Executive Summary|Summary|Abstract)[:\n]+([\s\S]*?)(?:\n#{1,6}|\n\n|$)/i);

        let summary = summaryMatch ? summaryMatch[1].trim() : '';

        if (!summary) {
            // Fall back to first substantial paragraph
            const paragraphs = markdown.split(/\n\s*\n/).filter(p => p.trim().length > 50);
            summary = paragraphs[0] || '';
        }

        // Clean up and truncate
        summary = summary
            .replace(/[#*_`~\[\]()]/g, '')
            .replace(/\n+/g, ' ')
            .trim();

        if (summary.length > maxLength) {
            summary = summary.substring(0, maxLength).replace(/\s+\w*$/, '') + '...';
        }

        return summary;
    }

    /**
     * Validate report content
     */
    validateReport(markdown) {
        const issues = [];

        // Check for required sections
        const requiredSections = [
            'Patient Information',
            'Findings',
            'Assessment',
            'Recommendations'
        ];

        requiredSections.forEach(section => {
            if (!markdown.toLowerCase().includes(section.toLowerCase())) {
                issues.push({
                    type: 'missing_section',
                    message: `Missing required section: ${section}`,
                    severity: 'warning'
                });
            }
        });

        // Check for BI-RADS category
        if (markdown.toLowerCase().includes('mammogr') && !markdown.includes('BI-RADS')) {
            issues.push({
                type: 'missing_birads',
                message: 'Mammography report should include BI-RADS category',
                severity: 'warning'
            });
        }

        // Check report length
        const wordCount = this.getWordCount(markdown);
        if (wordCount < 100) {
            issues.push({
                type: 'too_short',
                message: 'Report appears to be too brief for a complete medical report',
                severity: 'info'
            });
        }

        return {
            isValid: issues.filter(i => i.severity === 'error').length === 0,
            issues,
            wordCount
        };
    }
}

/**
 * Report Export Utilities
 */
class ReportExporter {
    constructor() {
        this.formatter = new MedicalReportFormatter();
    }

    /**
     * Export report as PDF (using browser print)
     */
    exportToPDF(reportData, filename = 'medical_report.pdf') {
        const { html, metadata } = this.formatter.formatReport(reportData);

        const printWindow = window.open('', '_blank');
        printWindow.document.write(this.generatePrintableHTML(html, metadata));
        printWindow.document.close();
        printWindow.focus();

        setTimeout(() => {
            printWindow.print();
        }, 250);
    }

    /**
     * Export report as markdown file
     */
    exportToMarkdown(reportData, filename = 'medical_report.md') {
        const blob = new Blob([reportData.markdown], { type: 'text/markdown' });
        this.downloadBlob(blob, filename);
    }

    /**
     * Export report as HTML file
     */
    exportToHTML(reportData, filename = 'medical_report.html') {
        const { html, metadata } = this.formatter.formatReport(reportData);
        const fullHTML = this.generateStandaloneHTML(html, metadata);

        const blob = new Blob([fullHTML], { type: 'text/html' });
        this.downloadBlob(blob, filename);
    }

    /**
     * Export report as JSON
     */
    exportToJSON(reportData, filename = 'medical_report.json') {
        const formatted = this.formatter.formatReport(reportData);
        const exportData = {
            ...reportData,
            formatted,
            exportedAt: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        this.downloadBlob(blob, filename);
    }

    /**
     * Generate printable HTML
     */
    generatePrintableHTML(html, metadata) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Medical Report - ${metadata.reportId}</title>
                <style>
                    ${this.getPrintStyles()}
                </style>
            </head>
            <body>
                <div class="print-header">
                    <h1>Medical Diagnostic Report</h1>
                    <div class="metadata">
                        <p><strong>Report ID:</strong> ${metadata.reportId}</p>
                        <p><strong>Date:</strong> ${metadata.studyDate}</p>
                        <p><strong>Physician:</strong> ${metadata.physician}</p>
                    </div>
                </div>
                <div class="report-content">
                    ${html}
                </div>
                <div class="print-footer">
                    <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Generate standalone HTML file
     */
    generateStandaloneHTML(html, metadata) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Medical Report - ${metadata.reportId}</title>
                <style>
                    ${this.getStandaloneStyles()}
                </style>
            </head>
            <body>
                <div class="container">
                    <header class="report-header">
                        <h1>Medical Diagnostic Report</h1>
                        <div class="metadata-grid">
                            <div><strong>Report ID:</strong> ${metadata.reportId}</div>
                            <div><strong>Date:</strong> ${metadata.studyDate}</div>
                            <div><strong>Physician:</strong> ${metadata.physician}</div>
                            <div><strong>Reading Time:</strong> ${metadata.readingTime || 'N/A'}</div>
                        </div>
                    </header>
                    <main class="report-content">
                        ${html}
                    </main>
                    <footer class="report-footer">
                        <p>This report was generated electronically and is valid without signature.</p>
                        <p>Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</p>
                    </footer>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Get print-specific CSS styles
     */
    getPrintStyles() {
        return `
            @media print {
                body { margin: 0; font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.4; }
                .print-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
                .print-header h1 { margin: 0; color: #333; }
                .metadata { margin-top: 15px; }
                .metadata p { margin: 5px 0; }
                .report-content { margin: 20px 0; }
                .print-footer { margin-top: 30px; text-align: center; font-size: 10pt; color: #666; border-top: 1px solid #ccc; padding-top: 15px; }
                h1, h2, h3 { color: #333; page-break-after: avoid; }
                p { page-break-inside: avoid; }
                table { page-break-inside: avoid; }
                .medical-report-content h1 { font-size: 16pt; }
                .medical-report-content h2 { font-size: 14pt; }
                .medical-report-content h3 { font-size: 12pt; }
                .medical-report-content p { margin-bottom: 10pt; }
            }
            body { font-family: Arial, sans-serif; line-height: 1.6; }
        `;
    }

    /**
     * Get standalone HTML CSS styles
     */
    getStandaloneStyles() {
        return `
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; background: #f5f7fa; }
            .container { max-width: 800px; margin: 20px auto; background: white; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-radius: 8px; }
            .report-header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #0066cc; }
            .report-header h1 { color: #0066cc; margin-bottom: 20px; }
            .metadata-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 20px; }
            .report-content { margin: 40px 0; }
            .report-footer { margin-top: 40px; text-align: center; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
            .medical-report-content h1 { color: #0066cc; border-bottom: 2px solid #e3f2fd; padding-bottom: 10px; }
            .medical-report-content h2 { color: #0066cc; border-bottom: 1px solid #e3f2fd; padding-bottom: 8px; }
            .medical-report-content h3 { color: #0066cc; }
            .medical-report-content p { margin-bottom: 16px; line-height: 1.7; }
            .medical-report-content table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .medical-report-content th, .medical-report-content td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            .medical-report-content th { background: #e3f2fd; color: #0066cc; font-weight: 600; }
            .medical-report-content blockquote { background: #e3f2fd; border-left: 4px solid #0066cc; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0; }
            .medical-report-content code { background: #f5f7fa; padding: 2px 6px; border-radius: 4px; font-family: Monaco, monospace; }
            .medical-report-content strong { color: #1976d2; }
            @media (max-width: 768px) {
                .container { margin: 10px; padding: 20px; }
                .metadata-grid { grid-template-columns: 1fr; }
            }
        `;
    }

    /**
     * Download blob as file
     */
    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}

// Export classes for global use
window.MarkdownRenderer = MarkdownRenderer;
window.MedicalReportFormatter = MedicalReportFormatter;
window.ReportExporter = ReportExporter;