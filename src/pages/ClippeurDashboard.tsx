import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Trophy, Users, DollarSign, Copy, Check, Activity, TrendingUp, BarChart2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LeaderboardEntry {
    clippeur_id: string;
    full_name: string | null;
    total_earnings: number;
    sales_count: number;
    trials_count: number;
}

interface AffiliateSale {
    id: string;
    amount_total: number;
    earnings: number;
    created_at: string;
    buyer_name: string | null;
}

export default function ClippeurDashboard() {
    const { user, profile } = useAuth();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [mySales, setMySales] = useState<AffiliateSale[]>([]);
    const [myTrialsCount, setMyTrialsCount] = useState(0);
    const [myReferredCount, setMyReferredCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'leaderboard' | 'mysales'>('leaderboard');

    // Total earnings from mySales
    const myTotalEarnings = mySales.reduce((acc, sale) => acc + sale.earnings, 0);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // Leaderboard
            const { data: lbData, error: lbErr } = await supabase.rpc('get_clippeur_leaderboard');
            if (!lbErr && lbData) setLeaderboard(lbData as LeaderboardEntry[]);

            // Personal sales
            const { data: salesData, error: salesErr } = await supabase.rpc('get_my_affiliate_sales');
            if (!salesErr && salesData) {
                const newSales = salesData as AffiliateSale[];
                if (newSales.length > mySales.length && mySales.length > 0) {
                    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
                }
                setMySales(newSales);
            }

            // My trials count
            if (user) {
                const { count: trialsCount } = await supabase
                    .from('affiliate_trials')
                    .select('*', { count: 'exact', head: true })
                    .eq('clippeur_id', user.id);
                setMyTrialsCount(trialsCount ?? 0);

                // My referred users count — via RPC (bypasses RLS)
                const { data: referredData } = await supabase.rpc('get_my_referred_users_count');
                setMyReferredCount((referredData as number) ?? 0);
            }
        } catch (err) {
            console.error('Failed to load clippeur data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchDashboardData();
        }
    }, [user]);

    const handleCopyLink = () => {
        if (!profile?.referral_code) return;
        const link = `${window.location.origin}/?ref=${profile.referral_code}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatEarning = (cents: number) => {
        return (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
    };

    if (loading && leaderboard.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
                <div className="text-white text-sm font-bold tracking-widest uppercase animate-pulse">Chargement Clippeurs...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#09090b] text-neutral-200 p-4 md:p-8 pt-24 pb-32">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* ── Header ── */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                            <Activity className="w-8 h-8 text-emerald-500" /> Espace Clippeur
                        </h1>
                        <p className="text-neutral-500 font-light mt-2 uppercase text-xs tracking-widest">
                            Programme d'ambassadeurs • 30% de commission
                        </p>
                    </div>
                </div>

                {/* ── My Stats Cards ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Gains */}
                    <div className="bg-neutral-900/50 backdrop-blur-md rounded-3xl p-6 border border-white/5 shadow-xl flex flex-col justify-between">
                        <div>
                            <div className="p-2.5 bg-emerald-500/10 rounded-xl w-fit mb-3 text-emerald-400"><DollarSign className="w-5 h-5" /></div>
                            <p className="text-[10px] font-bold tracking-widest uppercase text-neutral-500 mb-1">Mes Gains</p>
                            <p className="text-3xl font-black text-white">{formatEarning(myTotalEarnings)}</p>
                        </div>
                    </div>

                    {/* Ventes payantes */}
                    <div className="bg-neutral-900/50 backdrop-blur-md rounded-3xl p-6 border border-white/5 shadow-xl flex flex-col justify-between">
                        <div>
                            <div className="p-2.5 bg-blue-500/10 rounded-xl w-fit mb-3 text-[#0091FF]"><Users className="w-5 h-5" /></div>
                            <p className="text-[10px] font-bold tracking-widest uppercase text-neutral-500 mb-1">Ventes</p>
                            <p className="text-3xl font-black text-white">{mySales.length}</p>
                        </div>
                    </div>

                    {/* Essais gratuits */}
                    <div className="bg-neutral-900/50 backdrop-blur-md rounded-3xl p-6 border border-white/5 shadow-xl flex flex-col justify-between">
                        <div>
                            <div className="p-2.5 bg-amber-500/10 rounded-xl w-fit mb-3 text-amber-400"><Activity className="w-5 h-5" /></div>
                            <p className="text-[10px] font-bold tracking-widest uppercase text-neutral-500 mb-1">Essais Gratuits</p>
                            <p className="text-3xl font-black text-white">{myTrialsCount}</p>
                            {myTrialsCount > 0 && mySales.length > 0 && (
                                <p className="text-[10px] text-emerald-400 font-bold mt-1">
                                    {Math.round((mySales.length / myTrialsCount) * 100)}% convertis
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Utilisateurs référés */}
                    <div className="bg-neutral-900/50 backdrop-blur-md rounded-3xl p-6 border border-white/5 shadow-xl flex flex-col justify-between">
                        <div>
                            <div className="p-2.5 bg-purple-500/10 rounded-xl w-fit mb-3 text-purple-400"><TrendingUp className="w-5 h-5" /></div>
                            <p className="text-[10px] font-bold tracking-widest uppercase text-neutral-500 mb-1">Utilisateurs Référés</p>
                            <p className="text-3xl font-black text-white">{myReferredCount}</p>
                            <p className="text-[10px] text-neutral-500 font-bold mt-1">inscrits via ton lien</p>
                        </div>
                    </div>
                </div>

                {/* ── Referral link card ── */}
                <div className="bg-neutral-900/50 backdrop-blur-md rounded-3xl p-6 border border-white/5 shadow-xl">
                    <p className="text-[10px] font-bold tracking-widest uppercase text-neutral-500 mb-2">Mon Lien Unique</p>
                    {profile?.referral_code ? (
                        <div className="bg-black border border-white/10 rounded-xl p-3 flex items-center justify-between mt-2">
                            <span className="text-emerald-400 font-mono text-sm truncate pr-2">
                                {window.location.origin}/?ref={profile.referral_code}
                            </span>
                            <button onClick={handleCopyLink} className={`p-2 rounded-lg transition-all shrink-0 ${copied ? 'bg-emerald-500 text-black' : 'bg-white/5 text-white hover:bg-white/10'}`}>
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                        </div>
                    ) : (
                        <p className="text-sm text-neutral-500 mt-2">Code en cours de génération...</p>
                    )}
                    <p className="text-[10px] text-neutral-500 mt-3 leading-relaxed">
                        Partage ce lien sur TikTok. Tu gagnes automatiquement 30% sur chaque achat de tes clients.
                    </p>
                </div>

                {/* ── Tabs ── */}
                <div className="flex gap-2 pb-1 border-b border-white/5">
                    <button onClick={() => setActiveTab('leaderboard')}
                        className={`flex items-center gap-2 px-5 py-3 text-sm font-bold uppercase tracking-widest transition-all ${activeTab === 'leaderboard' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-neutral-500 hover:text-white'}`}>
                        <Trophy className="w-4 h-4" /> Le Classement
                    </button>
                    <button onClick={() => setActiveTab('mysales')}
                        className={`flex items-center gap-2 px-5 py-3 text-sm font-bold uppercase tracking-widest transition-all ${activeTab === 'mysales' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-neutral-500 hover:text-white'}`}>
                        <BarChart2 className="w-4 h-4" /> Mes Ventes
                    </button>
                </div>

                {/* ── Content ── */}
                {activeTab === 'leaderboard' && (
                    <div className="bg-neutral-900/50 backdrop-blur-md rounded-3xl border border-white/5 shadow-2xl overflow-hidden animate-fade-in">
                        <div className="p-6 border-b border-white/5 flex items-center gap-3">
                            <TrendingUp className="w-5 h-5 text-amber-400" />
                            <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-300">Top Clippeurs</h2>
                        </div>
                        {leaderboard.length === 0 ? (
                            <p className="p-8 text-neutral-500 text-sm text-center">Aucun clippeur n'a encore généré de ventes. Sois le premier !</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-black/40 text-[10px] uppercase tracking-widest text-neutral-500">
                                        <tr>
                                            <th className="py-4 px-6 font-bold w-16">Rang</th>
                                            <th className="py-4 px-6 font-bold">Clippeur</th>
                                            <th className="py-4 px-6 font-bold text-center">Ventes</th>
                                            <th className="py-4 px-6 font-bold text-center">Essais</th>
                                            <th className="py-4 px-6 font-bold text-right">Gains</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {leaderboard.map((lb, index) => (
                                            <tr key={lb.clippeur_id} className={`transition-colors ${user?.id === lb.clippeur_id ? 'bg-emerald-500/5 hover:bg-emerald-500/10' : 'hover:bg-white/[0.02]'}`}>
                                                <td className="py-4 px-6">
                                                    {index === 0 ? <Trophy className="w-5 h-5 text-yellow-400" /> :
                                                        index === 1 ? <Trophy className="w-5 h-5 text-neutral-400" /> :
                                                            index === 2 ? <Trophy className="w-5 h-5 text-amber-700" /> :
                                                                <span className="text-neutral-500 font-black px-2">{index + 1}</span>}
                                                </td>
                                                <td className="py-4 px-6 font-bold text-white">
                                                    {lb.full_name || 'Anonyme'} {user?.id === lb.clippeur_id && <span className="ml-2 bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full uppercase">Moi</span>}
                                                </td>
                                                <td className="py-4 px-6 text-neutral-400 text-center font-mono">{lb.sales_count}</td>
                                                <td className="py-4 px-6 text-center">
                                                    <span className="text-amber-400 font-mono">{lb.trials_count ?? 0}</span>
                                                    <span className="text-neutral-600 text-[10px] ml-1">essais</span>
                                                </td>
                                                <td className="py-4 px-6 font-black text-emerald-400 text-right">{formatEarning(lb.total_earnings)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'mysales' && (
                    <div className="bg-neutral-900/50 backdrop-blur-md rounded-3xl border border-white/5 shadow-2xl overflow-hidden animate-fade-in">
                        <div className="p-6 border-b border-white/5 flex items-center gap-3">
                            <DollarSign className="w-5 h-5 text-emerald-500" />
                            <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-300">Détail de mes ventes</h2>
                        </div>
                        {mySales.length === 0 ? (
                            <p className="p-8 text-neutral-500 text-sm text-center">Tu n'as pas encore réalisé de ventes. Partage ton lien pour commencer !</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-black/40 text-[10px] uppercase tracking-widest text-neutral-500">
                                        <tr>
                                            <th className="py-4 px-6 font-bold">Date</th>
                                            <th className="py-4 px-6 font-bold">Client</th>
                                            <th className="py-4 px-6 font-bold text-center">Achat</th>
                                            <th className="py-4 px-6 font-bold text-right">Ma Commission (30%)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {mySales.map(sale => (
                                            <tr key={sale.id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="py-4 px-6 text-neutral-400 text-xs">
                                                    {new Date(sale.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                                <td className="py-4 px-6 font-medium text-white">
                                                    {sale.buyer_name || 'Utilisateur'}
                                                </td>
                                                <td className="py-4 px-6 text-neutral-500 text-center text-xs">
                                                    {formatEarning(sale.amount_total)}
                                                </td>
                                                <td className="py-4 px-6 font-black text-emerald-400 text-right">
                                                    + {formatEarning(sale.earnings)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
