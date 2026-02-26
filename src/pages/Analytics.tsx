import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { invokeWithAuth } from '../lib/invokeWithAuth';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
    RefreshCw, Users, TrendingUp, Gift, Database, Zap, ImageIcon, Activity,
    CreditCard, Target, Clock, BarChart2, ArrowDownRight, CheckCircle2, XCircle,
    Wallet, AlertTriangle, BadgeCheck, Ban, Trophy,
} from 'lucide-react';
import confetti from 'canvas-confetti';

// ─── Types ────────────────────────────────────────────────────────────────────
interface FunnelStep { step: string; step_order: number; user_count: number; conversion_pct: number; }
interface Overview {
    total_users: number; paying_users: number; total_revenue_cents: number;
    avg_credits_at_churn: number; avg_renders_before_buy: number; avg_hours_to_purchase: number;
    users_burned_all_credits: number; sessions_today: number; events_today: number;
    paywall_to_purchase_rate: number;
}
interface AnalyticsUser {
    user_id: string; email: string; full_name: string | null; referred_by: string | null; referred_by_name: string | null;
    registered_at: string; last_seen_at: string; first_purchase_at: string | null;
    marketing_source: string | null; utm_source: string | null; device: string | null;
    session_count: number; total_realistic_renders: number; total_paywall_views: number;
    total_purchases: number; credits_remaining_at_churn: number | null; purchase_revenue_cents: number;
}
interface SourceBreakdown { source: string; device: string; count: number; }
interface DailyEvent { day: string; event_name: string; count: number; }
interface RecentActivity {
    id: string; user_id: string; type: string; description: string; amount: number; created_at: string;
}
interface StripeSub {
    id: string; status: string; customer_email: string | null; customer_name: string | null;
    plan_name: string; amount_cents: number; currency: string; interval: string;
    trial_start: string | null; trial_end: string | null; current_period_end: string;
    cancel_at_period_end: boolean; created: string; metadata: Record<string, string>;
    last_invoice_status: string | null; last_invoice_amount: number;
}
interface StripePayment {
    id: string; amount_cents: number; currency: string; status: string;
    created: string; description: string | null; metadata: Record<string, string>;
}
interface StripeData {
    subscriptions: StripeSub[];
    subscription_summary: { trialing: number; active: number; canceled: number; past_due: number; incomplete: number; };
    recent_payments: StripePayment[];
    session_stats: { total: number; completed: number; expired: number; open: number; };
    balance: { available_cents: number; pending_cents: number; currency: string; };
}

