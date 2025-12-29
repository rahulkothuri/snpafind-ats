/**
 * PieChart Component - Requirements 10.2
 * 
 * Features:
 * - Display rejection reasons distribution
 * - Show legend with percentages
 * - SVG-based pie chart with hover effects
 * - Responsive design
 */

interface PieSlice {
  id: string;
  label: string;
  value: number;
  percentage: number;
  color: string;
}

interface PieChartProps {
  data: PieSlice[];
  title?: string;
  size?: number;
  showLegend?: boolean;
  showPercentages?: boolean;
  className?: string;
}

const defaultColors = [
  '#3b82f6', // blue-500
  '#ef4444', // red-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
];

export function PieChart({
  data,
  title,
  size = 200,
  showLegend = true,
  showPercentages = true,
  className = '',
}: PieChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`bg-white rounded-xl border border-[#e2e8f0] p-6 ${className}`}>
        {title && (
          <h3 className="text-lg font-semibold text-[#111827] mb-4">{title}</h3>
        )}
        <div className="text-center text-[#64748b]">
          No data available
        </div>
      </div>
    );
  }

  // Ensure colors are assigned
  const dataWithColors = data.map((slice, index) => ({
    ...slice,
    color: slice.color || defaultColors[index % defaultColors.length],
  }));

  // Calculate total for percentages if not provided
  const total = dataWithColors.reduce((sum, slice) => sum + slice.value, 0);
  const normalizedData = dataWithColors.map(slice => ({
    ...slice,
    percentage: slice.percentage || (total > 0 ? (slice.value / total) * 100 : 0),
  }));

  // Generate SVG path data for pie slices
  const generatePieSlices = () => {
    const center = size / 2;
    const radius = (size / 2) - 10; // Leave some padding
    let currentAngle = -90; // Start from top

    return normalizedData.map((slice) => {
      const sliceAngle = (slice.percentage / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;

      // Convert angles to radians
      const startAngleRad = (startAngle * Math.PI) / 180;
      const endAngleRad = (endAngle * Math.PI) / 180;

      // Calculate arc coordinates
      const x1 = center + radius * Math.cos(startAngleRad);
      const y1 = center + radius * Math.sin(startAngleRad);
      const x2 = center + radius * Math.cos(endAngleRad);
      const y2 = center + radius * Math.sin(endAngleRad);

      // Large arc flag
      const largeArcFlag = sliceAngle > 180 ? 1 : 0;

      // Create SVG path
      const pathData = [
        `M ${center} ${center}`, // Move to center
        `L ${x1} ${y1}`, // Line to start of arc
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`, // Arc
        'Z', // Close path
      ].join(' ');

      currentAngle = endAngle;

      return {
        ...slice,
        pathData,
        startAngle,
        endAngle,
      };
    });
  };

  const pieSlices = generatePieSlices();

  return (
    <div className={`bg-white rounded-xl border border-[#e2e8f0] p-6 ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-[#111827] mb-6">{title}</h3>
      )}
      
      <div className="flex flex-col lg:flex-row items-center gap-6">
        {/* Pie Chart SVG */}
        <div className="flex-shrink-0">
          <svg width={size} height={size} className="drop-shadow-sm">
            {pieSlices.map((slice) => (
              <g key={slice.id}>
                <path
                  d={slice.pathData}
                  fill={slice.color}
                  stroke="white"
                  strokeWidth="2"
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                />
              </g>
            ))}
          </svg>
        </div>

        {/* Legend */}
        {showLegend && (
          <div className="flex-1 min-w-0">
            <div className="space-y-3">
              {normalizedData.map((slice) => (
                <div key={slice.id} className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: slice.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-[#374151] truncate">
                        {slice.label}
                      </span>
                      <div className="flex items-center gap-2 text-sm text-[#64748b] flex-shrink-0">
                        <span>{slice.value.toLocaleString()}</span>
                        {showPercentages && (
                          <span className="font-medium">
                            ({slice.percentage.toFixed(1)}%)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Total */}
            <div className="mt-4 pt-3 border-t border-[#e2e8f0]">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-[#374151]">Total</span>
                <span className="font-semibold text-[#111827]">
                  {total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PieChart;