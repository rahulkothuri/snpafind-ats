import { MdError } from 'react-icons/md';

interface StageDropOff {
    stageName: string;
    dropOffCount: number;
    dropOffPercentage: number;
}

interface StageRejectionChartProps {
    data: StageDropOff[];
    highestDropOffStage?: string;
    className?: string;
}

/**
 * Generate a suggestion based on the highest drop-off stage
 * Requirements 8.6: Show suggestion for reducing drop-offs
 */
function getSuggestionForStage(stageName: string): string {
    const lowerStageName = stageName.toLowerCase();
    
    if (lowerStageName.includes('applied') || lowerStageName.includes('queue')) {
        return 'Use AI-screening + better JD clarity to reduce early drop-offs.';
    } else if (lowerStageName.includes('screening')) {
        return 'Consider refining screening criteria or improving candidate communication.';
    } else if (lowerStageName.includes('interview')) {
        return 'Review interview process efficiency and candidate experience feedback.';
    } else if (lowerStageName.includes('offer')) {
        return 'Analyze offer competitiveness and improve negotiation process.';
    } else if (lowerStageName.includes('shortlist')) {
        return 'Ensure shortlisting criteria align with role requirements.';
    }
    
    return 'Review this stage for process improvements and bottleneck reduction.';
}

/**
 * StageRejectionChart - Displays drop-off percentages by pipeline stage
 * Uses horizontal bar chart with light red bars matching atsreport.html design
 * Requirements: 8.1, 8.3, 8.4, 8.5, 8.6
 */
export function StageRejectionChart({
    data,
    highestDropOffStage,
    className = '',
}: StageRejectionChartProps) {
    // Find max percentage for scaling bars
    const maxPercentage = Math.max(...data.map(d => d.dropOffPercentage), 1);

    return (
        <div
            className={`bg-white rounded-xl border border-gray-100 p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${className}`}
        >
            {/* Header */}
            <div className="mb-6">
                <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                    <MdError className="text-red-400" />
                    Rejections – Stage Wise
                </h3>
                <div className="text-xs text-gray-500 mt-0.5">
                    Where do we lose most candidates?
                </div>
            </div>

            {/* Bar Chart - Requirements 8.3, 8.4 */}
            <div className="space-y-3">
                {data.map(item => {
                    const isHighestDropOff = item.stageName === highestDropOffStage;
                    return (
                        <div key={item.stageName} className="flex items-center gap-3">
                            {/* Label */}
                            <div 
                                className={`w-28 text-xs truncate ${isHighestDropOff ? 'text-red-600 font-medium' : 'text-gray-500'}`} 
                                title={item.stageName}
                            >
                                {item.stageName}
                            </div>
                            {/* Bar Track */}
                            <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-300"
                                    style={{
                                        width: `${(item.dropOffPercentage / maxPercentage) * 100}%`,
                                        // Light red color for bars - Requirements 8.4
                                        backgroundColor: isHighestDropOff ? '#fca5a5' : '#fecaca', // red-300 for highest, red-200 for others
                                    }}
                                />
                            </div>
                            {/* Value */}
                            <div className={`w-12 text-right text-xs font-medium ${isHighestDropOff ? 'text-red-600' : 'text-gray-600'}`}>
                                {item.dropOffPercentage}%
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer Insight - Requirements 8.5, 8.6 */}
            {highestDropOffStage && (
                <div className="mt-5 text-[10px] text-gray-500">
                    Most rejections at <strong className="text-red-600">{highestDropOffStage}</strong>.{' '}
                    {getSuggestionForStage(highestDropOffStage)}
                </div>
            )}
        </div>
    );
}

export default StageRejectionChart;
