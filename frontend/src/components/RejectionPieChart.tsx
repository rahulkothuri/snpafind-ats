/**
 * RejectionPieChart - Using Recharts for Professional Power BI-like design
 * Requirements: 3.1, 3.3, 3.5, 3.6
 */

import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip
} from 'recharts';

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

// Professional color palette
const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6', '#3b82f6'];

// Custom tooltip
const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white px-3 py-2 shadow-lg rounded-lg border border-gray-100">
                <p className="text-sm font-semibold text-gray-800">{payload[0].payload.reason}</p>
                <p className="text-sm text-gray-600">{payload[0].value}% of rejections</p>
            </div>
        );
    }
    return null;
};

// Custom legend
const CustomLegend = ({ payload }: any) => {
    return (
        <div className="flex flex-col gap-2 ml-4">
            {payload?.map((entry: any, index: number) => (
                <div key={`legend-${index}`} className="flex justify-between items-center text-xs gap-3">
                    <div className="flex items-center gap-2 text-gray-600">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: entry.color }} />
                        <span className="truncate max-w-[120px]">{entry.value}</span>
                    </div>
                    <span className="font-semibold text-gray-700">{entry.payload.percentage}%</span>
                </div>
            ))}
        </div>
    );
};

export function RejectionPieChart({ data, className = '', topStage, subtitle = 'Across all roles' }: RejectionPieChartProps) {
    // Handle empty data case
    if (!data || data.length === 0) {
        return (
            <div className={`bg-white rounded-xl border border-gray-100 p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] h-full flex flex-col ${className}`}>
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

    // Transform data for Recharts
    const chartData = data.map((item, index) => ({
        ...item,
        name: item.reason,
        value: item.percentage,
        fill: item.color || COLORS[index % COLORS.length]
    }));

    return (
        <div className={`bg-white rounded-xl border border-gray-100 p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] h-full flex flex-col ${className}`}>
            <div className="mb-3">
                <h3 className="text-base font-bold text-gray-800">Rejections – Reason Wise</h3>
                <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>
            </div>

            <div className="flex items-center gap-4" style={{ height: 140 }}>
                <ResponsiveContainer width="45%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={55}
                            paddingAngle={2}
                            dataKey="value"
                            animationDuration={800}
                            animationEasing="ease-out"
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.fill}
                                    stroke="#fff"
                                    strokeWidth={2}
                                />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                </ResponsiveContainer>

                <div className="flex-1">
                    <CustomLegend payload={chartData.map((item) => ({
                        value: item.reason,
                        color: item.fill,
                        payload: item
                    }))} />
                </div>
            </div>

            {/* Top stage for rejections */}
            <div className="mt-3 flex justify-between items-center gap-4 text-[10px] text-gray-500 border-t border-gray-100 pt-2">
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

export default RejectionPieChart;
