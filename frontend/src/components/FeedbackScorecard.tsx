/**
 * FeedbackScorecard Component
 * 
 * A structured feedback form for interview evaluation with:
 * - Rating criteria with 1-5 scale
 * - Comments field per criterion
 * - Overall comments textarea
 * - Recommendation selector
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4
 */

import { useState } from 'react';
import { Button } from './Button';
import type { 
  FeedbackRating, 
  InterviewRecommendation,
  Interview 
} from '../services/interviews.service';

export interface FeedbackScorecardProps {
  interview: Interview;
  onSubmit: (feedback: FeedbackSubmission) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export interface FeedbackSubmission {
  ratings: FeedbackRating[];
  overallComments: string;
  recommendation: InterviewRecommendation;
}

// Default scorecard criteria (Requirements 9.1)
export const DEFAULT_CRITERIA = [
  { 
    name: 'technical_skills', 
    label: 'Technical Skills', 
    description: 'Relevant technical knowledge and problem-solving ability' 
  },
  { 
    name: 'communication', 
    label: 'Communication', 
    description: 'Clarity, articulation, and listening skills' 
  },
  { 
    name: 'culture_fit', 
    label: 'Culture Fit', 
    description: 'Alignment with company values and team dynamics' 
  },
  { 
    name: 'experience', 
    label: 'Relevant Experience', 
    description: 'Past experience applicable to the role' 
  },
  { 
    name: 'motivation', 
    label: 'Motivation & Interest', 
    description: 'Enthusiasm for the role and company' 
  },
];

// Recommendation options (Requirements 9.4)
const RECOMMENDATION_OPTIONS: { value: InterviewRecommendation; label: string; color: string }[] = [
  { value: 'strong_hire', label: 'Strong Hire', color: 'bg-green-100 text-green-800 border-green-300' },
  { value: 'hire', label: 'Hire', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { value: 'no_hire', label: 'No Hire', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  { value: 'strong_no_hire', label: 'Strong No Hire', color: 'bg-red-100 text-red-800 border-red-300' },
];

// Rating labels for 1-5 scale
const RATING_LABELS = ['Poor', 'Below Average', 'Average', 'Good', 'Excellent'];

interface CriterionRating {
  criterion: string;
  score: number;
  comments: string;
}

export function FeedbackScorecard({
  interview,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: FeedbackScorecardProps) {
  const [ratings, setRatings] = useState<CriterionRating[]>(
    DEFAULT_CRITERIA.map(c => ({ criterion: c.name, score: 0, comments: '' }))
  );
  const [overallComments, setOverallComments] = useState('');
  const [recommendation, setRecommendation] = useState<InterviewRecommendation | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const candidateName = interview.jobCandidate?.candidate?.name || 'Unknown Candidate';
  const jobTitle = interview.jobCandidate?.job?.title || 'Unknown Job';

  const handleRatingChange = (criterionName: string, score: number) => {
    setRatings(prev => 
      prev.map(r => r.criterion === criterionName ? { ...r, score } : r)
    );
    // Clear error when rating is set
    if (errors[criterionName]) {
      setErrors(prev => ({ ...prev, [criterionName]: '' }));
    }
  };

  const handleCommentsChange = (criterionName: string, comments: string) => {
    setRatings(prev => 
      prev.map(r => r.criterion === criterionName ? { ...r, comments } : r)
    );
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Check all criteria have ratings
    ratings.forEach(r => {
      if (r.score === 0) {
        const criterion = DEFAULT_CRITERIA.find(c => c.name === r.criterion);
        newErrors[r.criterion] = `Please rate ${criterion?.label || r.criterion}`;
      }
    });

    // Check overall comments (Requirements 9.3)
    if (!overallComments.trim()) {
      newErrors.overallComments = 'Overall comments are required';
    }

    // Check recommendation (Requirements 9.4)
    if (!recommendation) {
      newErrors.recommendation = 'Please select a recommendation';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const feedbackRatings: FeedbackRating[] = ratings.map(r => ({
      criterion: r.criterion,
      score: r.score,
      comments: r.comments || undefined,
    }));

    onSubmit({
      ratings: feedbackRatings,
      overallComments,
      recommendation: recommendation!,
    });
  };

  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#e2e8f0]">
        <h3 className="text-lg font-semibold text-[#111827]">Interview Feedback</h3>
        <p className="text-sm text-[#64748b] mt-1">
          {candidateName} • {jobTitle}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Rating Criteria Section (Requirements 9.1, 9.2) */}
        <div className="space-y-6">
          <h4 className="text-sm font-medium text-[#374151] uppercase tracking-wide">
            Evaluation Criteria
          </h4>
          
          {DEFAULT_CRITERIA.map((criterion, index) => {
            const rating = ratings.find(r => r.criterion === criterion.name);
            const currentScore = rating?.score || 0;
            const currentComments = rating?.comments || '';

            return (
              <div 
                key={criterion.name} 
                className={`p-4 rounded-lg border ${
                  errors[criterion.name] ? 'border-red-300 bg-red-50' : 'border-[#e2e8f0] bg-[#f8fafc]'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#111827]">
                        {index + 1}. {criterion.label}
                      </span>
                      {currentScore > 0 && (
                        <span className="text-xs text-[#64748b]">
                          ({RATING_LABELS[currentScore - 1]})
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#64748b] mt-0.5">{criterion.description}</p>
                  </div>
                </div>

                {/* Rating Scale (1-5) */}
                <div className="flex items-center gap-2 mb-3">
                  {[1, 2, 3, 4, 5].map(score => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => handleRatingChange(criterion.name, score)}
                      className={`w-10 h-10 rounded-lg border-2 text-sm font-medium transition-all ${
                        currentScore === score
                          ? 'bg-[#0b6cf0] border-[#0b6cf0] text-white'
                          : currentScore > 0 && score <= currentScore
                          ? 'bg-[#dbeafe] border-[#93c5fd] text-[#1e40af]'
                          : 'bg-white border-[#e2e8f0] text-[#64748b] hover:border-[#0b6cf0]'
                      }`}
                      title={RATING_LABELS[score - 1]}
                    >
                      {score}
                    </button>
                  ))}
                  <span className="text-xs text-[#94a3b8] ml-2">
                    1 = Poor, 5 = Excellent
                  </span>
                </div>

                {/* Comments for this criterion */}
                <textarea
                  value={currentComments}
                  onChange={(e) => handleCommentsChange(criterion.name, e.target.value)}
                  placeholder={`Add comments for ${criterion.label.toLowerCase()}...`}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b6cf0] resize-none"
                />

                {errors[criterion.name] && (
                  <p className="text-xs text-red-600 mt-1">{errors[criterion.name]}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Overall Comments Section (Requirements 9.3) */}
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-2">
            Overall Comments <span className="text-red-500">*</span>
          </label>
          <textarea
            value={overallComments}
            onChange={(e) => {
              setOverallComments(e.target.value);
              if (errors.overallComments) {
                setErrors(prev => ({ ...prev, overallComments: '' }));
              }
            }}
            placeholder="Provide your overall assessment of the candidate, including strengths, areas for improvement, and any other relevant observations..."
            rows={4}
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b6cf0] resize-none ${
              errors.overallComments ? 'border-red-500' : 'border-[#e2e8f0]'
            }`}
          />
          {errors.overallComments && (
            <p className="text-xs text-red-600 mt-1">{errors.overallComments}</p>
          )}
        </div>

        {/* Recommendation Section (Requirements 9.4) */}
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-2">
            Recommendation <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {RECOMMENDATION_OPTIONS.map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setRecommendation(option.value);
                  if (errors.recommendation) {
                    setErrors(prev => ({ ...prev, recommendation: '' }));
                  }
                }}
                className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                  recommendation === option.value
                    ? `${option.color} border-current`
                    : 'bg-white border-[#e2e8f0] text-[#64748b] hover:border-[#cbd5e1]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {errors.recommendation && (
            <p className="text-xs text-red-600 mt-1">{errors.recommendation}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-[#e2e8f0]">
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Submitting...
              </span>
            ) : (
              'Submit Feedback'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default FeedbackScorecard;
