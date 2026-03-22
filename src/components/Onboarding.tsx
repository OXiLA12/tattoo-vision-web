import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, ImagePlus, User, MagicWand } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface OnboardingProps {
    onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const { t, language } = useLanguage();

    const steps = [
        {
            icon: ImagePlus,
            title: language === 'fr' ? "1. Importez" : "1. Upload",
            description: language === 'fr' ? "Prenez une photo de la zone à tatouer." : "Take a photo of the area to tattoo.",
            image: "/onboarding/upload.png"
        },
        {
            icon: User,
            title: language === 'fr' ? "2. Placez" : "2. Place",
            description: language === 'fr' ? "Ajustez la taille et la position de votre tatouage avec précision." : "Adjust the size and position of your tattoo with precision.",
            image: "/onboarding/place.png"
        },
        {
            icon: Sparkles,
            title: language === 'fr' ? "3. Rendu Réaliste" : "3. Realistic Render",
            description: language === 'fr' ? "Notre IA fusionne le tatouage avec votre peau pour un aperçu parfait." : "Our AI merges the tattoo with your skin for a perfect preview.",
            image: "/onboarding/render.png"
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
                    <motion.img 
                        key={currentStep}
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 0.5, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        src={steps[currentStep].image} 
                        alt="Background" 
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                </AnimatePresence>
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/90 to-neutral-950/20" />
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
                            language === 'fr' ? "Commencer" : "Get Started"
                        ) : (
                            language === 'fr' ? "Suivant" : "Next"
                        )}
                        <ArrowRight className="w-5 h-5" />
                    </button>
                    
                    {currentStep < steps.length - 1 && (
                        <button 
                            onClick={onComplete}
                            className="w-full py-4 text-sm font-medium text-neutral-500 hover:text-white transition-colors uppercase tracking-widest mt-2"
                        >
                            {language === 'fr' ? "Passer" : "Skip"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
