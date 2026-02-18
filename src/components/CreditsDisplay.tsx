import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PlanPricingModal from './PlanPricingModal';
import { useLanguage } from '../contexts/LanguageContext';

export default function CreditsDisplay() {
    const { credits } = useAuth();
    const { t } = useLanguage();
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <div className="flex items-center gap-2">
                <div className="flex flex-col items-end">
                    <span className="text-[8px] uppercase tracking-widest text-[#a1a1aa] font-black leading-none mb-0.5 opacity-60">
                        {t('profile_credits')}
                    </span>
                    <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-full border border-white/10">
                        <span className="text-xs font-black text-white italic">
                            {credits.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-[#0091FF] font-black">VP</span>
                    </div>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="p-2 bg-[#0091FF] hover:bg-[#007AFF] text-white rounded-full transition-all active:scale-95 shadow-[0_0_15px_rgba(0,145,255,0.3)]"
                    title={t('profile_buy_more')}
                >
                    <Plus className="w-3 h-3" strokeWidth={3} />
                </button>
            </div>

            {isModalOpen && (
                <PlanPricingModal onClose={() => setIsModalOpen(false)} />
            )}
        </>
    );
}
