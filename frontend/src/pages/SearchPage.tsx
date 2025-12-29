/**
 * SearchPage Component - Requirements 13.1, 13.4
 * 
 * Advanced search page with:
 * - Boolean query support with help
 * - Search results with highlighting
 * - Support for both candidate and job search
 * - Advanced filtering capabilities
 */

import { useState, useCallback, useMemo } from 'react';
import { useCandidateSearch, useJobSearch, useBooleanQueryParser, useSearchSuggestions } from '../hooks/useSearch';
import { SearchInput } from '../components/SearchInput';
import { AdvancedFilters } from '../components/AdvancedFilters';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { PaginationControls } from '../components/PaginationControls';
import { Badge } from '../components/Badge';
import type { Candidate, Job } from '../types';

type SearchType = 'candidates' | 'jobs';

interface SearchResultItemProps {
  item: Candidate | Job;
  type: SearchType;
  highlights: Map<string, string[]>;
  onClick: (item: Candidate | Job) => void;
}

function SearchResultItem({ item, type, highlights, onClick }: SearchResultItemProps) {
  const handleClick = useCallback(() => {
    onClick(item);
  }, [item, onClick]);

  const getHighlightedText = useCallback((text: string, field: string) => {
    const fieldHighlights = highlights.get(field) || [];
    if (fieldHighlights.length === 0) return text;

    let highlightedText = text;
    fieldHighlights.forEach(highlight => {
      const regex = new RegExp(`(${highlight})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
    });

    return highlightedText;
  }, [highlights]);

  if (type === 'candidates') {
    const candidate = item as Candidate;
    return (
      <div
        className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
        onClick={handleClick}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 
              className="text-lg font-semibold text-gray-900 mb-2"
              dangerouslySetInnerHTML={{ __html: getHighlightedText(candidate.name, 'name') }}
            />
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <span 
                  dangerouslySetInnerHTML={{ __html: getHighlightedText(candidate.email, 'email') }}
                />
                {candidate.phone && (
                  <span 
                    dangerouslySetInnerHTML={{ __html: getHighlightedText(candidate.phone, 'phone') }}
                  />
                )}
              </div>
              <div className="flex items-center space-x-4">
                <span>{candidate.experienceYears} years experience</span>
                <span 
                  dangerouslySetInnerHTML={{ __html: getHighlightedText(candidate.location, 'location') }}
                />
              </div>
              {candidate.currentCompany && (
                <div 
                  dangerouslySetInnerHTML={{ __html: getHighlightedText(candidate.currentCompany, 'currentCompany') }}
                />
              )}
              {candidate.skills && candidate.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {candidate.skills.slice(0, 5).map((skill, index) => (
                    <Badge 
                      key={index} 
                      text={skill}
                      variant="gray"
                    />
                  ))}
                  {candidate.skills.length > 5 && (
                    <Badge text={`+${candidate.skills.length - 5} more`} variant="gray" />
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            {candidate.score && (
              <div className="text-sm text-gray-500 mb-2">
                Score: {candidate.score}%
              </div>
            )}
            {candidate.currentStage && (
              <Badge text={candidate.currentStage} variant="blue" />
            )}
          </div>
        </div>
      </div>
    );
  } else {
    const job = item as Job;
    return (
      <div
        className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
        onClick={handleClick}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 
              className="text-lg font-semibold text-gray-900 mb-2"
              dangerouslySetInnerHTML={{ __html: getHighlightedText(job.title, 'title') }}
            />
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <span 
                  dangerouslySetInnerHTML={{ __html: getHighlightedText(job.department, 'department') }}
                />
                <span 
                  dangerouslySetInnerHTML={{ __html: getHighlightedText(job.location, 'location') }}
                />
              </div>
              {job.salaryRange && (
                <div 
                  dangerouslySetInnerHTML={{ __html: getHighlightedText(job.salaryRange, 'salaryRange') }}
                />
              )}
              {job.skills && job.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {job.skills.slice(0, 5).map((skill, index) => (
                    <Badge 
                      key={index} 
                      text={skill}
                      variant="gray"
                    />
                  ))}
                  {job.skills.length > 5 && (
                    <Badge text={`+${job.skills.length - 5} more`} variant="gray" />
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="flex flex-col items-end space-y-2">
              <Badge 
                text={job.status}
                variant={job.status === 'active' ? 'green' : job.status === 'paused' ? 'orange' : 'gray'}
              />
              {job.priority && (
                <Badge 
                  text={job.priority}
                  variant={job.priority === 'High' ? 'red' : job.priority === 'Medium' ? 'orange' : 'gray'}
                />
              )}
              {job.candidateCount !== undefined && (
                <div className="text-sm text-gray-500">
                  {job.candidateCount} candidates
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

interface BooleanHelpProps {
  isVisible: boolean;
  onClose: () => void;
}

function BooleanHelp({ isVisible, onClose }: BooleanHelpProps) {
  if (!isVisible) return null;

  return (
    <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900">Boolean Search Help</h4>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="space-y-3 text-sm">
        <div>
          <strong>AND:</strong> Find results containing all terms
          <div className="text-gray-600 ml-4">Example: "javascript AND react"</div>
        </div>
        <div>
          <strong>OR:</strong> Find results containing any term
          <div className="text-gray-600 ml-4">Example: "python OR java"</div>
        </div>
        <div>
          <strong>NOT:</strong> Exclude terms from results
          <div className="text-gray-600 ml-4">Example: "developer NOT junior"</div>
        </div>
        <div>
          <strong>Quotes:</strong> Search for exact phrases
          <div className="text-gray-600 ml-4">Example: "senior developer"</div>
        </div>
        <div>
          <strong>Combine:</strong> Use parentheses to group terms
          <div className="text-gray-600 ml-4">Example: "react AND (typescript OR javascript)"</div>
        </div>
      </div>
    </div>
  );
}

export function SearchPage() {
  const [searchType, setSearchType] = useState<SearchType>('candidates');
  const [showBooleanHelp, setShowBooleanHelp] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Boolean query parser
  const { query, setQuery, parsedQuery } = useBooleanQueryParser();

  // Search hooks
  const candidateSearch = useCandidateSearch(
    { query },
    300,
    { enabled: searchType === 'candidates' }
  );

  const jobSearch = useJobSearch(
    { query },
    300,
    { enabled: searchType === 'jobs' }
  );

  // Get active search based on type
  const activeSearch = searchType === 'candidates' ? candidateSearch : jobSearch;

  // Search suggestions
  const { data: suggestions } = useSearchSuggestions(query, searchType, 200, {
    enabled: query.length >= 2 && !parsedQuery.isValid
  });

  // Handle search type change
  const handleSearchTypeChange = useCallback((type: SearchType) => {
    setSearchType(type);
  }, []);

  // Handle search query change
  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, [setQuery]);

  // Handle result item click
  const handleResultClick = useCallback((item: Candidate | Job) => {
    if (searchType === 'candidates') {
      // Navigate to candidate profile
      window.location.href = `/candidates/${item.id}`;
    } else {
      // Navigate to job details
      window.location.href = `/jobs/${item.id}`;
    }
  }, [searchType]);

  // Handle filter changes
  const handleFilterChange = useCallback((filters: any) => {
    activeSearch.updateFilters(filters);
  }, [activeSearch]);

  // Handle clear filters
  const handleClearFilters = useCallback(() => {
    activeSearch.clearFilters();
  }, [activeSearch]);

  // Handle pagination
  const handlePageChange = useCallback((page: number) => {
    activeSearch.updatePagination(page);
  }, [activeSearch]);

  // Memoized results
  const results = useMemo(() => {
    return activeSearch.data?.items || [];
  }, [activeSearch.data]);

  const totalResults = activeSearch.data?.total || 0;
  const currentPage = activeSearch.searchQuery.page;
  const pageSize = activeSearch.searchQuery.pageSize;
  const totalPages = Math.ceil(totalResults / pageSize);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Advanced Search</h1>
          <p className="text-gray-600">
            Search for {searchType} using Boolean operators and advanced filters
          </p>
        </div>

        {/* Search Type Toggle */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => handleSearchTypeChange('candidates')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                searchType === 'candidates'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Candidates
            </button>
            <button
              onClick={() => handleSearchTypeChange('jobs')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                searchType === 'jobs'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Jobs
            </button>
          </div>
        </div>

        {/* Search Input with Boolean Help */}
        <div className="mb-6 relative">
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <SearchInput
                value={query}
                onChange={handleQueryChange}
                placeholder={`Search ${searchType} using Boolean operators (AND, OR, NOT)...`}
                className="w-full"
              />
              <BooleanHelp
                isVisible={showBooleanHelp}
                onClose={() => setShowBooleanHelp(false)}
              />
            </div>
            <button
              onClick={() => setShowBooleanHelp(!showBooleanHelp)}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Boolean Help
            </button>
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-4 py-2 text-sm font-medium border rounded-lg transition-colors ${
                showAdvancedFilters
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'text-gray-600 bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              Advanced Filters
              {activeSearch.activeFilterCount > 0 && (
                <Badge text={activeSearch.activeFilterCount.toString()} variant="blue" className="ml-2" />
              )}
            </button>
          </div>

          {/* Query Validation */}
          {query && !parsedQuery.isValid && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-4 h-4 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-red-700">
                  {parsedQuery.error || 'Invalid search query'}
                </span>
              </div>
            </div>
          )}

          {/* Search Suggestions */}
          {suggestions && suggestions.length > 0 && query.length >= 2 && (
            <div className="absolute top-full left-0 right-0 z-40 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleQueryChange(suggestion.value)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-900">{suggestion.label}</span>
                    {suggestion.count && (
                      <span className="text-xs text-gray-500">{suggestion.count} results</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="mb-6">
            <AdvancedFilters
              type={searchType}
              filters={activeSearch.searchQuery.filters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              activeFilterCount={activeSearch.activeFilterCount}
            />
          </div>
        )}

        {/* Results Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Results Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Search Results
                </h2>
                {totalResults > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    {totalResults.toLocaleString()} {searchType} found
                    {activeSearch.data?.searchTime && (
                      <span> in {activeSearch.data.searchTime}ms</span>
                    )}
                  </p>
                )}
              </div>
              {activeSearch.activeFilterCount > 0 && (
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>

          {/* Results Content */}
          <div className="p-6">
            {activeSearch.isSearching ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
                <span className="ml-3 text-gray-600">Searching...</span>
              </div>
            ) : activeSearch.error ? (
              <div className="text-center py-12">
                <div className="text-red-600 mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Search Error</h3>
                <p className="text-gray-600 mb-4">
                  {activeSearch.error?.message || 'An error occurred while searching'}
                </p>
                <button
                  onClick={() => activeSearch.refetch()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : results.length === 0 ? (
              <EmptyState
                title={`No ${searchType} found`}
                description={
                  query || activeSearch.activeFilterCount > 0
                    ? `Try adjusting your search query or filters`
                    : `Enter a search query to find ${searchType}`
                }
                actionLabel={
                  activeSearch.activeFilterCount > 0 ? "Clear Filters" : undefined
                }
                onAction={
                  activeSearch.activeFilterCount > 0 ? handleClearFilters : undefined
                }
              />
            ) : (
              <>
                {/* Results List */}
                <div className="space-y-4">
                  {results.map((item) => (
                    <SearchResultItem
                      key={item.id}
                      item={item}
                      type={searchType}
                      highlights={activeSearch.data?.highlights || new Map()}
                      onClick={handleResultClick}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center">
                    <PaginationControls
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={totalResults}
                      itemsPerPage={pageSize}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchPage;