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
 * StageRejectionChart - Displays drop-off percentages by pipeline stage
 * Uses horizontal bar chart with red-tinted bars matching atsreport.html design
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

            {/* Bar Chart */}
            <div className="space-y-3">
                {data.map(item => (
                    <div key={item.stageName} className="flex items-center gap-3">
                        {/* Label */}
                        <div className="w-28 text-xs text-gray-500 truncate" title={item.stageName}>
                            {item.stageName}
                        </div>
                        {/* Bar Track */}
                        <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                    width: `${(item.dropOffPercentage / maxPercentage) * 100}%`,
                                    backgroundColor: '#fee2e2', // red-100 tint
                                }}
                            />
                        </div>
                        {/* Value */}
                        <div className="w-12 text-right text-xs text-gray-600 font-medium">
                            {item.dropOffPercentage}%
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer Insight */}
            {highestDropOffStage && (
                <div className="mt-5 text-[10px] text-gray-500">
                    Most rejections at <strong className="text-gray-700">{highestDropOffStage}</strong>.
                    Use AI-screening + better JD clarity to reduce early drop-offs.
                </div>
            )}
        </div>
    );
}

export default StageRejectionChart;
