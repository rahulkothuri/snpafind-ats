import { Router } from 'express';
import { slaService } from '../services/sla.service.js';
import { authenticate } from '../middleware/auth.js';
const router = Router();
// All routes require authentication
router.use(authenticate);
/**
 * GET /api/alerts
 * Get all alerts (SLA breaches and pending feedback)
 * Requirements: 10.1, 10.2, 10.3
 */
router.get('/alerts', async (req, res, next) => {
    try {
        const authReq = req;
        const companyId = authReq.user.companyId;
        const type = req.query.type;
        const alerts = await slaService.getAlerts(companyId, { type });
        res.json(alerts);
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/settings/sla
 * Get SLA configuration for the company
 * Requirements: 10.5
 */
router.get('/settings/sla', async (req, res, next) => {
    try {
        const authReq = req;
        const companyId = authReq.user.companyId;
        const configs = await slaService.getSLAConfig(companyId);
        // Get stored system defaults (or fallback to hardcoded)
        const defaults = await slaService.getStoredSystemDefaults();
        res.json({
            configs,
            defaults,
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * PUT /api/settings/sla
 * Update SLA configuration for the company
 * Requirements: 10.5
 */
router.put('/settings/sla', async (req, res, next) => {
    try {
        const authReq = req;
        const companyId = authReq.user.companyId;
        const { configs } = req.body;
        // If configs is an array, update multiple
        if (Array.isArray(configs)) {
            const results = await slaService.updateSLAConfigs(companyId, configs);
            res.json({ success: true, configs: results });
        }
        else {
            // Single config update
            const { stageName, thresholdDays } = req.body;
            const result = await slaService.updateSLAConfig(companyId, {
                stageName,
                thresholdDays,
            });
            res.json({ success: true, config: result });
        }
    }
    catch (error) {
        next(error);
    }
});
/**
 * DELETE /api/settings/sla/:stageName
 * Delete SLA configuration for a specific stage
 * Requirements: 10.5
 */
router.delete('/settings/sla/:stageName', async (req, res, next) => {
    try {
        const authReq = req;
        const companyId = authReq.user.companyId;
        const stageName = decodeURIComponent(req.params.stageName);
        await slaService.deleteSLAConfig(companyId, stageName);
        res.json({ success: true });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/settings/sla/defaults
 * Get default SLA thresholds
 * Requirements: 10.5
 */
router.get('/settings/sla/defaults', async (_req, res, next) => {
    try {
        const defaults = await slaService.getStoredSystemDefaults();
        res.json({ defaults });
    }
    catch (error) {
        next(error);
    }
});
/**
 * PUT /api/settings/sla/defaults
 * Update system default SLA thresholds
 * Requirements: 10.5
 */
router.put('/settings/sla/defaults', async (req, res, next) => {
    try {
        const { configs } = req.body;
        if (!Array.isArray(configs)) {
            return res.status(400).json({ error: 'configs must be an array' });
        }
        const updatedDefaults = await slaService.updateSystemDefaults(configs);
        res.json({ success: true, defaults: updatedDefaults });
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/settings/sla/apply-defaults
 * Apply default SLA thresholds to the company
 * Requirements: 10.5
 */
router.post('/settings/sla/apply-defaults', async (req, res, next) => {
    try {
        const authReq = req;
        const companyId = authReq.user.companyId;
        const defaults = await slaService.getStoredSystemDefaults();
        const results = await slaService.updateSLAConfigs(companyId, defaults);
        res.json({ success: true, configs: results });
    }
    catch (error) {
        next(error);
    }
});
/**
 * GET /api/candidates/:id/sla-status
 * Check SLA status for a specific job candidate
 * Requirements: 10.1, 2.5
 */
router.get('/candidates/:id/sla-status', async (req, res, next) => {
    try {
        const jobCandidateId = req.params.id;
        const breach = await slaService.checkCandidateSLABreach(jobCandidateId);
        res.json({
            isBreached: breach !== null,
            breach,
        });
    }
    catch (error) {
        next(error);
    }
});
export default router;
//# sourceMappingURL=sla.routes.js.map