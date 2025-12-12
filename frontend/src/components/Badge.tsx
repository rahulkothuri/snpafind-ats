/**
 * Badge Component - Requirements 4.3
 * 
 * Pill-shaped status badges with colored variants:
 * - green: Active status (#dcfce7 bg, #166534 text)
 * - orange: Pending/At risk status (#fef3c7 bg, #92400e text)
 * - red: Inactive/Suspended status (#fee2e2 bg, #991b1b text)
 * - blue: Info/Role status (#dbeafe bg, #1e40af text)
 * - gray: Default/neutral (#f3f4f6 bg, #374151 text)
 * - priority: warm colors for priority pills
 */

type BadgeVariant = 'green' | 'orange' | 'red' | 'blue' | 'gray' | 'priority';

interface BadgeProps {
  text: string;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  green: 'bg-[#dcfce7] text-[#166534]',
  orange: 'bg-[#fef3c7] text-[#92400e]',
  red: 'bg-[#fee2e2] text-[#991b1b]',
  blue: 'bg-[#dbeafe] text-[#1e40af]',
  gray: 'bg-[#f3f4f6] text-[#374151]',
  priority: 'bg-[#fffbeb] text-[#9a3412] border border-[#fed7aa]',
};

export function Badge({ text, variant = 'gray', className = '' }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {text}
    </span>
  );
}

export default Badge;
