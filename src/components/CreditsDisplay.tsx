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
            <div className="flex flex-col gap-3 w-full">
                <div className="w-full flex items-center justify-between px-3 py-2 bg-[#09090b] border border-[#27272a] rounded-lg">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider text-[#a1a1aa] font-mono mb-0.5">
                            {t('profile_credits')}
                        </span>
                        <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium text-white font-mono">
                                {credits.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-[#52525b]">VP</span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-[#0091FF] hover:bg-[#007AFF] text-white rounded-lg transition-all active:scale-[0.98] shadow-[0_4px_12px_rgba(0,145,255,0.2)]"
                >
                    <span className="text-[10px] font-bold uppercase tracking-wider">{t('profile_buy_more')}</span>
                    <Plus className="w-3 h-3" />
                </button>
            </div>

            {isModalOpen && (
                <PlanPricingModal onClose={() => setIsModalOpen(false)} />
            )}
        </>
    );
}
