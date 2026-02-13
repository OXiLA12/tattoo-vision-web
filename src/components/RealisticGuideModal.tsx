import { Lightbulb, Check, Image as ImageIcon, SunMedium, Move, X } from 'lucide-react';

interface RealisticGuideModalProps {
    onClose: () => void;
}

export default function RealisticGuideModal({ onClose }: RealisticGuideModalProps) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in overflow-y-auto"
            onClick={onClose}
        >
            <div
                className="bg-[#09090b] border border-neutral-800 rounded-2xl p-6 md:p-8 w-full max-w-lg relative animate-scale-in shadow-2xl my-8 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-neutral-800/50 hover:bg-neutral-700 transition-colors z-10"
                    aria-label="Close"
                >
                    <X className="w-4 h-4 text-neutral-400" />
                </button>

                {/* Header */}
                <div className="flex items-center gap-4 mb-6 pr-8">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20 flex-shrink-0">
                        <Lightbulb className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-neutral-50">Pro Tips for Realistic Renders</h2>
                        <p className="text-neutral-400 text-sm">Follow these 3 rules for perfect results</p>
                    </div>
                </div>

                {/* Steps */}
                <div className="space-y-4">
                    <div className="flex gap-4 p-4 rounded-xl bg-neutral-900/50 border border-neutral-800/50">
                        <div className="flex-shrink-0 mt-1">
                            <SunMedium className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <h3 className="text-neutral-200 font-bold text-sm mb-1">1. Good Lighting is Key</h3>
                            <p className="text-neutral-500 text-xs leading-relaxed">
                                Avoid heavy shadows or overexposed photos. The AI needs to see the skin texture clearly to blend the ink naturally.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4 p-4 rounded-xl bg-neutral-900/50 border border-neutral-800/50">
                        <div className="flex-shrink-0 mt-1">
                            <Move className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-neutral-200 font-bold text-sm mb-1">2. Precise Placement</h3>
                            <p className="text-neutral-500 text-xs leading-relaxed">
                                Position the designs exactly where you want them. The AI respects your layout 100%. Use the rotate tool to follow body curves.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4 p-4 rounded-xl bg-neutral-900/50 border border-neutral-800/50">
                        <div className="flex-shrink-0 mt-1">
                            <ImageIcon className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-neutral-200 font-bold text-sm mb-1">3. Don't Fade Too Much</h3>
                            <p className="text-neutral-500 text-xs leading-relaxed">
                                Keep Opacity high (60-80%). If it's too transparent, the AI might treat it as a shadow or bruise instead of ink.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action */}
                <button
                    onClick={onClose}
                    className="w-full mt-6 py-4 bg-white text-neutral-950 rounded-xl font-bold text-sm hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
                >
                    <Check className="w-4 h-4" />
                    I Understand
                </button>
            </div>
        </div>
    );
}
