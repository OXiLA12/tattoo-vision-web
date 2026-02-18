import { useState } from 'react';
import { Home, Clock, Grid, User, Sparkles } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import CreditsDisplay from './CreditsDisplay';
import ReferralModal from './ReferralModal';
import BrandMark from './BrandMark';

interface NavigationProps {
    currentPage: string;
    onNavigate: (page: any) => void;
}

export default function Navigation({ currentPage, onNavigate }: NavigationProps) {
    const { t } = useLanguage();
    const [showReferralModal, setShowReferralModal] = useState(false);

    const navItems = [
        { id: 'upload', icon: Home, label: t('nav_home') },
        { id: 'history', icon: Clock, label: t('nav_history') },
        { id: 'library', icon: Grid, label: t('nav_library') },
        { id: 'extract', icon: Sparkles, label: t('nav_extract') },
        { id: 'profile', icon: User, label: t('nav_profile') },
    ];

    return (
        <>
            {showReferralModal && <ReferralModal onClose={() => setShowReferralModal(false)} />}

            {/* Mobile Top Header - For better credit visibility */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#09090b]/80 backdrop-blur-xl border-b border-[#27272a]/50 z-[40] flex items-center justify-between px-4">
                <div className="scale-75 origin-left">
                    <BrandMark compact horizontal />
                </div>
                <div className="scale-90 origin-right">
                    <CreditsDisplay />
                </div>
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-[#09090b] border-r border-[#27272a] p-4 z-50">
                <div className="mb-10 px-2">
                    <button
                        onClick={() => onNavigate('upload')}
                        className="hover:opacity-90 transition-all group"
                    >
                        <BrandMark compact horizontal />
                    </button>
                </div>

                <nav className="flex-1 space-y-2 py-4">
                    {navItems.map((item) => (
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
                    <div className="py-4 border-t border-[#27272a]">
                        <CreditsDisplay />
                        <p className="text-[10px] text-[#52525b] mt-3 uppercase tracking-wider font-mono text-center opacity-60">BALANCE</p>
                    </div>
                </div>
            </div>

            {/* Mobile Bottom Bar - Optimized for app-like experience */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#09090b]/95 backdrop-blur-2xl border-t border-white/5 z-50 px-2 pb-[env(safe-area-inset-bottom)]">
                <div className="flex justify-around items-center h-16 md:h-20">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all active:scale-90 ${currentPage === item.id || (currentPage === 'editor' && item.id === 'upload') || (currentPage === 'export' && item.id === 'upload')
                                ? 'text-[#0091FF]'
                                : 'text-[#a1a1aa] active:text-white'
                                }`}
                        >
                            <div className={`relative ${currentPage === item.id || (currentPage === 'editor' && item.id === 'upload') || (currentPage === 'export' && item.id === 'upload') ? 'scale-110' : 'scale-100'} transition-all duration-300`}>
                                <item.icon className="w-5 h-5 md:w-6 md:h-6" strokeWidth={currentPage === item.id || (currentPage === 'editor' && item.id === 'upload') || (currentPage === 'export' && item.id === 'upload') ? 2.5 : 2} />
                                {(currentPage === item.id || (currentPage === 'editor' && item.id === 'upload') || (currentPage === 'export' && item.id === 'upload')) && (
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#0091FF] rounded-full shadow-[0_0_8px_#0091FF]"></div>
                                )}
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${currentPage === item.id || (currentPage === 'editor' && item.id === 'upload') || (currentPage === 'export' && item.id === 'upload') ? 'opacity-100' : 'opacity-60'}`}>{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
}
