interface BrandMarkProps {
  /** Use compact mode inside tight headers */
  compact?: boolean;
  /** Optional subtitle shown under the name */
  subtitle?: string;
  /** Show horizontal layout */
  horizontal?: boolean;
}

export default function BrandMark({ compact = false, subtitle, horizontal = false }: BrandMarkProps) {
  const iconSize = compact ? 'w-8 h-8' : 'w-12 h-12';

  return (
    <div className={`flex ${horizontal ? 'flex-row items-center gap-2' : 'flex-col items-center'} inline-flex`}>
      {/* Symbol */}
      <div className={`${iconSize} flex-shrink-0 flex items-center justify-center bg-[#0091FF]/10 rounded-xl border border-[#0091FF]/20`}>
        <svg viewBox="0 0 100 100" className="w-6 h-6 md:w-8 md:h-8 fill-none stroke-[#0091FF] stroke-[8]" strokeLinecap="round" strokeLinejoin="round">
          {/* Simple Eye / Lens Symbol */}
          <circle cx="50" cy="50" r="40" />
          <circle cx="50" cy="50" r="15" fill="#0091FF" />
          <path d="M50 10 L50 30 M50 70 L50 90 M10 50 L30 50 M70 50 L90 50" />
        </svg>
      </div>

      <div className={horizontal ? 'text-left' : 'text-center mt-2'}>
        <div className="flex flex-col">
          <span className={`${compact ? 'text-lg' : 'text-2xl'} font-black tracking-tighter text-white uppercase`}>
            Tattoo<span className="text-[#0091FF]">Vision</span>
          </span>
          {subtitle && (
            <span className="text-[8px] md:text-[9px] text-neutral-500 font-bold uppercase tracking-widest leading-none mt-0.5">
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
