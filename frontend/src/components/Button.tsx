/**
 * Button Component - Requirements 28.1, 28.2, 28.3, 28.4
 * 
 * Variants:
 * - primary: blue background (#0b6cf0), white text, pill shape
 * - secondary: light background (#f9fafb), dark text, subtle border
 * - outline: transparent background, accent color text, colored border
 * - text: no background, just text styling
 * - mini: smaller padding, 9px font, contextual colors
 * 
 * Sizes:
 * - sm: smaller padding for header buttons
 * - md: default size
 */

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'text' | 'mini';
type ButtonSize = 'sm' | 'md';
type MiniColor = 'note' | 'move' | 'schedule' | 'cv' | 'default';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  miniColor?: MiniColor;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-[#0b6cf0] hover:bg-[#0958c7] text-white rounded-full',
  secondary: 'bg-white hover:bg-[#f9fafb] text-[#374151] border border-[#e2e8f0] rounded-full',
  outline: 'bg-transparent hover:bg-[#eff6ff] text-[#0b6cf0] border border-[#0b6cf0] rounded-full',
  text: 'bg-transparent hover:bg-gray-100 text-[#374151] rounded-lg',
  mini: 'rounded',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
};

const miniColorStyles: Record<MiniColor, string> = {
  note: 'bg-gray-100 hover:bg-gray-200 text-gray-600',
  move: 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border border-yellow-200',
  schedule: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200',
  cv: 'bg-green-50 hover:bg-green-100 text-green-700 border border-green-200',
  default: 'bg-gray-100 hover:bg-gray-200 text-gray-600',
};

export function Button({
  variant = 'primary',
  size = 'md',
  miniColor = 'default',
  children,
  onClick,
  disabled = false,
  icon,
  type = 'button',
  className = '',
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center gap-1.5 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#0b6cf0] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  let variantStyle: string;
  let sizeStyle: string;
  
  if (variant === 'mini') {
    variantStyle = `${variantStyles.mini} ${miniColorStyles[miniColor]}`;
    sizeStyle = 'px-1.5 py-0.5 text-[9px]';
  } else {
    variantStyle = variantStyles[variant];
    sizeStyle = sizeStyles[size];
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyle} ${sizeStyle} ${className}`}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
}

export default Button;
