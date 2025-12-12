/**
 * Footer Component - Requirements 6.2, 6.3
 * 
 * Features:
 * - Light theme with white background (#ffffff)
 * - Muted text color (#64748b) for secondary text
 * - Consistent border color (#e2e8f0)
 * - Contextual description text on the left
 * - Key metrics on the right side
 */

interface FooterProps {
  leftText: string;
  rightText?: string;
}

export function Footer({ leftText, rightText }: FooterProps) {
  return (
    <footer className="h-12 px-6 flex items-center justify-between bg-white border-t border-[#e2e8f0] text-[#64748b] text-xs">
      {/* Left: Contextual description */}
      <span>{leftText}</span>
      
      {/* Right: Key metrics */}
      {rightText && (
        <span className="hidden sm:block">{rightText}</span>
      )}
    </footer>
  );
}

export default Footer;
