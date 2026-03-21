import { useState } from 'react';
import { Home, Grid, User, Sparkles, Zap, Plus, LayoutDashboard } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import BrandMark from './BrandMark';
import CreditPackModal from './CreditPackModal';

const ADMIN_EMAIL = 'kali.nzeutem@gmail.com';

interface NavigationProps {
    currentPage: string;
    onNavigate: (page: any) => void;
}

function CreditsBadge({ credits, onClick }: { credits: number; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="group relative flex items-center gap-1.5 select-none cursor-pointer
                       px-2.5 py-1.5 rounded-xl
                       bg-[#0091FF]/10 border border-[#0091FF]/20
                       hover:bg-[#0091FF]/20 hover:border-[#0091FF]/50
                       hover:shadow-[0_0_16px_rgba(0,145,255,0.3)]
                       active:scale-95
                       transition-all duration-200"
            {...({title: t("nav_credits_tooltip")} as any)}
        >
            {/* Glow pulse on hover */}
            <div className="absolute inset-0 rounded-xl bg-[#0091FF]/0 group-hover:bg-[#0091FF]/10 transition-all duration-300 blur-sm" />

            <Zap
                className="w-3 h-3 text-[#0091FF] relative z-10
                           group-hover:scale-125 group-hover:drop-shadow-[0_0_6px_rgba(0,145,255,0.9)]
                           transition-all duration-200"
                fill="currentColor"
            />
            <span className="text-xs font-black text-white tracking-tight relative z-10 tabular-nums">
                {credits.toLocaleString()}
            </span>
            <Plus
                className="w-2.5 h-2.5 text-[#0091FF]/70 group-hover:text-[#0091FF] group-hover:rotate-90
                           transition-all duration-200 relative z-10"
            />
        </button>
    );
}

export default function Navigation({ currentPage, onNavigate }: NavigationProps) {
    const { t } = useLanguage();
    const { isEntitled, credits, user } = useAuth();
    const isAdmin = user?.email === ADMIN_EMAIL;
    const [showCreditModal, setShowCreditModal] = useState(false);

    const navItems = [
        { id: 'upload', icon: Home, label: t('nav_home') },
        { id: 'library', icon: Grid, label: t('nav_library') },
        { id: 'extract', icon: Sparkles, label: t('nav_extract') },
        { id: 'profile', icon: User, label: t('nav_profile') },
    ];

    const isActive = (id: string) =>
        currentPage === id ||
        (currentPage === 'editor' && id === 'upload') ||
        (currentPage === 'export' && id === 'upload');

    return (
        <>
            {/* Credit Pack Modal */}
            {showCreditModal && <CreditPackModal onClose={() => setShowCreditModal(false)} />}

            {/* Mobile Top Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-24 bg-[#09090b]/90 backdrop-blur-2xl border-b border-white/5 z-[100] flex items-end justify-between px-6 pb-4 pt-[max(env(safe-area-inset-top),20px)]">
                <div className="flex-1 flex items-center gap-2 h-full pt-4">
                    <BrandMark compact horizontal />
                    {isEntitled && <CreditsBadge credits={credits} onClick={() => setShowCreditModal(true)} />}
                </div>
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-[#09090b] border-r border-[#27272a] p-4 z-50">
                <div className="mb-10 px-2 flex items-center gap-2">
                    <button onClick={() => onNavigate('upload')} className="hover:opacity-90 transition-all group">
                        <BrandMark compact horizontal />
                    </button>
                    {isEntitled && <CreditsBadge credits={credits} onClick={() => setShowCreditModal(true)} />}
                </div>

                <nav className="flex-1 space-y-2 py-4">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive(item.id)
                                ? 'bg-[#0091FF]/10 text-[#0091FF]'
                                : 'text-[#a1a1aa] hover:bg-[#18181b] hover:text-white'
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            <span>{item.label}</span>
                        </button>
                    ))}
                    {isAdmin && (
                        <button
                            onClick={() => onNavigate('analytics')}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${currentPage === 'analytics'
                                ? 'bg-[#0091FF]/10 text-[#0091FF]'
                                : 'text-[#a1a1aa] hover:bg-[#18181b] hover:text-white'
                                }`}
                        >
                            <LayoutDashboard className="w-5 h-5" />
                            <span>Admin</span>
                        </button>
                    )}
                </nav>
            </div>

            {/* Mobile Bottom Bar */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#09090b]/95 backdrop-blur-2xl border-t border-white/5 z-50 px-2 pb-[env(safe-area-inset-bottom)]">
                <div className="flex justify-around items-center h-16">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all active:scale-90 ${isActive(item.id) ? 'text-[#0091FF]' : 'text-[#a1a1aa] active:text-white'}`}
                        >
                            <div className={`relative ${isActive(item.id) ? 'scale-110' : 'scale-100'} transition-all duration-300`}>
                                <item.icon className="w-5 h-5" strokeWidth={isActive(item.id) ? 2.5 : 2} />
                                {isActive(item.id) && (
                                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#0091FF] rounded-full shadow-[0_0_8px_#0091FF]" />
                                )}
                                {item.id === 'profile' && isEntitled && (
                                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#0091FF] border border-[#09090b] shadow-[0_0_6px_#0091FF]" />
                                )}
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive(item.id) ? 'opacity-100' : 'opacity-60'}`}>
                                {item.label}
                            </span>
                        </button>
                    ))}
                    {isAdmin && (
                        <button
                            onClick={() => onNavigate('analytics')}
                            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all active:scale-90 ${currentPage === 'analytics' ? 'text-[#0091FF]' : 'text-[#a1a1aa] active:text-white'}`}
                        >
                            <div className={`relative ${currentPage === 'analytics' ? 'scale-110' : 'scale-100'} transition-all duration-300`}>
                                <LayoutDashboard className="w-5 h-5" strokeWidth={currentPage === 'analytics' ? 2.5 : 2} />
                                {currentPage === 'analytics' && <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#0091FF] rounded-full shadow-[0_0_8px_#0091FF]" />}
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${currentPage === 'analytics' ? 'opacity-100' : 'opacity-60'}`}>Admin</span>
                        </button>
                    )}
                </div>
            </div>
        </>
    );
}
