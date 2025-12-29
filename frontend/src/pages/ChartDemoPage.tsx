/**
 * Chart Demo Page - Task 15: Checkpoint - Frontend Components
 * 
 * This page demonstrates all chart components with sample data for visual verification
 */

import { useState } from 'react';
import FunnelChart from '../components/FunnelChart';
import HorizontalBarChart from '../components/HorizontalBarChart';
import PieChart from '../components/PieChart';
import AnalyticsFilter from '../components/AnalyticsFilter';

export function ChartDemoPage() {
  // Sample data for FunnelChart
  const sampleFunnelData = [
    { id: '1', name: 'Applied', count: 150, percentage: 100, conversionToNext: 60 },
    { id: '2', name: 'Screening', count: 90, percentage: 60, conversionToNext: 56 },
    { id: '3', name: 'Phone Interview', count: 50, percentage: 33, conversionToNext: 70 },
    { id: '4', name: 'Technical Interview', count: 35, percentage: 23, conversionToNext: 71 },
    { id: '5', name: 'Final Interview', count: 25, percentage: 17, conversionToNext: 80 },
    { id: '6', name: 'Offer', count: 20, percentage: 13, conversionToNext: 85 },
    { id: '7', name: 'Hired', count: 17, percentage: 11 },
  ];

  // Sample data for HorizontalBarChart (Time to Fill)
  const sampleTimeToFillData = [
    { id: '1', label: 'Engineering', value: 45, displayValue: '45 days', isOverThreshold: true, subtitle: '12 roles closed' },
    { id: '2', label: 'Product', value: 38, displayValue: '38 days', isOverThreshold: true, subtitle: '8 roles closed' },
    { id: '3', label: 'Sales', value: 28, displayValue: '28 days', isOverThreshold: false, subtitle: '15 roles closed' },
    { id: '4', label: 'Marketing', value: 25, displayValue: '25 days', isOverThreshold: false, subtitle: '6 roles closed' },
    { id: '5', label: 'Customer Success', value: 22, displayValue: '22 days', isOverThreshold: false, subtitle: '4 roles closed' },
  ];

  // Sample data for HorizontalBarChart (Source Performance)
  const sampleSourceData = [
    { id: '1', label: 'LinkedIn', value: 85, displayValue: '85% hire rate', subtitle: '120 candidates' },
    { id: '2', label: 'Employee Referral', value: 78, displayValue: '78% hire rate', subtitle: '45 candidates' },
    { id: '3', label: 'Company Website', value: 65, displayValue: '65% hire rate', subtitle: '89 candidates' },
    { id: '4', label: 'Indeed', value: 52, displayValue: '52% hire rate', subtitle: '156 candidates' },
    { id: '5', label: 'Glassdoor', value: 48, displayValue: '48% hire rate', subtitle: '67 candidates' },
    { id: '6', label: 'University Recruiting', value: 42, displayValue: '42% hire rate', subtitle: '34 candidates' },
  ];

  // Sample data for PieChart
  const sampleRejectionData = [
    { id: '1', label: 'Skill Mismatch', value: 45, percentage: 45, color: '#ef4444' },
    { id: '2', label: 'Compensation Mismatch', value: 25, percentage: 25, color: '#f59e0b' },
    { id: '3', label: 'Culture Fit', value: 20, percentage: 20, color: '#10b981' },
    { id: '4', label: 'Location/Notice/Other', value: 10, percentage: 10, color: '#3b82f6' },
  ];

  // Sample filters state
  const [filters, setFilters] = useState<{
    dateRange: { start: Date | null; end: Date | null };
    departmentId?: string;
    locationId?: string;
    jobId?: string;
    recruiterId?: string;
  }>({
    dateRange: { start: null, end: null },
    departmentId: undefined,
    locationId: undefined,
    jobId: undefined,
    recruiterId: undefined,
  });

  const sampleAvailableFilters = {
    departments: [
      { value: 'eng', label: 'Engineering' },
      { value: 'product', label: 'Product' },
      { value: 'sales', label: 'Sales' },
      { value: 'marketing', label: 'Marketing' },
      { value: 'cs', label: 'Customer Success' },
    ],
    locations: [
      { value: 'sf', label: 'San Francisco' },
      { value: 'ny', label: 'New York' },
      { value: 'austin', label: 'Austin' },
      { value: 'remote', label: 'Remote' },
    ],
    jobs: [
      { value: 'job1', label: 'Senior Software Engineer' },
      { value: 'job2', label: 'Product Manager' },
      { value: 'job3', label: 'Sales Representative' },
      { value: 'job4', label: 'Marketing Specialist' },
      { value: 'job5', label: 'Customer Success Manager' },
    ],
  };

  const handleStageClick = (stage: any) => {
    console.log('Stage clicked:', stage);
    alert(`Clicked on stage: ${stage.name} (${stage.count} candidates)`);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#111827] mb-2">
            Chart Components Demo
          </h1>
          <p className="text-[#64748b]">
            Visual verification of all analytics chart components with sample data
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Analytics Filter */}
          <div className="lg:col-span-1">
            <AnalyticsFilter
              filters={filters}
              onFilterChange={setFilters}
              availableFilters={sampleAvailableFilters}
            />
          </div>

          {/* KPI Cards Placeholder */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-[#e2e8f0] p-6">
              <h3 className="text-lg font-semibold text-[#111827] mb-4">Sample KPI Cards</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Active Roles', value: '24', trend: '+3' },
                  { label: 'Active Candidates', value: '342', trend: '+15' },
                  { label: 'Interviews Today', value: '8', trend: '+2' },
                  { label: 'Offers Pending', value: '12', trend: '-1' },
                ].map((kpi, index) => (
                  <div key={index} className="bg-[#f8fafc] rounded-lg p-4">
                    <div className="text-2xl font-bold text-[#111827]">{kpi.value}</div>
                    <div className="text-sm text-[#64748b]">{kpi.label}</div>
                    <div className="text-xs text-[#10b981] mt-1">{kpi.trend}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Funnel Chart */}
          <FunnelChart
            stages={sampleFunnelData}
            onStageClick={handleStageClick}
            showPercentages={true}
          />

          {/* Rejection Reasons Pie Chart */}
          <PieChart
            data={sampleRejectionData}
            title="Rejection Reasons Distribution"
            showLegend={true}
            showPercentages={true}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 mb-8">
          {/* Time to Fill by Department */}
          <HorizontalBarChart
            data={sampleTimeToFillData}
            title="Average Time to Fill by Department"
            valueLabel="Days from job posting to hire"
            threshold={30}
            thresholdLabel="Target: 30 days"
            showValues={true}
          />
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Source Performance */}
          <HorizontalBarChart
            data={sampleSourceData}
            title="Source Performance by Hire Rate"
            valueLabel="Percentage of candidates hired from each source"
            showValues={true}
            colorScheme={{
              normal: '#10b981',
              warning: '#ef4444',
              threshold: '#f59e0b',
            }}
          />
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-[#eff6ff] border border-[#3b82f6] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[#1e40af] mb-2">
            Component Testing Instructions
          </h3>
          <div className="text-sm text-[#1e40af] space-y-2">
            <p>• <strong>FunnelChart:</strong> Click on any stage to test the click handler</p>
            <p>• <strong>AnalyticsFilter:</strong> Try selecting different date ranges and filters</p>
            <p>• <strong>HorizontalBarChart:</strong> Notice the threshold indicators and color coding</p>
            <p>• <strong>PieChart:</strong> Hover over slices to see the hover effects</p>
            <p>• All components should be responsive and work on different screen sizes</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChartDemoPage;