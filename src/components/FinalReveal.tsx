import { useState, useRef, useEffect } from 'react';
import { Download, Share2, Sparkles, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface FinalRevealProps {
    originalImage: string; // The raw placement or original photo
    finalImage: string;    // The realistic render
    onBack: () => void;
    onDownload: () => void;
}

export default function FinalReveal({ originalImage, finalImage, onBack, onDownload }: FinalRevealProps) {
    const [sliderPos, setSliderPos] = useState(50);
    const [isResizing, setIsResizing] = useState(false);
    const [containerWidth, setContainerWidth] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // Initial Celebration Effect + Set container width
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
        return () => window.removeEventListener('resize', handleResize);
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
            className="flex-1 flex flex-col items-center justify-center p-6 animate-scale-in"
            onMouseUp={() => setIsResizing(false)}
            onTouchEnd={() => setIsResizing(false)}
        >
            <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-12 items-center">

                {/* Visual Section - Comparison Slider */}
                <div
                    ref={containerRef}
                    className="relative aspect-[3/4] max-h-[70vh] w-full rounded-2xl overflow-hidden border border-[#27272a] shadow-2xl select-none cursor-ew-resize group"
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
                        className="absolute inset-0 w-full h-full object-contain bg-black pointer-events-none"
                    />

                    {/* Layer 2: Original Image (Clipped) */}
                    <div
                        className="absolute inset-0 overflow-hidden pointer-events-none border-r border-white/50"
                        style={{ width: `${sliderPos}%` }}
                    >
                        <img
                            src={originalImage}
                            alt="Original Preview"
                            className="absolute inset-0 w-full h-full object-contain bg-black"
                            style={{ width: `${containerWidth}px`, maxWidth: 'none' }}
                        />
                    </div>

                    {/* Slider Handle */}
                    <div
                        className="absolute top-0 bottom-0 w-1 bg-white/80 cursor-ew-resize shadow-[0_0_10px_rgba(0,0,0,0.5)] flex items-center justify-center pointer-events-none"
                        style={{ left: `${sliderPos}%` }}
                    >
                        <div className="w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                        </div>
                    </div>

                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur text-white text-xs px-2 py-1 rounded pointer-events-none">Draft</div>
                    <div className="absolute top-4 right-4 bg-[#0091FF]/80 backdrop-blur text-white text-xs px-2 py-1 rounded pointer-events-none">Realistic AI</div>
                </div>

                {/* Content Section */}
                <div className="flex flex-col gap-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold uppercase tracking-wider border border-emerald-500/20">
                            <Sparkles className="w-3.5 h-3.5" />
                            Render Complete
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">It looks real.<br />Because it is.</h1>
                        <p className="text-[#a1a1aa] text-lg leading-relaxed">
                            Your tattoo visualization has been processed with our advanced lighting and texture engine. Drag the slider to see the difference.
                        </p>
                    </div>

                    <div className="flex flex-col gap-4">
                        <button
                            onClick={onDownload}
                            className="w-full py-4 bg-[#0091FF] text-white rounded-xl text-sm font-bold uppercase tracking-wide hover:bg-[#007AFF] shadow-[0_0_20px_rgba(0,145,255,0.3)] hover:shadow-[0_0_30px_rgba(0,145,255,0.5)] transition-all flex items-center justify-center gap-2 transform hover:-translate-y-1"
                        >
                            <Download className="w-5 h-5" />
                            Download HD Render
                        </button>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={onBack} // Actually goes back to editor or previous view
                                className="py-4 bg-[#18181b] border border-[#27272a] text-[#a1a1aa] rounded-xl text-xs font-bold uppercase tracking-wide hover:bg-[#27272a] hover:text-white transition-all flex items-center justify-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Edit
                            </button>
                            <button
                                disabled
                                className="py-4 bg-[#18181b] border border-[#27272a] text-[#52525b] rounded-xl text-xs font-bold uppercase tracking-wide cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Share2 className="w-4 h-4" />
                                Share (Soon)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
