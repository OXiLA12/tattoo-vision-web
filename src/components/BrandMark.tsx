interface BrandMarkProps {
  /** Use compact mode inside tight headers */
  compact?: boolean;
  /** Optional subtitle shown under the name */
  subtitle?: string;
  /** Show horizontal layout */
  horizontal?: boolean;
}

export default function BrandMark({ compact = false, subtitle, horizontal = false }: BrandMarkProps) {
  const iconSize = compact ? 'w-10 h-10' : 'w-20 h-20';

  return (
    <div className={`flex ${horizontal ? 'flex-row items-center gap-4' : 'flex-col items-center'} group transition-all duration-500`}>
      {/* Premium Logo Icon */}
      <div className={`relative ${iconSize} flex items-center justify-center shrink-0`}>
        {/* Layered Glow Rings */}
        <div className="absolute inset-0 bg-[#0091FF]/20 rounded-full blur-xl group-hover:bg-[#0091FF]/30 transition-colors duration-700" />

        <svg viewBox="0 0 100 100" className="w-full h-full relative z-10 drop-shadow-[0_0_15px_rgba(0,145,255,0.4)]">
          <defs>
            <linearGradient id="premium-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0091FF" />
              <stop offset="100%" stopColor="#00D4FF" />
            </linearGradient>
          </defs>

          {/* Animated Outer Ring */}
          <circle
            cx="50" cy="50" r="46"
            fill="none"
            stroke="url(#premium-gradient)"
            strokeWidth="1.5"
            strokeDasharray="160 40"
            className="animate-spin"
            style={{ animationDuration: '12s' }}
          />

          {/* Static Inner Ring */}
          <circle
            cx="50" cy="50" r="32"
            fill="none"
            stroke="white"
            strokeWidth="0.5"
            className="opacity-20"
          />

          {/* Focal Crosshair */}
          <path
            d="M50 12 L50 35 M50 65 L50 88 M12 50 L35 50 M65 50 L88 50"
            stroke="url(#premium-gradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Central Core */}
          <circle
            cx="50" cy="50" r="8"
            fill="url(#premium-gradient)"
            className="animate-pulse"
          />

          {/* Stylized 'V' for Vision - The focal point */}
          <path
            d="M32 42 L50 64 L68 42"
            fill="none"
            stroke="white"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-lg"
          />
        </svg>
      </div>

      <div className={horizontal ? 'text-left' : 'text-center mt-3'}>
        <div className="flex flex-col">
          <h1 className={`${compact ? 'text-xl' : 'text-4xl'} font-black tracking-tighter text-white leading-none uppercase`}>
            Tattoo<span className="text-[#0091FF]">Vision</span>
          </h1>
          {subtitle && (
            <span className={`${compact ? 'text-[9px]' : 'text-[11px]'} text-neutral-500 font-black uppercase tracking-[0.3em] mt-1.5 opacity-80`}>
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
