/**
 * StageRejectionChart - Using Recharts for Professional Power BI-like design
 * Displays drop-off percentages by pipeline stage
 * Requirements: 8.1, 8.3, 8.4, 8.5, 8.6
 */

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    LabelList
} from 'recharts';
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

// Custom tooltip
const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white px-3 py-2 shadow-lg rounded-lg border border-gray-100">
                <p className="text-sm font-semibold text-gray-800">{data.stageName}</p>
                <p className="text-sm text-gray-600">{data.dropOffCount} candidates dropped</p>
                <p className="text-sm text-red-500 font-medium">{data.dropOffPercentage}% drop-off rate</p>
            </div>
        );
    }
    return null;
};

export function StageRejectionChart({
    data,
    highestDropOffStage,
    className = '',
}: StageRejectionChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className={`bg-white rounded-xl border border-gray-100 p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] h-full flex flex-col ${className}`}>
                <div className="mb-4">
                    <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                        <MdError className="text-red-400" />
                        Rejections – Stage Wise
                    </h3>
                </div>
                <div className="text-center text-gray-500 py-8">
                    <p className="text-sm">No drop-off data available</p>
                </div>
            </div>
        );
    }

    // Transform data for Recharts
    const chartData = data.map(item => ({
        ...item,
        name: item.stageName,
        value: item.dropOffPercentage,
        isHighest: item.stageName === highestDropOffStage
    }));

    return (
        <div className={`bg-white rounded-xl border border-gray-100 p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] h-full flex flex-col ${className}`}>
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

            {/* Chart */}
            <div className="w-full" style={{ height: Math.max(data.length * 45, 180) }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        layout="vertical"
                        data={chartData}
                        margin={{ top: 5, right: 50, left: 10, bottom: 5 }}
                        barCategoryGap="20%"
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={true} vertical={false} />
                        <XAxis
                            type="number"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                            domain={[0, 'auto']}
                            tickFormatter={(value) => `${value}%`}
                        />
                        <YAxis
                            type="category"
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#374151', fontWeight: 500 }}
                            width={100}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#fef2f2' }} />
                        <Bar
                            dataKey="value"
                            radius={[0, 4, 4, 0]}
                            maxBarSize={22}
                            animationDuration={800}
                            animationEasing="ease-out"
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.isHighest ? '#f87171' : '#fca5a5'}
                                    style={{ filter: entry.isHighest ? 'drop-shadow(0 1px 3px rgba(239,68,68,0.3))' : 'none' }}
                                />
                            ))}
                            <LabelList
                                dataKey="dropOffPercentage"
                                position="right"
                                fill="#374151"
                                fontSize={11}
                                fontWeight={600}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Footer Insight */}
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
