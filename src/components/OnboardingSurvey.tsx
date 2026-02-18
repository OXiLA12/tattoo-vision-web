import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabaseClient';
import { Sparkles, ArrowRight, Instagram, Globe, MessageCircle, Heart, Search } from 'lucide-react';
import { motion } from 'framer-motion';

interface OnboardingSurveyProps {
    onComplete: () => void;
}

export default function OnboardingSurvey({ onComplete }: OnboardingSurveyProps) {
    const { user, refreshCredits } = useAuth();
    const { t } = useLanguage();
    const [selectedSource, setSelectedSource] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const sources = [
        {
            id: 'tiktok',
            label: t('survey_source_tiktok'),
            icon: (
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z" />
                </svg>
            ),
            color: 'from-pink-500 to-cyan-500'
        },
        {
            id: 'instagram',
            label: t('survey_source_instagram'),
            icon: <Instagram className="w-5 h-5" />,
            color: 'from-purple-600 to-orange-500'
        },
        {
            id: 'ads',
            label: t('survey_source_ads'),
            icon: <Heart className="w-5 h-5" />,
            color: 'from-blue-600 to-indigo-600'
        },
        {
            id: 'google',
            label: t('survey_source_google'),
            icon: <Search className="w-5 h-5" />,
            color: 'from-red-500 via-yellow-500 to-green-500'
        },
        {
            id: 'friend',
            label: t('survey_source_friend'),
            icon: <MessageCircle className="w-5 h-5" />,
            color: 'from-emerald-500 to-teal-500'
        },
        {
            id: 'other',
            label: t('survey_source_other'),
            icon: <Globe className="w-5 h-5" />,
            color: 'from-neutral-600 to-neutral-800'
        },
    ];

    const handleSubmit = async () => {
        if (!selectedSource || !user) return;
        setLoading(true);

        try {
            const { error } = await (supabase.rpc as any)('submit_onboarding_survey', {
                p_source: selectedSource
            });

            if (error) throw error;
            await refreshCredits();
            onComplete();
        } catch (error) {
            console.error('Error submitting survey:', error);
            onComplete();
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl overflow-y-auto py-10"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                className="w-full max-w-lg bg-neutral-900/50 border border-white/10 rounded-[40px] p-6 md:p-10 shadow-[0_32px_64px_rgba(0,0,0,0.5)] relative overflow-hidden my-auto"
            >
                {/* Background glow Decor */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#0091FF]/10 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />

                <div className="relative z-10 max-h-[80vh] flex flex-col">
                    <div className="text-center mb-6 md:mb-10">
                        <motion.div
                            initial={{ rotate: -15, scale: 0 }}
                            animate={{ rotate: 0, scale: 1 }}
                            transition={{ type: "spring", delay: 0.2 }}
                            className="w-16 h-16 md:w-20 md:h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-2xl backdrop-blur-lg"
                        >
                            <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-[#0091FF]" />
                        </motion.div>
                        <h2 className="text-[9px] uppercase font-black tracking-[0.3em] text-[#0091FF] mb-3 bg-[#0091FF]/10 px-4 py-1.5 rounded-full inline-block">
                            {t('survey_title')}
                        </h2>
                        <h1 className="text-2xl md:text-4xl font-black text-white mb-3 tracking-tight leading-tight">
                            {t('survey_subtitle')}
                        </h1>
                        <p className="text-neutral-400 text-xs md:text-base font-light max-w-[280px] mx-auto leading-relaxed">
                            {t('survey_desc', { amount: 10 })}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-10 overflow-y-auto pr-1 custom-scrollbar">
                        {sources.map((source, index) => (
                            <motion.button
                                key={source.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + index * 0.05 }}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedSource(source.id)}
                                className={`group relative p-3 md:p-4 rounded-3xl border transition-all duration-500 overflow-hidden ${selectedSource === source.id
                                    ? 'bg-white border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                                    : 'bg-white/5 border-white/10 hover:border-white/20'
                                    }`}
                            >
                                <div className="relative z-10 flex flex-col items-center gap-2 md:gap-3">
                                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-2xl flex items-center justify-center transition-all duration-300 ${selectedSource === source.id
                                        ? `bg-black text-white`
                                        : `bg-neutral-800 text-neutral-400 group-hover:text-white`
                                        }`}>
                                        {source.icon}
                                    </div>
                                    <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-colors ${selectedSource === source.id ? 'text-black' : 'text-neutral-400'
                                        }`}>
                                        {source.label}
                                    </span>
                                </div>
                                {selectedSource === source.id && (
                                    <motion.div
                                        layoutId="glow"
                                        className="absolute inset-0 bg-gradient-to-br from-white via-white to-neutral-100"
                                    />
                                )}
                            </motion.button>
                        ))}
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={!selectedSource || loading}
                        className="w-full group relative py-6 md:py-5 bg-[#0091FF] disabled:bg-neutral-800 text-white rounded-[24px] font-black uppercase tracking-[0.2em] text-sm shadow-[0_20px_40px_rgba(0,145,255,0.4)] hover:shadow-[0_25px_50px_rgba(0,145,255,0.6)] transition-all disabled:shadow-none disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden active:scale-95"
                    >
                        <div className="relative z-10 flex items-center justify-center gap-3">
                            {loading ? t('survey_unlocking') : (
                                <>
                                    <span>{t('survey_unlock_button', { amount: 10 })}</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer" />
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
