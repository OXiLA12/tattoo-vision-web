interface BrandMarkProps {
  /** Use compact mode inside tight headers */
  compact?: boolean;
  /** Optional subtitle shown under the name */
  subtitle?: string;
}

export default function BrandMark({ compact = false, subtitle }: BrandMarkProps) {
  return (
    <div className="text-center">
      <h1 className={`${compact ? 'text-xl' : 'text-3xl'} tracking-tight font-light text-neutral-50`}>
        Tattoo Vision
      </h1>
      {subtitle ? (
        <div className="text-xs text-neutral-400 font-light tracking-wide mt-1">{subtitle}</div>
      ) : null}
    </div>
  );
}
