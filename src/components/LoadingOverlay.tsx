import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
    message: string;
}

const STEPS = [
    "Analyzing skin texture...",
    "Calculating lighting model...",
    "Injecting ink pigments...",
    "Applying realistic shading...",
    "Rendering final output..."
];

export default function LoadingOverlay({ message }: LoadingOverlayProps) {
    const [stepIndex, setStepIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Simulate progress bar and step changing
        const progressInterval = setInterval(() => {
            setProgress(p => {
                if (p >= 95) return p;
                return p + (Math.random() * 2);
            });
        }, 100);

        const stepInterval = setInterval(() => {
            setStepIndex(s => (s < STEPS.length - 1 ? s + 1 : s));
        }, 2000);

        return () => {
            clearInterval(progressInterval);
            clearInterval(stepInterval);
        };
    }, []);

    return (
        <div className="fixed inset-0 bg-[#09090b] z-[9999] flex flex-col items-center justify-center animate-fade-in overscroll-none touch-none">
            <div className="max-w-md w-full px-8 text-center">
                <div className="relative w-24 h-24 mx-auto mb-8">
                    <div className="absolute inset-0 rounded-full border-2 border-[#18181b]"></div>
                    <div className="absolute inset-0 rounded-full border-t-2 border-[#0091FF] animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[#0091FF] font-mono font-bold text-lg">{Math.round(progress)}%</span>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Generating Realistic Render</h2>
                <div className="h-6 overflow-hidden relative">
                    <p className="text-[#a1a1aa] font-mono text-sm animate-fade-up key-{stepIndex}">
                        {STEPS[stepIndex]}
                    </p>
                </div>

                {/* Progress bar line */}
                <div className="mt-8 h-1 w-full bg-[#18181b] rounded-full overflow-hidden">
                    <div
                        className="h-full bg-[#0091FF] transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <p className="text-[#52525b] text-xs mt-4 uppercase tracking-widest">Power Your Vision</p>
            </div>
        </div>
    );
}
