import { X, Sun, Aperture, CheckCircle2, Sparkles, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';

interface PhotoGuideProps {
    onClose: () => void;
}

export default function PhotoGuide({ onClose }: PhotoGuideProps) {
    const { t } = useLanguage();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl overflow-y-auto"
                onClick={onClose}
            >
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/5 rounded-[40px] shadow-2xl flex flex-col p-8 md:p-12"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <header className="mb-12 relative">
                        <motion.div variants={itemVariants} className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-500/10 rounded-xl">
                                <Sparkles className="w-5 h-5 text-blue-400" />
                            </div>
                            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">{t('upload_tips')}</span>
                        </motion.div>
                        <motion.h2 variants={itemVariants} className="text-4xl md:text-5xl font-semibold text-white tracking-tight mb-4">
                            {t('tips_title')}
                        </motion.h2>
                        <motion.p variants={itemVariants} className="text-neutral-500 text-lg font-light leading-relaxed max-w-md">
                            {t('tips_subtitle')}
                        </motion.p>

                        <button
                            onClick={onClose}
                            className="absolute -top-4 -right-4 p-4 text-neutral-500 hover:text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </header>

                    {/* Bento Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                        {/* Lighting Card */}
                        <motion.div
                            variants={itemVariants}
                            className="md:col-span-2 group relative overflow-hidden bg-neutral-900/40 border border-white/5 rounded-[32px] p-8"
                        >
                            <div className="flex flex-col md:flex-row gap-8 items-center mb-6">
                                <div className="flex-1 space-y-4 text-center md:text-left">
                                    <div className="flex items-center justify-center md:justify-start gap-2 text-amber-400">
                                        <Sun className="w-5 h-5" />
                                        <span className="text-sm font-bold uppercase tracking-widest">{t('tips_lighting_title')}</span>
                                    </div>
                                    <p className="text-neutral-400 text-sm leading-relaxed">
                                        {t('tips_lighting_desc')}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 h-48 md:h-64">
                                <div className="relative rounded-2xl overflow-hidden border border-emerald-500/20 bg-neutral-900 flex items-center justify-center">
                                    <Sun className="absolute w-8 h-8 text-neutral-800" />
                                    <img src="/tips/lighting_good.jpg" alt="" className="w-full h-full object-cover relative z-10" onError={(e) => e.currentTarget.style.display = 'none'} />
                                    <div className="absolute top-3 left-3 bg-emerald-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter z-20">Good</div>
                                </div>
                                <div className="relative rounded-2xl overflow-hidden border border-red-500/20 bg-neutral-900 flex items-center justify-center">
                                    <Sun className="absolute w-8 h-8 text-neutral-800" />
                                    <img src="/tips/lighting_bad.jpg" alt="" className="w-full h-full object-cover relative z-10 grayscale opacity-60" onError={(e) => e.currentTarget.style.display = 'none'} />
                                    <div className="absolute top-3 left-3 bg-red-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter z-20">Bad</div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Angle Card */}
                        <motion.div
                            variants={itemVariants}
                            className="group bg-neutral-900/40 border border-white/5 rounded-[32px] p-8 flex flex-col gap-6"
                        >
                            <div className="flex items-center gap-2 text-blue-400">
                                <Aperture className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-widest">{t('tips_angle_title')}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 h-32 md:h-40">
                                <div className="relative rounded-xl overflow-hidden border border-emerald-500/10 bg-neutral-900 flex items-center justify-center">
                                    <Aperture className="absolute w-6 h-6 text-neutral-800" />
                                    <img src="/tips/angle_good.jpg" alt="" className="w-full h-full object-cover relative z-10" onError={(e) => e.currentTarget.style.display = 'none'} />
                                    <div className="absolute top-2 left-2 bg-emerald-500 text-[6px] text-white font-bold px-1.5 py-0.5 rounded-full uppercase z-20">✓</div>
                                </div>
                                <div className="relative rounded-xl overflow-hidden border border-white/5 bg-neutral-900 flex items-center justify-center">
                                    <Aperture className="absolute w-6 h-6 text-neutral-800" />
                                    <img src="/tips/angle_bad.jpg" alt="" className="w-full h-full object-cover relative z-10 grayscale opacity-40" onError={(e) => e.currentTarget.style.display = 'none'} />
                                    <div className="absolute top-2 left-2 bg-neutral-700 text-[6px] text-white font-bold px-1.5 py-0.5 rounded-full uppercase z-20">✕</div>
                                </div>
                            </div>
                            <p className="text-neutral-500 text-[10px] leading-relaxed italic">
                                {t('tips_angle_desc')}
                            </p>
                        </motion.div>

                        {/* Skin Quality Card */}
                        <motion.div
                            variants={itemVariants}
                            className="group bg-neutral-900/40 border border-white/5 rounded-[32px] p-8 flex flex-col gap-6"
                        >
                            <div className="flex items-center gap-2 text-violet-400">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-widest">{t('tips_skin_title')}</span>
                            </div>
                            <div className="w-full h-32 md:h-40 rounded-2xl bg-neutral-900 border border-violet-500/10 relative overflow-hidden flex items-center justify-center">
                                <CheckCircle2 className="w-10 h-10 text-neutral-800" />
                                <img src="/tips/skin_tip.jpg" alt="" className="absolute inset-0 w-full h-full object-cover brightness-75 z-10" onError={(e) => e.currentTarget.style.display = 'none'} />
                            </div>
                            <p className="text-neutral-500 text-[10px] leading-relaxed italic">
                                {t('tips_skin_desc')}
                            </p>
                        </motion.div>
                    </div>

                    {/* Footer */}
                    <motion.footer variants={itemVariants} className="mt-auto">
                        <button
                            onClick={onClose}
                            className="w-full group py-6 bg-white text-black rounded-[24px] text-lg font-bold tracking-wide transition-all hover:bg-[#0091FF] hover:text-white flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-white/5"
                        >
                            {t('tips_got_it')}
                            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </motion.footer>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
