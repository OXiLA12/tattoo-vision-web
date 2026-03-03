import { Home, Grid, User, Sparkles, Zap } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import BrandMark from './BrandMark';

interface NavigationProps {
    currentPage: string;
    onNavigate: (page: any) => void;
}

function ProBadge({ credits }: { credits: number }) {
    return (
        <div className="flex items-center gap-1.5 select-none" title="Crédits disponibles">
            <Zap className="w-3 h-3 text-[#0091FF]" />
            <span className="text-xs font-black text-white tracking-tight">
                {credits.toLocaleString()}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#0091FF]">crédits</span>
        </div>
    );
}

export default function Navigation({ currentPage, onNavigate }: NavigationProps) {
    const { t } = useLanguage();
    const { isEntitled, credits } = useAuth();

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
            {/* Mobile Top Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-24 bg-[#09090b]/90 backdrop-blur-2xl border-b border-white/5 z-[100] flex items-end justify-between px-6 pb-4 pt-[max(env(safe-area-inset-top),20px)]">
                <div className="flex-1 flex items-center gap-2 h-full pt-4">
                    <BrandMark compact horizontal />
                    {isEntitled && <ProBadge credits={credits} />}
                </div>
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-64 bg-[#09090b] border-r border-[#27272a] p-4 z-50">
                <div className="mb-10 px-2 flex items-center gap-2">
                    <button onClick={() => onNavigate('upload')} className="hover:opacity-90 transition-all group">
                        <BrandMark compact horizontal />
                    </button>
                    {isEntitled && <ProBadge credits={credits} />}
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
                                {/* Blue dot on Profile icon for Pro users */}
                                {item.id === 'profile' && isEntitled && (
                                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#0091FF] border border-[#09090b] shadow-[0_0_6px_#0091FF]" />
                                )}
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive(item.id) ? 'opacity-100' : 'opacity-60'}`}>
                                {item.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
}
