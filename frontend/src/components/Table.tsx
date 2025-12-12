import { useState, useMemo } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

/**
 * Table Component - Requirements 29.1, 29.2, 29.3, 29.4, 23.1, 23.4
 * 
 * Features:
 * - 10-12px font size, left-aligned text, bottom borders
 * - Muted header color (#64748b), 500 font weight
 * - Hover highlighting with light blue background (#eff6ff)
 * - Selected row highlighting with stronger blue (#dbeafe)
 * - Sorting support
 * - Loading state with spinner
 * - Empty state message
 */

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  selectedRow?: T;
  loading?: boolean;
  emptyMessage?: string;
  keyExtractor: (row: T) => string;
  className?: string;
}

type SortDirection = 'asc' | 'desc' | null;

export function Table<T>({
  columns,
  data,
  onRowClick,
  selectedRow,
  loading = false,
  emptyMessage = 'No data available',
  keyExtractor,
  className = '',
}: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortKey(null);
        setSortDirection(null);
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return data;

    return [...data].sort((a, b) => {
      const aValue = (a as Record<string, unknown>)[sortKey];
      const bValue = (b as Record<string, unknown>)[sortKey];

      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison = aValue < bValue ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data, sortKey, sortDirection]);

  const getSortIcon = (key: string) => {
    if (sortKey !== key) return '↕';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const isSelected = (row: T) => {
    if (!selectedRow) return false;
    return keyExtractor(row) === keyExtractor(selectedRow);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="md" text="Loading data..." />
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto table-responsive ${className}`}>
      <table className="w-full text-[11px] min-w-[600px]">
        {/* Header - Requirements 4.1, 4.2 */}
        <thead className="bg-[#f9fafb]">
          <tr className="border-b border-[#e2e8f0]">
            {columns.map((column) => (
              <th
                key={column.key}
                className={`
                  py-3 px-3 text-[#6b7280] font-medium text-xs uppercase tracking-wider
                  ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'}
                  ${column.sortable ? 'cursor-pointer hover:text-[#374151] select-none' : ''}
                `}
                style={{ width: column.width }}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <span className="inline-flex items-center gap-1">
                  {column.header}
                  {column.sortable && (
                    <span className="text-[10px] opacity-60">
                      {getSortIcon(column.key)}
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>

        {/* Body - Requirements 29.1, 29.3, 29.4 */}
        <tbody>
          {sortedData.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="py-12 text-center text-[#64748b]"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedData.map((row) => (
              <tr
                key={keyExtractor(row)}
                onClick={() => onRowClick?.(row)}
                className={`
                  border-b border-[#e2e8f0] transition-colors
                  ${onRowClick ? 'cursor-pointer' : ''}
                  ${isSelected(row) 
                    ? 'bg-[#eff6ff]' 
                    : 'hover:bg-[#f9fafb]'
                  }
                `}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`
                      py-3 px-3 text-[#374151]
                      ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'}
                    `}
                  >
                    {column.render 
                      ? column.render(row) 
                      : String((row as Record<string, unknown>)[column.key] ?? '')
                    }
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Pagination Component - Requirement 4.5
 * 
 * Features:
 * - Numbered page buttons with blue highlight for current page
 * - Previous/Next navigation buttons
 * - Consistent styling with the table theme
 */

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const baseButtonClass = `
    px-3 py-1.5 text-sm font-medium rounded-md transition-colors
    border border-[#e2e8f0]
  `;

  const activeButtonClass = `
    bg-[#0b6cf0] text-white border-[#0b6cf0]
  `;

  const inactiveButtonClass = `
    bg-white text-[#374151] hover:bg-[#f9fafb]
  `;

  const disabledButtonClass = `
    bg-[#f9fafb] text-[#9ca3af] cursor-not-allowed
  `;

  return (
    <div className={`flex items-center justify-center gap-1 mt-4 ${className}`}>
      {/* Previous Button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`${baseButtonClass} ${currentPage === 1 ? disabledButtonClass : inactiveButtonClass}`}
      >
        ←
      </button>

      {/* Page Numbers */}
      {getPageNumbers().map((page, index) => (
        typeof page === 'number' ? (
          <button
            key={index}
            onClick={() => onPageChange(page)}
            className={`${baseButtonClass} ${page === currentPage ? activeButtonClass : inactiveButtonClass}`}
          >
            {page}
          </button>
        ) : (
          <span key={index} className="px-2 text-[#9ca3af]">
            {page}
          </span>
        )
      ))}

      {/* Next Button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`${baseButtonClass} ${currentPage === totalPages ? disabledButtonClass : inactiveButtonClass}`}
      >
        →
      </button>
    </div>
  );
}

export default Table;
