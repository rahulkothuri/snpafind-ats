import { describe, it, expect } from 'vitest';
import { analyticsService, AnalyticsService } from '../../services/analytics.service.js';

describe('Analytics Service', () => {
  it('should be able to import and instantiate the analytics service', () => {
    expect(analyticsService).toBeDefined();
    expect(analyticsService).toBeInstanceOf(AnalyticsService);
  });

  it('should have all required methods', () => {
    expect(typeof analyticsService.getKPIMetrics).toBe('function');
    expect(typeof analyticsService.getFunnelAnalytics).toBe('function');
    expect(typeof analyticsService.getConversionRates).toBe('function');
    expect(typeof analyticsService.getTimeToFill).toBe('function');
    expect(typeof analyticsService.getTimeInStage).toBe('function');
    expect(typeof analyticsService.getSourcePerformance).toBe('function');
    expect(typeof analyticsService.getRecruiterProductivity).toBe('function');
    expect(typeof analyticsService.getPanelPerformance).toBe('function');
    expect(typeof analyticsService.getDropOffAnalysis).toBe('function');
    expect(typeof analyticsService.getRejectionReasons).toBe('function');
    expect(typeof analyticsService.getOfferAcceptanceRate).toBe('function');
    expect(typeof analyticsService.getSLAStatus).toBe('function');
  });
});