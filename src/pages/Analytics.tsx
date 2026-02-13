import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { RefreshCw, Users, CreditCard, TrendingUp, Gift } from 'lucide-react';

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

const COLORS = ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#14B8A6'];
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
        await Promise.all([
            fetchMarketingAnalytics(),
            fetchRecentUsers(),
            fetchCreditStats(),
        ]);
        setLastUpdate(new Date());
    };

    const fetchMarketingAnalytics = async () => {
        setLoading(true);
        try {
            const { data: profiles, error } = await supabase
                .from('profiles')
                .select('marketing_source');

            if (error) throw error;

            const counts: Record<string, number> = {};
            profiles?.forEach((profile) => {
                const source = profile.marketing_source || 'Non renseigné';
                counts[source] = (counts[source] || 0) + 1;
            });

            const chartData = Object.entries(counts).map(([source, count]) => ({
                source,
                count,
            }));

            setData(chartData);
            setTotalUsers(profiles?.length || 0);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
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
            fetchCreditStats();
        } catch (error) {
            console.error('Error granting credits:', error);
            alert('❌ Erreur lors de l\'ajout des crédits');
        }
    };

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-black to-pink-900">
                <div className="text-white text-2xl">❌ Accès refusé - Admin uniquement</div>
            </div>
        );
    }

    if (loading && data.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-black to-pink-900">
                <div className="text-white text-xl">Chargement des données...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-white">🔐 Admin Dashboard</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-white/60 text-sm">
                            Mis à jour: {lastUpdate.toLocaleTimeString('fr-FR')}
                        </span>
                        <button
                            onClick={fetchAllData}
                            className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition"
                        >
                            <RefreshCw className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                        <div className="flex items-center gap-3 mb-2">
                            <Users className="w-6 h-6 text-purple-400" />
                            <h2 className="text-lg font-semibold text-white">Utilisateurs</h2>
                        </div>
                        <p className="text-4xl font-bold text-purple-400">{totalUsers}</p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                        <div className="flex items-center gap-3 mb-2">
                            <CreditCard className="w-6 h-6 text-pink-400" />
                            <h2 className="text-lg font-semibold text-white">Crédits vendus</h2>
                        </div>
                        <p className="text-4xl font-bold text-pink-400">
                            {creditStats.total_credits_purchased.toLocaleString()}
                        </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                        <div className="flex items-center gap-3 mb-2">
                            <TrendingUp className="w-6 h-6 text-green-400" />
                            <h2 className="text-lg font-semibold text-white">Revenu (test)</h2>
                        </div>
                        <p className="text-4xl font-bold text-green-400">
                            {creditStats.total_revenue_test.toFixed(2)}€
                        </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                        <div className="flex items-center gap-3 mb-2">
                            <Gift className="w-6 h-6 text-yellow-400" />
                            <h2 className="text-lg font-semibold text-white">Achat moyen</h2>
                        </div>
                        <p className="text-4xl font-bold text-yellow-400">
                            {Math.round(creditStats.average_purchase)} VP
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Marketing Sources - Pie Chart */}
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                        <h2 className="text-2xl font-semibold text-white mb-6">📈 Sources d'acquisition</h2>
                        <ResponsiveContainer width="100%" height={350}>
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ source, percent }) => `${source}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="count"
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Manual Credit Grant */}
                    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                        <h2 className="text-2xl font-semibold text-white mb-6">🎁 Ajouter des crédits manuellement</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-white mb-2 block">User ID</label>
                                <input
                                    type="text"
                                    value={manualCreditUserId}
                                    onChange={(e) => setManualCreditUserId(e.target.value)}
                                    placeholder="UUID de l'utilisateur"
                                    className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-white/40"
                                />
                            </div>
                            <div>
                                <label className="text-white mb-2 block">Montant (VP)</label>
                                <input
                                    type="number"
                                    value={manualCreditAmount}
                                    onChange={(e) => setManualCreditAmount(e.target.value)}
                                    placeholder="1000"
                                    className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-white/40"
                                />
                            </div>
                            <button
                                onClick={handleManualCreditGrant}
                                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 rounded-lg transition"
                            >
                                Ajouter les crédits
                            </button>
                        </div>
                    </div>
                </div>

                {/* Recent Users Table */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-8">
                    <h2 className="text-2xl font-semibold text-white mb-6">👥 Utilisateurs récents</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-white">
                            <thead>
                                <tr className="border-b border-white/20">
                                    <th className="text-left py-3 px-4">Email</th>
                                    <th className="text-left py-3 px-4">Nom</th>
                                    <th className="text-left py-3 px-4">Plan</th>
                                    <th className="text-left py-3 px-4">Inscrit le</th>
                                    <th className="text-left py-3 px-4">ID</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentUsers.map((user) => (
                                    <tr key={user.id} className="border-b border-white/10">
                                        <td className="py-3 px-4">{user.email}</td>
                                        <td className="py-3 px-4">{user.full_name || '-'}</td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 rounded text-xs ${user.plan === 'free' ? 'bg-gray-500' :
                                                    user.plan === 'plus' ? 'bg-blue-500' :
                                                        user.plan === 'pro' ? 'bg-purple-500' :
                                                            'bg-pink-500'
                                                }`}>
                                                {user.plan}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-sm">
                                            {new Date(user.created_at).toLocaleDateString('fr-FR')}
                                        </td>
                                        <td className="py-3 px-4 text-xs text-white/60 font-mono">
                                            {user.id.slice(0, 8)}...
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Detailed Marketing Sources Table */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                    <h2 className="text-2xl font-semibold text-white mb-6">📊 Détails par source</h2>
                    <table className="w-full text-white">
                        <thead>
                            <tr className="border-b border-white/20">
                                <th className="text-left py-3 px-4">Source</th>
                                <th className="text-right py-3 px-4">Utilisateurs</th>
                                <th className="text-right py-3 px-4">Pourcentage</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data
                                .sort((a, b) => b.count - a.count)
                                .map((item, index) => (
                                    <tr key={index} className="border-b border-white/10">
                                        <td className="py-3 px-4">{item.source}</td>
                                        <td className="text-right py-3 px-4">{item.count}</td>
                                        <td className="text-right py-3 px-4">
                                            {((item.count / totalUsers) * 100).toFixed(1)}%
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
