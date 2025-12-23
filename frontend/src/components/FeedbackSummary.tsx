/**
 * FeedbackSummary Component
 * 
 * Displays all submitted feedback for an interview with:
 * - All submitted feedback from panel members
 * - Aggregate scores across criteria
 * - Recommendations from each panel member
 * 
 * Requirements: 14.5
 */

import { Badge } from './Badge';
import { DEFAULT_CRITERIA } from './FeedbackScorecard';
import type { 
  InterviewFeedback, 
  InterviewRecommendation 
} from '../services/interviews.service';

export interface FeedbackSummaryProps {
  feedback: InterviewFeedback[];
  totalPanelMembers?: number;
}

// Get recommendation badge variant
function getRecommendationVariant(recommendation: InterviewRecommendation): 'green' | 'blue' | 'orange' | 'red' {
  switch (recommendation) {
    case 'strong_hire':
      return 'green';
    case 'hire':
      return 'blue';
    case 'no_hire':
      return 'orange';
    case 'strong_no_hire':
      return 'red';
    default:
      return 'blue';
  }
}

// Format recommendation for display
function formatRecommendation(recommendation: InterviewRecommendation): string {
  switch (recommendation) {
    case 'strong_hire':
      return 'Strong Hire';
    case 'hire':
      return 'Hire';
    case 'no_hire':
      return 'No Hire';
    case 'strong_no_hire':
      return 'Strong No Hire';
    default:
      return recommendation;
  }
}

// Format date for display
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// Calculate aggregate scores
function calculateAggregateScores(feedback: InterviewFeedback[]): Map<string, { total: number; count: number; avg: number }> {
  const aggregates = new Map<string, { total: number; count: number; avg: number }>();

  feedback.forEach(fb => {
    fb.ratings.forEach(rating => {
      const existing = aggregates.get(rating.criterion) || { total: 0, count: 0, avg: 0 };
      existing.total += rating.score;
      existing.count += 1;
      existing.avg = existing.total / existing.count;
      aggregates.set(rating.criterion, existing);
    });
  });

  return aggregates;
}

// Get score color based on value
function getScoreColor(score: number): string {
  if (score >= 4) return 'text-green-600';
  if (score >= 3) return 'text-blue-600';
  if (score >= 2) return 'text-orange-600';
  return 'text-red-600';
}

// Get score background color
function getScoreBgColor(score: number): string {
  if (score >= 4) return 'bg-green-100';
  if (score >= 3) return 'bg-blue-100';
  if (score >= 2) return 'bg-orange-100';
  return 'bg-red-100';
}

