/**
 * ScoreBreakdown Component - Requirements 2.1, 2.2, 2.3, 2.5, 2.6
 * 
 * Displays detailed score breakdown showing:
 * - Domain Score
 * - Industry Score
 * - Key Responsibilities Score
 * 
 * Features:
 * - Visual progress bars for each score category
 * - Handles null scores with "N/A" display
 * - Consistent styling with existing sidebar design (blue/white theme)
 * - Shows overall score calculation
 */

export interface ScoreBreakdownProps {
  domainScore: number | null | undefined;
  industryScore: number | null | undefined;
  keyResponsibilitiesScore: number | null | undefined;
  overallScore?: number | null;
}

interface ScoreCategory {
  label: string;
  score: number | null | undefined;
  color: string;
  bgColor: string;
}

/**
 * Calculate the average of non-null scores
 * Requirements: 2.4, 2.7
 */
export function calculateAverageScore(
  domainScore: number | null | undefined,
  industryScore: number | null | undefined,
  keyResponsibilitiesScore: number | null | undefined
): number | null {
  const scores = [domainScore, industryScore, keyResponsibilitiesScore].filter(
    (score): score is number => score !== null && score !== undefined
  );
  
  if (scores.length === 0) {
    return null;
  }
  
  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

/**
 * Get color variant based on score value
 */
function getScoreColorVariant(score: number | null | undefined): { color: string; bgColor: string; textColor: string } {
  if (score === null || score === undefined) {
    return { color: 'bg-gray-300', bgColor: 'bg-gray-100', textColor: 'text-gray-500' };
  }
  if (score >= 80) {
    return { color: 'bg-green-500', bgColor: 'bg-green-50', textColor: 'text-green-700' };
  }
  if (score >= 60) {
    return { color: 'bg-blue-500', bgColor: 'bg-blue-50', textColor: 'text-blue-700' };
  }
  if (score >= 40) {
    return { color: 'bg-yellow-500', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700' };
  }
  return { color: 'bg-red-500', bgColor: 'bg-red-50', textColor: 'text-red-700' };
}

/**
 * Individual score bar component
 */
function ScoreBar({ 
  label, 
  score 
}: { 
  label: string; 
  score: number | null | undefined;
}) {
  const { color, bgColor, textColor } = getScoreColorVariant(score);
  const displayScore = score !== null && score !== undefined ? score : null;
  const progressWidth = displayScore !== null ? `${displayScore}%` : '0%';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-600">{label}</span>
        <span className={`text-xs font-semibold ${displayScore !== null ? textColor : 'text-gray-400'}`}>
          {displayScore !== null ? `${displayScore}%` : 'N/A'}
        </span>
      </div>
      <div className={`h-2 rounded-full ${bgColor} overflow-hidden`}>
        {displayScore !== null && (
          <div 
            className={`h-full rounded-full ${color} transition-all duration-300`}
            style={{ width: progressWidth }}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Overall score badge component
 */
function OverallScoreBadge({ score }: { score: number | null }) {
  const { bgColor, textColor } = getScoreColorVariant(score);
  
  return (
    <div className={`flex items-center justify-center p-3 rounded-lg ${bgColor}`}>
      <div className="text-center">
        <div className={`text-2xl font-bold ${textColor}`}>
          {score !== null ? `${score}%` : 'N/A'}
        </div>
        <div className="text-xs text-gray-500 mt-0.5">Overall Score</div>
      </div>
    </div>
  );
}

/**
 * ScoreBreakdown Component
 * Displays detailed score breakdown with visual indicators
 */
export function ScoreBreakdown({
  domainScore,
  industryScore,
  keyResponsibilitiesScore,
  overallScore,
}: ScoreBreakdownProps) {
  // Calculate overall score if not provided
  const calculatedOverall = overallScore ?? calculateAverageScore(
    domainScore,
    industryScore,
    keyResponsibilitiesScore
  );

  const scoreCategories: ScoreCategory[] = [
    {
      label: 'Domain Score',
      score: domainScore,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Industry Score',
      score: industryScore,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Key Responsibilities',
      score: keyResponsibilitiesScore,
      color: 'bg-teal-500',
      bgColor: 'bg-teal-50',
    },
  ];

  // Check if all scores are null/undefined
  const allScoresNull = domainScore === null && 
                        industryScore === null && 
                        keyResponsibilitiesScore === null &&
                        domainScore === undefined &&
                        industryScore === undefined &&
                        keyResponsibilitiesScore === undefined;

  return (
    <div className="space-y-4">
      {/* Overall Score Badge */}
      <OverallScoreBadge score={calculatedOverall} />

      {/* Score Breakdown Bars */}
      <div className="space-y-3">
        {scoreCategories.map((category) => (
          <ScoreBar
            key={category.label}
            label={category.label}
            score={category.score}
          />
        ))}
      </div>

      {/* Info text when all scores are null */}
      {allScoresNull && (
        <p className="text-xs text-gray-400 text-center italic">
          Score breakdown not available for this candidate
        </p>
      )}
    </div>
  );
}

export default ScoreBreakdown;
