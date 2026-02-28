import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, ImagePlus, User, MagicWand } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface OnboardingProps {
    onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const { t } = useLanguage();

    const steps = [
        {
            icon: ImagePlus,
            title: t('language') === 'fr' || navigator.language.startsWith('fr') ? "1. Importez" : "1. Upload",
            description: t('language') === 'fr' || navigator.language.startsWith('fr') ? "Prenez une photo de la zone à tatouer et choisissez ou générez un design." : "Take a photo of the area to tattoo and choose or generate a design.",
            gradient: "from-blue-600/30 via-indigo-900/40 to-neutral-950"
        },
        {
            icon: User,
            title: t('language') === 'fr' || navigator.language.startsWith('fr') ? "2. Placez" : "2. Place",
            description: t('language') === 'fr' || navigator.language.startsWith('fr') ? "Ajustez la taille et la position de votre tatouage avec précision." : "Adjust the size and position of your tattoo with precision.",
            gradient: "from-emerald-600/30 via-teal-900/40 to-neutral-950"
        },
        {
            icon: Sparkles,
            title: t('language') === 'fr' || navigator.language.startsWith('fr') ? "3. Rendu Réaliste" : "3. Realistic Render",
            description: t('language') === 'fr' || navigator.language.startsWith('fr') ? "Laissez notre IA fusionner le tatouage avec votre peau pour un aperçu parfait." : "Let our AI merge the tattoo with your skin for a perfect preview.",
            gradient: "from-purple-600/30 via-pink-900/40 to-neutral-950"
        }
    ];

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onComplete();
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex flex-col bg-neutral-950 text-white overflow-hidden">
            <div className="absolute inset-0 z-0 bg-neutral-950">
                <AnimatePresence mode="popLayout">
                    <motion.div 
                        key={currentStep}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        className={`absolute inset-0 w-full h-full bg-gradient-to-br ${steps[currentStep].gradient} opacity-80`}
                    />
                </AnimatePresence>
                {/* Overlay patterns for texture */}
                <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
            </div>

            <div className="relative z-10 flex-1 flex flex-col justify-end pb-12 px-6 sm:px-12 backdrop-blur-[2px]">
                <div className="max-w-md mx-auto w-full">
                    {/* Progress indicators */}
                    <div className="flex gap-2 mb-8 justify-center">
                        {steps.map((_, idx) => (
                            <div 
                                key={idx} 
                                className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentStep ? 'w-8 bg-[#0091FF]' : 'w-2 bg-white/20'}`} 
                            />
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                            className="text-center"
                        >
                            <div className="w-16 h-16 bg-[#0091FF]/20 rounded-2xl flex items-center justify-center mx-auto mb-6 ring-1 ring-[#0091FF]/50 shadow-[0_0_30px_rgba(0,145,255,0.3)]">
                                {(() => {
                                    const IconUrl = steps[currentStep].icon;
                                    return <IconUrl className="w-8 h-8 text-[#0091FF]" />;
                                })()}
                            </div>
                            
                            <h1 className="text-3xl font-black mb-4 uppercase tracking-tight">{steps[currentStep].title}</h1>
                            <p className="text-neutral-400 text-lg leading-relaxed mb-8">
                                {steps[currentStep].description}
                            </p>
                        </motion.div>
                    </AnimatePresence>

                    <button
                        onClick={nextStep}
                        className="w-full h-14 bg-white text-black rounded-xl text-lg font-bold flex items-center justify-center gap-2 hover:bg-neutral-200 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)]"
                    >
                        {currentStep === steps.length - 1 ? (
                            t('language') === 'fr' || navigator.language.startsWith('fr') ? "Commencer" : "Get Started"
                        ) : (
                            t('language') === 'fr' || navigator.language.startsWith('fr') ? "Suivant" : "Next"
                        )}
                        <ArrowRight className="w-5 h-5" />
                    </button>
                    
                    {currentStep < steps.length - 1 && (
                        <button 
                            onClick={onComplete}
                            className="w-full py-4 text-sm font-medium text-neutral-500 hover:text-white transition-colors uppercase tracking-widest mt-2"
                        >
                            {t('language') === 'fr' || navigator.language.startsWith('fr') ? "Passer" : "Skip"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
