import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EnhancedCandidateCard } from '../EnhancedCandidateCard';

// Mock candidate data for testing
const mockCandidate = {
  id: '1',
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+1 234 567 8900',
  title: 'Senior Software Engineer',
  department: 'Engineering',
  experienceYears: 5,
  currentCompany: 'Tech Corp',
  location: 'San Francisco',
  source: 'LinkedIn',
  availability: 'Immediate',
  skills: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'Python', 'AWS'],
  tags: ['High priority'],
  currentCtc: '$120k',
  expectedCtc: '$150k',
  noticePeriod: '30 days',
  resumeUrl: 'https://example.com/resume.pdf',
  updatedAt: '2 hours ago',
  internalMobility: false,
  age: 30,
  industry: 'Technology',
  jobDomain: 'Software Development',
  candidateSummary: 'Experienced software engineer with 5+ years in full-stack development. Strong expertise in React and Node.js. Led multiple successful projects and mentored junior developers.',
  createdAt: '2024-01-15',
};

describe('EnhancedCandidateCard', () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  it('renders candidate information correctly', () => {
    render(
      <EnhancedCandidateCard
        candidate={mockCandidate}
        onClick={mockOnClick}
        isSelected={false}
      />
    );

    // Check if basic information is displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    expect(screen.getByText('+1 234 567 8900')).toBeInTheDocument();
    expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    expect(screen.getByText('San Francisco')).toBeInTheDocument();
  });

  it('displays skills with overflow handling', () => {
    render(
      <EnhancedCandidateCard
        candidate={mockCandidate}
        onClick={mockOnClick}
        isSelected={false}
      />
    );

    // Should show first 5 skills
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Node.js')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Python')).toBeInTheDocument();
    
    // Should show "+1 more" for the 6th skill
    expect(screen.getByText('+1 more')).toBeInTheDocument();
  });

  it('displays candidate summary when available', () => {
    render(
      <EnhancedCandidateCard
        candidate={mockCandidate}
        onClick={mockOnClick}
        isSelected={false}
      />
    );

    expect(screen.getByText(/Experienced software engineer with 5\+ years/)).toBeInTheDocument();
  });

  it('renders action buttons', () => {
    render(
      <EnhancedCandidateCard
        candidate={mockCandidate}
        onClick={mockOnClick}
        isSelected={false}
      />
    );

    expect(screen.getByText('CV')).toBeInTheDocument();
    expect(screen.getByText('Add to Job')).toBeInTheDocument();
    expect(screen.getByText('Share')).toBeInTheDocument();
    expect(screen.getByText('More Actions')).toBeInTheDocument();
  });

  it('calls onClick when card is clicked', () => {
    const { container } = render(
      <EnhancedCandidateCard
        candidate={mockCandidate}
        onClick={mockOnClick}
        isSelected={false}
      />
    );

    const card = container.firstChild as HTMLElement;
    fireEvent.click(card);

    expect(mockOnClick).toHaveBeenCalledWith(mockCandidate);
  });

  it('applies selected styling when isSelected is true', () => {
    const { container } = render(
      <EnhancedCandidateCard
        candidate={mockCandidate}
        onClick={mockOnClick}
        isSelected={true}
      />
    );

    // Find the main card div (first child of container)
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('ring-2');
    expect(card).toHaveClass('ring-[#0b6cf0]');
    expect(card).toHaveClass('border-[#0b6cf0]');
  });

  it('handles missing optional fields gracefully', () => {
    const candidateWithoutOptionalFields = {
      ...mockCandidate,
      age: undefined,
      industry: undefined,
      jobDomain: undefined,
      candidateSummary: undefined,
    };

    render(
      <EnhancedCandidateCard
        candidate={candidateWithoutOptionalFields}
        onClick={mockOnClick}
        isSelected={false}
      />
    );

    // Should still render basic information
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    
    // Should not show summary section when not available
    expect(screen.queryByText('Summary:')).not.toBeInTheDocument();
  });
});