import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { RefreshCw, Users, CreditCard, TrendingUp, Gift, Database } from 'lucide-react';

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

interface CreditStats {
    total_credits_purchased: number;
    total_revenue_test: number;
    average_purchase: number;
}

const COLORS = ['#0091FF', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6'];
const ADMIN_EMAIL = 'kali.nzeutem@gmail.com';

export default function Analytics() {
    const { user } = useAuth();
    const [data, setData] = useState<AnalyticsData[]>([]);
    const [totalUsers, setTotalUsers] = useState(0);
    const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
    const [creditStats, setCreditStats] = useState<CreditStats>({ total_credits_purchased: 0, total_revenue_test: 0, average_purchase: 0 });
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [manualCreditUserId, setManualCreditUserId] = useState('');
    const [manualCreditAmount, setManualCreditAmount] = useState('');

    const isAdmin = user?.email === ADMIN_EMAIL;

    useEffect(() => {
        if (!isAdmin) return;
        fetchAllData();

        // Auto-refresh every 30 seconds
        const interval = setInterval(() => {
            fetchAllData();
        }, 30000);

        return () => clearInterval(interval);
    }, [isAdmin]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            // Tentative d'utilisation de la nouvelle fonction RPC si elle existe (pour contourner RLS et limites)
            const { data: rpcData, error: rpcError } = await supabase.rpc('get_admin_analytics');

            if (!rpcError && rpcData) {
                // If the RPC exists and succeeds, use its accurate data
                const result = rpcData as any;
                setTotalUsers(result.total_users || 0);
                setCreditStats({
                    total_credits_purchased: result.total_credits_purchased || 0,
                    total_revenue_test: result.total_revenue || 0,
                    average_purchase: result.average_purchase || 0
                });
                setData(result.marketing_data || []);
                setRecentUsers(result.recent_users || []);
            } else {
                // Fallback to direct queries if the RPC isn't deployed yet
                await Promise.all([
                    fetchMarketingAnalytics(),
                    fetchRecentUsers(),
                    fetchCreditStats(),
                ]);
            }
        } catch (err) {
            console.error('Error fetching analytics:', err);
        } finally {
            setLoading(false);
            setLastUpdate(new Date());
        }
    };

    const fetchMarketingAnalytics = async () => {
        try {
            // Count query for total exactly
            const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

            if (count !== null) setTotalUsers(count);

            const { data: profiles, error } = await supabase
                .from('profiles')
                .select('marketing_source');

            if (error) throw error;

            const counts: Record<string, number> = {};
            profiles?.forEach((profile) => {
                const source = profile.marketing_source || 'Non renseigné';
                counts[source] = (counts[source] || 0) + 1;
            });

            const chartData = Object.entries(counts).map(([source, countText]) => ({
                source,
                count: countText,
            }));

            setData(chartData);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        }
    };

    const fetchRecentUsers = async () => {
        try {
            const { data: users, error } = await supabase
                .from('profiles')
                .select('id, email, full_name, created_at, plan')
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) throw error;
            setRecentUsers(users || []);
        } catch (error) {
            console.error('Error fetching recent users:', error);
        }
    };

    const fetchCreditStats = async () => {
        try {
            const { data: transactions, error } = await supabase
                .from('credit_transactions')
                .select('amount, type')
                .eq('type', 'purchase');

            if (error) throw error;

            const totalCredits = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;
            // Estimation: 1000 crédits = ~10€ (à ajuster selon vos prix)
            const totalRevenue = (totalCredits / 1000) * 10;
            const avgPurchase = transactions?.length ? totalCredits / transactions.length : 0;

            setCreditStats({
                total_credits_purchased: totalCredits,
                total_revenue_test: totalRevenue,
                average_purchase: avgPurchase,
            });
        } catch (error) {
            console.error('Error fetching credit stats:', error);
        }
    };

    const handleManualCreditGrant = async () => {
        if (!manualCreditUserId || !manualCreditAmount) {
            alert('Veuillez remplir tous les champs');
            return;
        }

        try {
            const { error } = await supabase.rpc('add_credits', {
                p_user_id: manualCreditUserId,
                p_amount: parseInt(manualCreditAmount),
                p_type: 'manual_admin',
                p_description: 'Crédits ajoutés manuellement par admin'
            });

            if (error) throw error;

            alert('✅ Crédits ajoutés avec succès !');
            setManualCreditUserId('');
            setManualCreditAmount('');
            fetchAllData();
        } catch (error) {
            console.error('Error granting credits:', error);
            alert('❌ Erreur lors de l\'ajout des crédits');
        }
    };

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
                <div className="text-white text-2xl font-bold uppercase tracking-widest text-red-500 flex items-center gap-3">
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
                            Vue globale de l'application
                        </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-bold tracking-widest uppercase text-neutral-500">
                        <span>
                            MAJ: {lastUpdate.toLocaleTimeString('fr-FR')}
                        </span>
                        <button
                            onClick={fetchAllData}
                            disabled={loading}
                            className="bg-white/5 hover:bg-white/10 p-3 rounded-xl transition-all border border-white/5 disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 text-white ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-neutral-900/50 backdrop-blur-md rounded-3xl p-6 border border-white/5 shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-blue-500/10 rounded-2xl">
                                <Users className="w-5 h-5 text-[#0091FF]" />
                            </div>
                            <h2 className="text-xs font-bold tracking-widest uppercase text-neutral-400">Utilisateurs</h2>
                        </div>
                        <p className="text-5xl font-black text-white">{totalUsers}</p>
                    </div>

                    <div className="bg-neutral-900/50 backdrop-blur-md rounded-3xl p-6 border border-white/5 shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-pink-500/10 rounded-2xl">
                                <CreditCard className="w-5 h-5 text-pink-500" />
                            </div>
                            <h2 className="text-xs font-bold tracking-widest uppercase text-neutral-400">Crédits vendus</h2>
                        </div>
                        <p className="text-5xl font-black text-white">
                            0
                        </p>
                    </div>

                    <div className="bg-neutral-900/50 backdrop-blur-md rounded-3xl p-6 border border-white/5 shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-yellow-500/10 rounded-2xl">
                                <Gift className="w-5 h-5 text-yellow-500" />
                            </div>
                            <h2 className="text-xs font-bold tracking-widest uppercase text-neutral-400">Achat moyen</h2>
                        </div>
                        <p className="text-5xl font-black text-white">
                            0 <span className="text-xl text-neutral-500">VP</span>
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                    {/* Marketing Sources - Pie Chart */}
                    <div className="bg-neutral-900/50 backdrop-blur-md rounded-3xl p-8 border border-white/5 shadow-2xl flex flex-col">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-300 mb-8 flex items-center gap-3">
                            <TrendingUp className="w-4 h-4 text-[#0091FF]" />
                            Sources d'acquisition
                        </h2>
                        <div className="flex-1 min-h-[300px]">
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={data}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ source, percent }) => `${source}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        stroke="rgba(0,0,0,0.5)"
                                        strokeWidth={4}
                                        dataKey="count"
                                    >
                                        {data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '16px', color: 'white' }}
                                        itemStyle={{ color: 'white', fontWeight: 'bold' }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Manual Credit Grant */}
                    <div className="bg-neutral-900/50 backdrop-blur-md rounded-3xl p-8 border border-white/5 shadow-2xl">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-300 mb-8 flex items-center gap-3">
                            <Gift className="w-4 h-4 text-purple-500" />
                            Créditer un compte
                        </h2>
                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-3 block">ID Utilisateur (UUID)</label>
                                <input
                                    type="text"
                                    value={manualCreditUserId}
                                    onChange={(e) => setManualCreditUserId(e.target.value)}
                                    placeholder="ex: 8f74g..."
                                    className="w-full bg-black border border-white/10 rounded-2xl p-4 text-white placeholder-neutral-700 outline-none focus:border-[#0091FF] focus:ring-1 focus:ring-[#0091FF] transition-all font-mono text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-3 block">Montant en crédits (VP)</label>
                                <input
                                    type="number"
                                    value={manualCreditAmount}
                                    onChange={(e) => setManualCreditAmount(e.target.value)}
                                    placeholder="1000"
                                    className="w-full bg-black border border-white/10 rounded-2xl p-4 text-white placeholder-neutral-700 outline-none focus:border-[#0091FF] focus:ring-1 focus:ring-[#0091FF] transition-all font-mono text-sm"
                                />
                            </div>
                            <button
                                onClick={handleManualCreditGrant}
                                className="w-full bg-[#0091FF] hover:bg-[#007AFF] text-white font-bold text-sm tracking-wide uppercase py-4 rounded-2xl transition-all shadow-lg shadow-[#0091FF]/20 active:scale-[0.98]"
                            >
                                Ajouter les crédits
                            </button>
                        </div>
                    </div>
                </div>

                {/* Recent Users Table */}
                <div className="bg-neutral-900/50 backdrop-blur-md rounded-3xl border border-white/5 shadow-2xl overflow-hidden mb-10">
                    <div className="p-8 border-b border-white/5 flex items-center gap-3">
                        <Users className="w-4 h-4 text-green-500" />
                        <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-300">Utilisateurs récents</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-black/40 text-[10px] uppercase tracking-widest text-neutral-500">
                                <tr>
                                    <th className="py-4 px-8 font-bold">Email</th>
                                    <th className="py-4 px-8 font-bold">Nom</th>
                                    <th className="py-4 px-8 font-bold">Plan</th>
                                    <th className="py-4 px-8 font-bold">Inscription</th>
                                    <th className="py-4 px-8 font-bold">ID</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {recentUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="py-4 px-8 text-neutral-200">{user.email}</td>
                                        <td className="py-4 px-8 text-neutral-400 font-light">{user.full_name || '-'}</td>
                                        <td className="py-4 px-8">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${user.plan === 'free' ? 'bg-neutral-800 text-neutral-400' :
                                                user.plan === 'plus' ? 'bg-blue-500/20 text-blue-400' :
                                                    user.plan === 'pro' ? 'bg-purple-500/20 text-purple-400' :
                                                        'bg-gradient-to-r from-pink-500/20 to-orange-500/20 text-pink-400'
                                                }`}>
                                                {user.plan}
                                            </span>
                                        </td>
                                        <td className="py-4 px-8 text-neutral-400 font-light text-xs">
                                            {new Date(user.created_at).toLocaleDateString('fr-FR', {
                                                day: 'numeric', month: 'short', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </td>
                                        <td className="py-4 px-8 text-neutral-600 font-mono text-[10px]">
                                            {user.id}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Detailed Marketing Sources Table */}
                <div className="bg-neutral-900/50 backdrop-blur-md rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
                    <div className="p-8 border-b border-white/5">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-300">Détails par source</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-black/40 text-[10px] uppercase tracking-widest text-neutral-500">
                                <tr>
                                    <th className="py-4 px-8 font-bold">Source</th>
                                    <th className="text-right py-4 px-8 font-bold">Utilisateurs</th>
                                    <th className="text-right py-4 px-8 font-bold">Proportion</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {[...data]
                                    .sort((a, b) => b.count - a.count)
                                    .map((item, index) => (
                                        <tr key={index} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="py-4 px-8 text-neutral-200 font-medium">{item.source}</td>
                                            <td className="text-right py-4 px-8 text-white font-mono">{item.count}</td>
                                            <td className="text-right py-4 px-8">
                                                <span className="bg-white/5 px-3 py-1 rounded-full text-xs font-mono text-neutral-400">
                                                    {totalUsers > 0 ? ((item.count / totalUsers) * 100).toFixed(1) : 0}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
