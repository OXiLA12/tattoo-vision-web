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
                    {/* Referral Button - Temporarily Removed
                    <button
                        onClick={() => setShowReferralModal(true)}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20 hover:bg-[#10b981]/20 transition-all font-medium text-sm group"
                    >
                        <Gift className="w-5 h-5" />
                        <span>Get free Vision Points</span>
                    </button>
                    */}

                    <div className="py-4 border-t border-[#27272a]">
                        <CreditsDisplay />
                        <p className="text-[10px] text-[#52525b] mt-3 uppercase tracking-wider font-mono text-center opacity-60">BALANCE</p>
                    </div>
                </div>
            </div>

            {/* Mobile Bottom Bar - Optimized for app-like experience */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#09090b]/95 backdrop-blur-xl border-t border-[#27272a]/50 z-50 px-2 pb-[env(safe-area-inset-bottom)]">
                <div className="flex justify-around items-center h-20">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={`flex flex-col items-center justify-center flex-1 h-full gap-1.5 transition-all active:scale-95 ${currentPage === item.id || (currentPage === 'editor' && item.id === 'upload') || (currentPage === 'export' && item.id === 'upload')
                                ? 'text-[#00D4FF]'
                                : 'text-[#71717a] active:text-[#a1a1aa]'
                                }`}
                        >
                            <div className={`relative ${currentPage === item.id || (currentPage === 'editor' && item.id === 'upload') || (currentPage === 'export' && item.id === 'upload') ? 'scale-110' : ''} transition-transform`}>
                                <item.icon className="w-6 h-6" strokeWidth={currentPage === item.id || (currentPage === 'editor' && item.id === 'upload') || (currentPage === 'export' && item.id === 'upload') ? 2.5 : 2} />
                                {(currentPage === item.id || (currentPage === 'editor' && item.id === 'upload') || (currentPage === 'export' && item.id === 'upload')) && (
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#00D4FF] rounded-full"></div>
                                )}
                            </div>
                            <span className={`text-[11px] font-medium ${currentPage === item.id || (currentPage === 'editor' && item.id === 'upload') || (currentPage === 'export' && item.id === 'upload') ? 'font-semibold' : ''}`}>{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
}
