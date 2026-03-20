import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import {
    BarChart2, Users, Wrench, RefreshCw, Copy, Check,
    UserPlus, UserMinus, Gift, Trophy, TrendingUp,
    Zap, CreditCard, Target, ImageIcon, Activity,
} from 'lucide-react';
import confetti from 'canvas-confetti';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Overview {
    total_users: number;
    paying_users: number;
    total_revenue_cents: number;
    sessions_today: number;
    events_today: number;
    paywall_to_purchase_rate: number;
    avg_renders_before_buy: number;
    avg_hours_to_purchase: number;
    users_burned_all_credits: number;
    avg_credits_at_churn: number;
}
interface AnalyticsUser {
    user_id: string;
    email: string;
    full_name: string | null;
    registered_at: string;
    last_seen_at: string;
    first_purchase_at: string | null;
    marketing_source: string | null;
    utm_source: string | null;
    device: string | null;
    session_count: number;
    total_realistic_renders: number;
    total_paywall_views: number;
    total_purchases: number;
    credits_remaining_at_churn: number | null;
    purchase_revenue_cents: number;
    referred_by_name: string | null;
}
interface Transaction {
    id: string;
    user_id: string;
    type: string;
    description: string;
    amount: number;
    created_at: string;
}
interface DailyEvent { day: string; event_name: string; count: number; }
interface FunnelStep { step: string; step_order: number; user_count: number; conversion_pct: number; }
interface ClippeurRank {
    clippeur_id: string;
    full_name: string | null;
    sales_count: number;
    total_earnings: number;
}

const ADMIN = 'kali.nzeutem@gmail.com';
const fmt = (cents: number) => `${(cents / 100).toFixed(0)}€`;
const fmtH = (h: number) => h < 24 ? `${Math.round(h)}h` : `${(h / 24).toFixed(1)}j`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });

