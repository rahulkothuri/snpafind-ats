import { MdPeople } from 'react-icons/md';

interface PanelData {
    id: string;
    name: string;
    rounds: number;
    offerRate: number;
    topRejectionReason: string;
    avgFeedbackTime: number;
}

interface PanelPerformanceCardProps {
    data: PanelData[];
    className?: string;
}

// Thresholds for highlighting - Requirements 6.3, 6.4
const HIGH_OFFER_RATE_THRESHOLD = 40; // Panels with offerRate > 40% are high performers
const SLOW_FEEDBACK_THRESHOLD = 12; // Panels with avgFeedbackTime > 12 hours are flagged

export function PanelPerformanceCard({ data, className = '' }: PanelPerformanceCardProps) {
    // Find interesting insights for the footer - Requirements 6.5
    const highestOffer = [...data].sort((a, b) => b.offerRate - a.offerRate)[0];
    const slowestFeedback = [...data].sort((a, b) => b.avgFeedbackTime - a.avgFeedbackTime)[0];
    
    // Count high performers and slow feedback panels for insights
    const highPerformers = data.filter(p => p.offerRate > HIGH_OFFER_RATE_THRESHOLD);
    const slowFeedbackPanels = data.filter(p => p.avgFeedbackTime > SLOW_FEEDBACK_THRESHOLD);

    // Helper function to determine if panel is a high performer - Requirements 6.4
    const isHighPerformer = (panel: PanelData) => panel.offerRate > HIGH_OFFER_RATE_THRESHOLD;
    
    // Helper function to determine if panel has slow feedback - Requirements 6.4
    const hasSlowFeedback = (panel: PanelData) => panel.avgFeedbackTime > SLOW_FEEDBACK_THRESHOLD;

    return (
        <div className={`bg-white rounded-xl border border-gray-100 p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${className}`}>
            <div className="mb-6">
                <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                    <MdPeople className="text-indigo-500" /> Panel Performance
                </h3>
                <div className="text-xs text-gray-500 mt-0.5">Technical panels · Engineering roles</div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-[10px] uppercase text-gray-500 border-b border-gray-100 tracking-wider">
                            <th className="py-2 px-2 font-medium">Panel / Interviewer</th>
                            <th className="py-2 px-2 font-medium text-center">Rounds</th>
                            <th className="py-2 px-2 font-medium text-center">Offer%</th>
                            <th className="py-2 px-2 font-medium">Rej. reason top-1</th>
                            <th className="py-2 px-2 font-medium text-right">Avg feedback</th>
                        </tr>
                    </thead>
                    <tbody className="text-[11px]">
                        {data.map(panel => (
                            <tr 
                                key={panel.id} 
                                className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${
                                    isHighPerformer(panel) ? 'bg-green-50/50' : ''
                                }`}
                            >
                                <td className="py-2.5 px-2 font-medium text-gray-800">
                                    <span className="flex items-center gap-1.5">
                                        {panel.name}
                                        {isHighPerformer(panel) && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-green-100 text-green-700">
                                                Top
                                            </span>
                                        )}
                                    </span>
                                </td>
                                <td className="py-2.5 px-2 text-center text-gray-600">{panel.rounds}</td>
                                <td className={`py-2.5 px-2 text-center font-semibold ${
                                    isHighPerformer(panel) ? 'text-green-600' : 'text-gray-600'
                                }`}>
                                    {panel.offerRate}%
                                </td>
                                <td className="py-2.5 px-2 text-gray-500">{panel.topRejectionReason}</td>
                                <td className={`py-2.5 px-2 text-right ${
                                    hasSlowFeedback(panel) ? 'text-amber-600 font-semibold' : 'text-gray-600'
                                }`}>
                                    {panel.avgFeedbackTime}h
                                    {hasSlowFeedback(panel) && (
                                        <span className="ml-1 text-[9px] text-amber-500">⚠</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Actionable Insights - Requirements 6.5 */}
            {(highestOffer || slowestFeedback) && (
                <div className="mt-4 text-[10px] text-gray-500 leading-relaxed bg-indigo-50/30 p-2.5 rounded-lg border border-indigo-50">
                    {highPerformers.length > 0 && (
                        <div className="flex items-start gap-1">
                            <span className="text-green-500">✓</span>
                            <span>
                                <strong className="text-gray-700">{highPerformers.length} high performer{highPerformers.length > 1 ? 's' : ''}</strong> with offer rate above {HIGH_OFFER_RATE_THRESHOLD}%.
                                {highestOffer && ` ${highestOffer.name} leads with ${highestOffer.offerRate}%.`}
                            </span>
                        </div>
                    )}
                    {slowFeedbackPanels.length > 0 && (
                        <div className="mt-1 flex items-start gap-1">
                            <span className="text-amber-500">⚠</span>
                            <span>
                                <strong className="text-gray-700">{slowFeedbackPanels.length} panel{slowFeedbackPanels.length > 1 ? 's' : ''}</strong> with feedback time over {SLOW_FEEDBACK_THRESHOLD}h.
                                {slowestFeedback && slowestFeedback.avgFeedbackTime > SLOW_FEEDBACK_THRESHOLD && (
                                    ` Action: Reduce feedback time for ${slowestFeedback.name} (${slowestFeedback.avgFeedbackTime}h).`
                                )}
                            </span>
                        </div>
                    )}
                    {highPerformers.length === 0 && slowFeedbackPanels.length === 0 && highestOffer && (
                        <div>
                            Highlight: <strong className="text-gray-700">{highestOffer.name}</strong> gives highest offer ratio ({highestOffer.offerRate}%).
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
