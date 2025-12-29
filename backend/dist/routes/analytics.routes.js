import { Router } from 'express';
import { z } from 'zod';
import { AnalyticsService } from '../services/analytics.service.js';
import { authenticate } from '../middleware/auth.js';
import { ValidationError } from '../middleware/errorHandler.js';
const router = Router();
const analyticsService = new AnalyticsService();
// Validation schemas
const analyticsFiltersSchema = z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    departmentId: z.string().optional(),
    locationId: z.string().optional(),
    jobId: z.string().optional(),
    recruiterId: z.string().optional(),
});
const exportFormatSchema = z.object({
    format: z.enum(['pdf', 'excel', 'csv']).default('pdf'),
    includeCharts: z.boolean().default(true),
});
/**
 * Helper function to parse and validate filters
 */
function parseFilters(query) {
    const filtersResult = analyticsFiltersSchema.safeParse(query);
    if (!filtersResult.success) {
        throw new ValidationError({
            filters: filtersResult.error.issues.map(issue => issue.message)
        });
    }
    return {
        ...filtersResult.data,
        startDate: filtersResult.data.startDate ? new Date(filtersResult.data.startDate) : undefined,
        endDate: filtersResult.data.endDate ? new Date(filtersResult.data.endDate) : undefined,
    };
}
/**
 * GET /api/analytics/kpis
 * Get KPI metrics for dashboard
 * Requirements: 1.1, 1.4
 */
