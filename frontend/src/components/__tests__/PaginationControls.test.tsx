import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaginationControls } from '../PaginationControls';

describe('PaginationControls', () => {
  const mockOnPageChange = vi.fn();

  beforeEach(() => {
    mockOnPageChange.mockClear();
  });

  it('renders pagination info correctly', () => {
    render(
      <PaginationControls
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
        totalItems={50}
        itemsPerPage={10}
      />
    );

    expect(screen.getByText('Showing 1-10 of 50 candidates')).toBeInTheDocument();
  });

  it('renders page numbers correctly', () => {
    render(
      <PaginationControls
        currentPage={3}
        totalPages={5}
        onPageChange={mockOnPageChange}
        totalItems={50}
        itemsPerPage={10}
      />
    );

    // Should show all page numbers for small total
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('highlights current page', () => {
    render(
      <PaginationControls
        currentPage={3}
        totalPages={5}
        onPageChange={mockOnPageChange}
        totalItems={50}
        itemsPerPage={10}
      />
    );

    const currentPageButton = screen.getByText('3');
    expect(currentPageButton).toHaveClass('bg-[#0b6cf0]');
    expect(currentPageButton).toHaveClass('text-white');
  });

  it('calls onPageChange when page number is clicked', () => {
    render(
      <PaginationControls
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
        totalItems={50}
        itemsPerPage={10}
      />
    );

    fireEvent.click(screen.getByText('3'));
    expect(mockOnPageChange).toHaveBeenCalledWith(3);
  });

  it('handles previous button correctly', () => {
    render(
      <PaginationControls
        currentPage={3}
        totalPages={5}
        onPageChange={mockOnPageChange}
        totalItems={50}
        itemsPerPage={10}
      />
    );

    fireEvent.click(screen.getByText('Previous'));
    expect(mockOnPageChange).toHaveBeenCalledWith(2);
  });

  it('handles next button correctly', () => {
    render(
      <PaginationControls
        currentPage={3}
        totalPages={5}
        onPageChange={mockOnPageChange}
        totalItems={50}
        itemsPerPage={10}
      />
    );

    fireEvent.click(screen.getByText('Next'));
    expect(mockOnPageChange).toHaveBeenCalledWith(4);
  });

  it('disables previous button on first page', () => {
    render(
      <PaginationControls
        currentPage={1}
        totalPages={5}
        onPageChange={mockOnPageChange}
        totalItems={50}
        itemsPerPage={10}
      />
    );

    const previousButton = screen.getByText('Previous').closest('button');
    expect(previousButton).toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(
      <PaginationControls
        currentPage={5}
        totalPages={5}
        onPageChange={mockOnPageChange}
        totalItems={50}
        itemsPerPage={10}
      />
    );

    const nextButton = screen.getByText('Next').closest('button');
    expect(nextButton).toBeDisabled();
  });

  it('does not render when totalPages is 1 or less', () => {
    const { container } = render(
      <PaginationControls
        currentPage={1}
        totalPages={1}
        onPageChange={mockOnPageChange}
        totalItems={5}
        itemsPerPage={10}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('shows ellipsis for large page counts', () => {
    render(
      <PaginationControls
        currentPage={5}
        totalPages={20}
        onPageChange={mockOnPageChange}
        totalItems={200}
        itemsPerPage={10}
      />
    );

    // Should show ellipsis when there are many pages
    const ellipsis = screen.getAllByText('...');
    expect(ellipsis.length).toBeGreaterThan(0);
  });

  it('calculates item range correctly for last page', () => {
    render(
      <PaginationControls
        currentPage={5}
        totalPages={5}
        onPageChange={mockOnPageChange}
        totalItems={47}
        itemsPerPage={10}
      />
    );

    // Last page should show 41-47 of 47
    expect(screen.getByText('Showing 41-47 of 47 candidates')).toBeInTheDocument();
  });
});