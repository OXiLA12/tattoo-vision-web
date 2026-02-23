import { useState, useRef, useEffect } from 'react';
import { Download, Share2, Sparkles, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';

interface FinalRevealProps {
    originalImage: string; // The raw placement or original photo
    finalImage: string;    // The realistic render
    isFreeUser?: boolean;
    onBack: () => void;
    onDownload: () => void;
}

export default function FinalReveal({ originalImage, finalImage, isFreeUser, onBack, onDownload }: FinalRevealProps) {
    const { t } = useLanguage();
    const [sliderPos, setSliderPos] = useState(50);
    const [isResizing, setIsResizing] = useState(false);
    const [containerWidth, setContainerWidth] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Initial hint animation + Set container width
    useEffect(() => {
        if (containerRef.current) {
            setContainerWidth(containerRef.current.offsetWidth);
        }

        const handleResize = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.offsetWidth);
            }
        };

        window.addEventListener('resize', handleResize);

        // Micro-animation hint: 50 -> 40 -> 50
        const timer = setTimeout(() => {
            setSliderPos(40);
            setTimeout(() => setSliderPos(50), 400);
        }, 800);

        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(timer);
        };
    }, []);

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isResizing || !containerRef.current) return;

        // Prevent page scroll on touch devices
        if ('touches' in e) {
            e.preventDefault();
        }

        const rect = containerRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;

        let pos = ((clientX - rect.left) / rect.width) * 100;
        pos = Math.max(0, Math.min(100, pos));
        setSliderPos(pos);
    };

    return (
        <div
            className="flex-1 flex flex-col items-center justify-center p-6 bg-black min-h-screen animate-scale-in"
            onMouseUp={() => setIsResizing(false)}
            onTouchEnd={() => setIsResizing(false)}
        >
            <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-12 items-center">

                {/* Visual Section - Comparison Slider */}
                <div
                    ref={containerRef}
                    className="relative aspect-[3/4] max-h-[70vh] w-full rounded-[32px] overflow-hidden border border-white/10 shadow-2xl select-none cursor-ew-resize group"
                    style={{ touchAction: 'none' }}
                    onMouseDown={() => setIsResizing(true)}
                    onTouchStart={() => setIsResizing(true)}
                    onMouseMove={handleMouseMove}
                    onTouchMove={handleMouseMove}
                >
                    {/* Layer 1: Final Image (Background) */}
                    <img
                        src={finalImage}
                        alt="Final Render"
                        className="absolute inset-0 w-full h-full object-contain bg-neutral-950 pointer-events-none"
                    />

                    {/* Layer 2: Original Image (Clipped) */}
                    <motion.div
                        className="absolute inset-0 overflow-hidden pointer-events-none border-r border-white/50"
                        animate={{ width: `${sliderPos}%` }}
                        transition={isResizing ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 30 }}
                    >
                        <img
                            src={originalImage}
                            alt="Original Preview"
                            className="absolute inset-0 w-full h-full object-contain bg-neutral-950"
                            style={{ width: `${containerWidth}px`, maxWidth: 'none' }}
                        />
                    </motion.div>

                    {/* Slider Handle */}
                    <motion.div
                        className="absolute top-0 bottom-0 w-[2px] bg-white cursor-ew-resize shadow-[0_0_15px_rgba(255,255,255,0.5)] flex items-center justify-center pointer-events-none"
                        animate={{ left: `${sliderPos}%` }}
                        transition={isResizing ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 30 }}
                    >
                        <div className="w-10 h-10 rounded-full bg-white shadow-2xl flex items-center justify-center group-active:scale-110 transition-transform">
                            <div className="flex gap-1">
                                <div className="w-[1px] h-3 bg-neutral-300" />
                                <div className="w-[1px] h-3 bg-neutral-300" />
                            </div>
                        </div>
                    </motion.div>

                    <div className="absolute top-6 left-6 px-3 py-1 bg-black/40 backdrop-blur-md border border-white/10 text-white/70 text-[10px] uppercase font-black tracking-widest rounded-full pointer-events-none">{t('reveal_draft')}</div>
                    <div className="absolute top-6 right-6 px-3 py-1 bg-[#0091FF]/40 backdrop-blur-md border border-[#0091FF]/20 text-white text-[10px] uppercase font-black tracking-widest rounded-full pointer-events-none">{t('reveal_realistic')}</div>

                    {/* Watermark Overlay (Only for free users) */}
                    {isFreeUser && (
                        <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-center overflow-hidden">
                            <div className="transform -rotate-45 text-white/40 font-black tracking-widest text-[12vw] md:text-8xl whitespace-nowrap" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}>
                                TATTOO VISION
                            </div>
                            <div className="transform -rotate-45 text-white/40 font-black tracking-widest text-[12vw] md:text-8xl whitespace-nowrap mt-12" style={{ textShadow: '0 4px 20px rgba(0,0,0,0.8)' }}>
                                TATTOO VISION
                            </div>
                        </div>
                    )}
                </div>

                {/* Content Section */}
                <div className="flex flex-col gap-10">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-black uppercase tracking-widest border border-emerald-500/20">
                            <Sparkles className="w-4 h-4" />
                            {t('reveal_complete')}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">{t('reveal_title')}<br />{t('reveal_title_sub')}</h1>
                        <p className="text-neutral-400 text-lg leading-relaxed font-light">
                            {t('reveal_subtitle')}
                        </p>
                    </div>

                    <div className="flex flex-col gap-6">
                        <button
                            onClick={onDownload}
                            className={`w-full py-5 rounded-[24px] text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 group ${isFreeUser
                                ? 'bg-gradient-to-r from-[#0091FF] to-[#00DC82] text-white hover:opacity-90 shadow-[0_12px_30px_rgba(0,145,255,0.4)]'
                                : 'bg-[#0091FF] text-white hover:bg-[#007AFF] shadow-[0_12px_24px_rgba(0,145,255,0.3)]'
                                }`}
                        >
                            <Download className="w-6 h-6" />
                            {isFreeUser ? t('reveal_unlock') : t('reveal_download')}
                        </button>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={onBack}
                                className="py-4 bg-neutral-900 border border-white/5 text-neutral-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-800 transition-all flex items-center justify-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                {t('reveal_back')}
                            </button>
                            <button
                                disabled
                                className="py-4 bg-neutral-900 border border-white/5 text-neutral-700 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Share2 className="w-4 h-4" />
                                {t('reveal_share')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
