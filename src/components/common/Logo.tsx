import React from 'react';

interface LogoProps {
  variant?: 'black' | 'white';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBadge?: boolean;
}

// Logo selalu putih (sesuai permintaan user).
// Untuk konteks terang (modal, kartu putih), beri wrapper bg gelap.
export const Logo: React.FC<LogoProps> = ({
  variant = 'white',
  size = 'md',
  className = '',
  showBadge = true,
}) => {
  // Selalu pakai versi putih
  const logoSrc = '/katar-margabakti-white.svg';

  const sizeClasses = {
    sm: 'h-5 sm:h-6 w-auto',
    md: 'h-6 sm:h-8 w-auto',
    lg: 'h-9 sm:h-12 md:h-14 w-auto',
    xl: 'h-11 sm:h-14 md:h-18 w-auto',
  }[size];

  const badgeSizes = {
    sm: 'text-[9px] px-1.5 py-0.5',
    md: 'text-[10px] sm:text-xs px-2 py-0.5',
    lg: 'text-xs sm:text-sm px-2.5 py-1',
    xl: 'text-sm sm:text-base px-3 py-1',
  }[size];

  // Di konteks terang (variant="black"), bungkus dengan pill gelap
  // agar logo putih tetap terbaca
  if (variant === 'black') {
    return (
      <div className="inline-flex items-center gap-2 sm:gap-2.5 select-none shrink-0">
        <div className="bg-slate-900 rounded-xl px-3 py-1.5 inline-flex items-center">
          <img
            src={logoSrc}
            alt="Logo Katar Margabakti"
            className={`${className || sizeClasses} object-contain shrink-0`}
            loading="eager"
            decoding="sync"
          />
        </div>
        {showBadge && (
          <span
            className={`uppercase font-black tracking-wider rounded-md border shrink-0 bg-slate-900 text-amber-400 border-slate-800 ${badgeSizes}`}
          >
            07
          </span>
        )}
      </div>
    );
  }

  // variant="white" — logo putih di atas background gelap (navbar, footer, hero, admin)
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
          className={`uppercase font-black tracking-wider rounded-md border shrink-0 bg-amber-400/20 text-amber-300 border-amber-400/40 ${badgeSizes}`}
        >
          07
        </span>
      )}
    </div>
  );
};
