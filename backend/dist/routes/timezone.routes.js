/**
 * Timezone API Routes
 *
 * Provides endpoints for timezone list and utilities
 * Requirements: 3.1 - Allow selection of timezone from standard timezone list (IANA format)
 */
import { Router } from 'express';
import { getTimezoneList, getTimezonesByRegion, searchTimezones, isValidTimezone, getTimezoneLabel } from '../services/timezone.service.js';
const router = Router();
/**
 * GET /api/timezones
 * Get all available timezones
 */
router.get('/', (_req, res) => {
    try {
        const timezones = getTimezoneList();
        res.json({ timezones });
    }
    catch (error) {
        console.error('Error fetching timezones:', error);
        res.status(500).json({ error: 'Failed to fetch timezones' });
    }
});
/**
 * GET /api/timezones/grouped
 * Get timezones grouped by region
 */
router.get('/grouped', (_req, res) => {
    try {
        const timezonesByRegion = getTimezonesByRegion();
        res.json({ timezonesByRegion });
    }
    catch (error) {
        console.error('Error fetching grouped timezones:', error);
        res.status(500).json({ error: 'Failed to fetch grouped timezones' });
    }
});
/**
 * GET /api/timezones/search
 * Search timezones by query
 */
router.get('/search', (req, res) => {
    try {
        const query = req.query.q;
        if (!query || query.trim().length === 0) {
            res.status(400).json({ error: 'Search query is required' });
            return;
        }
        const results = searchTimezones(query);
        res.json({ timezones: results });
    }
    catch (error) {
        console.error('Error searching timezones:', error);
        res.status(500).json({ error: 'Failed to search timezones' });
    }
});
/**
 * GET /api/timezones/validate/:timezone
 * Validate a timezone identifier
 */
router.get('/validate/:timezone', (req, res) => {
    try {
        const timezone = decodeURIComponent(req.params.timezone);
        const valid = isValidTimezone(timezone);
        const label = valid ? getTimezoneLabel(timezone) : null;
        res.json({
            timezone,
            valid,
            label
        });
    }
    catch (error) {
        console.error('Error validating timezone:', error);
        res.status(500).json({ error: 'Failed to validate timezone' });
    }
});
export default router;
//# sourceMappingURL=timezone.routes.js.map