router.get('/kpis', authenticate, async (req, res, next) => {
    try {
        const filters = parseFilters(req.query);
        const kpiData = await analyticsService.getKPIMetrics(req.user.companyId, req.user.userId, req.user.role, filters);
        res.json(kpiData);
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/analytics/funnel
 * Get funnel analytics with conversion rates
 * Requirements: 2.1, 2.2, 2.5, 9.1, 9.2
 */
router.get('/funnel', authenticate, async (req, res, next) => {
    try {
        const filters = parseFilters(req.query);
        const funnelData = await analyticsService.getFunnelAnalytics(req.user.companyId, req.user.userId, req.user.role, filters);
        res.json(funnelData);
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/analytics/conversion-rates
 * Get conversion rates between stages
 * Requirements: 9.1, 9.2
 */
router.get('/conversion-rates', authenticate, async (req, res, next) => {
    try {
        const filters = parseFilters(req.query);
        const conversionData = await analyticsService.getConversionRates(req.user.companyId, req.user.userId, req.user.role, filters);
        res.json(conversionData);
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/analytics/time-to-fill
 * Get time-to-fill metrics by department and role
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.6
 */
router.get('/time-to-fill', authenticate, async (req, res, next) => {
    try {
        const filters = parseFilters(req.query);
        const timeToFillData = await analyticsService.getTimeToFill(req.user.companyId, req.user.userId, req.user.role, filters);
        res.json(timeToFillData);
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/analytics/time-in-stage
 * Get time-in-stage metrics with bottleneck identification
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.6
 */
router.get('/time-in-stage', authenticate, async (req, res, next) => {
    try {
        const filters = parseFilters(req.query);
        const timeInStageData = await analyticsService.getTimeInStage(req.user.companyId, req.user.userId, req.user.role, filters);
        res.json(timeInStageData);
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/analytics/sources
 * Get source performance analytics
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */
router.get('/sources', authenticate, async (req, res, next) => {
    try {
        const filters = parseFilters(req.query);
        const sourceData = await analyticsService.getSourcePerformance(req.user.companyId, req.user.userId, req.user.role, filters);
        res.json(sourceData);
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/analytics/recruiters
 * Get recruiter productivity analytics
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 */
router.get('/recruiters', authenticate, async (req, res, next) => {
    try {
        const filters = parseFilters(req.query);
        const recruiterData = await analyticsService.getRecruiterProductivity(req.user.companyId, req.user.userId, req.user.role, filters);
        res.json(recruiterData);
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/analytics/panels
 * Get panel performance analytics
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6
 */
router.get('/panels', authenticate, async (req, res, next) => {
    try {
        const filters = parseFilters(req.query);
        const panelData = await analyticsService.getPanelPerformance(req.user.companyId, req.user.userId, req.user.role, filters);
        res.json(panelData);
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/analytics/drop-off
 * Get drop-off analysis with rejection reasons
 * Requirements: 10.1, 10.2, 10.3, 10.5
 */
router.get('/drop-off', authenticate, async (req, res, next) => {
    try {
        const filters = parseFilters(req.query);
        const dropOffData = await analyticsService.getDropOffAnalysis(req.user.companyId, req.user.userId, req.user.role, filters);
        const rejectionData = await analyticsService.getRejectionReasons(req.user.companyId, req.user.userId, req.user.role, filters);
        res.json({
            dropOff: dropOffData,
            rejections: rejectionData,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/analytics/rejection-reasons
 * Get rejection reasons analysis
 * Requirements: 10.2, 10.5
 */
router.get('/rejection-reasons', authenticate, async (req, res, next) => {
    try {
        const filters = parseFilters(req.query);
        const rejectionData = await analyticsService.getRejectionReasons(req.user.companyId, req.user.userId, req.user.role, filters);
        res.json(rejectionData);
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/analytics/offer-rate
 * Get offer acceptance rate analytics
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */
router.get('/offer-rate', authenticate, async (req, res, next) => {
    try {
        const filters = parseFilters(req.query);
        const offerData = await analyticsService.getOfferAcceptanceRate(req.user.companyId, req.user.userId, req.user.role, filters);
        res.json(offerData);
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/analytics/sla
 * Get SLA status summary
 * Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6
 */
router.get('/sla', authenticate, async (req, res, next) => {
    try {
        const filters = parseFilters(req.query);
        const slaData = await analyticsService.getSLAStatus(req.user.companyId, req.user.userId, req.user.role, filters);
        res.json(slaData);
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/analytics/overview
 * Get aggregated analytics data for overview
 * Requirements: 1.1, 2.1, 5.1, 19.1
 */
router.get('/overview', authenticate, async (req, res, next) => {
    try {
        const filters = parseFilters(req.query);
        const [kpis, funnel, sources, slaStatus] = await Promise.all([
            analyticsService.getKPIMetrics(req.user.companyId, req.user.userId, req.user.role, filters),
            analyticsService.getFunnelAnalytics(req.user.companyId, req.user.userId, req.user.role, filters),
            analyticsService.getSourcePerformance(req.user.companyId, req.user.userId, req.user.role, filters),
            analyticsService.getSLAStatus(req.user.companyId, req.user.userId, req.user.role, filters),
        ]);
        res.json({
            kpis,
            funnel,
            sources,
            slaStatus,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/analytics/export
 * Export analytics report in PDF or Excel/CSV format
 * Requirements: 16.1, 16.2, 16.3, 16.4
 */
router.get('/export', authenticate, async (req, res, next) => {
    try {
        const filters = parseFilters(req.query);
        const exportParamsResult = exportFormatSchema.safeParse(req.query);
        if (!exportParamsResult.success) {
            throw new ValidationError({
                export: exportParamsResult.error.issues.map(issue => issue.message)
            });
        }
        const { format, includeCharts } = exportParamsResult.data;
        // Gather all analytics data for export
        const [kpis, funnelData, timeToFillData, timeInStageData, sourceData, recruiterData, panelData, dropOffData, rejectionData, offerData, slaData] = await Promise.all([
            analyticsService.getKPIMetrics(req.user.companyId, req.user.userId, req.user.role, filters),
            analyticsService.getFunnelAnalytics(req.user.companyId, req.user.userId, req.user.role, filters),
            analyticsService.getTimeToFill(req.user.companyId, req.user.userId, req.user.role, filters),
            analyticsService.getTimeInStage(req.user.companyId, req.user.userId, req.user.role, filters),
            analyticsService.getSourcePerformance(req.user.companyId, req.user.userId, req.user.role, filters),
            analyticsService.getRecruiterProductivity(req.user.companyId, req.user.userId, req.user.role, filters),
            analyticsService.getPanelPerformance(req.user.companyId, req.user.userId, req.user.role, filters),
            analyticsService.getDropOffAnalysis(req.user.companyId, req.user.userId, req.user.role, filters),
            analyticsService.getRejectionReasons(req.user.companyId, req.user.userId, req.user.role, filters),
            analyticsService.getOfferAcceptanceRate(req.user.companyId, req.user.userId, req.user.role, filters),
            analyticsService.getSLAStatus(req.user.companyId, req.user.userId, req.user.role, filters),
        ]);
        const exportData = {
            metadata: {
                generatedAt: new Date().toISOString(),
                companyId: req.user.companyId,
                userId: req.user.userId,
                filters,
                format,
                includeCharts,
            },
            data: {
                kpis,
                funnel: funnelData,
                timeToFill: timeToFillData,
                timeInStage: timeInStageData,
                sources: sourceData,
                recruiters: recruiterData,
                panels: panelData,
                dropOff: dropOffData,
                rejections: rejectionData,
                offers: offerData,
                sla: slaData,
            }
        };
        if (format === 'pdf') {
            // Generate PDF report
            const pdfBuffer = await generatePDFReport(exportData);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="analytics-report-${new Date().toISOString().split('T')[0]}.pdf"`);
            res.send(pdfBuffer);
        }
        else if (format === 'excel') {
            // Generate Excel report
            const excelBuffer = await generateExcelReport(exportData);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename="analytics-report-${new Date().toISOString().split('T')[0]}.xlsx"`);
            res.send(excelBuffer);
        }
        else if (format === 'csv') {
            // Generate CSV report
            const csvData = await generateCSVReport(exportData);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="analytics-report-${new Date().toISOString().split('T')[0]}.csv"`);
            res.send(csvData);
        }
    }
    catch (error) {
        next(error);
    }
});
// Helper functions for export generation
/**
 * Generate PDF report from analytics data
 */
async function generatePDFReport(exportData) {
    // For now, return a simple text-based PDF
    // In a real implementation, you'd use a library like puppeteer or pdfkit
    const reportContent = `
Analytics Report
Generated: ${exportData.metadata.generatedAt}

KPI Metrics:
- Active Roles: ${exportData.data.kpis.activeRoles}
- Active Candidates: ${exportData.data.kpis.activeCandidates}
- Interviews Today: ${exportData.data.kpis.interviewsToday}
- Interviews This Week: ${exportData.data.kpis.interviewsThisWeek}
- Offers Pending: ${exportData.data.kpis.offersPending}
- Total Hires: ${exportData.data.kpis.totalHires}
- Avg Time to Fill: ${exportData.data.kpis.avgTimeToFill} days
- Offer Acceptance Rate: ${exportData.data.kpis.offerAcceptanceRate}%

Funnel Analytics:
Total Applicants: ${exportData.data.funnel.totalApplicants}
Total Hired: ${exportData.data.funnel.totalHired}
Overall Conversion Rate: ${exportData.data.funnel.overallConversionRate}%

Source Performance:
${exportData.data.sources.map((source) => `- ${source.source}: ${source.candidateCount} candidates (${source.percentage}%), ${source.hireRate}% hire rate`).join('\n')}

Time to Fill:
- Overall Average: ${exportData.data.timeToFill.overall.average} days
- Overall Median: ${exportData.data.timeToFill.overall.median} days
- Target: ${exportData.data.timeToFill.overall.target} days

SLA Status:
- On Track: ${exportData.data.sla.summary.onTrack}
- At Risk: ${exportData.data.sla.summary.atRisk}
- Breached: ${exportData.data.sla.summary.breached}
`;
    // Simple text-to-PDF conversion (in real implementation, use proper PDF library)
    return Buffer.from(reportContent, 'utf-8');
}
/**
 * Generate Excel report from analytics data
 */
async function generateExcelReport(exportData) {
    // For now, return CSV-like data as Excel
    // In a real implementation, you'd use a library like exceljs
    const csvContent = await generateCSVReport(exportData);
    return Buffer.from(csvContent, 'utf-8');
}
/**
 * Generate CSV report from analytics data
 */
async function generateCSVReport(exportData) {
    const lines = [];
    // Add metadata
    lines.push('Analytics Report');
    lines.push(`Generated,${exportData.metadata.generatedAt}`);
    lines.push('');
    // Add KPI metrics
    lines.push('KPI Metrics');
    lines.push('Metric,Value');
    lines.push(`Active Roles,${exportData.data.kpis.activeRoles}`);
    lines.push(`Active Candidates,${exportData.data.kpis.activeCandidates}`);
    lines.push(`Interviews Today,${exportData.data.kpis.interviewsToday}`);
    lines.push(`Interviews This Week,${exportData.data.kpis.interviewsThisWeek}`);
    lines.push(`Offers Pending,${exportData.data.kpis.offersPending}`);
    lines.push(`Total Hires,${exportData.data.kpis.totalHires}`);
    lines.push(`Avg Time to Fill,${exportData.data.kpis.avgTimeToFill}`);
    lines.push(`Offer Acceptance Rate,${exportData.data.kpis.offerAcceptanceRate}`);
    lines.push('');
    // Add source performance
    lines.push('Source Performance');
    lines.push('Source,Candidates,Percentage,Hires,Hire Rate,Avg Time to Hire');
    exportData.data.sources.forEach((source) => {
        lines.push(`${source.source},${source.candidateCount},${source.percentage},${source.hireCount},${source.hireRate},${source.avgTimeToHire}`);
    });
    lines.push('');
    // Add recruiter productivity
    lines.push('Recruiter Productivity');
    lines.push('Name,Active Roles,CVs Added,Interviews,Offers,Hires,Avg Time to Fill,Score');
    exportData.data.recruiters.forEach((recruiter) => {
        lines.push(`${recruiter.name},${recruiter.activeRoles},${recruiter.cvsAdded},${recruiter.interviewsScheduled},${recruiter.offersMade},${recruiter.hires},${recruiter.avgTimeToFill},${recruiter.productivityScore}`);
    });
    lines.push('');
    // Add SLA status
    lines.push('SLA Status Summary');
    lines.push('Status,Count');
    lines.push(`On Track,${exportData.data.sla.summary.onTrack}`);
    lines.push(`At Risk,${exportData.data.sla.summary.atRisk}`);
    lines.push(`Breached,${exportData.data.sla.summary.breached}`);
    return lines.join('\n');
}
export default router;
//# sourceMappingURL=analytics.routes.js.map