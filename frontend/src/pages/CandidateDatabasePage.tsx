import { useState, useMemo } from 'react';
import { Layout, KPICard, Badge, Button, DetailPanel, DetailSection, SummaryRow, SkillsTags, Timeline, NotesSection, ActionsSection, LoadingSpinner, ErrorMessage, EnhancedCandidateCard, PaginationControls } from '../components';
import { useAuth } from '../hooks/useAuth';
import { useCandidates } from '../hooks/useCandidates';
import { getResumeUrl } from '../services';
import type { Candidate } from '../services';

/**
 * Candidate Database Page - Requirements 17.1-17.11
 * 
 * Features:
 * - Master candidate list with search and filters
 * - KPI cards showing database metrics
 * - Database insights section
 * - Detail panel for candidate actions
 * - Search with hint text examples
 * - Filter dropdowns for department, location, experience, source, availability, tag, sort
 */

// Types
interface DatabaseCandidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  title: string;
  department: string;
  experienceYears: number;
  currentCompany: string;
  location: string;
  source: string;
  availability: string;
  skills: string[];
  tags: string[];
  currentCtc: string;
  expectedCtc: string;
  noticePeriod: string;
  resumeUrl?: string;
  updatedAt: string;
  internalMobility: boolean;
  // Enhanced fields for comprehensive display
  age?: number;
  industry?: string;
  jobDomain?: string;
  candidateSummary?: string;
  createdAt: string;
}

interface FilterState {
  search: string;
  department: string;
  location: string;
  experience: string;
  source: string;
  availability: string;
  tag: string;
  sortBy: string;
}

// Sample data - Requirements 30.1-30.6 - REMOVED: Now using database data only

// Filter options
const departmentOptions = ['All', 'Engineering', 'Product', 'Sales', 'Design', 'Analytics', 'HR'];
const locationOptions = ['All', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Gurgaon', 'Remote'];
const experienceOptions = ['All', '0-3 yrs', '3-6 yrs', '6-10 yrs', '10+ yrs'];
const sourceOptions = ['All', 'LinkedIn', 'Referral', 'Job Board', 'Career Page', 'Agency', 'Headhunted'];
const availabilityOptions = ['All', 'Immediate', '15 days', '30 days', '60+ days'];
const tagOptions = ['All', 'High priority', 'Fintech', 'Referral', 'Remote', 'Leadership', 'Fresher pool'];
const sortOptions = ['Recently updated', 'Name A-Z', 'Experience high-low', 'Experience low-high'];



// Search and Filter Section Component - Requirements 17.2, 17.3, 9.3, 9.4
function SearchFilterSection({
  filters,
  onFilterChange,
}: {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string) => void;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm space-y-3">
      {/* Search Input - Requirement 17.2, 9.4 */}
      <div className="relative">
        <input
          type="text"
          value={filters.search}
          onChange={(e) => onFilterChange('search', e.target.value)}
          placeholder='Search candidates...'
          className="w-full py-2 pl-9 pr-4 bg-gray-50 border border-gray-200 rounded-md text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Filter Dropdowns - Requirement 17.3, 9.3 */}
      <div className="flex flex-wrap gap-2">
        <FilterDropdown
          label="Department"
          value={filters.department}
          options={departmentOptions}
          onChange={(v) => onFilterChange('department', v)}
        />
        <FilterDropdown
          label="Location"
          value={filters.location}
          options={locationOptions}
          onChange={(v) => onFilterChange('location', v)}
        />
        <FilterDropdown
          label="Experience"
          value={filters.experience}
          options={experienceOptions}
          onChange={(v) => onFilterChange('experience', v)}
        />
        <FilterDropdown
          label="Source"
          value={filters.source}
          options={sourceOptions}
          onChange={(v) => onFilterChange('source', v)}
        />
        <FilterDropdown
          label="Availability"
          value={filters.availability}
          options={availabilityOptions}
          onChange={(v) => onFilterChange('availability', v)}
        />
        <FilterDropdown
          label="Tag"
          value={filters.tag}
          options={tagOptions}
          onChange={(v) => onFilterChange('tag', v)}
        />
        <FilterDropdown
          label="Sort by"
          value={filters.sortBy}
          options={sortOptions}
          onChange={(v) => onFilterChange('sortBy', v)}
        />
      </div>
    </div>
  );
}

// Filter Dropdown Component - Requirement 9.3
function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-[#374151] whitespace-nowrap">{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="py-1.5 px-3 pr-8 text-xs bg-white border border-[#e2e8f0] rounded-lg text-[#374151] appearance-none cursor-pointer focus:outline-none focus:border-[#0b6cf0] focus:ring-2 focus:ring-[#0b6cf0]/20 transition-all"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: 'right 8px center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '14px 14px',
        }}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

