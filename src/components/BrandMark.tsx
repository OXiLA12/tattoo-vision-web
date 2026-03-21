interface BrandMarkProps {
  /** Use compact mode inside tight headers */
  compact?: boolean;
  /** Optional subtitle shown under the name */
  subtitle?: string;
  /** Show horizontal layout */
  horizontal?: boolean;
}

export default function BrandMark({ compact = false, subtitle, horizontal = false }: BrandMarkProps) {
  return (
    <div className={`flex ${horizontal ? 'flex-row items-center gap-3' : 'flex-col items-center'} text-center`}>
      {/* Premium Logo Icon */}
      <div className={`relative ${compact ? 'w-10 h-10' : 'w-16 h-16'} mb-2 flex items-center justify-center`}>
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_12px_rgba(0,145,255,0.4)]">
          <defs>
            <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0091FF" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer Lens/Eye Ring */}
          <circle
            cx="50" cy="50" r="45"
            fill="none"
            stroke="url(#logo-gradient)"
            strokeWidth="1.5"
            strokeDasharray="180 30"
            className="animate-[spin_10s_linear_infinite]"
          />

          {/* Inner Circle (The "Iris") */}
          <circle
            cx="50" cy="50" r="28"
            fill="none"
            stroke="url(#logo-gradient)"
            strokeWidth="3"
            className="opacity-50"
          />

          {/* Abstract Tattoo Needle / Vision Focus */}
          <path
            d="M50 20 L50 45 M50 55 L50 80 M20 50 L45 50 M55 50 L80 50"
            stroke="url(#logo-gradient)"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Central Point (The Ink/Focus) */}
          <circle
            cx="50" cy="50" r="8"
            fill="url(#logo-gradient)"
            filter="url(#glow)"
          />

          {/* Stylized 'V' for Vision/Verticality */}
          <path
            d="M35 45 L50 65 L65 45"
            fill="none"
            stroke="white"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-sm"
          />
        </svg>
      </div>

      <div className={horizontal ? 'text-left' : 'text-center'}>
        <h1 className={`${compact ? 'text-xl' : 'text-3xl'} tracking-tighter font-bold bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent`}>
          Tattoo<span className="text-[#0091FF]">Vision</span>
        </h1>
        {subtitle && (
          <div className="text-[10px] text-neutral-400 font-medium uppercase tracking-[0.2em] mt-0.5">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
