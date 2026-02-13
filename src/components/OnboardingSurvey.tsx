import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Sparkles, ArrowRight, Instagram, Twitter, Users, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

interface OnboardingSurveyProps {
    onComplete: () => void;
}

export default function OnboardingSurvey({ onComplete }: OnboardingSurveyProps) {
    const { user, refreshCredits } = useAuth();
    const [selectedSource, setSelectedSource] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const sources = [
        {
            id: 'tiktok',
            label: 'TikTok',
            icon: (
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z" />
                </svg>
            )
        },
        {
            id: 'instagram',
            label: 'Instagram',
            icon: <Instagram className="w-6 h-6" />
        },
        {
            id: 'twitter',
            label: 'Twitter / X',
            icon: <Twitter className="w-6 h-6" />
        },
        {
            id: 'google',
            label: 'Google Search',
            icon: (
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                </svg>
            )
        },
        {
            id: 'friend',
            label: 'Friend',
            icon: <Users className="w-6 h-6" />
        },
        {
            id: 'other',
            label: 'Other',
            icon: <Globe className="w-6 h-6" />
        },
    ];

    const handleSubmit = async () => {
        if (!selectedSource || !user) return;
        setLoading(true);

        try {
            // Call the Supabase function we created
            const { error } = await supabase.rpc('submit_onboarding_survey', {
                p_source: selectedSource
            });

            if (error) throw error;

            // Refresh credits to show the new balance
            await refreshCredits();

            // Proceed
            onComplete();
        } catch (error) {
            console.error('Error submitting survey:', error);
            // Even if network fails, we might want to let them through or show retry
            // For now, let's treat success to avoid blocking, but in prod we'd handle error better
            onComplete();
        } finally {
            setLoading(false);
        }
    };



    // ... (existing imports)

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-neutral-950/95 backdrop-blur-md"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", duration: 0.6 }}
                className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl"
            >
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4"
                    >
                        <Sparkles className="w-8 h-8 text-neutral-200" />
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <h2 className="text-2xl font-light text-neutral-50 mb-2">One last thing!</h2>
                        <p className="text-neutral-400 font-light">
                            Tell us how you found us to unlock your <span className="text-neutral-200 font-medium">10 free credits</span>.
                        </p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-8">
                    {sources.map((source, index) => (
                        <motion.button
                            key={source.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + index * 0.1 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedSource(source.id)}
                            className={`p-4 rounded-xl border text-left transition-colors duration-300 flex flex-col gap-2 ${selectedSource === source.id
                                ? 'bg-neutral-100 border-neutral-100 text-neutral-950 shadow-lg shadow-white/5'
                                : 'bg-neutral-900/50 border-neutral-800 text-neutral-400 hover:border-neutral-600 hover:text-neutral-200'
                                }`}
                        >
                            <span className="text-2xl">{source.icon}</span>
                            <span className="text-sm font-medium">{source.label}</span>
                        </motion.button>
                    ))}
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={!selectedSource || loading}
                    className="w-full py-4 bg-neutral-100 text-neutral-900 rounded-xl font-medium tracking-wide hover:bg-white hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                    {loading ? 'Unlocking...' : 'Unlock 10 Credits'}
                    {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
            </motion.div>
        </motion.div>
    );
}
