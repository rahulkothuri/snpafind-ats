import { Router, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AnalyticsService } from '../services/analytics.service.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { ValidationError } from '../middleware/errorHandler.js';
import prisma from '../lib/prisma.js';
import PdfPrinter from 'pdfmake';
import ExcelJS from 'exceljs';
import type { TDocumentDefinitions, Content, TableCell } from 'pdfmake/interfaces';

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
function parseFilters(query: any) {
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
 * GET /api/analytics/filter-options
 * Get filter options for analytics dashboard (departments, locations, jobs, recruiters)
 * Requirements: 9.1 - Fetch departments, locations, jobs, and recruiters from database
 */
router.get(
  '/filter-options',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Fetch jobs for the company
      const jobs = await prisma.job.findMany({
        where: {
          companyId: req.user!.companyId,
        },
        select: {
          id: true,
          title: true,
          jobDomain: true,
          locations: true,
          location: true, // Legacy field
        },
      });

      // Fetch recruiters (users with recruiter or hiring_manager role)
      const recruiters = await prisma.user.findMany({
        where: {
          companyId: req.user!.companyId,
          role: {
            in: ['recruiter', 'hiring_manager', 'admin'],
          },
          isActive: true,
        },
        select: {
          id: true,
          name: true,
        },
      });

      // Extract unique departments (jobDomain) from jobs
      const departmentSet = new Set<string>();
      const locationSet = new Set<string>();

      jobs.forEach((job) => {
        if (job.jobDomain) {
          departmentSet.add(job.jobDomain);
        }
        // Handle both locations array and legacy location field
        if (Array.isArray(job.locations)) {
          (job.locations as string[]).forEach((loc) => {
            if (loc && typeof loc === 'string') locationSet.add(loc);
          });
        } else if (job.location) {
          locationSet.add(job.location);
        }
      });

      const departments = Array.from(departmentSet)
        .sort()
        .map((dept) => ({
          value: dept,
          label: dept,
        }));

      const locations = Array.from(locationSet)
        .sort()
        .map((loc) => ({
          value: loc,
          label: loc,
        }));

      const jobOptions = jobs.map((job) => ({
        value: job.id,
        label: job.title,
      }));

      const recruiterOptions = recruiters.map((user) => ({
        value: user.id,
        label: user.name,
      }));

      res.json({
        departments,
        locations,
        jobs: jobOptions,
        recruiters: recruiterOptions,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/analytics/kpis
 * Get KPI metrics for dashboard
 * Requirements: 1.1, 1.4
 */
router.get(
  '/kpis',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const filters = parseFilters(req.query);

      const kpiData = await analyticsService.getKPIMetrics(
        req.user!.companyId,
        req.user!.userId,
        req.user!.role,
        filters
      );

      res.json(kpiData);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/analytics/funnel
 * Get funnel analytics with conversion rates
 * Requirements: 2.1, 2.2, 2.5, 9.1, 9.2
 */
router.get(
  '/funnel',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const filters = parseFilters(req.query);

      const funnelData = await analyticsService.getFunnelAnalytics(
        req.user!.companyId,
        req.user!.userId,
        req.user!.role,
        filters
      );

      res.json(funnelData);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/analytics/conversion-rates
 * Get conversion rates between stages
 * Requirements: 9.1, 9.2
 */
router.get(
  '/conversion-rates',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const filters = parseFilters(req.query);

      const conversionData = await analyticsService.getConversionRates(
        req.user!.companyId,
        req.user!.userId,
        req.user!.role,
        filters
      );

      res.json(conversionData);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/analytics/time-to-fill
 * Get time-to-fill metrics by department and role
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.6
 */
router.get(
  '/time-to-fill',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const filters = parseFilters(req.query);

      const timeToFillData = await analyticsService.getTimeToFill(
        req.user!.companyId,
        req.user!.userId,
        req.user!.role,
        filters
      );

      res.json(timeToFillData);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/analytics/time-in-stage
 * Get time-in-stage metrics with bottleneck identification
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.6
 */
router.get(
  '/time-in-stage',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const filters = parseFilters(req.query);

      const timeInStageData = await analyticsService.getTimeInStage(
        req.user!.companyId,
        req.user!.userId,
        req.user!.role,
        filters
      );

      res.json(timeInStageData);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/analytics/sources
 * Get source performance analytics
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */
router.get(
  '/sources',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const filters = parseFilters(req.query);

      const sourceData = await analyticsService.getSourcePerformance(
        req.user!.companyId,
        req.user!.userId,
        req.user!.role,
        filters
      );

      res.json(sourceData);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/analytics/recruiters
 * Get recruiter productivity analytics
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
 */
router.get(
  '/recruiters',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const filters = parseFilters(req.query);

      const recruiterData = await analyticsService.getRecruiterProductivity(
        req.user!.companyId,
        req.user!.userId,
        req.user!.role,
        filters
      );

      res.json(recruiterData);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/analytics/panels
 * Get panel performance analytics
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6
 */
router.get(
  '/panels',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const filters = parseFilters(req.query);

      const panelData = await analyticsService.getPanelPerformance(
        req.user!.companyId,
        req.user!.userId,
        req.user!.role,
        filters
      );

      res.json(panelData);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/analytics/drop-off
 * Get drop-off analysis with rejection reasons
 * Requirements: 10.1, 10.2, 10.3, 10.5
 */
router.get(
  '/drop-off',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const filters = parseFilters(req.query);

      const dropOffData = await analyticsService.getDropOffAnalysis(
        req.user!.companyId,
        req.user!.userId,
        req.user!.role,
        filters
      );

      const rejectionData = await analyticsService.getRejectionReasons(
        req.user!.companyId,
        req.user!.userId,
        req.user!.role,
        filters
      );

      res.json({
        dropOff: dropOffData,
        rejections: rejectionData,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/analytics/rejection-reasons
 * Get rejection reasons analysis
 * Requirements: 10.2, 10.5
 */
router.get(
  '/rejection-reasons',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const filters = parseFilters(req.query);

      const rejectionData = await analyticsService.getRejectionReasons(
        req.user!.companyId,
        req.user!.userId,
        req.user!.role,
        filters
      );

      res.json(rejectionData);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/analytics/offer-rate
 * Get offer acceptance rate analytics
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */
router.get(
  '/offer-rate',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const filters = parseFilters(req.query);

      const offerData = await analyticsService.getOfferAcceptanceRate(
        req.user!.companyId,
        req.user!.userId,
        req.user!.role,
        filters
      );

      res.json(offerData);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/analytics/sla
 * Get SLA status summary
 * Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6
 */
router.get(
  '/sla',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const filters = parseFilters(req.query);

      const slaData = await analyticsService.getSLAStatus(
        req.user!.companyId,
        req.user!.userId,
        req.user!.role,
        filters
      );

      res.json(slaData);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/analytics/overview
 * Get aggregated analytics data for overview
 * Requirements: 1.1, 2.1, 5.1, 19.1
 */
router.get(
  '/overview',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const filters = parseFilters(req.query);

      const [kpis, funnel, sources, slaStatus] = await Promise.all([
        analyticsService.getKPIMetrics(req.user!.companyId, req.user!.userId, req.user!.role, filters),
        analyticsService.getFunnelAnalytics(req.user!.companyId, req.user!.userId, req.user!.role, filters),
        analyticsService.getSourcePerformance(req.user!.companyId, req.user!.userId, req.user!.role, filters),
        analyticsService.getSLAStatus(req.user!.companyId, req.user!.userId, req.user!.role, filters),
      ]);

      res.json({
        kpis,
        funnel,
        sources,
        slaStatus,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/analytics/export
 * Export analytics report in PDF or Excel/CSV format
 * Requirements: 16.1, 16.2, 16.3, 16.4
 */
router.get(
  '/export',
  authenticate,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
      const [
        kpis,
        funnelData,
        timeToFillData,
        timeInStageData,
        sourceData,
        recruiterData,
        panelData,
        dropOffData,
        rejectionData,
        offerData,
        slaData
      ] = await Promise.all([
        analyticsService.getKPIMetrics(req.user!.companyId, req.user!.userId, req.user!.role, filters),
        analyticsService.getFunnelAnalytics(req.user!.companyId, req.user!.userId, req.user!.role, filters),
        analyticsService.getTimeToFill(req.user!.companyId, req.user!.userId, req.user!.role, filters),
        analyticsService.getTimeInStage(req.user!.companyId, req.user!.userId, req.user!.role, filters),
        analyticsService.getSourcePerformance(req.user!.companyId, req.user!.userId, req.user!.role, filters),
        analyticsService.getRecruiterProductivity(req.user!.companyId, req.user!.userId, req.user!.role, filters),
        analyticsService.getPanelPerformance(req.user!.companyId, req.user!.userId, req.user!.role, filters),
        analyticsService.getDropOffAnalysis(req.user!.companyId, req.user!.userId, req.user!.role, filters),
        analyticsService.getRejectionReasons(req.user!.companyId, req.user!.userId, req.user!.role, filters),
        analyticsService.getOfferAcceptanceRate(req.user!.companyId, req.user!.userId, req.user!.role, filters),
        analyticsService.getSLAStatus(req.user!.companyId, req.user!.userId, req.user!.role, filters),
      ]);

      const exportData = {
        metadata: {
          generatedAt: new Date().toISOString(),
          companyId: req.user!.companyId,
          userId: req.user!.userId,
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
        // Generate PDF report using pdfmake
        const pdfBuffer = await generatePDFReportNew(exportData);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="analytics-report-${new Date().toISOString().split('T')[0]}.pdf"`);
        res.send(pdfBuffer);
      } else if (format === 'excel') {
        // Generate Excel report
        const excelBuffer = await generateExcelReport(exportData);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="analytics-report-${new Date().toISOString().split('T')[0]}.xlsx"`);
        res.send(excelBuffer);
      } else if (format === 'csv') {
        // Generate CSV report
        const csvData = await generateCSVReport(exportData);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="analytics-report-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvData);
      }
    } catch (error) {
      next(error);
    }
  }
);

// Helper functions for export generation

/**
 * Generate PDF report from analytics data
 * Requirements: 11.1 - PDF export includes all visible data
 */
async function generatePDFReport(exportData: any): Promise<Buffer> {
  // Generate a text-based PDF-like report
  // In production, use a library like puppeteer or pdfkit
  const reportContent = `
================================================================================
                           ANALYTICS REPORT
================================================================================
Generated: ${new Date(exportData.metadata.generatedAt).toLocaleString()}
Filters Applied: ${JSON.stringify(exportData.metadata.filters, null, 2)}

================================================================================
                           KPI METRICS
================================================================================
Active Roles:           ${exportData.data.kpis.activeRoles}
Active Candidates:      ${exportData.data.kpis.activeCandidates}
New Candidates (Month): ${exportData.data.kpis.newCandidatesThisMonth || 0}
Interviews Today:       ${exportData.data.kpis.interviewsToday}
Interviews This Week:   ${exportData.data.kpis.interviewsThisWeek}
Offers Pending:         ${exportData.data.kpis.offersPending}
Total Hires:            ${exportData.data.kpis.totalHires}
Total Offers:           ${exportData.data.kpis.totalOffers || 0}
Avg Time to Fill:       ${exportData.data.kpis.avgTimeToFill} days
Offer Acceptance Rate:  ${exportData.data.kpis.offerAcceptanceRate}%

================================================================================
                           FUNNEL ANALYTICS
================================================================================
Total Applicants:       ${exportData.data.funnel.totalApplicants}
Total Hired:            ${exportData.data.funnel.totalHired}
Overall Conversion:     ${exportData.data.funnel.overallConversionRate}%

Stage Breakdown:
${exportData.data.funnel.stages?.map((stage: any) =>
    `  ${stage.name.padEnd(20)} ${String(stage.count).padStart(6)} candidates (${stage.percentage}%)`
  ).join('\n') || 'No stage data available'}

================================================================================
                           TIME TO FILL
================================================================================
Overall Average:        ${exportData.data.timeToFill.overall?.average || 0} days
Overall Median:         ${exportData.data.timeToFill.overall?.median || 0} days
Target:                 ${exportData.data.timeToFill.overall?.target || 30} days

By Role:
${exportData.data.timeToFill.byRole?.map((role: any) =>
    `  ${role.roleName.padEnd(30)} ${String(role.average).padStart(4)} days ${role.isOverTarget ? '⚠️ OVER TARGET' : ''}`
  ).join('\n') || 'No role data available'}

================================================================================
                           TIME IN STAGE
================================================================================
${exportData.data.timeInStage.stages?.map((stage: any) =>
    `  ${stage.stageName.padEnd(25)} ${String(stage.avgDays).padStart(4)} days ${stage.isBottleneck ? '🔴 BOTTLENECK' : ''}`
  ).join('\n') || 'No stage data available'}

Bottleneck Stage:       ${exportData.data.timeInStage.bottleneckStage || 'None identified'}
Suggestion:             ${exportData.data.timeInStage.suggestion || 'N/A'}

================================================================================
                           SOURCE PERFORMANCE
================================================================================
${exportData.data.sources?.map((source: any) =>
    `  ${source.source.padEnd(20)} ${String(source.candidateCount).padStart(5)} candidates (${source.percentage}%), ${source.hireRate}% hire rate`
  ).join('\n') || 'No source data available'}

================================================================================
                           RECRUITER PRODUCTIVITY
================================================================================
${'Name'.padEnd(25)} ${'Roles'.padStart(6)} ${'CVs'.padStart(6)} ${'Interviews'.padStart(10)} ${'Offers'.padStart(7)} ${'Hires'.padStart(6)} ${'TTF'.padStart(6)}
${'-'.repeat(80)}
${exportData.data.recruiters?.map((r: any) =>
    `${r.name.padEnd(25)} ${String(r.activeRoles).padStart(6)} ${String(r.cvsAdded).padStart(6)} ${String(r.interviewsScheduled).padStart(10)} ${String(r.offersMade).padStart(7)} ${String(r.hires).padStart(6)} ${String(r.avgTimeToFill).padStart(5)}d`
  ).join('\n') || 'No recruiter data available'}

================================================================================
                           PANEL PERFORMANCE
================================================================================
${'Panel'.padEnd(25)} ${'Rounds'.padStart(7)} ${'Offer%'.padStart(7)} ${'Top Rejection'.padStart(20)} ${'Feedback'.padStart(10)}
${'-'.repeat(80)}
${exportData.data.panels?.map((p: any) =>
    `${p.panelName.padEnd(25)} ${String(p.interviewRounds).padStart(7)} ${String(p.offerPercentage).padStart(6)}% ${p.topRejectionReason.padStart(20)} ${String(p.avgFeedbackTime).padStart(9)}h`
  ).join('\n') || 'No panel data available'}

================================================================================
                           DROP-OFF ANALYSIS
================================================================================
${exportData.data.dropOff.byStage?.map((stage: any) =>
    `  ${stage.stageName.padEnd(20)} ${String(stage.dropOffCount).padStart(5)} dropped (${stage.dropOffPercentage}%)`
  ).join('\n') || 'No drop-off data available'}

Highest Drop-off Stage: ${exportData.data.dropOff.highestDropOffStage || 'None identified'}

================================================================================
                           REJECTION REASONS
================================================================================
${exportData.data.rejections.reasons?.map((r: any) =>
    `  ${r.reason.padEnd(25)} ${String(r.count).padStart(5)} (${r.percentage}%)`
  ).join('\n') || 'No rejection data available'}

Top Stage for Rejection: ${exportData.data.rejections.topStageForRejection || 'N/A'}

================================================================================
                           SLA STATUS
================================================================================
On Track:               ${exportData.data.sla.summary?.onTrack || 0}
At Risk:                ${exportData.data.sla.summary?.atRisk || 0}
Breached:               ${exportData.data.sla.summary?.breached || 0}

================================================================================
                           END OF REPORT
================================================================================
`;

  return Buffer.from(reportContent, 'utf-8');
}

// PDF fonts configuration for pdfmake
const fonts = {
  Roboto: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  }
};

/**
 * Generate PDF report from analytics data using pdfmake
 * Requirements: 11.1 - PDF export includes all visible data
 */
async function generatePDFReportNew(exportData: any): Promise<Buffer> {
  const printer = new PdfPrinter(fonts);

  const docDefinition: TDocumentDefinitions = {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    content: [
      // Header
      { text: 'ANALYTICS REPORT', style: 'header' },
      { text: `Generated: ${new Date(exportData.metadata.generatedAt).toLocaleString()}`, style: 'subheader' },
      { text: '', margin: [0, 10] },

      // KPI Metrics Section
      { text: 'KEY PERFORMANCE INDICATORS', style: 'sectionHeader' },
      {
        table: {
          widths: ['*', 'auto'],
          body: [
            ['Active Roles', String(exportData.data.kpis.activeRoles)],
            ['Active Candidates', String(exportData.data.kpis.activeCandidates)],
            ['Avg Time to Fill', `${exportData.data.kpis.avgTimeToFill} days`],
            ['Offer Acceptance Rate', `${exportData.data.kpis.offerAcceptanceRate}%`],
            ['Total Hires', String(exportData.data.kpis.totalHires)],
            ['Total Offers', String(exportData.data.kpis.totalOffers || 0)],
          ] as TableCell[][]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 5, 0, 15] as [number, number, number, number]
      } as Content,

      // Funnel Analytics Section
      { text: 'HIRING FUNNEL', style: 'sectionHeader' },
      {
        table: {
          widths: ['*', 'auto', 'auto'],
          body: [
            [{ text: 'Stage', bold: true }, { text: 'Candidates', bold: true }, { text: 'Percentage', bold: true }],
            ...(exportData.data.funnel.stages?.map((stage: any) => [
              stage.name,
              String(stage.count),
              `${stage.percentage}%`
            ]) || [])
          ] as TableCell[][]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 5, 0, 15] as [number, number, number, number]
      } as Content,
      { text: `Overall Conversion: ${exportData.data.funnel.overallConversionRate}%`, style: 'note' },

      // Time Analytics Section
      { text: 'TIME ANALYTICS', style: 'sectionHeader', pageBreak: 'before' as const },
      { text: 'Time in Stage:', style: 'subsectionHeader' },
      {
        table: {
          widths: ['*', 'auto', 'auto'],
          body: [
            [{ text: 'Stage', bold: true }, { text: 'Avg Days', bold: true }, { text: 'Status', bold: true }],
            ...(exportData.data.timeInStage.stages?.map((stage: any) => [
              stage.stageName,
              String(stage.avgDays),
              stage.isBottleneck ? 'BOTTLENECK' : 'OK'
            ]) || [])
          ] as TableCell[][]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 5, 0, 15] as [number, number, number, number]
      } as Content,

      // Recruiter Productivity
      { text: 'RECRUITER PRODUCTIVITY', style: 'sectionHeader' },
      {
        table: {
          widths: ['*', 'auto', 'auto', 'auto', 'auto'],
          body: [
            [{ text: 'Name', bold: true }, { text: 'Roles', bold: true }, { text: 'Hires', bold: true }, { text: 'Offers', bold: true }, { text: 'TTF', bold: true }],
            ...(exportData.data.recruiters?.slice(0, 10).map((r: any) => [
              r.name,
              String(r.activeRoles),
              String(r.hires),
              String(r.offersMade),
              `${r.avgTimeToFill}d`
            ]) || [])
          ] as TableCell[][]
        },
        layout: 'lightHorizontalLines',
        margin: [0, 5, 0, 15] as [number, number, number, number]
      } as Content,

      // SLA Status
      { text: 'SLA STATUS SUMMARY', style: 'sectionHeader' },
      {
        columns: [
          { text: `On Track: ${exportData.data.sla.summary?.onTrack || 0}`, style: 'stat', color: 'green' },
          { text: `At Risk: ${exportData.data.sla.summary?.atRisk || 0}`, style: 'stat', color: 'orange' },
          { text: `Breached: ${exportData.data.sla.summary?.breached || 0}`, style: 'stat', color: 'red' },
        ]
      }
    ],
    styles: {
      header: { fontSize: 18, bold: true, alignment: 'center' as const, margin: [0, 0, 0, 10] as [number, number, number, number] },
      subheader: { fontSize: 10, color: '#666666', alignment: 'center' as const, margin: [0, 0, 0, 20] as [number, number, number, number] },
      sectionHeader: { fontSize: 12, bold: true, color: '#333333', margin: [0, 15, 0, 5] as [number, number, number, number] },
      subsectionHeader: { fontSize: 10, bold: true, color: '#555555', margin: [0, 10, 0, 5] as [number, number, number, number] },
      note: { fontSize: 9, color: '#666666', italics: true, margin: [0, 5, 0, 10] as [number, number, number, number] },
      stat: { fontSize: 11, bold: true, margin: [0, 5] as [number, number] }
    }
  };

  return new Promise((resolve, reject) => {
    try {
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const chunks: Buffer[] = [];

      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);

      pdfDoc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate Excel report from analytics data using ExcelJS
 * Requirements: 11.2 - Excel export includes all visible data
 */
async function generateExcelReportNew(exportData: any): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SnapFind ATS';
  workbook.created = new Date();

  // Style definitions
  const headerStyle: Partial<ExcelJS.Style> = {
    font: { bold: true, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } },
    alignment: { horizontal: 'center' }
  };

  // KPI Sheet
  const kpiSheet = workbook.addWorksheet('KPI Metrics');
  kpiSheet.columns = [{ width: 25 }, { width: 20 }];
  kpiSheet.addRow(['Metric', 'Value']).eachCell(c => Object.assign(c, { style: headerStyle }));
  kpiSheet.addRow(['Active Roles', exportData.data.kpis.activeRoles]);
  kpiSheet.addRow(['Active Candidates', exportData.data.kpis.activeCandidates]);
  kpiSheet.addRow(['Avg Time to Fill', `${exportData.data.kpis.avgTimeToFill} days`]);
  kpiSheet.addRow(['Offer Acceptance Rate', `${exportData.data.kpis.offerAcceptanceRate}%`]);
  kpiSheet.addRow(['Total Hires', exportData.data.kpis.totalHires]);
  kpiSheet.addRow(['Total Offers', exportData.data.kpis.totalOffers || 0]);
  kpiSheet.addRow(['Interviews Today', exportData.data.kpis.interviewsToday]);
  kpiSheet.addRow(['Interviews This Week', exportData.data.kpis.interviewsThisWeek]);

  // Funnel Sheet
  const funnelSheet = workbook.addWorksheet('Hiring Funnel');
  funnelSheet.columns = [{ width: 20 }, { width: 15 }, { width: 15 }];
  funnelSheet.addRow(['Stage', 'Candidates', 'Percentage']).eachCell(c => Object.assign(c, { style: headerStyle }));
  exportData.data.funnel.stages?.forEach((stage: any) => {
    funnelSheet.addRow([stage.name, stage.count, `${stage.percentage}%`]);
  });
  funnelSheet.addRow([]);
  funnelSheet.addRow(['Total Applicants', exportData.data.funnel.totalApplicants]);
  funnelSheet.addRow(['Total Hired', exportData.data.funnel.totalHired]);
  funnelSheet.addRow(['Overall Conversion', `${exportData.data.funnel.overallConversionRate}%`]);

  // Time Analytics Sheet
  const timeSheet = workbook.addWorksheet('Time Analytics');
  timeSheet.columns = [{ width: 25 }, { width: 15 }, { width: 15 }];
  timeSheet.addRow(['Stage', 'Avg Days', 'Status']).eachCell(c => Object.assign(c, { style: headerStyle }));
  exportData.data.timeInStage.stages?.forEach((stage: any) => {
    const row = timeSheet.addRow([stage.stageName, stage.avgDays, stage.isBottleneck ? 'BOTTLENECK' : 'OK']);
    if (stage.isBottleneck) row.eachCell(c => { c.font = { color: { argb: 'FFDC2626' } }; });
  });

  // Recruiter Sheet
  const recruiterSheet = workbook.addWorksheet('Recruiters');
  recruiterSheet.columns = [{ width: 25 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 }];
  recruiterSheet.addRow(['Name', 'Roles', 'Hires', 'Offers', 'CVs Added', 'TTF']).eachCell(c => Object.assign(c, { style: headerStyle }));
  exportData.data.recruiters?.forEach((r: any) => {
    recruiterSheet.addRow([r.name, r.activeRoles, r.hires, r.offersMade, r.cvsAdded, `${r.avgTimeToFill}d`]);
  });

  // Source Performance Sheet
  const sourceSheet = workbook.addWorksheet('Sources');
  sourceSheet.columns = [{ width: 20 }, { width: 15 }, { width: 15 }, { width: 15 }];
  sourceSheet.addRow(['Source', 'Candidates', 'Percentage', 'Hire Rate']).eachCell(c => Object.assign(c, { style: headerStyle }));
  exportData.data.sources?.forEach((s: any) => {
    sourceSheet.addRow([s.source, s.candidateCount, `${s.percentage}%`, `${s.hireRate}%`]);
  });

  // SLA Sheet
  const slaSheet = workbook.addWorksheet('SLA Status');
  slaSheet.columns = [{ width: 15 }, { width: 15 }];
  slaSheet.addRow(['Status', 'Count']).eachCell(c => Object.assign(c, { style: headerStyle }));
  slaSheet.addRow(['On Track', exportData.data.sla.summary?.onTrack || 0]);
  slaSheet.addRow(['At Risk', exportData.data.sla.summary?.atRisk || 0]);
  slaSheet.addRow(['Breached', exportData.data.sla.summary?.breached || 0]);

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

// Old Excel function kept for backward compatibility
async function generateExcelReport(exportData: any): Promise<Buffer> {
  return generateExcelReportNew(exportData);
}

/**
 * Generate CSV report from analytics data
 * Requirements: 11.3 - Exports respect current filters
 */
async function generateCSVReport(exportData: any): Promise<string> {
  const lines: string[] = [];

  // Add metadata
  lines.push('Analytics Report');
  lines.push(`Generated,${exportData.metadata.generatedAt}`);
  lines.push(`Filters Applied,"${JSON.stringify(exportData.metadata.filters).replace(/"/g, '""')}"`);
  lines.push('');

  // Add KPI metrics
  lines.push('KPI Metrics');
  lines.push('Metric,Value');
  lines.push(`Active Roles,${exportData.data.kpis.activeRoles}`);
  lines.push(`Active Candidates,${exportData.data.kpis.activeCandidates}`);
  lines.push(`New Candidates This Month,${exportData.data.kpis.newCandidatesThisMonth || 0}`);
  lines.push(`Interviews Today,${exportData.data.kpis.interviewsToday}`);
  lines.push(`Interviews This Week,${exportData.data.kpis.interviewsThisWeek}`);
  lines.push(`Offers Pending,${exportData.data.kpis.offersPending}`);
  lines.push(`Total Hires,${exportData.data.kpis.totalHires}`);
  lines.push(`Total Offers,${exportData.data.kpis.totalOffers || 0}`);
  lines.push(`Avg Time to Fill,${exportData.data.kpis.avgTimeToFill}`);
  lines.push(`Offer Acceptance Rate,${exportData.data.kpis.offerAcceptanceRate}`);
  lines.push('');

  // Add funnel data
  lines.push('Funnel Analytics');
  lines.push('Stage,Count,Percentage,Conversion to Next');
  if (exportData.data.funnel.stages) {
    exportData.data.funnel.stages.forEach((stage: any) => {
      lines.push(`${stage.name},${stage.count},${stage.percentage},${stage.conversionToNext || 0}`);
    });
  }
  lines.push(`Total Applicants,${exportData.data.funnel.totalApplicants},,`);
  lines.push(`Total Hired,${exportData.data.funnel.totalHired},,`);
  lines.push(`Overall Conversion Rate,${exportData.data.funnel.overallConversionRate},,`);
  lines.push('');

  // Add time to fill data
  lines.push('Time to Fill by Role');
  lines.push('Role,Average Days,Over Target');
  if (exportData.data.timeToFill.byRole) {
    exportData.data.timeToFill.byRole.forEach((role: any) => {
      lines.push(`"${role.roleName}",${role.average},${role.isOverTarget ? 'Yes' : 'No'}`);
    });
  }
  lines.push('');

  // Add time in stage data
  lines.push('Time in Stage');
  lines.push('Stage,Average Days,Is Bottleneck');
  if (exportData.data.timeInStage.stages) {
    exportData.data.timeInStage.stages.forEach((stage: any) => {
      lines.push(`${stage.stageName},${stage.avgDays},${stage.isBottleneck ? 'Yes' : 'No'}`);
    });
  }
  lines.push(`Bottleneck Stage,${exportData.data.timeInStage.bottleneckStage || 'None'},`);
  lines.push('');

  // Add source performance
  lines.push('Source Performance');
  lines.push('Source,Candidates,Percentage,Hires,Hire Rate,Avg Time to Hire');
  if (exportData.data.sources) {
    exportData.data.sources.forEach((source: any) => {
      lines.push(`${source.source},${source.candidateCount},${source.percentage},${source.hireCount},${source.hireRate},${source.avgTimeToHire}`);
    });
  }
  lines.push('');

  // Add recruiter productivity
  lines.push('Recruiter Productivity');
  lines.push('Name,Active Roles,CVs Added,Interviews,Offers,Hires,Avg Time to Fill,Score');
  if (exportData.data.recruiters) {
    exportData.data.recruiters.forEach((recruiter: any) => {
      lines.push(`"${recruiter.name}",${recruiter.activeRoles},${recruiter.cvsAdded},${recruiter.interviewsScheduled},${recruiter.offersMade},${recruiter.hires},${recruiter.avgTimeToFill},${recruiter.productivityScore}`);
    });
  }
  lines.push('');

  // Add panel performance
  lines.push('Panel Performance');
  lines.push('Panel Name,Interview Rounds,Offer Percentage,Top Rejection Reason,Avg Feedback Time');
  if (exportData.data.panels) {
    exportData.data.panels.forEach((panel: any) => {
      lines.push(`"${panel.panelName}",${panel.interviewRounds},${panel.offerPercentage},"${panel.topRejectionReason}",${panel.avgFeedbackTime}`);
    });
  }
  lines.push('');

  // Add drop-off analysis
  lines.push('Drop-off Analysis');
  lines.push('Stage,Drop-off Count,Drop-off Percentage');
  if (exportData.data.dropOff.byStage) {
    exportData.data.dropOff.byStage.forEach((stage: any) => {
      lines.push(`${stage.stageName},${stage.dropOffCount},${stage.dropOffPercentage}`);
    });
  }
  lines.push(`Highest Drop-off Stage,${exportData.data.dropOff.highestDropOffStage || 'None'},`);
  lines.push('');

  // Add rejection reasons
  lines.push('Rejection Reasons');
  lines.push('Reason,Count,Percentage');
  if (exportData.data.rejections.reasons) {
    exportData.data.rejections.reasons.forEach((reason: any) => {
      lines.push(`"${reason.reason}",${reason.count},${reason.percentage}`);
    });
  }
  lines.push(`Top Stage for Rejection,${exportData.data.rejections.topStageForRejection || 'N/A'},`);
  lines.push('');

  // Add SLA status
  lines.push('SLA Status Summary');
  lines.push('Status,Count');
  lines.push(`On Track,${exportData.data.sla.summary?.onTrack || 0}`);
  lines.push(`At Risk,${exportData.data.sla.summary?.atRisk || 0}`);
  lines.push(`Breached,${exportData.data.sla.summary?.breached || 0}`);

  return lines.join('\n');
}

export default router;