// Database Insights Section Component - Requirement 17.5
function DatabaseInsights({ candidates }: { candidates: DatabaseCandidate[] }) {
  // Calculate insights
  const allSkills = candidates.flatMap((c) => c.skills);
  const skillCounts = allSkills.reduce((acc, skill) => {
    acc[skill] = (acc[skill] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topSkills = Object.entries(skillCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([skill]) => skill);

  const locationCounts = candidates.reduce((acc, c) => {
    acc[c.location] = (acc[c.location] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topLocations = Object.entries(locationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([loc]) => loc);

  const allTags = candidates.flatMap((c) => c.tags);
  const tagCounts = allTags.reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag);

  const sourceCounts = candidates.reduce((acc, c) => {
    acc[c.source] = (acc[c.source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topSources = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([source]) => source);

  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-[#111827] mb-4">Database Insights</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 grid-cols-4-responsive">
        <InsightCard title="Top Skills" items={topSkills} variant="blue" />
        <InsightCard title="Top Locations" items={topLocations} variant="green" />
        <InsightCard title="Talent Pool Tags" items={topTags} variant="orange" />
        <InsightCard title="Sources" items={topSources} variant="gray" />
      </div>
    </div>
  );
}

// Insight Card Component
function InsightCard({
  title,
  items,
  variant,
}: {
  title: string;
  items: string[];
  variant: 'blue' | 'green' | 'orange' | 'gray';
}) {
  const variantStyles = {
    blue: 'bg-[#dbeafe] text-[#1d4ed8]',
    green: 'bg-[#dcfce7] text-[#166534]',
    orange: 'bg-[#fef9c3] text-[#854d0e]',
    gray: 'bg-[#f3f4f6] text-[#374151]',
  };

  return (
    <div className="p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
      <h4 className="text-xs font-medium text-[#64748b] mb-2">{title}</h4>
      <div className="flex flex-wrap gap-1">
        {items.map((item) => (
          <span
            key={item}
            className={`px-2 py-0.5 text-[10px] rounded-full ${variantStyles[variant]}`}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}


// Candidate Card Grid Component - Requirements 17.1, 17.6, 9.1, 9.2
function CandidateCardGrid({
  candidates,
  onCandidateClick,
  selectedCandidate,
}: {
  candidates: DatabaseCandidate[];
  onCandidateClick: (candidate: DatabaseCandidate) => void;
  selectedCandidate: DatabaseCandidate | null;
}) {
  if (candidates.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-12 text-center">
        <div className="text-[#64748b] text-lg mb-2">No candidates found</div>
        <div className="text-[#94a3b8] text-sm">Try adjusting your search or filter criteria</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {candidates.map((candidate) => (
        <EnhancedCandidateCard
          key={candidate.id}
          candidate={candidate}
          onClick={onCandidateClick}
          isSelected={selectedCandidate?.id === candidate.id}
        />
      ))}
    </div>
  );
}

// Candidate Detail Panel Content - Requirements 17.7, 17.8, 17.9
function CandidateDetailContent({
  candidate,
}: {
  candidate: DatabaseCandidate;
}) {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSaveNote = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setNote('');
    }, 1000);
  };

  // Sample ATS roles for the candidate
  const atsRoles = [
    { role: 'Senior Backend Engineer', year: '2024' },
    { role: 'Backend Architect', year: '2023' },
  ];

  const timelineEntries = [
    { id: '1', date: candidate.updatedAt, description: 'Profile updated' },
    { id: '2', date: '1 week ago', description: 'Added to talent pool' },
    { id: '3', date: '2 weeks ago', description: `Applied via ${candidate.source}` },
  ];

  const actions = [
    { label: 'View CV', onClick: () => window.open(getResumeUrl(candidate.resumeUrl), '_blank'), variant: 'primary' as const },
    { label: 'Add to role', onClick: () => { }, variant: 'secondary' as const },
    { label: 'Share profile', onClick: () => { }, variant: 'secondary' as const },
    { label: 'Block candidate', onClick: () => { }, variant: 'danger' as const },
  ];

  return (
    <>
      {/* Profile Summary - Requirement 17.7 */}
      <DetailSection title="Profile Summary">
        <SummaryRow label="Primary department" value={candidate.department} />
        <SummaryRow label="Primary role" value={candidate.title} />
        <SummaryRow label="Total experience" value={`${candidate.experienceYears} years`} />
        <SummaryRow label="Location preference" value={candidate.location} />
        <SummaryRow label="Current company" value={candidate.currentCompany} />
        <SummaryRow label="Current CTC" value={candidate.currentCtc} />
        <SummaryRow label="Expected CTC" value={candidate.expectedCtc} />
      </DetailSection>

      {/* Skills & Keywords - Requirement 17.7 */}
      <DetailSection title="Skills & Keywords">
        <SkillsTags skills={candidate.skills} />
      </DetailSection>

      {/* ATS Roles - Requirement 17.7 */}
      <DetailSection title="ATS Roles">
        <div className="space-y-2">
          {atsRoles.map((role, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-[#374151]">{role.role}</span>
              <span className="text-[#64748b]">{role.year}</span>
            </div>
          ))}
        </div>
      </DetailSection>

      {/* Contact & Flags - Requirement 17.7 */}
      <DetailSection title="Contact & Flags">
        <SummaryRow label="Email" value={candidate.email} />
        <SummaryRow label="Phone" value={candidate.phone} />
        <SummaryRow label="Source" value={candidate.source} />
        <SummaryRow
          label="Internal mobility"
          value={
            candidate.internalMobility ? (
              <Badge text="Yes" variant="green" />
            ) : (
              <Badge text="No" variant="gray" />
            )
          }
        />
        <SummaryRow label="Availability" value={candidate.availability} />
      </DetailSection>

      <DetailSection title="Timeline">
        <Timeline entries={timelineEntries} />
      </DetailSection>

      <DetailSection title="Notes">
        <NotesSection
          value={note}
          onChange={setNote}
          onSave={handleSaveNote}
          saving={saving}
        />
      </DetailSection>

      {/* Actions - Requirement 17.8 */}
      <DetailSection title="Actions">
        <ActionsSection
          actions={actions}
          lastUpdated={candidate.updatedAt}
        />
      </DetailSection>
    </>
  );
}


// Main Candidate Database Page Component
export function CandidateDatabasePage() {
  const { user, logout } = useAuth();
  const { data: apiCandidates, isLoading, error, refetch } = useCandidates();
  const [selectedCandidate, setSelectedCandidate] = useState<DatabaseCandidate | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    department: 'All',
    location: 'All',
    experience: 'All',
    source: 'All',
    availability: 'All',
    tag: 'All',
    sortBy: 'Recently updated',
  });

  // Map API candidates to local format
  const candidatesFromApi: DatabaseCandidate[] = useMemo(() => {
    if (!apiCandidates) return [];
    return apiCandidates.map((c: Candidate) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone || '',
      title: c.title || c.currentCompany || 'Candidate',
      department: c.department || 'Engineering', // Default, would come from job association
      experienceYears: c.experienceYears,
      currentCompany: c.currentCompany || '',
      location: c.location,
      source: c.source,
      availability: c.availability || 'Not specified',
      skills: Array.isArray(c.skills) ? c.skills : [],
      tags: Array.isArray(c.tags) ? c.tags : [],
      currentCtc: c.currentCtc || '',
      expectedCtc: c.expectedCtc || '',
      noticePeriod: c.noticePeriod || '',
      resumeUrl: c.resumeUrl,
      updatedAt: new Date(c.updatedAt).toLocaleDateString(),
      internalMobility: c.internalMobility || false,
      // Enhanced fields from database
      age: c.age,
      industry: c.industry,
      jobDomain: c.jobDomain,
      candidateSummary: c.candidateSummary,
      createdAt: new Date(c.createdAt).toLocaleDateString(),
    }));
  }, [apiCandidates]);

  // Use API data only - no fallback to sample data
  const allCandidates = candidatesFromApi;

  // Filter and sort candidates
  const filteredCandidates = useMemo(() => {
    let result = [...allCandidates];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(searchLower) ||
          c.email.toLowerCase().includes(searchLower) ||
          c.skills.some((s) => s.toLowerCase().includes(searchLower)) ||
          c.location.toLowerCase().includes(searchLower) ||
          c.department.toLowerCase().includes(searchLower) ||
          (filters.search.includes('internal') && c.internalMobility)
      );
    }

    // Department filter
    if (filters.department !== 'All') {
      result = result.filter((c) => c.department === filters.department);
    }

    // Location filter
    if (filters.location !== 'All') {
      result = result.filter((c) => c.location === filters.location);
    }

    // Experience filter
    if (filters.experience !== 'All') {
      result = result.filter((c) => {
        const exp = c.experienceYears;
        switch (filters.experience) {
          case '0-3 yrs':
            return exp >= 0 && exp <= 3;
          case '3-6 yrs':
            return exp > 3 && exp <= 6;
          case '6-10 yrs':
            return exp > 6 && exp <= 10;
          case '10+ yrs':
            return exp > 10;
          default:
            return true;
        }
      });
    }

    // Source filter
    if (filters.source !== 'All') {
      result = result.filter((c) => c.source === filters.source);
    }

    // Availability filter
    if (filters.availability !== 'All') {
      result = result.filter((c) => c.availability === filters.availability);
    }

    // Tag filter
    if (filters.tag !== 'All') {
      result = result.filter((c) => c.tags.includes(filters.tag));
    }

    // Sort
    switch (filters.sortBy) {
      case 'Name A-Z':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'Experience high-low':
        result.sort((a, b) => b.experienceYears - a.experienceYears);
        break;
      case 'Experience low-high':
        result.sort((a, b) => a.experienceYears - b.experienceYears);
        break;
      default:
        // Recently updated - keep original order (already sorted by updatedAt in sample data)
        break;
    }

    return result;
  }, [filters, allCandidates]);

  // Pagination logic
  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);
  const paginatedCandidates = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredCandidates.slice(startIndex, endIndex);
  }, [filteredCandidates, currentPage, itemsPerPage]);

  // Reset to first page when filters change
  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Calculate KPI metrics - Requirement 17.4
  const totalCandidates = allCandidates.length;
  const uniqueSkills = new Set(allCandidates.flatMap((c) => c.skills)).size;
  const locationsCovered = new Set(allCandidates.map((c) => c.location)).size;
  const updatedLast30Days = allCandidates.filter(
    (c) => !c.updatedAt.includes('week') && !c.updatedAt.includes('month')
  ).length;

  // Header actions - Requirement 17.10
  const headerActions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm">Saved views</Button>
      <Button variant="outline" size="sm">Export candidates</Button>
    </div>
  );

  return (
    <Layout
      pageTitle="Master Candidate Database"
      pageSubtitle="Offline master list of all candidates across roles and years"
      headerActions={headerActions}
      user={user}
      companyName="Acme Technologies"
      footerLeftText="SnapFind Client ATS · Candidate Database view"
      footerRightText="Time-to-fill (median): 24 days · Offer acceptance: 78%"
      onLogout={logout}
    >
      {/* Loading and Error States */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {error && (
        <ErrorMessage
          message="Failed to load candidates"
          onRetry={() => refetch()}
        />
      )}

      <div className="space-y-6">
        {/* Search and Filters - Requirements 17.2, 17.3 */}
        <SearchFilterSection filters={filters} onFilterChange={handleFilterChange} />

        {/* KPI Cards - Requirement 17.4, 22.3 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 grid-cols-4-responsive">
          <KPICard
            label="Total Candidates"
            value={totalCandidates}
            subtitle="Across all roles & years"
          />
          <KPICard
            label="Unique Skills"
            value={uniqueSkills}
            subtitle="Distinct technical/functional skills"
          />
          <KPICard
            label="Locations Covered"
            value={locationsCovered}
            subtitle="Cities/remote options"
          />
          <KPICard
            label="Updated Last 30 Days"
            value={updatedLast30Days}
            subtitle="New or updated profiles"
            trend={{ text: '+5 this week', type: 'ok' }}
          />
        </div>

        {/* Candidate Card Grid - Requirements 17.1, 17.6 */}
        <CandidateCardGrid
          candidates={paginatedCandidates}
          onCandidateClick={setSelectedCandidate}
          selectedCandidate={selectedCandidate}
        />

        {/* Pagination Controls - Requirement 4.1, 4.2, 4.3, 4.4, 4.5 */}
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalItems={filteredCandidates.length}
          itemsPerPage={itemsPerPage}
        />

        {/* Database Insights - Requirement 17.5 (moved to bottom) */}
        <DatabaseInsights candidates={allCandidates} />
      </div>

      {/* Detail Panel - Requirements 17.7, 17.8, 17.9 */}
      <DetailPanel
        isOpen={!!selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        title={selectedCandidate?.name || ''}
        subtitle={
          selectedCandidate
            ? `${selectedCandidate.title} · ${selectedCandidate.location} · ${selectedCandidate.department}`
            : ''
        }
      >
        {selectedCandidate && (
          <CandidateDetailContent candidate={selectedCandidate} />
        )}
      </DetailPanel>
    </Layout>
  );
}

export default CandidateDatabasePage;
