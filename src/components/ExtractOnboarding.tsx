import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Upload, CheckCircle2, X } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface ExtractOnboardingProps {
    onClose: () => void;
}

export default function ExtractOnboarding({ onClose }: ExtractOnboardingProps) {
    const { t } = useLanguage();
    const [step, setStep] = useState(0);

    const steps = [
        {
            title: t('extract_step_1_title') || "Upload Photo",
            description: t('extract_step_1_desc') || "Select a clear photo of a tattoo or a drawing.",
            icon: Upload,
            color: "#0091FF"
        },
        {
            title: t('extract_step_2_title') || "AI Extraction",
            description: t('extract_step_2_desc') || "Our AI isolates the design from its background instantly.",
            icon: Sparkles,
            color: "#0055FF"
        },
        {
            title: t('extract_step_3_title') || "Ready to Use",
            description: t('extract_step_3_desc') || "Save the result and try it on yourself in the editor.",
            icon: CheckCircle2,
            color: "#10b981"
        }
    ];

    const nextStep = () => {
        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
            onClose();
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        >
            <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="relative max-w-sm w-full bg-[#0c0c0e] border border-white/10 rounded-[40px] p-8 mt-12 overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.8)]"
            >
                {/* Background Ambient Glow */}
                <div 
                    className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-20 transition-colors duration-500"
                    style={{ backgroundColor: steps[step].color }}
                />

                <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/40 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="relative z-10">
                    <AnimatePresence mode="wait">
                        <motion.div 
                            key={step}
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            className="flex flex-col items-center text-center"
                        >
                            <div 
                                className="w-20 h-20 rounded-3xl flex items-center justify-center mb-8 shadow-2xl transition-all duration-500"
                                style={{ 
                                    backgroundColor: `${steps[step].color}20`,
                                    border: `1px solid ${steps[step].color}40`,
                                    boxShadow: `0 0 30px ${steps[step].color}15`
                                }}
                            >
                                {(() => {
                                    const Icon = steps[step].icon;
                                    return <Icon className="w-10 h-10" style={{ color: steps[step].color }} />;
                                })()}
                            </div>

                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2">
                                Step {step + 1} of 3
                            </p>
                            <h2 className="text-2xl font-black text-white mb-4 tracking-tight">
                                {steps[step].title}
                            </h2>
                            <p className="text-neutral-400 text-sm leading-relaxed mb-10 px-4">
                                {steps[step].description}
                            </p>
                        </motion.div>
                    </AnimatePresence>

                    <div className="flex flex-col gap-4">
                        <button
                            onClick={nextStep}
                            className="w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.15em] transition-all relative overflow-hidden group"
                            style={{ backgroundColor: steps[step].color, color: '#000' }}
                        >
                             <span className="relative z-10">
                                {step === steps.length - 1 ? (t('onboarding_start') || 'Let\'s Go') : (t('onboarding_next') || 'Continue')}
                             </span>
                             <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
                        </button>

                        <div className="flex justify-center gap-2 mt-2">
                            {steps.map((_, i) => (
                                <div 
                                    key={i}
                                    className="h-1 rounded-full transition-all duration-300"
                                    style={{ 
                                        width: i === step ? '20px' : '6px',
                                        backgroundColor: i === step ? steps[step].color : 'rgba(255,255,255,0.1)'
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
