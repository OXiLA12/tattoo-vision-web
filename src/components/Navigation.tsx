import { useState } from 'react';
import { Home, Grid, User, Sparkles, Gift } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import ReferralModal from './ReferralModal';
import BrandMark from './BrandMark';

interface NavigationProps {
    currentPage: string;
    onNavigate: (page: any) => void;
}

function ProBadge() {
    return (
        <span
            className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border"
            style={{
                background: 'linear-gradient(135deg, #0091FF22, #00DC8222)',
                borderColor: '#00DC8244',
                color: '#00DC82',
            }}
        >
            PRO
        </span>
    );
}

export default function Navigation({ currentPage, onNavigate }: NavigationProps) {
    const { t } = useLanguage();
    const { isEntitled } = useAuth();
    const [showReferralModal, setShowReferralModal] = useState(false);

    const navItems = [
        { id: 'upload', icon: Home, label: t('nav_home') },
        { id: 'library', icon: Grid, label: t('nav_library') },
        { id: 'extract', icon: Sparkles, label: t('nav_extract') },
        { id: 'profile', icon: User, label: t('nav_profile') },
        { id: 'referral', icon: Gift, label: t('language') === 'fr' || navigator.language.startsWith('fr') ? 'VP Gratuits' : 'Free VP' },
    ];

    return (
        <>
            {showReferralModal && <ReferralModal onClose={() => setShowReferralModal(false)} />}

            {/* Mobile Top Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-24 bg-[#09090b]/90 backdrop-blur-2xl border-b border-white/5 z-[100] flex items-end justify-between px-6 pb-4 pt-[max(env(safe-area-inset-top),20px)]">
                <div className="flex-1 flex items-center gap-2 h-full pt-4">
                    <BrandMark compact horizontal />
                    {isEntitled && <ProBadge />}
                </div>
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-[#09090b] border-r border-[#27272a] p-4 z-50">
                <div className="mb-10 px-2 flex items-center gap-2">
                    <button onClick={() => onNavigate('upload')} className="hover:opacity-90 transition-all group">
                        <BrandMark compact horizontal />
                    </button>
                    {isEntitled && <ProBadge />}
                </div>

                <nav className="flex-1 space-y-2 py-4">
                    {navItems.filter(item => item.id !== 'referral').map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${currentPage === item.id || (currentPage === 'editor' && item.id === 'upload') || (currentPage === 'export' && item.id === 'upload')
                                ? 'bg-[#0091FF]/10 text-[#0091FF]'
                                : 'text-[#a1a1aa] hover:bg-[#18181b] hover:text-white'
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="mt-auto px-2 space-y-4">
                    <button
                        onClick={() => setShowReferralModal(true)}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-[#00DC82]/10 text-[#00DC82] border border-[#00DC82]/20 hover:bg-[#00DC82]/20 transition-all font-medium text-sm group"
                    >
                        <Gift className="w-5 h-5" />
                        <span>{t('language') === 'fr' || navigator.language.startsWith('fr') ? 'Obtenir des VP Gratuits' : 'Get free Vision Points'}</span>
                    </button>

                    {/* Pro status or upgrade prompt */}
                    <div className="py-4 border-t border-[#27272a]">
                        {isEntitled ? (
                            <div className="flex items-center gap-2 px-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#00DC82] shadow-[0_0_8px_#00DC82]" />
                                <span className="text-[11px] font-black uppercase tracking-widest text-[#00DC82]">Accès Pro Actif</span>
                            </div>
                        ) : (
                            <p className="text-[10px] text-[#52525b] uppercase tracking-wider font-mono text-center opacity-60">
                                Abonnez-vous pour accéder à tout
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile Bottom Bar */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#09090b]/95 backdrop-blur-2xl border-t border-white/5 z-50 px-2 pb-[env(safe-area-inset-bottom)]">
                <div className="flex justify-around items-center h-16 md:h-20">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => item.id === 'referral' ? setShowReferralModal(true) : onNavigate(item.id)}
                            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all active:scale-90 ${item.id === 'referral'
                                ? 'text-[#00DC82]'
                                : currentPage === item.id || (currentPage === 'editor' && item.id === 'upload') || (currentPage === 'export' && item.id === 'upload')
                                    ? 'text-[#0091FF]'
                                    : 'text-[#a1a1aa] active:text-white'
                                }`}
                        >
                            <div className={`relative ${currentPage === item.id || (currentPage === 'editor' && item.id === 'upload') || (currentPage === 'export' && item.id === 'upload') ? 'scale-110' : 'scale-100'} transition-all duration-300`}>
                                <item.icon className="w-5 h-5 md:w-6 md:h-6" strokeWidth={item.id === 'referral' || currentPage === item.id || (currentPage === 'editor' && item.id === 'upload') || (currentPage === 'export' && item.id === 'upload') ? 2.5 : 2} />
                                {item.id !== 'referral' && (currentPage === item.id || (currentPage === 'editor' && item.id === 'upload') || (currentPage === 'export' && item.id === 'upload')) && (
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#0091FF] rounded-full shadow-[0_0_8px_#0091FF]"></div>
                                )}
                                {/* Pro dot on Profile icon */}
                                {item.id === 'profile' && isEntitled && (
                                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#00DC82] border border-[#09090b] shadow-[0_0_6px_#00DC82]" />
                                )}
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${item.id === 'referral' || currentPage === item.id || (currentPage === 'editor' && item.id === 'upload') || (currentPage === 'export' && item.id === 'upload') ? 'opacity-100' : 'opacity-60'}`}>{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
}
