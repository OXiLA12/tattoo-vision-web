import { ArrowRight, Camera, Sparkles, Download } from 'lucide-react';

interface WelcomeProps {
    onGetStarted: () => void;
}

export default function Welcome({ onGetStarted }: WelcomeProps) {
    return (
        <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Subtle light effect top center - BLUE ACCENT */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[400px] bg-blue-500/[0.15] blur-[120px] rounded-full pointer-events-none" />

            {/* Main content */}
            <div className="relative z-10 max-w-5xl w-full text-center flex flex-col items-center">

                {/* Badge "New" style */}
                <div className="mb-8 opacity-0 animate-fade-up">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400 text-[11px] font-mono tracking-wide">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        AI-POWERED VISUALIZATION
                    </span>
                </div>

                {/* Hero Title */}
                <div className="mb-6 opacity-0 animate-fade-up animation-delay-100 max-w-3xl">
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white leading-tight">
                        Visualize tattoos <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">before you commit.</span>
                    </h1>
                </div>

                {/* Subtitle */}
                <p className="text-lg text-[#a1a1aa] mb-12 opacity-0 animate-fade-up animation-delay-200 max-w-xl mx-auto leading-relaxed">
                    The professional standard for tattoo visualization. Upload, place, and preview with photorealistic precision.
                </p>

                {/* Primary CTA - BOLT BLUE */}
                <div className="opacity-0 animate-fade-up animation-delay-300">
                    <button
                        onClick={onGetStarted}
                        className="group relative px-8 py-4 bg-[#0091FF] text-white rounded-lg text-sm font-bold tracking-wide hover:bg-[#007AFF] transition-all inline-flex items-center gap-2 shadow-[0_0_30px_rgba(0,145,255,0.4)] hover:shadow-[0_0_40px_rgba(0,145,255,0.6)]"
                    >
                        <span>Start Creating</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                    <p className="mt-4 text-xs text-[#52525b] font-medium">No account required to try</p>
                </div>

                {/* Features Grid - Minimal */}
                <div className="mt-24 opacity-0 animate-fade-up animation-delay-400 w-full border-t border-[#27272a] pt-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center max-w-4xl mx-auto">
                        <div className="flex flex-col items-center p-4">
                            <div className="w-10 h-10 rounded-lg bg-[#18181b] border border-[#27272a] flex items-center justify-center mb-4 text-white">
                                <Camera className="w-5 h-5" />
                            </div>
                            <h3 className="text-sm font-bold text-white mb-2">Upload Photo</h3>
                            <p className="text-xs text-[#71717a] leading-relaxed">Use any photo of your body part.</p>
                        </div>
                        <div className="flex flex-col items-center p-4 border-l border-r border-[#27272a]/0 md:border-[#27272a]">
                            <div className="w-10 h-10 rounded-lg bg-[#18181b] border border-[#27272a] flex items-center justify-center mb-4 text-white">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <h3 className="text-sm font-bold text-white mb-2">AI Precision</h3>
                            <p className="text-xs text-[#71717a] leading-relaxed">Warp technology adapts to curves.</p>
                        </div>
                        <div className="flex flex-col items-center p-4">
                            <div className="w-10 h-10 rounded-lg bg-[#18181b] border border-[#27272a] flex items-center justify-center mb-4 text-white">
                                <Download className="w-5 h-5" />
                            </div>
                            <h3 className="text-sm font-bold text-white mb-2">Export HD</h3>
                            <p className="text-xs text-[#71717a] leading-relaxed">Download high-res previews.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-6 left-0 right-0 text-center opacity-0 animate-fade-in animation-delay-500">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#27272a] bg-[#09090b]">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className="text-[10px] text-[#71717a] font-mono">SYSTEM OPERATIONAL</span>
                </div>
            </div>
        </div>
    );
}
