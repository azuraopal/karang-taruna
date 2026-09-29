import React from 'react';

interface LogoProps {
  variant?: 'black' | 'white';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBadge?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'black',
  size = 'md',
  className = '',
  showBadge = true,
}) => {
  // Use SVG for crisp rendering at all sizes and resolutions
  const logoSrc =
    variant === 'black'
      ? '/katar-margabakti-black.svg'
      : '/katar-margabakti-white.svg';

  const sizeClasses = {
    sm: 'h-6 sm:h-7 w-auto',
    md: 'h-7 sm:h-9 w-auto',
    lg: 'h-10 sm:h-13 md:h-15 w-auto',
    xl: 'h-12 sm:h-16 md:h-20 w-auto',
  }[size];

  const badgeSizes = {
    sm: 'text-[9px] px-1.5 py-0.5',
    md: 'text-[10px] sm:text-xs px-2 py-0.5',
    lg: 'text-xs sm:text-sm px-2.5 py-1',
    xl: 'text-sm sm:text-base px-3 py-1',
  }[size];

  return (
    <div className="inline-flex items-center gap-2 sm:gap-2.5 select-none shrink-0">
      <img
        src={logoSrc}
        alt="Logo Katar Margabakti"
        className={`${className || sizeClasses} object-contain shrink-0`}
        loading="eager"
        decoding="sync"
      />
      {showBadge && (
        <span
          className={`uppercase font-black tracking-wider rounded-md border shrink-0 ${badgeSizes} ${
            variant === 'black'
              ? 'bg-slate-900 text-amber-400 border-slate-800'
              : 'bg-amber-400/20 text-amber-300 border-amber-400/40'
          }`}
        >
          07
        </span>
      )}
    </div>
  );
};