function Badge({ value, active, color }: { value: number; active: boolean; color: 'emerald' | 'amber' | 'blue' }) {
    const colors = { emerald: 'bg-emerald-500/15 text-emerald-400', amber: 'bg-amber-500/15 text-amber-400', blue: 'bg-blue-500/15 text-blue-400' };
    if (!active) return <span className="text-[10px] text-neutral-700">{value}</span>;
    return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors[color]}`}>{value}</span>;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Analytics() {
    const { user } = useAuth();
    const prevRev = useRef<number | null>(null);

    const [tab, setTab] = useState<'business' | 'users' | 'tools'>('business');
    const [loading, setLoading] = useState(true);
    const [refreshedAt, setRefreshedAt] = useState(new Date());
    const [search, setSearch] = useState('');
    const [copied, setCopied] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<{ msg: string; ok: boolean } | null>(null);

    const [overview, setOverview] = useState<Overview | null>(null);
    const [users, setUsers] = useState<AnalyticsUser[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [daily, setDaily] = useState<DailyEvent[]>([]);
    const [funnel, setFunnel] = useState<FunnelStep[]>([]);
    const [clippeurs, setClippeurs] = useState<ClippeurRank[]>([]);
    const [totalRenders, setTotalRenders] = useState(0);
    const [stripeEvents, setStripeEvents] = useState(0);

    const [creditId, setCreditId] = useState('');
    const [creditAmt, setCreditAmt] = useState('');
    const [clippeurId, setClippeurId] = useState('');

    const isAdmin = user?.email === ADMIN;

    useEffect(() => {
        if (!isAdmin) return;
        load();
        const t = setInterval(load, 30000);
        return () => clearInterval(t);
    }, [isAdmin]);

    const load = async () => {
        setLoading(true);
        await Promise.allSettled([
            loadOverview(), loadUsers(), loadTransactions(),
            loadDaily(), loadFunnel(), loadClippeurs(),
            loadTotalRenders(), loadStripeEvents(),
        ]);
        setLoading(false);
        setRefreshedAt(new Date());
    };

    const loadOverview = async () => {
        const { data } = await (supabase.rpc as any)('get_analytics_overview');
        if (!data) return;
        const rev = (data as Overview).total_revenue_cents;
        if (prevRev.current !== null && rev > prevRev.current) {
            const end = Date.now() + 3000;
            const tick = setInterval(() => {
                if (Date.now() > end) { clearInterval(tick); return; }
                const n = 40 * ((end - Date.now()) / 3000);
                confetti({ particleCount: n, spread: 360, startVelocity: 28, ticks: 50, zIndex: 9999, origin: { x: Math.random(), y: 0.3 } });
            }, 200);
        }
        prevRev.current = rev;
        setOverview(data as Overview);
    };
    const loadUsers = async () => { const { data } = await (supabase.rpc as any)('get_all_analytics_users'); setUsers((data as AnalyticsUser[]) || []); };
    const loadTransactions = async () => { const { data } = await (supabase.rpc as any)('get_all_transactions'); setTransactions((data as Transaction[]) || []); };
    const loadDaily = async () => { const { data } = await (supabase.rpc as any)('get_daily_events', { p_days: 14 }); setDaily((data as DailyEvent[]) || []); };
    const loadFunnel = async () => { const { data } = await (supabase.rpc as any)('get_analytics_funnel'); if (data) setFunnel(data as FunnelStep[]); };
    const loadClippeurs = async () => { const { data } = await supabase.rpc('get_clippeur_leaderboard'); if (data) setClippeurs(data as ClippeurRank[]); };
    const loadTotalRenders = async () => { const { count } = await supabase.from('user_history').select('*', { count: 'exact', head: true }); if (count !== null) setTotalRenders(count); };
    const loadStripeEvents = async () => { const { count } = await supabase.from('processed_stripe_events').select('*', { count: 'exact', head: true }); if (count !== null) setStripeEvents(count); };

    const flash = (msg: string, ok: boolean) => { setFeedback({ msg, ok }); setTimeout(() => setFeedback(null), 3000); };

    const grantCredits = async () => {
        if (!creditId || !creditAmt) { flash('Remplir tous les champs', false); return; }
        const { error } = await (supabase.rpc as any)('add_credits', { p_user_id: creditId, p_amount: parseInt(creditAmt), p_type: 'bonus', p_description: 'Crédits admin' });
        error ? flash(error.message, false) : flash(`✓ ${creditAmt} VP ajoutés`, true);
        setCreditId(''); setCreditAmt(''); loadOverview();
    };

    const toggleClippeur = async (status: boolean) => {
        if (!clippeurId) { flash('UUID manquant', false); return; }
        const { error } = await supabase.rpc('toggle_clippeur', { p_user_id: clippeurId, p_status: status });
        error ? flash(error.message, false) : flash(status ? '✓ Rôle ajouté' : '✓ Rôle retiré', true);
        setClippeurId(''); loadClippeurs();
    };

    const copy = (id: string, fill?: () => void) => {
        navigator.clipboard.writeText(id);
        setCopied(id);
        fill?.();
        setTimeout(() => setCopied(null), 1500);
    };

    if (!isAdmin) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <p className="text-red-500 text-sm font-bold tracking-widest uppercase">Accès refusé</p>
        </div>
    );

    if (loading && !overview) return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <p className="text-neutral-700 text-xs font-bold tracking-widest uppercase animate-pulse">Chargement…</p>
        </div>
    );

    // Derived
    const revenue = overview?.total_revenue_cents ?? 0;
    const payingUsers = overview?.paying_users ?? 0;
    const totalUsers = overview?.total_users ?? 1;
    const convRate = ((payingUsers / totalUsers) * 100).toFixed(1);
    const arpu = fmt(Math.round(revenue / Math.max(payingUsers, 1)));
    const recentPurchases = transactions.filter(t => t.type === 'purchase').slice(0, 8);
    const days = [...new Set(daily.map(e => e.day))].sort();
    const chartData = days.map(day => {
        const row: any = { day: day.slice(5) };
        daily.filter(e => e.day === day).forEach(e => { row[e.event_name] = e.count; });
        return row;
    });
    const filteredUsers = users.filter(u =>
        !search || u.email?.toLowerCase().includes(search.toLowerCase()) || u.full_name?.toLowerCase().includes(search.toLowerCase())
    );
    const tooltipStyle = { backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '10px', color: '#fff', fontSize: 11 };

    return (
        <div className="min-h-screen bg-black text-white">

            {/* Top bar */}
            <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/[0.06]">
                <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-white">Admin</span>
                        <span className="text-[10px] text-neutral-700 font-mono">
                            {refreshedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                    <button onClick={load} disabled={loading} className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors disabled:opacity-30">
                        <RefreshCw className={`w-3.5 h-3.5 text-neutral-500 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
                <div className="max-w-5xl mx-auto px-4 flex border-t border-white/[0.04]">
                    {([
                        { id: 'business', label: 'Business', icon: BarChart2 },
                        { id: 'users', label: `Utilisateurs (${users.length})`, icon: Users },
                        { id: 'tools', label: 'Outils', icon: Wrench },
                    ] as const).map(({ id, label, icon: Icon }) => (
                        <button key={id} onClick={() => setTab(id)}
                            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${tab === id ? 'border-white text-white' : 'border-transparent text-neutral-600 hover:text-neutral-400'}`}>
                            <Icon className="w-3.5 h-3.5" />{label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-6 pb-32 space-y-4">

                {/* ── BUSINESS ── */}
                {tab === 'business' && <>

                    {/* 4 KPIs */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { label: 'Revenus total', value: fmt(revenue), sub: `ARPU: ${arpu}`, color: '#10B981' },
                            { label: 'Utilisateurs payants', value: payingUsers, sub: `${convRate}% de conversion`, color: '#0091FF' },
                            { label: 'Inscrits total', value: totalUsers, sub: `${overview?.sessions_today ?? 0} sessions aujourd'hui`, color: '#8B5CF6' },
                            { label: 'Renders générés', value: totalRenders, sub: 'Depuis le lancement', color: '#F59E0B' },
                        ].map(({ label, value, sub, color }) => (
                            <div key={label} className="bg-[#0c0c0c] border border-white/[0.06] rounded-2xl p-4">
                                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-600 mb-3">{label}</p>
                                <p className="text-2xl font-black tracking-tight" style={{ color }}>{value}</p>
                                <p className="text-[10px] text-neutral-700 mt-1.5">{sub}</p>
                            </div>
                        ))}
                    </div>

                    {/* Chart + Recent purchases */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2 bg-[#0c0c0c] border border-white/[0.06] rounded-2xl p-5">
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-600 mb-4 flex items-center gap-2">
                                <Activity className="w-3 h-3" /> Activité — 14 jours
                            </p>
                            {chartData.length === 0
                                ? <div className="h-40 flex items-center justify-center text-neutral-800 text-xs">Aucune donnée</div>
                                : <>
                                    <ResponsiveContainer width="100%" height={160}>
                                        <BarChart data={chartData} barSize={5} barGap={1}>
                                            <CartesianGrid strokeDasharray="2 4" stroke="#161616" vertical={false} />
                                            <XAxis dataKey="day" tick={{ fill: '#444', fontSize: 9 }} tickLine={false} axisLine={false} />
                                            <YAxis tick={{ fill: '#444', fontSize: 9 }} tickLine={false} axisLine={false} width={20} allowDecimals={false} />
                                            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.01)' }} />
                                            <Bar dataKey="first_realistic_render_completed" name="Rendus" fill="#10B981" radius={[2, 2, 0, 0]} />
                                            <Bar dataKey="paywall_viewed" name="Paywall" fill="#F59E0B" radius={[2, 2, 0, 0]} />
                                            <Bar dataKey="purchase_completed" name="Achats" fill="#0091FF" radius={[2, 2, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                    <div className="flex gap-4 mt-2">
                                        {[['#10B981', 'Rendus'], ['#F59E0B', 'Paywall'], ['#0091FF', 'Achats']].map(([c, l]) => (
                                            <span key={l} className="flex items-center gap-1.5 text-[10px] text-neutral-700">
                                                <span className="w-1.5 h-1.5 rounded-sm inline-block" style={{ background: c }} />{l}
                                            </span>
                                        ))}
                                    </div>
                                </>}
                        </div>

                        <div className="bg-[#0c0c0c] border border-white/[0.06] rounded-2xl overflow-hidden">
                            <div className="px-4 py-3 border-b border-white/[0.05] flex items-center gap-2">
                                <CreditCard className="w-3 h-3 text-neutral-600" />
                                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-600">Derniers achats</p>
                            </div>
                            {recentPurchases.length === 0
                                ? <p className="px-4 py-6 text-center text-neutral-800 text-xs">Aucun achat</p>
                                : recentPurchases.map(t => (
                                    <div key={t.id} className="px-4 py-2.5 border-b border-white/[0.03] flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-xs text-neutral-400 truncate">{t.description || 'Achat'}</p>
                                            <p className="text-[10px] text-neutral-700 font-mono">{t.user_id.slice(0, 8)}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-xs font-bold text-emerald-400">+{t.amount} VP</p>
                                            <p className="text-[10px] text-neutral-700">
                                                {new Date(t.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>

                    {/* 6 metric tiles */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                            { icon: Target, label: 'Paywall → achat', value: `${overview?.paywall_to_purchase_rate ?? 0}%`, color: 'text-rose-400' },
                            { icon: ImageIcon, label: 'Rendus avant achat', value: overview?.avg_renders_before_buy ?? '—', color: 'text-indigo-400' },
                            { icon: Zap, label: 'Délai moyen achat', value: overview?.avg_hours_to_purchase ? fmtH(overview.avg_hours_to_purchase) : '—', color: 'text-amber-400' },
                            { icon: TrendingUp, label: 'Événements Stripe', value: stripeEvents, color: 'text-violet-400' },
                            { icon: Users, label: 'Crédits épuisés au churn', value: overview?.users_burned_all_credits ?? 0, color: 'text-red-400' },
                            { icon: Activity, label: 'VP restants (moy.)', value: `${overview?.avg_credits_at_churn ?? '?'} VP`, color: 'text-cyan-400' },
                        ].map(({ icon: Icon, label, value, color }) => (
                            <div key={label} className="bg-[#0c0c0c] border border-white/[0.06] rounded-2xl px-4 py-3 flex items-center gap-3">
                                <Icon className={`w-4 h-4 flex-shrink-0 ${color}`} />
                                <div className="min-w-0">
                                    <p className="text-[10px] text-neutral-600 truncate">{label}</p>
                                    <p className={`text-sm font-black ${color}`}>{value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Funnel */}
                    {funnel.length > 0 && (
                        <div className="bg-[#0c0c0c] border border-white/[0.06] rounded-2xl p-5">
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-600 mb-4 flex items-center gap-2">
                                <TrendingUp className="w-3 h-3" /> Funnel de conversion
                            </p>
                            <div className="space-y-3">
                                {funnel.map((step, i) => (
                                    <div key={step.step}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-neutral-500">{step.step}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-bold text-white">{step.user_count.toLocaleString()}</span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${step.conversion_pct > 50 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                                                    {step.conversion_pct}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-500"
                                                style={{ width: `${step.conversion_pct}%`, background: `hsl(${190 + i * 25}, 70%, 55%)` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>}

                {/* ── USERS ── */}
                {tab === 'users' && <>
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Rechercher par email ou nom…"
                        className="w-full bg-[#0c0c0c] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-700 outline-none focus:border-white/20 transition-all" />

                    <div className="bg-[#0c0c0c] border border-white/[0.06] rounded-2xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-white/[0.05] flex items-center justify-between">
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-600">Utilisateurs</p>
                            <p className="text-[10px] text-neutral-700">{filteredUsers.length} / {users.length}</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left whitespace-nowrap">
                                <thead>
                                    <tr className="border-b border-white/[0.04]">
                                        {['Email', 'Rendus', 'Paywall', 'Achats', 'Revenu', 'Source', 'Inscrit', 'Vu', 'ID'].map(h => (
                                            <th key={h} className="px-4 py-2.5 text-[9px] font-bold uppercase tracking-widest text-neutral-700">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map(u => (
                                        <tr key={u.user_id} className="border-b border-white/[0.03] hover:bg-white/[0.01] transition-colors">
                                            <td className="px-4 py-2.5 max-w-[180px]">
                                                <p className="text-xs text-neutral-300 truncate">{u.email}</p>
                                                {u.full_name && <p className="text-[10px] text-neutral-700 truncate">{u.full_name}</p>}
                                            </td>
                                            <td className="px-4 py-2.5 text-center">
                                                <Badge value={u.total_realistic_renders} active={u.total_realistic_renders > 0} color="emerald" />
                                            </td>
                                            <td className="px-4 py-2.5 text-center">
                                                <Badge value={u.total_paywall_views} active={u.total_paywall_views > 0} color="amber" />
                                            </td>
                                            <td className="px-4 py-2.5 text-center">
                                                <Badge value={u.total_purchases} active={!!u.first_purchase_at} color="blue" />
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <span className="text-xs font-bold text-emerald-400">{fmt(u.purchase_revenue_cents)}</span>
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <span className="text-[10px] text-neutral-600">{u.marketing_source || u.utm_source || '—'}</span>
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <span className="text-[10px] text-neutral-600">{u.registered_at ? fmtDate(u.registered_at) : '—'}</span>
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <span className="text-[10px] text-neutral-700">{u.last_seen_at ? fmtDate(u.last_seen_at) : '—'}</span>
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <button onClick={() => copy(u.user_id, () => { setCreditId(u.user_id); setClippeurId(u.user_id); })}
                                                    className="flex items-center gap-1 text-neutral-700 hover:text-white transition-colors font-mono text-[10px]">
                                                    {copied === u.user_id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                                    {u.user_id.slice(0, 6)}…
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredUsers.length === 0 && <p className="py-10 text-center text-neutral-800 text-xs">Aucun utilisateur</p>}
                        </div>
                    </div>
                </>}

                {/* ── TOOLS ── */}
                {tab === 'tools' && <>
                    {feedback && (
                        <div className={`px-4 py-2.5 rounded-xl text-xs font-bold ${feedback.ok ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                            {feedback.msg}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-[#0c0c0c] border border-white/[0.06] rounded-2xl p-5 space-y-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-600 flex items-center gap-2">
                                <Gift className="w-3 h-3" /> Ajouter des crédits
                            </p>
                            <input value={creditId} onChange={e => setCreditId(e.target.value)} placeholder="UUID utilisateur"
                                className="w-full bg-black border border-white/[0.07] rounded-xl px-3 py-2.5 text-xs text-white placeholder-neutral-800 outline-none focus:border-white/20 font-mono transition-all" />
                            <input value={creditAmt} onChange={e => setCreditAmt(e.target.value)} type="number" placeholder="Montant en VP"
                                className="w-full bg-black border border-white/[0.07] rounded-xl px-3 py-2.5 text-xs text-white placeholder-neutral-800 outline-none focus:border-white/20 font-mono transition-all" />
                            <button onClick={grantCredits}
                                className="w-full py-2.5 bg-white text-black text-xs font-black uppercase tracking-wider rounded-xl hover:bg-neutral-200 transition-all">
                                Ajouter
                            </button>
                        </div>

                        <div className="bg-[#0c0c0c] border border-white/[0.06] rounded-2xl p-5 space-y-3">
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-600 flex items-center gap-2">
                                <Users className="w-3 h-3" /> Rôle Clippeur
                            </p>
                            <input value={clippeurId} onChange={e => setClippeurId(e.target.value)} placeholder="UUID utilisateur"
                                className="w-full bg-black border border-white/[0.07] rounded-xl px-3 py-2.5 text-xs text-white placeholder-neutral-800 outline-none focus:border-white/20 font-mono transition-all" />
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => toggleClippeur(true)}
                                    className="py-2.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-emerald-500/25 transition-all flex items-center justify-center gap-1.5">
                                    <UserPlus className="w-3 h-3" /> Ajouter
                                </button>
                                <button onClick={() => toggleClippeur(false)}
                                    className="py-2.5 bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-red-500/20 transition-all flex items-center justify-center gap-1.5">
                                    <UserMinus className="w-3 h-3" /> Retirer
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#0c0c0c] border border-white/[0.06] rounded-2xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-white/[0.05] flex items-center justify-between">
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-600 flex items-center gap-2">
                                <Trophy className="w-3 h-3 text-amber-500" /> Classement Clippeurs
                            </p>
                            <p className="text-[10px] text-neutral-700">{clippeurs.length}</p>
                        </div>
                        {clippeurs.length === 0
                            ? <p className="py-8 text-center text-neutral-800 text-xs">Aucun clippeur</p>
                            : clippeurs.map((c, i) => (
                                <div key={c.clippeur_id} className="px-4 py-3 border-b border-white/[0.03] flex items-center gap-4 hover:bg-white/[0.01] transition-colors">
                                    <span className="text-xs w-5 text-center font-bold text-neutral-600">
                                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                                    </span>
                                    <span className="flex-1 text-xs text-neutral-300 truncate">{c.full_name || 'Utilisateur'}</span>
                                    <span className="text-xs text-neutral-600">{c.sales_count} ventes</span>
                                    <span className="text-xs font-bold text-emerald-400">{fmt(c.total_earnings)}</span>
                                    <button onClick={() => copy(c.clippeur_id, () => setClippeurId(c.clippeur_id))} className="text-neutral-700 hover:text-white transition-colors">
                                        {copied === c.clippeur_id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                </div>
                            ))}
                    </div>
                </>}
            </div>
        </div>
    );
}
