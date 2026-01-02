

interface RejectionReason {
    reason: string;
    percentage: number;
    color: string;
}

interface RejectionPieChartProps {
    data: RejectionReason[];
    className?: string;
    topStage?: string;
    subtitle?: string;
}

export function RejectionPieChart({ data, className = '', topStage, subtitle = 'Across all roles' }: RejectionPieChartProps) {
    // Handle empty data case - Requirements 10.2
    if (!data || data.length === 0) {
        return (
            <div className={`bg-white rounded-xl border border-gray-100 p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${className}`}>
                <div className="mb-4">
                    <h3 className="text-base font-bold text-gray-800">Rejections – Reason Wise</h3>
                    <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>
                </div>
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="text-sm text-gray-500">No rejection data available</p>
                    <p className="text-xs text-gray-400 mt-1">Try adjusting your filters or date range</p>
                </div>
            </div>
        );
    }

    // Calculate the conic gradient string
    // Example: #ef4444 0 28%, #f97316 28% 52%, ...
    let currentPercentage = 0;
    const gradientParts = data.map(item => {
        const start = currentPercentage;
        const end = currentPercentage + item.percentage;
        currentPercentage = end;
        return `${item.color} ${start}% ${end}%`;
    });

    const conicGradient = `conic-gradient(${gradientParts.join(', ')})`;

    return (
        <div className={`bg-white rounded-xl border border-gray-100 p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${className}`}>
            <div className="mb-4">
                <h3 className="text-base font-bold text-gray-800">Rejections – Reason Wise</h3>
                <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>
            </div>

            <div className="flex gap-6 items-center">
                {/* The Pie - Requirements 3.1 */}
                <div
                    className="w-[120px] h-[120px] rounded-full shrink-0 border-4 border-gray-50 shadow-[0_1px_3px_rgba(15,23,42,0.16)]"
                    style={{ background: conicGradient }}
                />

                {/* Legend - Requirements 3.3, 3.6 */}
                <div className="flex flex-col gap-2 flex-1">
                    {data.map(item => (
                        <div key={item.reason} className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-2 text-gray-600">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                                <span>{item.reason}</span>
                            </div>
                            <span className="font-semibold text-gray-700">{item.percentage}%</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Top stage for rejections - Requirements 3.5 */}
            <div className="mt-6 flex justify-between items-center gap-4 text-[10px] text-gray-500 border-t border-gray-50 pt-3">
                {topStage && (
                    <span>Top stage of rejection: <strong className="font-semibold text-gray-700">{topStage}</strong></span>
                )}
                <button className="px-2 py-1 rounded-full border border-dashed border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors">
                    Download logs
                </button>
            </div>
        </div>
    );
}
