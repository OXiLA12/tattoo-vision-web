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
            image: "https://images.unsplash.com/photo-1601004111364-e590af37bf6d?w=800&auto=format&fit=crop&q=80"
        },
        {
            icon: User,
            title: t('language') === 'fr' || navigator.language.startsWith('fr') ? "2. Placez" : "2. Place",
            description: t('language') === 'fr' || navigator.language.startsWith('fr') ? "Ajustez la taille et la position de votre tatouage avec précision." : "Adjust the size and position of your tattoo with precision.",
            image: "https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?w=800&auto=format&fit=crop&q=80"
        },
        {
            icon: Sparkles,
            title: t('language') === 'fr' || navigator.language.startsWith('fr') ? "3. Rendu Réaliste" : "3. Realistic Render",
            description: t('language') === 'fr' || navigator.language.startsWith('fr') ? "Laissez notre IA fusionner le tatouage avec votre peau pour un aperçu parfait." : "Let our AI merge the tattoo with your skin for a perfect preview.",
            image: "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6ece?w=800&auto=format&fit=crop&q=80"
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
            <div className="absolute inset-0 z-0">
                <img 
                    src={steps[currentStep].image} 
                    alt="Background" 
                    className="w-full h-full object-cover opacity-30 transition-all duration-1000 scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent" />
            </div>

            <div className="relative z-10 flex-1 flex flex-col justify-end pb-12 px-6 sm:px-12">
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
                        className="w-full h-14 bg-[#0091FF] text-white rounded-xl text-lg font-bold flex items-center justify-center gap-2 hover:bg-[#007AFF] transition-all shadow-[0_0_40px_rgba(0,145,255,0.4)] hover:shadow-[0_0_60px_rgba(0,145,255,0.6)]"
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
