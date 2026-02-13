import { X, CheckCircle2, XCircle, Sun, Aperture, Maximize, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PhotoGuideProps {
    onClose: () => void;
}

export default function PhotoGuide({ onClose }: PhotoGuideProps) {
    const sections = [
        {
            title: "Lighting",
            good: { text: "Natural light, soft shadows", icon: Sun, color: "text-amber-400" },
            bad: { text: "Dark or overhead lighting", icon: Sun, color: "text-neutral-600" },
            icon: Sun
        },
        {
            title: "Angle & Volume",
            good: { text: "Arm slightly turned, visible depth", icon: Aperture, color: "text-emerald-400" },
            bad: { text: "Arm flat, no perspective", icon: Aperture, color: "text-neutral-600" },
            icon: Aperture
        },
        {
            title: "Framing",
            good: { text: "Arm fully visible, well centered", icon: Maximize, color: "text-blue-400" },
            bad: { text: "Cropped or too far", icon: Maximize, color: "text-neutral-600" },
            icon: Maximize
        },
        {
            title: "Image Quality",
            good: { text: "Sharp, clean photo", icon: CheckCircle2, color: "text-violet-400" },
            bad: { text: "Blurry or filtered", icon: AlertTriangle, color: "text-neutral-600" },
            icon: AlertTriangle
        }
    ];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] my-8"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 md:p-8 bg-neutral-900 border-b border-neutral-800/50 z-10">
                        <h2 className="text-2xl font-light text-neutral-100 leading-tight">
                            For the best realistic result, take a good photo
                        </h2>
                        <p className="text-neutral-400 mt-2 font-light">A few simple tips.</p>

                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 rounded-xl transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
                        {sections.map((section, index) => (
                            <div key={index} className="space-y-3">
                                <div className="flex items-center gap-2 text-neutral-300 font-medium text-sm uppercase tracking-wider mb-2">
                                    <section.icon className="w-4 h-4" />
                                    {section.title}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Good Example */}
                                    <div className="bg-neutral-800/30 rounded-2xl p-4 border border-emerald-500/10 flex flex-col items-center text-center space-y-3 relative overflow-hidden group">
                                        <div className="absolute top-2 right-2">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                        </div>
                                        {/* Visual Placeholder for Good */}
                                        <div className="w-full aspect-square bg-neutral-800/50 rounded-xl flex items-center justify-center mb-1 group-hover:bg-neutral-800 transition-colors">
                                            <section.good.icon className={`w-10 h-10 ${section.good.color}`} />
                                        </div>
                                        <p className="text-xs text-neutral-300 font-light leading-snug">
                                            {section.good.text}
                                        </p>
                                    </div>

                                    {/* Bad Example */}
                                    <div className="bg-neutral-800/30 rounded-2xl p-4 border border-red-500/10 flex flex-col items-center text-center space-y-3 relative overflow-hidden group">
                                        <div className="absolute top-2 right-2">
                                            <XCircle className="w-5 h-5 text-red-500/50" />
                                        </div>
                                        {/* Visual Placeholder for Bad */}
                                        <div className="w-full aspect-square bg-neutral-800/30 rounded-xl flex items-center justify-center mb-1 group-hover:bg-neutral-800/50 transition-colors opacity-50 grayscale">
                                            <section.bad.icon className={`w-10 h-10 ${section.bad.color}`} />
                                        </div>
                                        <p className="text-xs text-neutral-500 font-light leading-snug">
                                            {section.bad.text}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer - Fixed at bottom */}
                    <div className="p-6 md:p-8 bg-neutral-900 border-t border-neutral-800/50 z-10 flex flex-col items-center text-center space-y-4">
                        <p className="text-sm text-neutral-400 font-light">
                            A better photo means a better preview.
                        </p>
                        <button
                            onClick={onClose}
                            className="w-full py-4 bg-neutral-100 text-neutral-900 rounded-xl text-base font-medium tracking-wide hover:bg-white hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            Got it
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
