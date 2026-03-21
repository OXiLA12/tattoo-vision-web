import React from "react";

interface MagicButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const MagicButton = React.forwardRef<HTMLButtonElement, MagicButtonProps>(
  ({ className = "", children, icon, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`relative inline-flex h-14 w-full items-center justify-center overflow-hidden rounded-[16px] border border-[#0091FF]/20 bg-[#070709] px-6 text-sm font-bold text-white transition-all duration-300 hover:border-[#0091FF]/50 hover:bg-[#0a0a0d] hover:shadow-[0_0_20px_rgba(0,145,255,0.15)] focus:outline-none focus:ring-2 focus:ring-[#0091FF]/40 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none group gap-3 ${className}`}
        {...props}
      >
        {icon}
        {children}
      </button>
    );
  }
);
MagicButton.displayName = "MagicButton";
