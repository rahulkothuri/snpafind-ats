/**
 * MandatoryCriteriaSection Component - Requirements 3.1, 3.2, 3.3
 * 
 * Displays a read-only section with predefined mandatory screening criteria.
 * This content is static and automatically included in all job postings.
 * 
 * Features:
 * - Read-only display (no editing allowed)
 * - Visual hierarchy with header and numbered list
 * - Styled to match the form section design
 * - Warning/important styling to emphasize mandatory nature
 */

export const MANDATORY_CRITERIA_CONTENT = {
  title: "Mandatory Criteria (Can't be neglected during screening)",
  intro: "Preferred candidates from good startups only.",
  criteria: [
    "CA Candidates are not applicable for this role.",
    "Need candidate from Tier 1 and Tier 2 colleges only.",
    "2–3 years of hands-on experience in Financial Analysis / FP&A.",
    "Strong proficiency in Financial Modelling, forecasting, budgeting, and variance analysis.",
    "Experience preparing financial reports, presentations, and management dashboards with Advance Excel skills.",
    "Strong attention to detail with high accuracy in analysis and reporting.",
    "Strong problem-solving skills and ability to recommend practical solutions on different Scenarios.",
    "Candidate should be good in Cost Management.",
  ],
  note: "NOTE - Looking for highly Intentful and Enthusiatic candidates",
};

export function MandatoryCriteriaSection() {
  return (
    <div className="form-section bg-[#fffbeb] border border-[#fcd34d]">
      {/* Header with warning icon */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#f59e0b] flex items-center justify-center">
          <svg 
            className="w-5 h-5 text-white" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-[#92400e]">
          {MANDATORY_CRITERIA_CONTENT.title}
        </h3>
      </div>

      {/* Read-only indicator */}
      <div className="flex items-center gap-1.5 mb-4 text-xs text-[#b45309]">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
          />
        </svg>
        <span>This section is read-only and will be included in all job postings</span>
      </div>

      {/* Intro text */}
      <p className="text-sm text-[#78350f] font-medium mb-3">
        {MANDATORY_CRITERIA_CONTENT.intro}
      </p>

      {/* Numbered criteria list */}
      <ol className="space-y-2 mb-4">
        {MANDATORY_CRITERIA_CONTENT.criteria.map((criterion, index) => (
          <li 
            key={index} 
            className="flex gap-3 text-sm text-[#78350f]"
          >
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#fcd34d] text-[#78350f] text-xs font-semibold flex items-center justify-center">
              {index + 1}
            </span>
            <span className="pt-0.5">{criterion}</span>
          </li>
        ))}
      </ol>

      {/* Note section */}
      <div className="mt-4 pt-3 border-t border-[#fcd34d]">
        <p className="text-sm font-semibold text-[#92400e] uppercase tracking-wide">
          {MANDATORY_CRITERIA_CONTENT.note}
        </p>
      </div>
    </div>
  );
}

export default MandatoryCriteriaSection;