export function FeedbackSummary({ feedback, totalPanelMembers }: FeedbackSummaryProps) {
  if (feedback.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-6">
        <div className="text-center py-8">
          <div className="text-4xl mb-3">📝</div>
          <h3 className="text-lg font-medium text-[#111827] mb-1">No Feedback Yet</h3>
          <p className="text-sm text-[#64748b]">
            Feedback will appear here once panel members submit their evaluations.
          </p>
        </div>
      </div>
    );
  }

  const aggregateScores = calculateAggregateScores(feedback);
  const overallAverage = Array.from(aggregateScores.values()).reduce(
    (sum, { avg }) => sum + avg, 0
  ) / aggregateScores.size;

  // Count recommendations
  const recommendationCounts = feedback.reduce((acc, fb) => {
    acc[fb.recommendation] = (acc[fb.recommendation] || 0) + 1;
    return acc;
  }, {} as Record<InterviewRecommendation, number>);

  const completionPercentage = totalPanelMembers 
    ? Math.round((feedback.length / totalPanelMembers) * 100)
    : 100;

  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#e2e8f0]">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#111827]">Feedback Summary</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#64748b]">
              {feedback.length}{totalPanelMembers ? `/${totalPanelMembers}` : ''} responses
            </span>
            {totalPanelMembers && (
              <Badge 
                text={`${completionPercentage}%`} 
                variant={completionPercentage === 100 ? 'green' : 'orange'} 
              />
            )}
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Aggregate Scores Section */}
        <div>
          <h4 className="text-sm font-medium text-[#374151] uppercase tracking-wide mb-4">
            Aggregate Scores
          </h4>
          
          {/* Overall Score */}
          <div className="flex items-center gap-4 mb-4 p-4 bg-[#f8fafc] rounded-lg">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getScoreBgColor(overallAverage)}`}>
              <span className={`text-2xl font-bold ${getScoreColor(overallAverage)}`}>
                {overallAverage.toFixed(1)}
              </span>
            </div>
            <div>
              <div className="text-sm font-medium text-[#111827]">Overall Score</div>
              <div className="text-xs text-[#64748b]">Average across all criteria</div>
            </div>
          </div>

          {/* Individual Criteria Scores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {DEFAULT_CRITERIA.map(criterion => {
              const aggregate = aggregateScores.get(criterion.name);
              const avgScore = aggregate?.avg || 0;

              return (
                <div 
                  key={criterion.name}
                  className="flex items-center justify-between p-3 bg-[#f8fafc] rounded-lg"
                >
                  <span className="text-sm text-[#374151]">{criterion.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-[#e2e8f0] rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          avgScore >= 4 ? 'bg-green-500' :
                          avgScore >= 3 ? 'bg-blue-500' :
                          avgScore >= 2 ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${(avgScore / 5) * 100}%` }}
                      />
                    </div>
                    <span className={`text-sm font-medium ${getScoreColor(avgScore)}`}>
                      {avgScore.toFixed(1)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recommendations Summary */}
        <div>
          <h4 className="text-sm font-medium text-[#374151] uppercase tracking-wide mb-4">
            Recommendations
          </h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(recommendationCounts).map(([rec, count]) => (
              <Badge
                key={rec}
                text={`${formatRecommendation(rec as InterviewRecommendation)} (${count})`}
                variant={getRecommendationVariant(rec as InterviewRecommendation)}
              />
            ))}
          </div>
        </div>

        {/* Individual Feedback Cards */}
        <div>
          <h4 className="text-sm font-medium text-[#374151] uppercase tracking-wide mb-4">
            Individual Feedback
          </h4>
          <div className="space-y-4">
            {feedback.map(fb => (
              <div 
                key={fb.id}
                className="border border-[#e2e8f0] rounded-lg overflow-hidden"
              >
                {/* Feedback Header */}
                <div className="px-4 py-3 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#0b6cf0] flex items-center justify-center text-white text-sm font-medium">
                      {fb.panelMember?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#111827]">
                        {fb.panelMember?.name || 'Unknown'}
                      </div>
                      <div className="text-xs text-[#64748b]">
                        {formatDate(fb.submittedAt)}
                      </div>
                    </div>
                  </div>
                  <Badge 
                    text={formatRecommendation(fb.recommendation)} 
                    variant={getRecommendationVariant(fb.recommendation)} 
                  />
                </div>

                {/* Feedback Content */}
                <div className="p-4 space-y-4">
                  {/* Ratings */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {fb.ratings.map(rating => {
                      const criterion = DEFAULT_CRITERIA.find(c => c.name === rating.criterion);
                      return (
                        <div 
                          key={rating.criterion}
                          className="flex items-center justify-between p-2 bg-[#f8fafc] rounded text-sm"
                        >
                          <span className="text-[#64748b] truncate">
                            {criterion?.label || rating.criterion}
                          </span>
                          <span className={`font-medium ${getScoreColor(rating.score)}`}>
                            {rating.score}/5
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Criterion Comments */}
                  {fb.ratings.some(r => r.comments) && (
                    <div className="space-y-2">
                      {fb.ratings.filter(r => r.comments).map(rating => {
                        const criterion = DEFAULT_CRITERIA.find(c => c.name === rating.criterion);
                        return (
                          <div key={rating.criterion} className="text-sm">
                            <span className="font-medium text-[#374151]">
                              {criterion?.label || rating.criterion}:
                            </span>{' '}
                            <span className="text-[#64748b]">{rating.comments}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Overall Comments */}
                  {fb.overallComments && (
                    <div className="pt-3 border-t border-[#e2e8f0]">
                      <div className="text-xs font-medium text-[#374151] uppercase tracking-wide mb-1">
                        Overall Comments
                      </div>
                      <p className="text-sm text-[#64748b] whitespace-pre-wrap">
                        {fb.overallComments}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeedbackSummary;
