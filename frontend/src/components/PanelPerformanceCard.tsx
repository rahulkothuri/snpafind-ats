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

export function PanelPerformanceCard({ data, className = '' }: PanelPerformanceCardProps) {
    // Find interesting insights for the footer
    const highestOffer = [...data].sort((a, b) => b.offerRate - a.offerRate)[0];
    const slowestFeedback = [...data].sort((a, b) => b.avgFeedbackTime - a.avgFeedbackTime)[0];

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
                            <tr key={panel.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                <td className="py-2.5 px-2 font-medium text-gray-800">{panel.name}</td>
                                <td className="py-2.5 px-2 text-center text-gray-600">{panel.rounds}</td>
                                <td className="py-2.5 px-2 text-center text-gray-600 font-semibold">{panel.offerRate}%</td>
                                <td className="py-2.5 px-2 text-gray-500">{panel.topRejectionReason}</td>
                                <td className="py-2.5 px-2 text-right text-gray-600">{panel.avgFeedbackTime}h</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {(highestOffer || slowestFeedback) && (
                <div className="mt-4 text-[10px] text-gray-500 leading-relaxed bg-indigo-50/30 p-2.5 rounded-lg border border-indigo-50">
                    {highestOffer && (
                        <div>
                            Highlight: <strong className="text-gray-700">{highestOffer.name}</strong> gives highest offer ratio ({highestOffer.offerRate}%).
                        </div>
                    )}
                    {slowestFeedback && (
                        <div className="mt-1">
                            Action: Reduce feedback time for <strong className="text-gray-700">{slowestFeedback.name}</strong> ({slowestFeedback.avgFeedbackTime}h) to improve experience.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