const COLORS = ['#0091FF', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6', '#F97316'];
const ADMIN_EMAIL = 'kali.nzeutem@gmail.com';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtRevenue = (cents: number) => `${(cents / 100).toFixed(0)}€`;
const fmtHours = (h: number) => h < 24 ? `${h}h` : `${(h / 24).toFixed(1)}j`;
const tooltipStyle = { backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '16px', color: 'white', fontSize: 12 };

function KPICard({ icon, label, value, sub, color = 'text-[#0091FF]', bg = 'bg-blue-500/10' }:
    { icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: string; bg?: string }) {
    return (
        <div className="bg-neutral-900/50 backdrop-blur-md rounded-3xl p-5 border border-white/5 shadow-2xl">
            <div className={`p-2.5 ${bg} rounded-xl w-fit mb-3`}><div className={color}>{icon}</div></div>
            <p className="text-[10px] font-bold tracking-widest uppercase text-neutral-500 mb-1">{label}</p>
            <p className="text-3xl font-black text-white">{value}</p>
            {sub && <p className="text-[10px] text-neutral-600 mt-1">{sub}</p>}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Analytics() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const prevRevenueRef = React.useRef<number | null>(null);

    // Data states
    const [overview, setOverview] = useState<Overview | null>(null);
    const [funnel, setFunnel] = useState<FunnelStep[]>([]);
    const [users, setUsers] = useState<AnalyticsUser[]>([]);
    const [sources, setSources] = useState<SourceBreakdown[]>([]);
    const [dailyEvents, setDailyEvents] = useState<DailyEvent[]>([]);
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [stripeData, setStripeData] = useState<StripeData | null>(null);
    const [stripeLoading, setStripeLoading] = useState(false);
    const [stripeError, setStripeError] = useState<string | null>(null);
    const [clippeurLeaderboard, setClippeurLeaderboard] = useState<any[]>([]);
    const [totalGenerations, setTotalGenerations] = useState<number>(0);

    // UI states
    const [manualCreditUserId, setManualCreditUserId] = useState('');
    const [manualCreditAmount, setManualCreditAmount] = useState('');
    const [manualClippeurId, setManualClippeurId] = useState('');
    const [userSearch, setUserSearch] = useState('');
    const [activeTab, setActiveTab] = useState<'overview' | 'funnel' | 'users' | 'attribution' | 'stripe' | 'clippeurs'>('overview');

    const isAdmin = user?.email === ADMIN_EMAIL;

    useEffect(() => {
        if (!isAdmin) return;
        fetchAll();
        const interval = setInterval(fetchAll, 30000);
        return () => clearInterval(interval);
    }, [isAdmin]);

    const fetchAll = async () => {
        setLoading(true);
        try {
            // Run all fetches independently — one failure won't break the others
            await Promise.allSettled([
                fetchOverview(),
                fetchFunnel(),
                fetchUsers(),
                fetchSources(),
                fetchDailyEvents(),
                fetchRecentActivity(),
                fetchClippeurs(),
                fetchTotalGenerations(),
            ]);
        } finally {
            setLoading(false);
            setLastUpdate(new Date());
        }
    };

    const fetchStripeData = async () => {
        setStripeLoading(true);
        setStripeError(null);
        try {
            const { data, error } = await invokeWithAuth('get-stripe-data', { method: 'POST', body: {} });
            if (error) throw new Error(error.message);
            setStripeData(data as StripeData);
        } catch (err: any) {
            setStripeError(err.message || 'Erreur Stripe');
        } finally {
            setStripeLoading(false);
        }
    };

    const fetchTotalGenerations = async () => {
        const { count, error } = await supabase
            .from('user_history')
            .select('*', { count: 'exact', head: true });
        if (!error && count !== null) {
            setTotalGenerations(count);
        }
    };

    const fetchOverview = async () => {
        const { data } = await (supabase.rpc as any)('get_analytics_overview');
        if (data) {
            const currentRevenue = (data as Overview).total_revenue_cents;

            // Trigger confetti if revenue increased
            if (prevRevenueRef.current !== null && currentRevenue > prevRevenueRef.current) {
                // Fire massive confetti from both edges
                const duration = 5000;
                const animationEnd = Date.now() + duration;
                const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

                const interval: any = setInterval(function () {
                    const timeLeft = animationEnd - Date.now();
                    if (timeLeft <= 0) {
                        return clearInterval(interval);
                    }
                    const particleCount = 50 * (timeLeft / duration);
                    // Left edge
                    confetti(Object.assign({}, defaults, { particleCount, origin: { x: 0, y: Math.random() - 0.2 } }));
                    // Right edge
                    confetti(Object.assign({}, defaults, { particleCount, origin: { x: 1, y: Math.random() - 0.2 } }));
                }, 250);
            }

            prevRevenueRef.current = currentRevenue;
            setOverview(data as Overview);
        }
    };

    const fetchFunnel = async () => {
        const { data } = await (supabase.rpc as any)('get_analytics_funnel');
        if (data) setFunnel(data as FunnelStep[]);
    };

    const fetchUsers = async () => {
        const { data } = await (supabase.rpc as any)('get_all_analytics_users');
        setUsers((data as AnalyticsUser[]) || []);
    };

    const fetchSources = async () => {
        const { data } = await (supabase.rpc as any)('get_source_breakdown');
        setSources((data as SourceBreakdown[]) || []);
    };

    const fetchDailyEvents = async () => {
        const { data } = await (supabase.rpc as any)('get_daily_events', { p_days: 14 });
        setDailyEvents((data as DailyEvent[]) || []);
    };

    const fetchRecentActivity = async () => {
        const { data } = await (supabase.rpc as any)('get_all_transactions');
        setRecentActivity(((data as any[]) || []).slice(0, 20));
    };

    const fetchClippeurs = async () => {
        const { data } = await supabase.rpc('get_clippeur_leaderboard');
        if (data) setClippeurLeaderboard(data as any[]);
    };

    const handleManualCreditGrant = async () => {
        if (!manualCreditUserId || !manualCreditAmount) { alert('Remplir tous les champs'); return; }
        const { error } = await (supabase.rpc as any)('add_credits', {
            p_user_id: manualCreditUserId,
            p_amount: parseInt(manualCreditAmount),
            p_type: 'bonus',
            p_description: 'Crédits ajoutés manuellement par admin'
        });
        if (error) { alert('❌ ' + error.message); return; }
        alert('✅ Crédits ajoutés !');
        setManualCreditUserId(''); setManualCreditAmount('');
        fetchAll();
    };

    const handleToggleClippeur = async (status: boolean) => {
        if (!manualClippeurId) { alert('UUID manquant'); return; }
        const { error } = await supabase.rpc('toggle_clippeur', { p_user_id: manualClippeurId, p_status: status });
        if (error) { alert('❌ ' + error.message); return; }
        alert(status ? '✅ Rôle Clippeur ajouté !' : '✅ Rôle Clippeur retiré !');
        setManualClippeurId('');
    };

    // ── Guards ──────────────────────────────────────────────────────────────────
    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
                <div className="text-red-500 text-2xl font-bold uppercase tracking-widest flex items-center gap-3">
                    <Database className="w-6 h-6" /> Accès refusé
                </div>
            </div>
        );
    }

    if (loading && !overview) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
                <div className="text-white text-sm font-bold tracking-widest uppercase animate-pulse">Chargement analytics...</div>
            </div>
        );
    }

    // ── Derived data ────────────────────────────────────────────────────────────
    const conversionRate = overview ? ((overview.paying_users / Math.max(overview.total_users, 1)) * 100).toFixed(1) : '0';

    // Build daily chart: pivot by event_name
    const dailyDays = [...new Set(dailyEvents.map(e => e.day))];
    const dailyChartData = dailyDays.map(day => {
        const row: any = { day };
        dailyEvents.filter(e => e.day === day).forEach(e => { row[e.event_name] = e.count; });
        return row;
    });

    // Pie: sources merged by source name
    const sourcePie = sources.reduce((acc: any[], s) => {
        const existing = acc.find(a => a.source === s.source);
        if (existing) existing.count += s.count;
        else acc.push({ source: s.source, count: s.count });
        return acc;
    }, []);

    // Device breakdown
    const deviceData = sources.reduce((acc: any[], s) => {
        const existing = acc.find(a => a.device === s.device);
        if (existing) existing.count += s.count;
        else acc.push({ device: s.device || 'unknown', count: s.count });
        return acc;
    }, []);

    const filteredUsers = users.filter(u =>
        !userSearch || u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.full_name?.toLowerCase().includes(userSearch.toLowerCase())
    );

    const tabs = [
        { id: 'overview', label: 'Vue d\'ensemble', icon: <BarChart2 className="w-4 h-4" /> },
        { id: 'funnel', label: 'Funnel', icon: <TrendingUp className="w-4 h-4" /> },
        { id: 'users', label: 'Utilisateurs', icon: <Users className="w-4 h-4" /> },
        { id: 'clippeurs', label: 'Clippeurs', icon: <Trophy className="w-4 h-4" /> },
        { id: 'attribution', label: 'Attribution', icon: <Target className="w-4 h-4" /> },
        { id: 'stripe', label: '💳 Stripe Live', icon: <Wallet className="w-4 h-4" /> },
    ] as const;

    return (
        <div className="min-h-screen bg-[#09090b] text-neutral-200 p-4 md:p-8 pt-24 pb-32">
            <div className="max-w-7xl mx-auto">

                {/* ── Header ── */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-3">
                            <Database className="w-8 h-8 text-[#0091FF]" /> Analytics Dashboard
                        </h1>
                        <p className="text-neutral-500 font-light mt-2 uppercase text-xs tracking-widest">
                            Tattoo Vision · {lastUpdate.toLocaleTimeString('fr-FR')}
                        </p>
                    </div>
                    <button onClick={fetchAll} disabled={loading}
                        className="bg-white/5 hover:bg-white/10 p-3 rounded-xl transition-all border border-white/5 disabled:opacity-50">
                        <RefreshCw className={`w-4 h-4 text-white ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* ── Tab navigation ── */}
                <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === tab.id
                                ? 'bg-[#0091FF] text-white shadow-lg shadow-[#0091FF]/30'
                                : 'bg-white/5 text-neutral-500 hover:bg-white/10 hover:text-white'}`}>
                            {tab.icon}{tab.label}
                        </button>
                    ))}
                </div>

                {/* ════════════════════════════════════════════
            TAB 1: OVERVIEW
        ════════════════════════════════════════════ */}
                {activeTab === 'overview' && (
                    <div className="space-y-8">

                        {/* KPI Row 1: Core metrics */}
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                            <KPICard icon={<Users className="w-5 h-5" />} label="Utilisateurs total"
                                value={overview?.total_users ?? 0} bg="bg-blue-500/10" color="text-[#0091FF]" />
                            <KPICard icon={<CreditCard className="w-5 h-5" />} label="Utilisateurs payants"
                                value={overview?.paying_users ?? 0}
                                sub={`${conversionRate}% conversion`} bg="bg-emerald-500/10" color="text-emerald-400" />
                            <KPICard icon={<TrendingUp className="w-5 h-5" />} label="Revenus total"
                                value={fmtRevenue(overview?.total_revenue_cents ?? 0)}
                                sub={`ARPU: ${fmtRevenue(Math.round((overview?.total_revenue_cents ?? 0) / Math.max(overview?.total_users ?? 1, 1)))}`}
                                bg="bg-amber-500/10" color="text-amber-400" />
                            <KPICard icon={<Zap className="w-5 h-5" />} label="Sessions aujourd'hui"
                                value={overview?.sessions_today ?? 0}
                                sub={`${overview?.events_today ?? 0} events`} bg="bg-purple-500/10" color="text-purple-400" />
                            <KPICard icon={<ImageIcon className="w-5 h-5" />} label="Tattoos Placés"
                                value={totalGenerations}
                                sub="Depuis le début" bg="bg-pink-500/10" color="text-pink-400" />
                        </div>

                        {/* KPI Row 2: Behavioral insights */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <KPICard icon={<Target className="w-5 h-5" />} label="Paywall → Achat"
                                value={`${overview?.paywall_to_purchase_rate ?? 0}%`}
                                sub="Taux de conversion paywall" bg="bg-rose-500/10" color="text-rose-400" />
                            <KPICard icon={<Clock className="w-5 h-5" />} label="Délai moyen achat"
                                value={overview?.avg_hours_to_purchase ? fmtHours(overview.avg_hours_to_purchase) : '—'}
                                sub="Depuis inscription" bg="bg-cyan-500/10" color="text-cyan-400" />
                            <KPICard icon={<ImageIcon className="w-5 h-5" />} label="Rendus avant achat"
                                value={overview?.avg_renders_before_buy ?? '—'}
                                sub="Moy. rendus avant 1er paiement" bg="bg-indigo-500/10" color="text-indigo-400" />
                            <KPICard icon={<ArrowDownRight className="w-5 h-5" />} label="Crédits à 0 au churn"
                                value={overview?.users_burned_all_credits ?? 0}
                                sub={`Moy. restant: ${overview?.avg_credits_at_churn ?? '?'} VP`} bg="bg-orange-500/10" color="text-orange-400" />
                        </div>

                        {/* Charts Row: Daily events + Activity */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                            {/* Daily renders + signups */}
                            <div className="bg-neutral-900/50 backdrop-blur-md rounded-3xl p-8 border border-white/5 shadow-2xl">
                                <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-300 mb-6 flex items-center gap-3">
                                    <Activity className="w-4 h-4 text-[#0091FF]" /> Activité (14 jours)
                                </h2>
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={dailyChartData} barSize={10}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                        <XAxis dataKey="day" tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} />
                                        <YAxis tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                                        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                                        <Bar dataKey="first_realistic_render_completed" name="Rendus réalistes" fill="#10B981" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="first_ai_generation_completed" name="Générés IA" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="paywall_viewed" name="Paywall vus" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="purchase_completed" name="Achats" fill="#0091FF" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                                <div className="flex flex-wrap gap-3 mt-3">
                                    {[['#10B981', 'Rendus'], ['#8B5CF6', 'IA'], ['#F59E0B', 'Paywall'], ['#0091FF', 'Achats']].map(([c, l]) => (
                                        <span key={l} className="flex items-center gap-1.5 text-[10px] text-neutral-400">
                                            <span className="w-2 h-2 rounded-sm inline-block" style={{ background: c }} />{l}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Recent Activity Feed */}
                            <div className="bg-neutral-900/50 backdrop-blur-md rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
                                <div className="p-6 border-b border-white/5 flex items-center gap-3">
                                    <Activity className="w-4 h-4 text-amber-400" />
                                    <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-300">Activité récente</h2>
                                </div>
                                <div className="divide-y divide-white/5 max-h-[320px] overflow-y-auto">
                                    {recentActivity.length === 0
                                        ? <p className="p-6 text-neutral-600 text-xs text-center">Aucune activité</p>
                                        : recentActivity.map((a) => {
                                            const isUsage = a.type === 'usage';
                                            const isPurchase = a.type === 'purchase';
                                            return (
                                                <div key={a.id} className="flex items-center gap-4 px-6 py-3 hover:bg-white/[0.02] transition-colors">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${isUsage ? 'bg-purple-500/20 text-purple-400' : isPurchase ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                                        {isUsage ? '⚡' : isPurchase ? '💳' : '🎁'}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs text-neutral-300 truncate">{a.description || a.type}</p>
                                                        <p className="text-[10px] text-neutral-600 font-mono truncate">{a.user_id?.slice(0, 8)}...</p>
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
                        </div>

                        {/* Credit Grant */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-neutral-900/50 backdrop-blur-md rounded-3xl p-8 border border-white/5 shadow-2xl">
                                <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-300 mb-6 flex items-center gap-3">
                                    <Gift className="w-4 h-4 text-purple-500" /> Créditer un compte
                                </h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2 block">
                                            ID Utilisateur <span className="text-neutral-700">(cliquer sur l'ID dans "Utilisateurs")</span>
                                        </label>
                                        <input type="text" value={manualCreditUserId} onChange={e => setManualCreditUserId(e.target.value)} placeholder="UUID..."
                                            className="w-full bg-black border border-white/10 rounded-2xl p-4 text-white placeholder-neutral-700 outline-none focus:border-[#0091FF] transition-all font-mono text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2 block">Montant (VP)</label>
                                        <input type="number" value={manualCreditAmount} onChange={e => setManualCreditAmount(e.target.value)} placeholder="500"
                                            className="w-full bg-black border border-white/10 rounded-2xl p-4 text-white placeholder-neutral-700 outline-none focus:border-[#0091FF] transition-all font-mono text-sm" />
                                    </div>
                                    <button onClick={handleManualCreditGrant}
                                        className="w-full bg-[#0091FF] hover:bg-[#007AFF] text-white font-bold text-sm tracking-wide uppercase py-4 rounded-2xl transition-all shadow-lg shadow-[#0091FF]/20">
                                        Ajouter les crédits
                                    </button>
                                </div>
                            </div>

                            <div className="bg-neutral-900/50 backdrop-blur-md rounded-3xl p-8 border border-white/5 shadow-2xl">
                                <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-300 mb-6 flex items-center gap-3">
                                    <Users className="w-4 h-4 text-emerald-500" /> Gérer Rôle Clippeur
                                </h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2 block">
                                            ID Utilisateur <span className="text-neutral-700">(cliquer sur l'ID dans "Utilisateurs")</span>
                                        </label>
                                        <input type="text" value={manualClippeurId} onChange={e => setManualClippeurId(e.target.value)} placeholder="UUID..."
                                            className="w-full bg-black border border-white/10 rounded-2xl p-4 text-white placeholder-neutral-700 outline-none focus:border-emerald-500 transition-all font-mono text-sm" />
                                    </div>
                                    <div className="flex gap-4 pt-10">
                                        <button onClick={() => handleToggleClippeur(true)}
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm tracking-wide uppercase py-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/20">
                                            Ajouter Rôle
                                        </button>
                                        <button onClick={() => handleToggleClippeur(false)}
                                            className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-red-500 font-bold text-sm tracking-wide uppercase py-4 rounded-2xl transition-all shadow-lg shadow-red-500/10">
                                            Retirer Rôle
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ════════════════════════════════════════════
            TAB 2: FUNNEL
        ════════════════════════════════════════════ */}
                {activeTab === 'funnel' && (
                    <div className="space-y-8">
                        <div className="bg-neutral-900/50 backdrop-blur-md rounded-3xl p-8 border border-white/5 shadow-2xl">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-300 mb-8 flex items-center gap-3">
                                <TrendingUp className="w-4 h-4 text-[#0091FF]" /> Conversion Funnel — Drop-off par étape
                            </h2>

                            {funnel.length === 0
                                ? <p className="text-neutral-600 text-sm text-center py-12">Aucune donnée funnel disponible — exécutez le SQL d'abord.</p>
                                : (
                                    <div className="space-y-4">
                                        {funnel.map((step, i) => {
                                            const prev = funnel[i - 1];
                                            const dropOff = prev ? prev.user_count - step.user_count : 0;
                                            const dropOffPct = prev ? ((dropOff / Math.max(prev.user_count, 1)) * 100).toFixed(0) : '0';
                                            const barWidth = `${step.conversion_pct}%`;
                                            const isGoodRate = step.conversion_pct > 50;

                                            return (
                                                <div key={step.step}>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[10px] font-black text-neutral-600 w-5">{step.step_order}</span>
                                                            <span className="text-sm font-bold text-white">{step.step}</span>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            {prev && dropOff > 0 && (
                                                                <span className="text-[10px] text-red-400 font-bold flex items-center gap-1">
                                                                    <ArrowDownRight className="w-3 h-3" />−{dropOff} ({dropOffPct}%)
                                                                </span>
                                                            )}
                                                            <span className="text-lg font-black text-white">{step.user_count.toLocaleString()}</span>
                                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isGoodRate ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                                                {step.conversion_pct}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-700"
                                                            style={{
                                                                width: barWidth,
                                                                background: `linear-gradient(to right, ${COLORS[i % COLORS.length]}, ${COLORS[(i + 1) % COLORS.length]})`
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                        </div>

                        {/* Funnel event breakdown cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            {[
                                { label: '% atteignent le rendu', val: funnel.find(f => f.step_order === 4)?.conversion_pct ?? 0, icon: <Zap className="w-5 h-5" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                                { label: '% voient le paywall', val: funnel.find(f => f.step_order === 5)?.conversion_pct ?? 0, icon: <Target className="w-5 h-5" />, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                                { label: '% convertissent', val: funnel.find(f => f.step_order === 6)?.conversion_pct ?? 0, icon: <CreditCard className="w-5 h-5" />, color: 'text-[#0091FF]', bg: 'bg-blue-500/10' },
                                { label: 'Paywall → Achat', val: overview?.paywall_to_purchase_rate ?? 0, icon: <CheckCircle2 className="w-5 h-5" />, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                                { label: 'Crédits épuisés au churn', val: overview?.users_burned_all_credits ?? 0, icon: <XCircle className="w-5 h-5" />, color: 'text-red-400', bg: 'bg-red-500/10' },
                                { label: 'Délai moyen vers achat', val: overview?.avg_hours_to_purchase ? fmtHours(overview.avg_hours_to_purchase) : '—', icon: <Clock className="w-5 h-5" />, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
                            ].map(({ label, val, icon, color, bg }) => (
                                <KPICard key={label} icon={icon} label={label} value={typeof val === 'number' ? `${val}%` : val} color={color} bg={bg} />
                            ))}
                        </div>
                    </div>
                )}

                {/* ════════════════════════════════════════════
            TAB 3: USERS
        ════════════════════════════════════════════ */}
                {activeTab === 'users' && (
                    <div className="space-y-6">
                        {/* Search */}
                        <input
                            type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)}
                            placeholder="Rechercher par email ou nom..."
                            className="w-full bg-neutral-900/50 border border-white/10 rounded-2xl px-5 py-3.5 text-white placeholder-neutral-600 outline-none focus:border-[#0091FF] transition-all text-sm"
                        />

                        <div className="bg-neutral-900/50 backdrop-blur-md rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
                            <div className="p-6 border-b border-white/5 flex items-center gap-3">
                                <Users className="w-4 h-4 text-blue-400" />
                                <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-300">Utilisateurs</h2>
                                <span className="ml-auto bg-white/5 text-neutral-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                                    {filteredUsers.length} / {users.length}
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-black/40 text-[10px] uppercase tracking-widest text-neutral-500">
                                        <tr>
                                            {['Email', 'Sessions', 'Rendus', 'Paywall', 'Achats', 'Rev.', 'VP churn', 'Clippeur', 'Source', 'Device', 'Inscrit', 'Dernier login', 'ID'].map(h => (
                                                <th key={h} className="py-4 px-4 font-bold">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredUsers.map(u => (
                                            <tr key={u.user_id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="py-3 px-4 text-neutral-200 max-w-[180px] truncate">
                                                    <div>{u.email}</div>
                                                    {u.full_name && <div className="text-[10px] text-neutral-600">{u.full_name}</div>}
                                                </td>
                                                <td className="py-3 px-4 text-neutral-400 text-center">{u.session_count}</td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.total_realistic_renders > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-neutral-600'}`}>
                                                        {u.total_realistic_renders}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.total_paywall_views > 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-neutral-600'}`}>
                                                        {u.total_paywall_views}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.first_purchase_at ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-neutral-600'}`}>
                                                        {u.total_purchases}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-emerald-400 font-bold text-xs">{fmtRevenue(u.purchase_revenue_cents)}</td>
                                                <td className="py-3 px-4 text-center">
                                                    {u.credits_remaining_at_churn !== null
                                                        ? <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.credits_remaining_at_churn === 0 ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-neutral-500'}`}>
                                                            {u.credits_remaining_at_churn}
                                                        </span>
                                                        : <span className="text-neutral-700">—</span>}
                                                </td>
                                                <td className="py-3 px-4">
                                                    {u.referred_by
                                                        ? <span className="text-[10px] font-bold px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full" title={u.referred_by}>
                                                            {u.referred_by_name || `ID: ${u.referred_by.slice(0, 6)}...`}
                                                        </span>
                                                        : <span className="text-neutral-700">—</span>}
                                                </td>
                                                <td className="py-3 px-4 text-neutral-500 text-xs">{u.marketing_source || u.utm_source || '—'}</td>
                                                <td className="py-3 px-4 text-neutral-500 text-xs">{u.device || '—'}</td>
                                                <td className="py-3 px-4 text-neutral-400 text-xs">
                                                    {u.registered_at ? new Date(u.registered_at).toLocaleDateString('fr-FR') : '—'}
                                                </td>
                                                <td className="py-3 px-4 text-neutral-500 text-xs">
                                                    {u.last_seen_at ? new Date(u.last_seen_at).toLocaleDateString('fr-FR') : '—'}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <button
                                                        onClick={() => { navigator.clipboard.writeText(u.user_id); setManualCreditUserId(u.user_id); setManualClippeurId(u.user_id); setActiveTab('overview'); }}
                                                        className="text-neutral-700 hover:text-[#0091FF] font-mono text-[10px] transition-colors"
                                                        title="Copier ID et aller à Créditer/Clippeur"
                                                    >{u.user_id.slice(0, 8)}...</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ════════════════════════════════════════════
            TAB 4: ATTRIBUTION
        ════════════════════════════════════════════ */}
                {activeTab === 'attribution' && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                            {/* Sources Pie */}
                            <div className="bg-neutral-900/50 backdrop-blur-md rounded-3xl p-8 border border-white/5 shadow-2xl">
                                <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-300 mb-6 flex items-center gap-3">
                                    <TrendingUp className="w-4 h-4 text-[#0091FF]" /> Sources d'acquisition
                                </h2>
                                {sourcePie.length === 0
                                    ? <div className="flex items-center justify-center h-40 text-neutral-600 text-sm">Aucune donnée — exécutez le SQL</div>
                                    : <ResponsiveContainer width="100%" height={280}>
                                        <PieChart>
                                            <Pie data={sourcePie} cx="50%" cy="50%" labelLine={false} outerRadius={100}
                                                fill="#8884d8" stroke="rgba(0,0,0,0.5)" strokeWidth={4} dataKey="count"
                                                label={({ source, percent }: any) => `${source}: ${((percent ?? 0) * 100).toFixed(0)}%`}>
                                                {sourcePie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: 'white' }} />
                                            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 16 }} />
                                        </PieChart>
                                    </ResponsiveContainer>}
                            </div>

                            {/* Device Pie */}
                            <div className="bg-neutral-900/50 backdrop-blur-md rounded-3xl p-8 border border-white/5 shadow-2xl">
                                <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-300 mb-6 flex items-center gap-3">
                                    <Activity className="w-4 h-4 text-purple-400" /> Appareils
                                </h2>
                                {deviceData.length === 0
                                    ? <div className="flex items-center justify-center h-40 text-neutral-600 text-sm">Aucune donnée</div>
                                    : <ResponsiveContainer width="100%" height={280}>
                                        <PieChart>
                                            <Pie data={deviceData} cx="50%" cy="50%" labelLine={false} outerRadius={100}
                                                dataKey="count" nameKey="device"
                                                label={({ device, percent }: any) => `${device}: ${((percent ?? 0) * 100).toFixed(0)}%`}>
                                                {deviceData.map((_, i) => <Cell key={i} fill={COLORS[(i + 2) % COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip contentStyle={tooltipStyle} />
                                            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 16 }} />
                                        </PieChart>
                                    </ResponsiveContainer>}
                            </div>
                        </div>

                        {/* Source + device table */}
                        <div className="bg-neutral-900/50 backdrop-blur-md rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
                            <div className="p-6 border-b border-white/5 flex items-center gap-3">
                                <Target className="w-4 h-4 text-amber-400" />
                                <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-300">Détail acquisition</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left whitespace-nowrap">
                                    <thead className="bg-black/40 text-[10px] uppercase tracking-widest text-neutral-500">
                                        <tr>
                                            <th className="py-4 px-6 font-bold">Source</th>
                                            <th className="py-4 px-6 font-bold">Appareil</th>
                                            <th className="py-4 px-6 font-bold">Utilisateurs</th>
                                            <th className="py-4 px-6 font-bold">% total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {sources.map((s, i) => (
                                            <tr key={i} className="hover:bg-white/[0.02]">
                                                <td className="py-3 px-6 font-medium text-white">{s.source}</td>
                                                <td className="py-3 px-6 text-neutral-400">{s.device}</td>
                                                <td className="py-3 px-6 font-bold text-white">{s.count}</td>
                                                <td className="py-3 px-6">
                                                    <span className="text-[10px] text-neutral-400">
                                                        {((s.count / Math.max(users.length, 1)) * 100).toFixed(1)}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ════════════════════════════════════════════
            TAB 5: STRIPE LIVE
        ════════════════════════════════════════════ */}
                {activeTab === 'stripe' && (
                    <div className="space-y-8">

                        {/* Load button */}
                        {!stripeData && !stripeLoading && (
                            <div className="flex flex-col items-center justify-center py-20 gap-6">
                                <div className="w-20 h-20 bg-violet-500/10 rounded-3xl flex items-center justify-center">
                                    <Wallet className="w-10 h-10 text-violet-400" />
                                </div>
                                <div className="text-center">
                                    <p className="text-white font-bold text-lg mb-1">Données Stripe en temps réel</p>
                                    <p className="text-neutral-500 text-sm">Abonnements, essais, paiements — directement depuis l'API Stripe</p>
                                </div>
                                <button onClick={fetchStripeData}
                                    className="px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-violet-500/20 flex items-center gap-3">
                                    <Wallet className="w-5 h-5" /> Charger les données Stripe
                                </button>
                            </div>
                        )}

                        {stripeLoading && (
                            <div className="flex items-center justify-center py-20 text-neutral-400 text-sm animate-pulse">
                                Connexion à Stripe...
                            </div>
                        )}

                        {stripeError && (
                            <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 flex items-center gap-3">
                                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                                {stripeError}
                            </div>
                        )}

                        {stripeData && (
                            <>
                                {/* Refresh */}
                                <div className="flex justify-end">
                                    <button onClick={fetchStripeData} disabled={stripeLoading}
                                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm text-white transition-all border border-white/5">
                                        <RefreshCw className={`w-4 h-4 ${stripeLoading ? 'animate-spin' : ''}`} /> Actualiser
                                    </button>
                                </div>

                                {/* Balance + Summary KPIs */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <KPICard icon={<Wallet className="w-5 h-5" />} label="Solde disponible"
                                        value={`${(stripeData.balance.available_cents / 100).toFixed(2)}€`}
                                        sub="Stripe balance" bg="bg-emerald-500/10" color="text-emerald-400" />
                                    <KPICard icon={<Clock className="w-5 h-5" />} label="En cours de virement"
                                        value={`${(stripeData.balance.pending_cents / 100).toFixed(2)}€`}
                                        sub="Pending payout" bg="bg-amber-500/10" color="text-amber-400" />
                                    <KPICard icon={<BadgeCheck className="w-5 h-5" />} label="Abonnements actifs"
                                        value={stripeData.subscription_summary.active}
                                        sub={`+ ${stripeData.subscription_summary.trialing} en essai`}
                                        bg="bg-violet-500/10" color="text-violet-400" />
                                    <KPICard icon={<Ban className="w-5 h-5" />} label="Annulés"
                                        value={stripeData.subscription_summary.canceled}
                                        sub={`${stripeData.subscription_summary.past_due} en retard`}
                                        bg="bg-red-500/10" color="text-red-400" />
                                </div>

                                {/* Checkout session stats */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <KPICard icon={<CreditCard className="w-5 h-5" />} label="Sessions checkout"
                                        value={stripeData.session_stats.total} bg="bg-blue-500/10" color="text-[#0091FF]" />
                                    <KPICard icon={<CheckCircle2 className="w-5 h-5" />} label="Complétées"
                                        value={stripeData.session_stats.completed}
                                        sub={`${((stripeData.session_stats.completed / Math.max(stripeData.session_stats.total, 1)) * 100).toFixed(0)}% taux`}
                                        bg="bg-emerald-500/10" color="text-emerald-400" />
                                    <KPICard icon={<XCircle className="w-5 h-5" />} label="Expirées"
                                        value={stripeData.session_stats.expired}
                                        bg="bg-orange-500/10" color="text-orange-400" />
                                    <KPICard icon={<Activity className="w-5 h-5" />} label="En cours"
                                        value={stripeData.session_stats.open}
                                        bg="bg-purple-500/10" color="text-purple-400" />
                                </div>

                                {/* Subscriptions table */}
                                <div className="bg-neutral-900/50 backdrop-blur-md rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
                                    <div className="p-6 border-b border-white/5 flex items-center gap-3">
                                        <Wallet className="w-4 h-4 text-violet-400" />
                                        <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-300">Abonnements &amp; Essais</h2>
                                        <span className="ml-auto text-[10px] font-bold px-3 py-1 bg-white/5 text-neutral-400 rounded-full">
                                            {stripeData.subscriptions.length} entrées
                                        </span>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm text-left whitespace-nowrap">
                                            <thead className="bg-black/40 text-[10px] uppercase tracking-widest text-neutral-500">
                                                <tr>
                                                    {['Statut', 'Email client', 'Plan', 'Montant', 'Essai fin', 'Renouvellement', 'Annulation', 'Créé le', 'ID'].map(h => (
                                                        <th key={h} className="py-4 px-4 font-bold">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {stripeData.subscriptions.map(sub => {
                                                    const statusColors: Record<string, string> = {
                                                        active: 'bg-emerald-500/20 text-emerald-400',
                                                        trialing: 'bg-violet-500/20 text-violet-400',
                                                        canceled: 'bg-red-500/20 text-red-400',
                                                        past_due: 'bg-orange-500/20 text-orange-400',
                                                        incomplete: 'bg-yellow-500/20 text-yellow-400',
                                                    };
                                                    const statusColor = statusColors[sub.status] || 'bg-white/5 text-neutral-400';
                                                    const trialEndsAt = sub.trial_end ? new Date(sub.trial_end) : null;
                                                    const isTrialExpired = trialEndsAt && trialEndsAt < new Date();

                                                    return (
                                                        <tr key={sub.id} className="hover:bg-white/[0.02] transition-colors">
                                                            <td className="py-3 px-4">
                                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusColor}`}>
                                                                    {sub.status}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-4 text-neutral-200 max-w-[180px] truncate">
                                                                {sub.customer_email || '—'}
                                                                {sub.customer_name && <div className="text-[10px] text-neutral-600">{sub.customer_name}</div>}
                                                            </td>
                                                            <td className="py-3 px-4 text-neutral-400 text-xs">{sub.plan_name}</td>
                                                            <td className="py-3 px-4 text-emerald-400 font-bold text-xs">
                                                                {sub.amount_cents > 0 ? `${(sub.amount_cents / 100).toFixed(2)}${sub.currency === 'eur' ? '€' : '$'}/${sub.interval}` : 'Gratuit'}
                                                            </td>
                                                            <td className="py-3 px-4 text-xs">
                                                                {trialEndsAt
                                                                    ? <span className={isTrialExpired ? 'text-red-400' : 'text-violet-400'}>
                                                                        {trialEndsAt.toLocaleDateString('fr-FR')}
                                                                        {isTrialExpired ? ' ✗' : ' ✓'}
                                                                    </span>
                                                                    : <span className="text-neutral-700">—</span>}
                                                            </td>
                                                            <td className="py-3 px-4 text-neutral-400 text-xs">
                                                                {new Date(sub.current_period_end).toLocaleDateString('fr-FR')}
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                {sub.cancel_at_period_end
                                                                    ? <span className="text-orange-400 text-[10px] font-bold">Annulation prévue</span>
                                                                    : <span className="text-neutral-700 text-[10px]">—</span>}
                                                            </td>
                                                            <td className="py-3 px-4 text-neutral-500 text-xs">
                                                                {new Date(sub.created).toLocaleDateString('fr-FR')}
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <a href={`https://dashboard.stripe.com/subscriptions/${sub.id}`}
                                                                    target="_blank" rel="noopener noreferrer"
                                                                    className="text-[#0091FF] hover:underline font-mono text-[10px]">
                                                                    {sub.id.slice(0, 12)}...
                                                                </a>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                        {stripeData.subscriptions.length === 0 && (
                                            <p className="text-center text-neutral-600 text-sm py-8">Aucun abonnement trouvé</p>
                                        )}
                                    </div>
                                </div>

                                {/* Recent one-time payments */}
                                <div className="bg-neutral-900/50 backdrop-blur-md rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
                                    <div className="p-6 border-b border-white/5 flex items-center gap-3">
                                        <CreditCard className="w-4 h-4 text-[#0091FF]" />
                                        <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-300">Paiements récents (VP)</h2>
                                    </div>
                                    <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto">
                                        {stripeData.recent_payments.length === 0
                                            ? <p className="text-center text-neutral-600 text-sm py-8">Aucun paiement récent</p>
                                            : stripeData.recent_payments.map(p => (
                                                <div key={p.id} className="flex items-center gap-4 px-6 py-3 hover:bg-white/[0.02] transition-colors">
                                                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs">💳</div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs text-neutral-300 truncate">{p.description || p.metadata?.packageId || 'Achat VP'}</p>
                                                        <p className="text-[10px] text-neutral-600 font-mono">{p.id}</p>
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <p className="text-emerald-400 font-bold text-xs">
                                                            +{(p.amount_cents / 100).toFixed(2)}{p.currency === 'eur' ? '€' : '$'}
                                                        </p>
                                                        <p className="text-[10px] text-neutral-600">
                                                            {new Date(p.created).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ════════════════════════════════════════════
            TAB 6: CLIPPEURS
        ════════════════════════════════════════════ */}
                {activeTab === 'clippeurs' && (
                    <div className="space-y-6">
                        <div className="bg-neutral-900/50 backdrop-blur-md rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
                            <div className="p-6 border-b border-white/5 flex items-center gap-3">
                                <Trophy className="w-4 h-4 text-amber-400" />
                                <h2 className="text-sm font-bold uppercase tracking-widest text-neutral-300">Classement des Clippeurs</h2>
                                <span className="ml-auto bg-white/5 text-neutral-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                                    {clippeurLeaderboard.length} clippeurs
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-black/40 text-[10px] uppercase tracking-widest text-neutral-500">
                                        <tr>
                                            <th className="py-4 px-6 font-bold w-16">Rang</th>
                                            <th className="py-4 px-6 font-bold">Email/Nom</th>
                                            <th className="py-4 px-6 font-bold text-center">Ventes</th>
                                            <th className="py-4 px-6 font-bold text-right">Gains Générés</th>
                                            <th className="py-4 px-6 font-bold text-right">ID</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {clippeurLeaderboard.map((lb, index) => (
                                            <tr key={lb.clippeur_id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="py-4 px-6">
                                                    {index === 0 ? <Trophy className="w-5 h-5 text-yellow-400" /> :
                                                        index === 1 ? <Trophy className="w-5 h-5 text-neutral-400" /> :
                                                            index === 2 ? <Trophy className="w-5 h-5 text-amber-700" /> :
                                                                <span className="text-neutral-500 font-black px-2">{index + 1}</span>}
                                                </td>
                                                <td className="py-4 px-6 text-neutral-200">
                                                    {lb.full_name || 'Utilisateur'}
                                                </td>
                                                <td className="py-4 px-6 text-neutral-400 text-center font-mono">
                                                    {lb.sales_count}
                                                </td>
                                                <td className="py-4 px-6 font-black text-emerald-400 text-right">
                                                    {fmtRevenue(lb.total_earnings)}
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <button
                                                        onClick={() => { navigator.clipboard.writeText(lb.clippeur_id); setManualClippeurId(lb.clippeur_id); setActiveTab('overview'); }}
                                                        className="text-neutral-700 hover:text-[#0091FF] font-mono text-[10px] transition-colors"
                                                        title="Copier ID et configurer Rôle"
                                                    >{lb.clippeur_id.slice(0, 8)}...</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
