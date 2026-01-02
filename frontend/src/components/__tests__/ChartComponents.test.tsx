/**
 * Chart Components Test - Task 15: Checkpoint - Frontend Components
 * 
 * This test verifies that all chart components render correctly with sample data
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import FunnelChart from '../FunnelChart';
import HorizontalBarChart from '../HorizontalBarChart';
import PieChart from '../PieChart';
import AnalyticsFilter from '../AnalyticsFilter';

describe('Chart Components Rendering', () => {
  describe('FunnelChart', () => {
    const sampleFunnelData = [
      { id: '1', name: 'Applied', count: 100, percentage: 100, conversionToNext: 60 },
      { id: '2', name: 'Screening', count: 60, percentage: 60, conversionToNext: 50 },
      { id: '3', name: 'Interview', count: 30, percentage: 30, conversionToNext: 67 },
      { id: '4', name: 'Offer', count: 20, percentage: 20, conversionToNext: 80 },
      { id: '5', name: 'Hired', count: 16, percentage: 16 },
    ];

    it('renders with sample data', () => {
      render(<FunnelChart stages={sampleFunnelData} />);
      
      // Check that all stages are rendered
      expect(screen.getByText('Applied')).toBeInTheDocument();
      expect(screen.getByText('Screening')).toBeInTheDocument();
      expect(screen.getByText('Interview')).toBeInTheDocument();
      expect(screen.getByText('Offer')).toBeInTheDocument();
      expect(screen.getByText('Hired')).toBeInTheDocument();
      
      // Check that candidate counts are displayed in the new format
      expect(screen.getByText('100 candidates')).toBeInTheDocument();
      expect(screen.getByText(/60 candidates/)).toBeInTheDocument();
      expect(screen.getByText(/30 candidates/)).toBeInTheDocument();
      expect(screen.getByText(/20 candidates/)).toBeInTheDocument();
      expect(screen.getByText(/16 candidates/)).toBeInTheDocument();
    });

    it('renders empty state when no data', () => {
      render(<FunnelChart stages={[]} />);
      expect(screen.getByText('No funnel data available')).toBeInTheDocument();
    });

    it('shows percentages for non-first stages', () => {
      render(<FunnelChart stages={sampleFunnelData} showPercentages={true} />);
      // Percentages are shown for stages after the first one
      expect(screen.getByText(/· 60\.0%/)).toBeInTheDocument();
      expect(screen.getByText(/· 30\.0%/)).toBeInTheDocument();
    });

    it('shows overall conversion in summary', () => {
      render(<FunnelChart stages={sampleFunnelData} />);
      expect(screen.getByText(/Total:/)).toBeInTheDocument();
      expect(screen.getByText(/applicants/)).toBeInTheDocument();
      expect(screen.getByText(/Overall conversion:/)).toBeInTheDocument();
    });
  });

  describe('HorizontalBarChart', () => {
    const sampleBarData = [
      { id: '1', label: 'LinkedIn', value: 45, displayValue: '45 days', isOverThreshold: true },
      { id: '2', label: 'Indeed', value: 32, displayValue: '32 days', isOverThreshold: false },
      { id: '3', label: 'Company Website', value: 28, displayValue: '28 days', isOverThreshold: false },
      { id: '4', label: 'Referral', value: 22, displayValue: '22 days', isOverThreshold: false },
    ];

    it('renders with sample data', () => {
      render(
        <HorizontalBarChart 
          data={sampleBarData} 
          title="Time to Fill by Source"
          threshold={30}
          thresholdLabel="Target: 30 days"
        />
      );
      
      // Check title
      expect(screen.getByText('Time to Fill by Source')).toBeInTheDocument();
      
      // Check all labels are rendered
      expect(screen.getByText('LinkedIn')).toBeInTheDocument();
      expect(screen.getByText('Indeed')).toBeInTheDocument();
      expect(screen.getByText('Company Website')).toBeInTheDocument();
      expect(screen.getByText('Referral')).toBeInTheDocument();
      
      // Check values are displayed
      expect(screen.getByText('45 days')).toBeInTheDocument();
      expect(screen.getByText('32 days')).toBeInTheDocument();
      expect(screen.getByText('28 days')).toBeInTheDocument();
      expect(screen.getByText('22 days')).toBeInTheDocument();
    });

    it('renders empty state when no data', () => {
      render(<HorizontalBarChart data={[]} title="Empty Chart" />);
      expect(screen.getByText('Empty Chart')).toBeInTheDocument();
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('shows threshold legend when threshold is provided', () => {
      render(
        <HorizontalBarChart 
          data={sampleBarData} 
          threshold={30}
          thresholdLabel="Target: 30 days"
        />
      );
      
      expect(screen.getByText('Normal')).toBeInTheDocument();
      expect(screen.getByText('Above Threshold')).toBeInTheDocument();
      expect(screen.getByText('Target: 30 days')).toBeInTheDocument();
    });
  });

  describe('PieChart', () => {
    const samplePieData = [
      { id: '1', label: 'Skill Mismatch', value: 45, percentage: 45, color: '#ef4444' },
      { id: '2', label: 'Compensation Mismatch', value: 25, percentage: 25, color: '#f59e0b' },
      { id: '3', label: 'Culture Fit', value: 20, percentage: 20, color: '#10b981' },
      { id: '4', label: 'Location/Notice/Other', value: 10, percentage: 10, color: '#3b82f6' },
    ];

    it('renders with sample data', () => {
      render(<PieChart data={samplePieData} title="Rejection Reasons" />);
      
      // Check title
      expect(screen.getByText('Rejection Reasons')).toBeInTheDocument();
      
      // Check all labels in legend
      expect(screen.getByText('Skill Mismatch')).toBeInTheDocument();
      expect(screen.getByText('Compensation Mismatch')).toBeInTheDocument();
      expect(screen.getByText('Culture Fit')).toBeInTheDocument();
      expect(screen.getByText('Location/Notice/Other')).toBeInTheDocument();
      
      // Check percentages
      expect(screen.getByText('(45.0%)')).toBeInTheDocument();
      expect(screen.getByText('(25.0%)')).toBeInTheDocument();
      expect(screen.getByText('(20.0%)')).toBeInTheDocument();
      expect(screen.getByText('(10.0%)')).toBeInTheDocument();
      
      // Check total
      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('renders empty state when no data', () => {
      render(<PieChart data={[]} title="Empty Pie Chart" />);
      expect(screen.getByText('Empty Pie Chart')).toBeInTheDocument();
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('renders without legend when showLegend is false', () => {
      render(<PieChart data={samplePieData} showLegend={false} />);
      
      // Legend should not be present
      expect(screen.queryByText('Skill Mismatch')).not.toBeInTheDocument();
      expect(screen.queryByText('Total')).not.toBeInTheDocument();
    });
  });

  describe('AnalyticsFilter', () => {
    const sampleFilters = {
      dateRange: { start: null, end: null },
      departmentId: undefined,
      locationId: undefined,
      jobId: undefined,
    };

    const sampleAvailableFilters = {
      departments: [
        { value: 'eng', label: 'Engineering' },
        { value: 'sales', label: 'Sales' },
        { value: 'marketing', label: 'Marketing' },
      ],
      locations: [
        { value: 'sf', label: 'San Francisco' },
        { value: 'ny', label: 'New York' },
        { value: 'remote', label: 'Remote' },
      ],
      jobs: [
        { value: 'job1', label: 'Senior Software Engineer' },
        { value: 'job2', label: 'Product Manager' },
        { value: 'job3', label: 'Sales Representative' },
      ],
    };

    const mockOnFilterChange = () => {};

    it('renders with sample data', () => {
      render(
        <AnalyticsFilter 
          filters={sampleFilters}
          onFilterChange={mockOnFilterChange}
          availableFilters={sampleAvailableFilters}
        />
      );
      
      // Check main elements
      expect(screen.getByText('Filters')).toBeInTheDocument();
      expect(screen.getByText('Date Range')).toBeInTheDocument();
      expect(screen.getByText('Department')).toBeInTheDocument();
      expect(screen.getByText('Location')).toBeInTheDocument();
      expect(screen.getByText('Job')).toBeInTheDocument();
      
      // Check predefined date ranges
      expect(screen.getByText('Last 7 days')).toBeInTheDocument();
      expect(screen.getByText('Last 30 days')).toBeInTheDocument();
      expect(screen.getByText('Last 90 days')).toBeInTheDocument();
      expect(screen.getByText('Custom Range')).toBeInTheDocument();
      
      // Check filter options
      expect(screen.getByText('All Departments')).toBeInTheDocument();
      expect(screen.getByText('Engineering')).toBeInTheDocument();
      expect(screen.getByText('All Locations')).toBeInTheDocument();
      expect(screen.getByText('San Francisco')).toBeInTheDocument();
      expect(screen.getByText('All Jobs')).toBeInTheDocument();
      expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument();
    });

    it('shows clear all button', () => {
      render(
        <AnalyticsFilter 
          filters={sampleFilters}
          onFilterChange={mockOnFilterChange}
          availableFilters={sampleAvailableFilters}
        />
      );
      
      expect(screen.getByText('Clear all')).toBeInTheDocument();
    });

    it('shows active filter count when filters are applied', () => {
      const filtersWithActive = {
        ...sampleFilters,
        departmentId: 'eng',
        locationId: 'sf',
        dateRange: { start: new Date('2024-01-01'), end: new Date('2024-01-31') },
      };

      render(
        <AnalyticsFilter 
          filters={filtersWithActive}
          onFilterChange={mockOnFilterChange}
          availableFilters={sampleAvailableFilters}
        />
      );
      
      expect(screen.getByText('3 active')).toBeInTheDocument();
    });
  });
});