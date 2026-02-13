import { useState, useEffect } from 'react';
import { X, ArrowRight, Check } from 'lucide-react';

interface OnboardingStep {
    targetId: string;
    title: string;
    description: string;
    position: 'top' | 'bottom' | 'left' | 'right';
}

const STEPS: OnboardingStep[] = [
    {
        targetId: 'tour-canvas',
        title: 'Positioning',
        description: 'Drag to move. Use corners to resize. Use the top handle to rotate.',
        position: 'bottom',
    },
    {
        targetId: 'tour-opacity',
        title: 'Adjust Opacity',
        description: 'Blend the tattoo with your skin for a more natural look.',
        position: 'top',
    },
    {
        targetId: 'tour-remove-bg',
        title: 'Remove Background',
        description: 'If your design has a white background, remove it here.',
        position: 'top',
    },
    {
        targetId: 'tour-zoom',
        title: 'Fine Tuning',
        description: 'Zoom in for precision work or rotate 90° quickly.',
        position: 'top',
    },
    {
        targetId: 'tour-export',
        title: 'Ready?',
        description: 'Click Continue to see the realistic render preview.',
        position: 'bottom',
    },
];

export default function OnboardingTour() {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

    useEffect(() => {
        const hasSeenTour = localStorage.getItem('hasSeenEditorTour');
        if (!hasSeenTour) {
            // Small delay to ensure elements are rendered
            setTimeout(() => setIsVisible(true), 500);
        }
    }, []);

    useEffect(() => {
        if (!isVisible) return;

        const updatePosition = () => {
            const step = STEPS[currentStepIndex];
            const element = document.getElementById(step.targetId);

            if (element) {
                const rect = element.getBoundingClientRect();
                let top = 0;
                let left = 0;
                const padding = 12; // Gap between tooltip and element

                switch (step.position) {
                    case 'top':
                        top = rect.top - padding;
                        left = rect.left + rect.width / 2;
                        break;
                    case 'bottom':
                        top = rect.bottom + padding;
                        left = rect.left + rect.width / 2;
                        break;
                    case 'left':
                        top = rect.top + rect.height / 2;
                        left = rect.left - padding;
                        break;
                    case 'right':
                        top = rect.top + rect.height / 2;
                        left = rect.right + padding;
                        break;
                }

                setCoords({ top, left });

                // Scroll element into view if needed
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        return () => window.removeEventListener('resize', updatePosition);
    }, [currentStepIndex, isVisible]);

    const handleNext = () => {
        if (currentStepIndex < STEPS.length - 1) {
            setCurrentStepIndex((prev) => prev + 1);
        } else {
            handleClose();
        }
    };

    const handleClose = () => {
        setIsVisible(false);
        localStorage.setItem('hasSeenEditorTour', 'true');
    };

    if (!isVisible || !coords) return null;

    const step = STEPS[currentStepIndex];
    const isLastStep = currentStepIndex === STEPS.length - 1;

    return (
        <div className="fixed inset-0 z-50 pointer-events-none">
            {/* Overlay backing for focus (optional, maybe too intrusive?) 
          Let's keep it subtle without a full dark overlay, just the popover. 
      */}

            {/* Tooltip */}
            <div
                className="absolute transition-all duration-300 pointer-events-auto"
                style={{
                    top: coords.top,
                    left: coords.left,
                    transform: `translate(${step.position === 'left' || step.position === 'right' ? '0, -50%' : '-50%, 0'})`
                }}
            >
                <div className={`
          bg-[#0091FF] text-white p-4 rounded-xl shadow-2xl w-64
          animate-fade-up
          ${step.position === 'top' ? 'mb-2 origin-bottom' : ''}
          ${step.position === 'bottom' ? 'mt-2 origin-top' : ''}
          ${step.position === 'left' ? 'mr-2 origin-right' : ''}
          ${step.position === 'right' ? 'ml-2 origin-left' : ''}
        `}>
                    {/* Arrow */}
                    <div className={`
            absolute w-3 h-3 bg-[#0091FF] rotate-45
            ${step.position === 'top' ? 'bottom-[-6px] left-1/2 -translate-x-1/2' : ''}
            ${step.position === 'bottom' ? 'top-[-6px] left-1/2 -translate-x-1/2' : ''}
            ${step.position === 'left' ? 'right-[-6px] top-1/2 -translate-y-1/2' : ''}
            ${step.position === 'right' ? 'left-[-6px] top-1/2 -translate-y-1/2' : ''}
          `} />

                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-sm uppercase tracking-wider">{step.title}</h3>
                        <button
                            onClick={handleClose}
                            className="p-1 hover:bg-white/20 rounded-full transition-colors -mr-2 -mt-2"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>

                    <p className="text-sm font-medium leading-relaxed opacity-90 mb-4">
                        {step.description}
                    </p>

                    <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                            {STEPS.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentStepIndex ? 'bg-white' : 'bg-white/30'
                                        }`}
                                />
                            ))}
                        </div>

                        <button
                            onClick={handleNext}
                            className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors"
                        >
                            {isLastStep ? 'Finish' : 'Next'}
                            {isLastStep ? <Check className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
