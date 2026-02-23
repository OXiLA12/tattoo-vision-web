import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { RefreshCw, Users, TrendingUp, Gift, Database, Zap, ImageIcon, Activity } from 'lucide-react';

interface AnalyticsData {
    source: string;
    count: number;
}

interface RecentUser {
    id: string;
    email: string;
    full_name: string | null;
    created_at: string;
    plan: string;
}



interface DailySignup {
    date: string;
    count: number;
}

interface DailyGeneration {
    date: string;
    realistic: number;
    tattoo: number;
}

interface RecentActivity {
    id: string;
    user_id: string;
    type: string;
    description: string;
    amount: number;
    created_at: string;
}

const COLORS = ['#0091FF', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6'];
const ADMIN_EMAIL = 'kali.nzeutem@gmail.com';

export default function Analytics() {
    const { user } = useAuth();
    const [data, setData] = useState<AnalyticsData[]>([]);
    const [totalUsers, setTotalUsers] = useState(0);
    const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
    const [dailySignups, setDailySignups] = useState<DailySignup[]>([]);
    const [dailyGenerations, setDailyGenerations] = useState<DailyGeneration[]>([]);
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [totalGenerations, setTotalGenerations] = useState({ realistic: 0, tattoo: 0 });
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [manualCreditUserId, setManualCreditUserId] = useState('');
    const [manualCreditAmount, setManualCreditAmount] = useState('');
    const [userFilter, setUserFilter] = useState<'1h' | '24h' | '7j' | '30j' | 'tout'>('24h');
    const [filteredUserCount, setFilteredUserCount] = useState(0);
    const [genFilter, setGenFilter] = useState<'1h' | '24h' | '7j' | '30j' | 'tout'>('tout');
    const [filteredGenerations, setFilteredGenerations] = useState({ realistic: 0, tattoo: 0 });

    const isAdmin = user?.email === ADMIN_EMAIL;

    useEffect(() => {
        if (!isAdmin) return;
        fetchAllData();
        const interval = setInterval(() => fetchAllData(), 30000);
        return () => clearInterval(interval);
    }, [isAdmin]);

    useEffect(() => {
        if (!isAdmin) return;
        fetchFilteredUserCount(userFilter);
    }, [userFilter, isAdmin]);

    useEffect(() => {
        if (!isAdmin) return;
        fetchFilteredGenerations(genFilter);
    }, [genFilter, isAdmin]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchMarketingAnalytics(),
                fetchRecentUsers(),
                fetchCreditStats(),
                fetchDailySignups(),
                fetchDailyGenerations(),
                fetchRecentActivity(),
                fetchFilteredUserCount(userFilter),
            ]);
        } catch (err) {
            console.error('Error fetching analytics:', err);
        } finally {
            setLoading(false);
            setLastUpdate(new Date());
        }
    };

    const fetchMarketingAnalytics = async () => {
        // RPC bypasses RLS - gets real total count
        const { data: countData } = await (supabase.rpc as any)('get_total_user_count');
        if (countData !== null) setTotalUsers(countData as number);

        // Get all profiles via RPC for marketing source breakdown
        const { data: profiles } = await (supabase.rpc as any)('get_all_profiles');
        const counts: Record<string, number> = {};
        (profiles as any[])?.forEach((p: any) => {
            const source = p.marketing_source || 'Non renseigné';
            counts[source] = (counts[source] || 0) + 1;
        });
        setData(Object.entries(counts).map(([source, count]) => ({ source, count })));
    };

    const fetchRecentUsers = async () => {
        // RPC bypasses RLS - gets all users not just the admin's own profile
        const { data: users } = await (supabase.rpc as any)('get_all_profiles');
        setRecentUsers((users as any[]) || []);
    };

    const fetchCreditStats = async () => {
        // No-op: revenue estimation removed
    };

    const fetchDailySignups = async () => {
        const { data: profiles } = await (supabase.rpc as any)('get_all_profiles');

        const buckets: Record<string, number> = {};
        for (let i = 13; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            buckets[d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })] = 0;
        }

        (profiles as any[])?.forEach((p: any) => {
            const key = new Date(p.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
            if (key in buckets) buckets[key]++;
        });

        setDailySignups(Object.entries(buckets).map(([date, count]) => ({ date, count })));
    };

    const fetchDailyGenerations = async () => {
        // RPC bypasses RLS - gets all credit_transactions
        const { data: txns } = await (supabase.rpc as any)('get_all_transactions');

        const buckets: Record<string, { realistic: number; tattoo: number }> = {};
        for (let i = 13; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            buckets[d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })] = { realistic: 0, tattoo: 0 };
        }

        let realisticTotal = 0;
        let tattooTotal = 0;
        const since = new Date();
        since.setDate(since.getDate() - 13);

        (txns as any[])?.filter((t: any) => t.type === 'usage' && new Date(t.created_at) >= since)
            .forEach((t: any) => {
                const key = new Date(t.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
                const desc = (t.description || '').toLowerCase();
                if (!(key in buckets)) return;

                if (desc.includes('realistic') || desc.includes('réaliste') || t.amount === 500) {
                    buckets[key].realistic++;
                    realisticTotal++;
                } else {
                    buckets[key].tattoo++;
                    tattooTotal++;
                }
            });

        // Also count ALL-TIME totals (not just last 14 days)
        let allRealistic = 0;
        let allTattoo = 0;
        (txns as any[])?.filter((t: any) => t.type === 'usage').forEach((t: any) => {
            const desc = (t.description || '').toLowerCase();
            if (desc.includes('realistic') || desc.includes('réaliste') || t.amount === 500) allRealistic++;
            else allTattoo++;
        });

        setDailyGenerations(Object.entries(buckets).map(([date, v]) => ({ date, ...v })));
        setTotalGenerations({ realistic: allRealistic, tattoo: allTattoo });
    };

    const fetchRecentActivity = async () => {
        const { data: txns } = await (supabase.rpc as any)('get_all_transactions');
        setRecentActivity((txns as any[])?.slice(0, 20) || []);
    };


    const fetchFilteredUserCount = async (filter: '1h' | '24h' | '7j' | '30j' | 'tout') => {
        if (filter === 'tout') {
            // already tracked in totalUsers
            setFilteredUserCount(-1); // -1 = use totalUsers
            return;
        }
        const since = new Date();
        if (filter === '1h') since.setHours(since.getHours() - 1);
        else if (filter === '24h') since.setDate(since.getDate() - 1);
        else if (filter === '7j') since.setDate(since.getDate() - 7);
        else if (filter === '30j') since.setDate(since.getDate() - 30);

        const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', since.toISOString());
        setFilteredUserCount(count ?? 0);
    };

    const fetchFilteredGenerations = async (filter: '1h' | '24h' | '7j' | '30j' | 'tout') => {
        const { data: txns } = await (supabase.rpc as any)('get_all_transactions');
        const all = (txns as any[])?.filter((t: any) => t.type === 'usage') || [];

        let filtered = all;
        if (filter !== 'tout') {
            const since = new Date();
            if (filter === '1h') since.setHours(since.getHours() - 1);
            else if (filter === '24h') since.setDate(since.getDate() - 1);
            else if (filter === '7j') since.setDate(since.getDate() - 7);
            else if (filter === '30j') since.setDate(since.getDate() - 30);
            filtered = all.filter((t: any) => new Date(t.created_at) >= since);
        }

        let realistic = 0;
        let tattoo = 0;
        filtered.forEach((t: any) => {
            const desc = (t.description || '').toLowerCase();
            if (desc.includes('realistic') || desc.includes('réaliste') || t.amount === 500) realistic++;
            else tattoo++;
        });

        setFilteredGenerations({ realistic, tattoo });
    };

    const handleManualCreditGrant = async () => {
        if (!manualCreditUserId || !manualCreditAmount) {
            alert('Veuillez remplir tous les champs');
            return;
        }
        const { error } = await (supabase.rpc as any)('add_credits', {
            p_user_id: manualCreditUserId,
            p_amount: parseInt(manualCreditAmount),
            p_type: 'bonus',
            p_description: 'Crédits ajoutés manuellement par admin'
        });
        if (error) { alert('❌ Erreur: ' + error.message); return; }
        alert('✅ Crédits ajoutés !');
        setManualCreditUserId('');
        setManualCreditAmount('');
        fetchAllData();
    };

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
                <div className="text-red-500 text-2xl font-bold uppercase tracking-widest flex items-center gap-3">
                    <Database className="w-6 h-6" /> Accès refusé
                </div>
            </div>
        );
    }

    if (loading && totalUsers === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
                <div className="text-white text-sm font-bold tracking-widest uppercase animate-pulse">Chargement...</div>
            </div>
        );
    }

    const tooltipStyle = { backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '16px', color: 'white' };

    return (
        <div className="min-h-screen bg-[#09090b] text-neutral-200 p-4 md:p-8 pt-24 pb-32">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                            <Database className="w-8 h-8 text-[#0091FF]" />
                            Dashboard Admin
                        </h1>
                        <p className="text-neutral-500 font-light mt-2 uppercase text-xs tracking-widest">
                            Vue globale · Mis à jour: {lastUpdate.toLocaleTimeString('fr-FR')}
                        </p>
                    </div>
                    <button
                        onClick={fetchAllData}
                        disabled={loading}
                        className="bg-white/5 hover:bg-white/10 p-3 rounded-xl transition-all border border-white/5 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 text-white ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* KPI Cards — 2 rows */}
                {/* Row 1: Users */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    {/* Total users */}
                    <div className="bg-neutral-900/50 backdrop-blur-md rounded-3xl p-5 border border-white/5 shadow-2xl">
                        <div className="p-2.5 bg-blue-500/10 rounded-xl w-fit mb-3"><Users className="w-5 h-5 text-[#0091FF]" /></div>
                        <p className="text-[10px] font-bold tracking-widest uppercase text-neutral-500 mb-1">Utilisateurs total</p>
                        <p className="text-3xl font-black text-white">{totalUsers}</p>
                    </div>

                    {/* Filtered new users */}
                    <div className="bg-neutral-900/50 backdrop-blur-md rounded-3xl p-5 border border-white/5 shadow-2xl">
                        <div className="p-2.5 bg-amber-500/10 rounded-xl w-fit mb-3"><Users className="w-5 h-5 text-amber-400" /></div>
                        <p className="text-[10px] font-bold tracking-widest uppercase text-neutral-500 mb-2">Nouveaux comptes</p>
                        <p className="text-3xl font-black text-white mb-3">{filteredUserCount === -1 ? totalUsers : filteredUserCount}</p>
                        <div className="flex flex-wrap gap-1">
                            {(['1h', '24h', '7j', '30j', 'tout'] as const).map((f) => (
                                <button key={f} onClick={() => setUserFilter(f)}
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${userFilter === f ? 'bg-amber-500 text-black' : 'bg-white/5 text-neutral-500 hover:bg-white/10'}`}>{f}</button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Row 2: Generations */}
                <div className="grid grid-cols-2 gap-4 mb-10">
                    {/* Filtered realistic */}
                    <div className="bg-neutral-900/50 backdrop-blur-md rounded-3xl p-5 border border-white/5 shadow-2xl">
                        <div className="p-2.5 bg-emerald-500/10 rounded-xl w-fit mb-3"><Zap className="w-5 h-5 text-emerald-400" /></div>
                        <p className="text-[10px] font-bold tracking-widest uppercase text-neutral-500 mb-2">Rendus réalistes</p>
                        <p className="text-3xl font-black text-white mb-3">{filteredGenerations.realistic}</p>
                        <div className="flex flex-wrap gap-1">
                            {(['1h', '24h', '7j', '30j', 'tout'] as const).map((f) => (
                                <button key={f} onClick={() => setGenFilter(f)}
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${genFilter === f ? 'bg-emerald-500 text-black' : 'bg-white/5 text-neutral-500 hover:bg-white/10'}`}>{f}</button>
                            ))}
                        </div>
                    </div>

                    {/* Filtered tattoo */}
                    <div className="bg-neutral-900/50 backdrop-blur-md rounded-3xl p-5 border border-white/5 shadow-2xl">
                        <div className="p-2.5 bg-purple-500/10 rounded-xl w-fit mb-3"><ImageIcon className="w-5 h-5 text-purple-400" /></div>
                        <p className="text-[10px] font-bold tracking-widest uppercase text-neutral-500 mb-2">Tatouages IA</p>
                        <p className="text-3xl font-black text-white mb-3">{filteredGenerations.tattoo}</p>
                        <div className="flex flex-wrap gap-1">
                            {(['1h', '24h', '7j', '30j', 'tout'] as const).map((f) => (
                                <button key={f} onClick={() => setGenFilter(f)}
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${genFilter === f ? 'bg-purple-500 text-white' : 'bg-white/5 text-neutral-500 hover:bg-white/10'}`}>{f}</button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">

                    {/* Daily Signups */}
                    <div className="bg-neutral-900/50 backdrop-blur-md rounded-3xl p-8 border border-white/5 shadow-2xl">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-300 mb-6 flex items-center gap-3">
                            <Users className="w-4 h-4 text-[#0091FF]" /> Nouveaux comptes (14j)
                        </h2>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={dailySignups} barSize={16}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} />
                                <YAxis tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                <Bar dataKey="count" name="Inscriptions" fill="#0091FF" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Daily Generations */}
                    <div className="bg-neutral-900/50 backdrop-blur-md rounded-3xl p-8 border border-white/5 shadow-2xl">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-300 mb-6 flex items-center gap-3">
                            <Zap className="w-4 h-4 text-emerald-400" /> Générations (14j)
                        </h2>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={dailyGenerations} barSize={10}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} />
                                <YAxis tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                <Bar dataKey="realistic" name="Rendu réaliste" fill="#10B981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="tattoo" name="Tatouage IA" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                        <div className="flex gap-4 mt-3">
                            <span className="flex items-center gap-1.5 text-[10px] text-neutral-400"><span className="w-2 h-2 rounded-sm bg-emerald-500 inline-block" />Rendu réaliste</span>
                            <span className="flex items-center gap-1.5 text-[10px] text-neutral-400"><span className="w-2 h-2 rounded-sm bg-purple-500 inline-block" />Tatouage IA</span>
                        </div>
                    </div>
                </div>

                {/* Recent Activity + Pie */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">

                    {/* Recent Activity Feed */}
                    <div className="bg-neutral-900/50 backdrop-blur-md rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-white/5 flex items-center gap-3">
                            <Activity className="w-4 h-4 text-amber-400" />
                            <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-300">Activité en temps réel</h2>
                        </div>
                        <div className="divide-y divide-white/5 max-h-[360px] overflow-y-auto">
                            {recentActivity.length === 0 ? (
                                <p className="p-6 text-neutral-600 text-xs text-center">Aucune activité</p>
                            ) : recentActivity.map((a) => {
                                const isUsage = a.type === 'usage';
                                const isPurchase = a.type === 'purchase';
                                const isBonus = a.type === 'bonus';
                                return (
                                    <div key={a.id} className="flex items-center gap-4 px-6 py-3 hover:bg-white/[0.02] transition-colors">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${isUsage ? 'bg-purple-500/20 text-purple-400' : isPurchase ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                            {isUsage ? '⚡' : isPurchase ? '💳' : '🎁'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-neutral-300 truncate">{a.description || a.type}</p>
                                            <p className="text-[10px] text-neutral-600 font-mono truncate">{a.user_id.slice(0, 8)}...</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className={`text-xs font-bold ${isUsage ? 'text-red-400' : 'text-emerald-400'}`}>
                                                {isUsage ? '-' : '+'}{Math.abs(a.amount)} VP
                                            </p>
                                            <p className="text-[10px] text-neutral-600">
                                                {new Date(a.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Marketing Sources Pie */}
                    <div className="bg-neutral-900/50 backdrop-blur-md rounded-3xl p-8 border border-white/5 shadow-2xl">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-300 mb-6 flex items-center gap-3">
                            <TrendingUp className="w-4 h-4 text-[#0091FF]" /> Sources d'acquisition
                        </h2>
                        <ResponsiveContainer width="100%" height={270}>
                            <PieChart>
                                <Pie data={data} cx="50%" cy="50%" labelLine={false}
                                    outerRadius={100} fill="#8884d8" stroke="rgba(0,0,0,0.5)" strokeWidth={4} dataKey="count"
                                    label={({ source, percent }: any) => `${source}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                                >
                                    {data.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: 'white', fontWeight: 'bold' }} />
                                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Users Table */}
                <div className="bg-neutral-900/50 backdrop-blur-md rounded-3xl border border-white/5 shadow-2xl overflow-hidden mb-10">
                    <div className="p-6 border-b border-white/5 flex items-center gap-3">
                        <Users className="w-4 h-4 text-green-500" />
                        <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-300">Nouveaux utilisateurs</h2>
                        <span className="ml-auto bg-white/5 text-neutral-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">{totalUsers} total</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-black/40 text-[10px] uppercase tracking-widest text-neutral-500">
                                <tr>
                                    <th className="py-4 px-6 font-bold">Email</th>
                                    <th className="py-4 px-6 font-bold">Nom</th>
                                    <th className="py-4 px-6 font-bold">Plan</th>
                                    <th className="py-4 px-6 font-bold">Inscription</th>
                                    <th className="py-4 px-6 font-bold">ID (copier)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {recentUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="py-3 px-6 text-neutral-200">{u.email}</td>
                                        <td className="py-3 px-6 text-neutral-400">{u.full_name || '—'}</td>
                                        <td className="py-3 px-6">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${u.plan === 'free' ? 'bg-neutral-800 text-neutral-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                {u.plan}
                                            </span>
                                        </td>
                                        <td className="py-3 px-6 text-neutral-400 text-xs">
                                            {new Date(u.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="py-3 px-6">
                                            <button
                                                onClick={() => { navigator.clipboard.writeText(u.id); setManualCreditUserId(u.id); }}
                                                className="text-neutral-600 hover:text-[#0091FF] font-mono text-[10px] transition-colors"
                                                title="Cliquer pour copier et remplir le champ crédits"
                                            >
                                                {u.id.slice(0, 12)}...
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Manual Credit Grant */}
                <div className="bg-neutral-900/50 backdrop-blur-md rounded-3xl p-8 border border-white/5 shadow-2xl max-w-md">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-300 mb-6 flex items-center gap-3">
                        <Gift className="w-4 h-4 text-purple-500" /> Créditer un compte
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2 block">ID Utilisateur <span className="text-neutral-700">(cliquer sur l'ID dans le tableau pour remplir auto)</span></label>
                            <input
                                type="text"
                                value={manualCreditUserId}
                                onChange={(e) => setManualCreditUserId(e.target.value)}
                                placeholder="UUID..."
                                className="w-full bg-black border border-white/10 rounded-2xl p-4 text-white placeholder-neutral-700 outline-none focus:border-[#0091FF] transition-all font-mono text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2 block">Montant (VP)</label>
                            <input
                                type="number"
                                value={manualCreditAmount}
                                onChange={(e) => setManualCreditAmount(e.target.value)}
                                placeholder="500"
                                className="w-full bg-black border border-white/10 rounded-2xl p-4 text-white placeholder-neutral-700 outline-none focus:border-[#0091FF] transition-all font-mono text-sm"
                            />
                        </div>
                        <button
                            onClick={handleManualCreditGrant}
                            className="w-full bg-[#0091FF] hover:bg-[#007AFF] text-white font-bold text-sm tracking-wide uppercase py-4 rounded-2xl transition-all shadow-lg shadow-[#0091FF]/20"
                        >
                            Ajouter les crédits
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
