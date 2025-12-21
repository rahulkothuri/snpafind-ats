/**
 * StatusToggle Component - Requirements 2.1
 * 
 * A toggle switch with "Open" and "Closed" options for filtering roles.
 * - Open: Shows roles with status 'active'
 * - Closed: Shows roles with status 'closed' or 'paused'
 */

export interface StatusToggleProps {
  value: 'open' | 'closed';
  onChange: (value: 'open' | 'closed') => void;
  className?: string;
}

export function StatusToggle({
  value,
  onChange,
  className = '',
}: StatusToggleProps) {
  return (
    <div className={`inline-flex rounded-lg border border-gray-200 bg-gray-100 p-1 ${className}`}>
      <button
        type="button"
        onClick={() => onChange('open')}
        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
          value === 'open'
            ? 'bg-white text-[#0b6cf0] shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        Open
      </button>
      <button
        type="button"
        onClick={() => onChange('closed')}
        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
          value === 'closed'
            ? 'bg-white text-[#0b6cf0] shadow-sm'
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        Closed
      </button>
    </div>
  );
}

export default StatusToggle;
