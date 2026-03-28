import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import {
    BarChart2, Users, Wrench, RefreshCw, Copy, Check,
    UserPlus, UserMinus, Gift, Trophy, TrendingUp,
    Zap, CreditCard, Target, ImageIcon, Activity, Crown,
    AlertTriangle, XCircle, Clock, Wand2, ShoppingCart,
    RotateCcw, Sparkles, LogIn, Star, Eye,
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
    subscription_status: string | null;
    current_period_ends_at: string | null;
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

interface RecentAction {
    id: string;
    user_id: string;
    email: string | null;
    full_name: string | null;
    kind: 'purchase' | 'usage' | 'bonus' | 'refund' | 'render' | 'generation';
    description: string | null;
    amount: number | null;         // VP (credits)
    amount_eur: number | null;     // euros (null si non-monétaire)
    is_realistic: boolean | null;  // pour les générations
    created_at: string;
}

interface ActivityEvent {
    id: string;
    user_id: string | null;
    email: string | null;
    full_name: string | null;
    type: 'signup' | 'session' | 'paywall_view' | 'purchase' | 'usage' | 'bonus' | 'refund' | 'render' | 'generation';
    description: string;
    meta: string | null;
    created_at: string;
}

const ACTIVITY_META: Record<string, { icon: any; label: string; cls: string; dot: string }> = {
    signup:       { icon: UserPlus,     label: 'Inscription',   cls: 'text-green-400',   dot: 'bg-green-400' },
    session:      { icon: LogIn,        label: 'Session',       cls: 'text-neutral-500', dot: 'bg-neutral-700' },
    paywall_view: { icon: Eye,          label: 'Paywall vu',    cls: 'text-orange-400',  dot: 'bg-orange-400' },
    purchase:     { icon: ShoppingCart, label: 'Achat',         cls: 'text-emerald-400', dot: 'bg-emerald-400' },
    usage:        { icon: Zap,          label: 'VP utilisé',    cls: 'text-neutral-500', dot: 'bg-neutral-600' },
    bonus:        { icon: Gift,         label: 'Bonus VP',      cls: 'text-amber-400',   dot: 'bg-amber-400' },
    refund:       { icon: RotateCcw,    label: 'Remboursement', cls: 'text-blue-400',    dot: 'bg-blue-400' },
    render:       { icon: Sparkles,     label: 'Rendu réaliste',cls: 'text-violet-400',  dot: 'bg-violet-400' },
    generation:   { icon: Wand2,        label: 'Génération IA', cls: 'text-indigo-400',  dot: 'bg-indigo-400' },
};

// Config visuelle par type d'action
const ACTION_META: Record<string, { icon: any; label: string; cls: string; dot: string }> = {
    purchase:   { icon: ShoppingCart, label: 'Achat',           cls: 'text-emerald-400', dot: 'bg-emerald-400' },
    bonus:      { icon: Gift,         label: 'Bonus crédits',   cls: 'text-amber-400',   dot: 'bg-amber-400' },
    refund:     { icon: RotateCcw,    label: 'Remboursement',   cls: 'text-blue-400',    dot: 'bg-blue-400' },
    usage:      { icon: Zap,          label: 'Utilisation VP',  cls: 'text-neutral-500', dot: 'bg-neutral-600' },
    render:     { icon: Sparkles,     label: 'Rendu réaliste',  cls: 'text-violet-400',  dot: 'bg-violet-400' },
    generation: { icon: Wand2,        label: 'Génération IA',   cls: 'text-indigo-400',  dot: 'bg-indigo-400' },
};

const fmtRelative = (d: string) => {
    const diff = (Date.now() - new Date(d).getTime()) / 1000;
    if (diff < 60)  return `il y a ${Math.floor(diff)}s`;
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `il y a ${Math.floor(diff / 86400)}j`;
    return fmtDate(d);
};

const ADMIN = 'kali.nzeutem@gmail.com';

// Prix des plans en centimes / mois
const PLAN_PRICE_CENTS: Record<string, number> = {
    plus: 999,    // €9.99
    pro: 1999,    // €19.99
    studio: 3999, // €39.99
};

const PLAN_META: Record<string, { label: string; cls: string; dot: string }> = {
    plus:   { label: 'Plus',   cls: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',    dot: 'bg-blue-400' },
    pro:    { label: 'Pro',    cls: 'bg-violet-500/15 text-violet-400 border border-violet-500/20', dot: 'bg-violet-400' },
    studio: { label: 'Studio', cls: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',  dot: 'bg-amber-400' },
    free:   { label: 'Free',   cls: 'bg-neutral-700/30 text-neutral-500 border border-transparent', dot: 'bg-neutral-600' },
};
const fmt = (cents: number) => `${(cents / 100).toFixed(0)}€`;
const fmtH = (h: number) => h < 24 ? `${Math.round(h)}h` : `${(h / 24).toFixed(1)}j`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
const fmtFullDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

function Badge({ value, active, color }: { value: number; active: boolean; color: 'emerald' | 'amber' | 'blue' }) {
    const colors = { emerald: 'bg-emerald-500/15 text-emerald-400', amber: 'bg-amber-500/15 text-amber-400', blue: 'bg-blue-500/15 text-blue-400' };
    if (!active) return <span className="text-[10px] text-neutral-700">{value}</span>;
    return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors[color]}`}>{value}</span>;
}

const SUB_STATUS_MAP: Record<string, { label: string; cls: string; dot: string }> = {
    active:   { label: 'Actif',      cls: 'bg-emerald-500/15 text-emerald-400', dot: 'bg-emerald-400' },
    trialing: { label: 'Essai',      cls: 'bg-blue-500/15 text-blue-400',       dot: 'bg-blue-400' },
    past_due: { label: 'Past Due',   cls: 'bg-amber-500/15 text-amber-400',     dot: 'bg-amber-400' },
    unpaid:   { label: 'Impayé',     cls: 'bg-red-500/15 text-red-400',         dot: 'bg-red-400' },
    canceled: { label: 'Annulé',     cls: 'bg-neutral-700/30 text-neutral-500', dot: 'bg-neutral-600' },
    incomplete: { label: 'Incomplet',cls: 'bg-orange-500/15 text-orange-400',   dot: 'bg-orange-400' },
    none:     { label: 'Inactif',    cls: 'bg-neutral-700/30 text-neutral-500', dot: 'bg-neutral-700' },
};

function SubStatusBadge({ status }: { status: string | null }) {
    const s = SUB_STATUS_MAP[status ?? 'none'] ?? SUB_STATUS_MAP['none'];
    return (
        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${s.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            {s.label}
        </span>
    );
}

// ─── Stripe types ──────────────────────────────────────────────────────────────
interface StripeSub {
    id: string;
    status: string;
    customer_email: string | null;
    customer_name: string | null;
    plan_name: string;
    amount_cents: number;
    currency: string;
    interval: string;
    trial_start: string | null;
    trial_end: string | null;
    current_period_end: string;
    cancel_at_period_end: boolean;
    created: string;
    last_invoice_status: string | null;
    last_invoice_amount: number;
    metadata: Record<string, string>;
}
interface StripeData {
    subscriptions: StripeSub[];
    subscription_summary: { trialing: number; active: number; canceled: number; past_due: number; incomplete: number };
    recent_payments: { id: string; amount_cents: number; currency: string; created: string; description: string | null }[];
    session_stats: { total: number; completed: number; expired: number; open: number };
    balance: { available_cents: number; pending_cents: number; currency: string };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Analytics() {
    const { user } = useAuth();
    const prevRev = useRef<number | null>(null);

    const [tab, setTab] = useState<'business' | 'users' | 'subscriptions' | 'tools' | 'activity'>('business');
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

    // Subscriptions tab — real Stripe data
    const [stripeData, setStripeData] = useState<StripeData | null>(null);
    const [stripeLoading, setStripeLoading] = useState(false);
    const [stripeError, setStripeError] = useState<string | null>(null);
    const [subFilter, setSubFilter] = useState<'all' | 'active' | 'trialing' | 'past_due' | 'unpaid' | 'canceled' | 'incomplete'>('all');
    const [subSearch, setSubSearch] = useState('');

    // Recent actions feed (subscriptions tab)
    const [recentActions, setRecentActions] = useState<RecentAction[]>([]);
    const [actionsLoading, setActionsLoading] = useState(false);
    const [actionKindFilter, setActionKindFilter] = useState<'all' | RecentAction['kind']>('all');

    // Activity log tab
    const [activityLog, setActivityLog] = useState<ActivityEvent[]>([]);
    const [activityLoading, setActivityLoading] = useState(false);
    const [activityTypeFilter, setActivityTypeFilter] = useState<'all' | ActivityEvent['type']>('all');
    const [activitySearch, setActivitySearch] = useState('');

    const isAdmin = user?.email === ADMIN;

    useEffect(() => {
        if (!isAdmin) return;
        load();
        const t = setInterval(load, 30000);
        return () => clearInterval(t);
    }, [isAdmin]);

    useEffect(() => {
        if (tab === 'subscriptions' && isAdmin) {
            if (!stripeData && !stripeLoading) loadStripeData();
            if (recentActions.length === 0 && !actionsLoading) loadRecentActions();
        }
        if (tab === 'activity' && isAdmin) {
            loadActivityLog();
        }
    }, [tab, isAdmin]);

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

    const loadStripeData = async () => {
        setStripeLoading(true);
        setStripeError(null);
        try {
            const { data, error } = await supabase.functions.invoke('get-stripe-data');
            if (error) throw new Error(error.message);
            setStripeData(data as StripeData);
        } catch (e: any) {
            setStripeError(e.message ?? 'Erreur Stripe');
        } finally {
            setStripeLoading(false);
        }
    };

    const loadRecentActions = async () => {
        setActionsLoading(true);
        try {
            // 1. credit_transactions (achats, utilisations VP, bonus, remboursements)
            const { data: txData } = await supabase
                .from('credit_transactions')
                .select('id, user_id, amount, type, description, created_at, profiles(email, full_name)')
                .order('created_at', { ascending: false })
                .limit(80);

            // 2. tattoo_history (générations d'images)
            const { data: histData } = await supabase
                .from('tattoo_history')
                .select('id, user_id, is_realistic, created_at, profiles(email, full_name)')
                .order('created_at', { ascending: false })
                .limit(40);

            const actions: RecentAction[] = [];

            (txData ?? []).forEach((tx: any) => {
                const profile = tx.profiles ?? {};
                // Déterminer si c'est un achat en euros (description contient €) ou VP
                const isEurPurchase = tx.type === 'purchase' && tx.description?.includes('invoice');
                actions.push({
                    id: `tx_${tx.id}`,
                    user_id: tx.user_id,
                    email: profile.email ?? null,
                    full_name: profile.full_name ?? null,
                    kind: tx.type as RecentAction['kind'],
                    description: tx.description,
                    amount: tx.amount,
                    amount_eur: null,
                    is_realistic: null,
                    created_at: tx.created_at,
                });
            });

            (histData ?? []).forEach((h: any) => {
                const profile = h.profiles ?? {};
                actions.push({
                    id: `hist_${h.id}`,
                    user_id: h.user_id,
                    email: profile.email ?? null,
                    full_name: profile.full_name ?? null,
                    kind: h.is_realistic ? 'render' : 'generation',
                    description: h.is_realistic ? 'Rendu réaliste généré' : 'Tatouage généré par IA',
                    amount: null,
                    amount_eur: null,
                    is_realistic: h.is_realistic,
                    created_at: h.created_at,
                });
            });

            // Trier par date décroissante
            actions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setRecentActions(actions.slice(0, 100));
        } finally {
            setActionsLoading(false);
        }
    };

    const loadActivityLog = async () => {
        setActivityLoading(true);
        try {
            // 1. Nouvelles inscriptions (profiles)
            const { data: signups } = await supabase
                .from('profiles')
                .select('id, email, full_name, created_at')
                .order('created_at', { ascending: false })
                .limit(60);

            // 2. Événements analytics (sessions, paywall vus)
            const { data: analyticsEvts } = await supabase
                .from('analytics_events')
                .select('id, user_id, event_name, properties, created_at, profiles(email, full_name)')
                .in('event_name', ['session_started', 'paywall_viewed', 'user_registered', 'purchase_completed'])
                .order('created_at', { ascending: false })
                .limit(120);

            // 3. Transactions VP (achats, usage, bonus, remboursements)
            const { data: txData } = await supabase
                .from('credit_transactions')
                .select('id, user_id, amount, type, description, created_at, profiles(email, full_name)')
                .order('created_at', { ascending: false })
                .limit(100);

            // 4. Générations et rendus
            const { data: histData } = await supabase
                .from('tattoo_history')
                .select('id, user_id, is_realistic, created_at, profiles(email, full_name)')
                .order('created_at', { ascending: false })
                .limit(80);

            const items: ActivityEvent[] = [];

            (signups ?? []).forEach((p: any) => {
                items.push({
                    id: `signup_${p.id}`,
                    user_id: p.id,
                    email: p.email,
                    full_name: p.full_name,
                    type: 'signup',
                    description: 'Nouveau compte créé',
                    meta: null,
                    created_at: p.created_at,
                });
            });

            (analyticsEvts ?? []).forEach((e: any) => {
                const profile = e.profiles ?? {};
                let type: ActivityEvent['type'];
                let description: string;
                if (e.event_name === 'session_started') { type = 'session'; description = 'Session démarrée'; }
                else if (e.event_name === 'paywall_viewed') { type = 'paywall_view'; description = 'Paywall affiché'; }
                else if (e.event_name === 'user_registered') { type = 'signup'; description = 'Inscription'; }
                else if (e.event_name === 'purchase_completed') { type = 'purchase'; description = 'Achat complété'; }
                else return;
                const props = e.properties ?? {};
                const metaParts: string[] = [];
                if (props.device) metaParts.push(props.device);
                if (props.plan) metaParts.push(props.plan);
                items.push({
                    id: `evt_${e.id}`,
                    user_id: e.user_id,
                    email: profile.email ?? null,
                    full_name: profile.full_name ?? null,
                    type,
                    description,
                    meta: metaParts.length ? metaParts.join(' · ') : null,
                    created_at: e.created_at,
                });
            });

            (txData ?? []).forEach((tx: any) => {
                const profile = tx.profiles ?? {};
                items.push({
                    id: `tx_${tx.id}`,
                    user_id: tx.user_id,
                    email: profile.email ?? null,
                    full_name: profile.full_name ?? null,
                    type: tx.type as ActivityEvent['type'],
                    description: tx.description ?? '',
                    meta: tx.amount != null ? `${tx.amount > 0 ? '+' : ''}${tx.amount} VP` : null,
                    created_at: tx.created_at,
                });
            });

            (histData ?? []).forEach((h: any) => {
                const profile = h.profiles ?? {};
                items.push({
                    id: `hist_${h.id}`,
                    user_id: h.user_id,
                    email: profile.email ?? null,
                    full_name: profile.full_name ?? null,
                    type: h.is_realistic ? 'render' : 'generation',
                    description: h.is_realistic ? 'Rendu réaliste généré' : 'Tatouage généré par IA',
                    meta: null,
                    created_at: h.created_at,
                });
            });

            items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            setActivityLog(items.slice(0, 200));
        } finally {
            setActivityLoading(false);
        }
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

    // ── Subscriptions derived — real Stripe data ───────────────────────────────
    const stripeSubs = stripeData?.subscriptions ?? [];
    const stripeSum = stripeData?.subscription_summary ?? { active: 0, trialing: 0, past_due: 0, canceled: 0, incomplete: 0 };
    const stripeMrr = stripeSubs
        .filter(s => s.status === 'active' || s.status === 'trialing')
        .reduce((sum, s) => {
            // Convert to monthly: weekly × 4.33, monthly × 1
            const monthly = s.interval === 'week' ? s.amount_cents * 4.33 : s.amount_cents;
            return sum + monthly;
        }, 0);
    const filteredStripeSubs = stripeSubs.filter(s => {
        const matchFilter = subFilter === 'all' || s.status === subFilter;
        const matchSearch = !subSearch || s.customer_email?.toLowerCase().includes(subSearch.toLowerCase()) || s.customer_name?.toLowerCase().includes(subSearch.toLowerCase());
        return matchFilter && matchSearch;
    });
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
                        { id: 'subscriptions', label: `Abonnements`, icon: Crown },
                        { id: 'activity', label: 'Activité', icon: Activity },
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
                                        {['Email', 'Statut', 'Prochain paiement', 'Rendus', 'Paywall', 'Achats', 'Revenu', 'Source', 'Inscrit', 'Vu', 'ID'].map(h => (
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
                                            <td className="px-4 py-2.5">
                                                <SubStatusBadge status={u.subscription_status} />
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <span className="text-[10px] text-neutral-500">
                                                    {u.current_period_ends_at ? fmtFullDate(u.current_period_ends_at) : '—'}
                                                </span>
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

                {/* ── SUBSCRIPTIONS (données réelles Stripe) ── */}
                {tab === 'subscriptions' && <>

                    {/* Header avec bouton refresh Stripe */}
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] text-neutral-600 font-mono">
                            Source : <span className="text-violet-400">Stripe API</span> — données en temps réel
                        </p>
                        <button onClick={loadStripeData} disabled={stripeLoading}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-bold rounded-lg hover:bg-violet-500/20 transition-all disabled:opacity-40">
                            <RefreshCw className={`w-3 h-3 ${stripeLoading ? 'animate-spin' : ''}`} />
                            {stripeLoading ? 'Chargement…' : 'Actualiser Stripe'}
                        </button>
                    </div>

                    {stripeError && (
                        <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-mono">
                            ⚠ Erreur Stripe : {stripeError}
                        </div>
                    )}

                    {stripeLoading && !stripeData && (
                        <div className="py-20 flex items-center justify-center">
                            <p className="text-neutral-700 text-xs font-bold tracking-widest uppercase animate-pulse">Connexion Stripe…</p>
                        </div>
                    )}

                    {stripeData && <>
                        {/* ── KPI Cards ── */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                {
                                    label: 'Actifs',
                                    value: stripeSum.active + stripeSum.trialing,
                                    sub: `${stripeSum.trialing} en essai gratuit`,
                                    color: '#10B981', icon: Crown,
                                },
                                {
                                    label: 'MRR réel',
                                    value: `${(stripeMrr / 100).toFixed(0)}€`,
                                    sub: 'Mensuel récurrent Stripe',
                                    color: '#0091FF', icon: TrendingUp,
                                },
                                {
                                    label: 'En danger',
                                    value: stripeSum.past_due + (stripeData.subscriptions.filter(s => s.status === 'unpaid').length),
                                    sub: 'Past due + impayé',
                                    color: '#F59E0B', icon: AlertTriangle,
                                },
                                {
                                    label: 'Annulés',
                                    value: stripeSum.canceled,
                                    sub: `Solde dispo: ${(stripeData.balance.available_cents / 100).toFixed(0)}€`,
                                    color: '#6B7280', icon: XCircle,
                                },
                            ].map(({ label, value, sub, color, icon: Icon }) => (
                                <div key={label} className="bg-[#0c0c0c] border border-white/[0.06] rounded-2xl p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-600">{label}</p>
                                        <Icon className="w-3.5 h-3.5" style={{ color }} />
                                    </div>
                                    <p className="text-2xl font-black tracking-tight" style={{ color }}>{value}</p>
                                    <p className="text-[10px] text-neutral-700 mt-1.5">{sub}</p>
                                </div>
                            ))}
                        </div>

                        {/* ── Recherche + Filtres ── */}
                        <input value={subSearch} onChange={e => setSubSearch(e.target.value)}
                            placeholder="Rechercher par email ou nom…"
                            className="w-full bg-[#0c0c0c] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-700 outline-none focus:border-white/20 transition-all" />

                        <div className="flex gap-2 flex-wrap">
                            {([
                                { id: 'all',        label: `Tous (${stripeSubs.length})` },
                                { id: 'active',     label: `Actif (${stripeSum.active})` },
                                { id: 'trialing',   label: `Essai (${stripeSum.trialing})` },
                                { id: 'past_due',   label: `Past Due (${stripeSum.past_due})` },
                                { id: 'unpaid',     label: `Impayé (${stripeSubs.filter(s => s.status === 'unpaid').length})` },
                                { id: 'canceled',   label: `Annulé (${stripeSum.canceled})` },
                                { id: 'incomplete', label: `Incomplet (${stripeSum.incomplete})` },
                            ] as const).map(({ id, label }) => (
                                <button key={id} onClick={() => setSubFilter(id)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${subFilter === id ? 'bg-white text-black' : 'bg-white/[0.04] text-neutral-500 hover:text-neutral-300'}`}>
                                    {label}
                                </button>
                            ))}
                        </div>

                        {/* ── Table Stripe ── */}
                        <div className="bg-[#0c0c0c] border border-white/[0.06] rounded-2xl overflow-hidden">
                            <div className="px-4 py-3 border-b border-white/[0.05] flex items-center justify-between">
                                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-600 flex items-center gap-2">
                                    <Crown className="w-3 h-3" /> Abonnements Stripe
                                </p>
                                <p className="text-[10px] text-neutral-700">{filteredStripeSubs.length} / {stripeSubs.length}</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left whitespace-nowrap">
                                    <thead>
                                        <tr className="border-b border-white/[0.04]">
                                            {['Client', 'Plan / Prix', 'Statut', 'Abonné depuis', 'Période en cours', 'Essai', 'Sub ID'].map(h => (
                                                <th key={h} className="px-4 py-2.5 text-[9px] font-bold uppercase tracking-widest text-neutral-700">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStripeSubs.map(sub => {
                                            const daysLeft = Math.ceil((new Date(sub.current_period_end).getTime() - Date.now()) / 86400000);
                                            const isTrialActive = sub.trial_end && new Date(sub.trial_end) > new Date();
                                            return (
                                                <tr key={sub.id} className="border-b border-white/[0.03] hover:bg-white/[0.01] transition-colors">

                                                    {/* Client */}
                                                    <td className="px-4 py-3 max-w-[200px]">
                                                        <p className="text-xs text-neutral-300 truncate">{sub.customer_email ?? '—'}</p>
                                                        {sub.customer_name && <p className="text-[10px] text-neutral-600 truncate">{sub.customer_name}</p>}
                                                    </td>

                                                    {/* Plan / Prix */}
                                                    <td className="px-4 py-3">
                                                        <p className="text-xs font-bold text-white">
                                                            {(sub.amount_cents / 100).toFixed(2)}€
                                                            <span className="text-neutral-600 font-normal"> /{sub.interval === 'week' ? 'sem' : sub.interval === 'month' ? 'mois' : sub.interval}</span>
                                                        </p>
                                                        {sub.plan_name && sub.plan_name !== '—' && (
                                                            <p className="text-[10px] text-neutral-600 truncate max-w-[120px]">{sub.plan_name}</p>
                                                        )}
                                                    </td>

                                                    {/* Statut */}
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-col gap-1">
                                                            <SubStatusBadge status={sub.status} />
                                                            {sub.cancel_at_period_end && (
                                                                <span className="text-[9px] text-orange-400 font-bold">↩ Annulation en cours</span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Abonné depuis */}
                                                    <td className="px-4 py-3">
                                                        <p className="text-[10px] text-neutral-400">{fmtFullDate(sub.created)}</p>
                                                    </td>

                                                    {/* Période en cours */}
                                                    <td className="px-4 py-3">
                                                        <p className="text-[10px] text-neutral-400">{fmtFullDate(sub.current_period_end)}</p>
                                                        <p className={`text-[10px] font-bold flex items-center gap-1 mt-0.5 ${daysLeft <= 2 ? 'text-red-400' : daysLeft <= 5 ? 'text-amber-400' : 'text-neutral-600'}`}>
                                                            <Clock className="w-2.5 h-2.5" />
                                                            {daysLeft > 0 ? `J-${daysLeft}` : 'Expiré'}
                                                        </p>
                                                    </td>

                                                    {/* Essai */}
                                                    <td className="px-4 py-3">
                                                        {sub.trial_end ? (
                                                            <div>
                                                                <p className={`text-[10px] font-bold ${isTrialActive ? 'text-blue-400' : 'text-neutral-600'}`}>
                                                                    {isTrialActive ? '🔵 En cours' : '✓ Terminé'}
                                                                </p>
                                                                <p className="text-[9px] text-neutral-700 mt-0.5">Fin: {fmtDate(sub.trial_end)}</p>
                                                            </div>
                                                        ) : <span className="text-[10px] text-neutral-700">—</span>}
                                                    </td>

                                                    {/* Sub ID */}
                                                    <td className="px-4 py-3">
                                                        <button onClick={() => copy(sub.id)}
                                                            className="flex items-center gap-1 text-neutral-700 hover:text-violet-400 transition-colors font-mono text-[9px]">
                                                            {copied === sub.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                                            {sub.id.slice(0, 12)}…
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                {filteredStripeSubs.length === 0 && (
                                    <p className="py-10 text-center text-neutral-800 text-xs">
                                        {stripeLoading ? 'Chargement…' : `Aucun abonné${subFilter !== 'all' ? ' dans ce filtre' : ''}`}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* ── Flux d'activité récente ── */}
                        <div className="bg-[#0c0c0c] border border-white/[0.06] rounded-2xl overflow-hidden">
                            <div className="px-4 py-3 border-b border-white/[0.05] flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Activity className="w-3 h-3 text-neutral-600" />
                                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-600">
                                        Activité récente — toutes actions
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <p className="text-[10px] text-neutral-700">{recentActions.length} événements</p>
                                    <button onClick={loadRecentActions} disabled={actionsLoading}
                                        className="p-1 rounded hover:bg-white/[0.05] transition-colors disabled:opacity-30">
                                        <RefreshCw className={`w-3 h-3 text-neutral-600 ${actionsLoading ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>
                            </div>

                            {/* Filtres par type */}
                            <div className="px-4 py-2 border-b border-white/[0.04] flex gap-2 flex-wrap">
                                {([
                                    { id: 'all',        label: 'Tout' },
                                    { id: 'purchase',   label: '💳 Achats' },
                                    { id: 'render',     label: '✨ Rendus' },
                                    { id: 'generation', label: '🪄 Générations' },
                                    { id: 'usage',      label: '⚡ VP utilisés' },
                                    { id: 'bonus',      label: '🎁 Bonus' },
                                    { id: 'refund',     label: '↩ Remboursements' },
                                ] as const).map(({ id, label }) => (
                                    <button key={id} onClick={() => setActionKindFilter(id)}
                                        className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all ${actionKindFilter === id ? 'bg-white text-black' : 'bg-white/[0.03] text-neutral-600 hover:text-neutral-400'}`}>
                                        {label}
                                    </button>
                                ))}
                            </div>

                            {actionsLoading && recentActions.length === 0 ? (
                                <p className="py-8 text-center text-neutral-700 text-xs animate-pulse">Chargement…</p>
                            ) : (
                                <div className="divide-y divide-white/[0.03] max-h-[520px] overflow-y-auto">
                                    {recentActions
                                        .filter(a => actionKindFilter === 'all' || a.kind === actionKindFilter)
                                        .map(action => {
                                            const meta = ACTION_META[action.kind] ?? ACTION_META['usage'];
                                            const Icon = meta.icon;
                                            return (
                                                <div key={action.id} className="px-4 py-2.5 flex items-start gap-3 hover:bg-white/[0.01] transition-colors">
                                                    {/* Icône */}
                                                    <div className={`mt-0.5 w-6 h-6 rounded-full bg-white/[0.04] flex items-center justify-center flex-shrink-0`}>
                                                        <Icon className={`w-3 h-3 ${meta.cls}`} />
                                                    </div>

                                                    {/* Contenu */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className={`text-[9px] font-black uppercase tracking-widest ${meta.cls}`}>
                                                                {meta.label}
                                                            </span>
                                                            {action.email && (
                                                                <span className="text-[10px] text-neutral-500 truncate max-w-[180px]">
                                                                    {action.email}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {action.description && (
                                                            <p className="text-[10px] text-neutral-600 truncate mt-0.5">{action.description}</p>
                                                        )}
                                                    </div>

                                                    {/* Montant + heure */}
                                                    <div className="text-right flex-shrink-0">
                                                        {action.amount !== null && (
                                                            <p className={`text-xs font-bold ${action.amount > 0 ? 'text-emerald-400' : 'text-neutral-500'}`}>
                                                                {action.amount > 0 ? '+' : ''}{action.amount} VP
                                                            </p>
                                                        )}
                                                        <p className="text-[9px] text-neutral-700 mt-0.5">{fmtRelative(action.created_at)}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    {recentActions.filter(a => actionKindFilter === 'all' || a.kind === actionKindFilter).length === 0 && (
                                        <p className="py-8 text-center text-neutral-800 text-xs">Aucune action</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* ── Balance Stripe ── */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="bg-[#0c0c0c] border border-white/[0.06] rounded-2xl p-4">
                                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-600 mb-3">Solde Stripe disponible</p>
                                <p className="text-2xl font-black text-emerald-400">
                                    {(stripeData.balance.available_cents / 100).toFixed(2)}€
                                </p>
                                <p className="text-[10px] text-neutral-700 mt-1">
                                    En attente : {(stripeData.balance.pending_cents / 100).toFixed(2)}€
                                </p>
                            </div>
                            <div className="bg-[#0c0c0c] border border-white/[0.06] rounded-2xl p-4">
                                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-600 mb-3">Sessions de paiement</p>
                                <div className="flex gap-4 flex-wrap">
                                    {[
                                        { label: 'Complétées', value: stripeData.session_stats.completed, color: 'text-emerald-400' },
                                        { label: 'Expirées',   value: stripeData.session_stats.expired,   color: 'text-neutral-500' },
                                        { label: 'En cours',   value: stripeData.session_stats.open,      color: 'text-amber-400' },
                                    ].map(({ label, value, color }) => (
                                        <div key={label}>
                                            <p className={`text-lg font-black ${color}`}>{value}</p>
                                            <p className="text-[9px] text-neutral-700 uppercase tracking-wider">{label}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>}

                    {!stripeData && !stripeLoading && !stripeError && (
                        <div className="py-20 flex flex-col items-center justify-center gap-3">
                            <Crown className="w-8 h-8 text-neutral-800" />
                            <p className="text-neutral-700 text-xs">Cliquer sur "Actualiser Stripe" pour charger les abonnements</p>
                        </div>
                    )}
                </>}

                {/* ── ACTIVITY LOG ── */}
                {tab === 'activity' && <>
                    {/* Compteurs par type */}
                    <div className="grid grid-cols-3 md:grid-cols-9 gap-2">
                        {([
                            { type: 'signup',       label: 'Inscrits' },
                            { type: 'session',      label: 'Sessions' },
                            { type: 'paywall_view', label: 'Paywall' },
                            { type: 'purchase',     label: 'Achats' },
                            { type: 'render',       label: 'Rendus' },
                            { type: 'generation',   label: 'Génér.' },
                            { type: 'usage',        label: 'VP usés' },
                            { type: 'bonus',        label: 'Bonus' },
                            { type: 'refund',       label: 'Remb.' },
                        ] as const).map(({ type, label }) => {
                            const count = activityLog.filter(e => e.type === type).length;
                            const m = ACTIVITY_META[type];
                            const Icon = m.icon;
                            return (
                                <button key={type}
                                    onClick={() => setActivityTypeFilter(activityTypeFilter === type ? 'all' : type)}
                                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all ${activityTypeFilter === type ? 'bg-white/[0.07] border-white/20' : 'bg-[#0c0c0c] border-white/[0.06] hover:border-white/10'}`}>
                                    <Icon className={`w-3.5 h-3.5 ${m.cls}`} />
                                    <p className="text-base font-black text-white leading-none">{count}</p>
                                    <p className="text-[8px] text-neutral-600 uppercase tracking-wider">{label}</p>
                                </button>
                            );
                        })}
                    </div>

                    {/* Barre recherche + refresh */}
                    <div className="flex items-center gap-3">
                        <input
                            value={activitySearch}
                            onChange={e => setActivitySearch(e.target.value)}
                            placeholder="Rechercher par email…"
                            className="flex-1 bg-[#0c0c0c] border border-white/[0.07] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-700 outline-none focus:border-white/20 transition-all"
                        />
                        <button onClick={loadActivityLog} disabled={activityLoading}
                            className="p-2 rounded-xl bg-[#0c0c0c] border border-white/[0.07] hover:border-white/15 transition-colors disabled:opacity-30">
                            <RefreshCw className={`w-3.5 h-3.5 text-neutral-500 ${activityLoading ? 'animate-spin' : ''}`} />
                        </button>
                        <p className="text-[10px] text-neutral-700 whitespace-nowrap">{activityLog.length} événements</p>
                    </div>

                    {/* Feed */}
                    <div className="bg-[#0c0c0c] border border-white/[0.06] rounded-2xl overflow-hidden">
                        {activityLoading && activityLog.length === 0 ? (
                            <p className="py-12 text-center text-neutral-700 text-xs animate-pulse">Chargement du journal…</p>
                        ) : (
                            <div className="divide-y divide-white/[0.03]">
                                {activityLog
                                    .filter(e =>
                                        (activityTypeFilter === 'all' || e.type === activityTypeFilter) &&
                                        (!activitySearch || e.email?.toLowerCase().includes(activitySearch.toLowerCase()) || e.full_name?.toLowerCase().includes(activitySearch.toLowerCase()))
                                    )
                                    .map(event => {
                                        const m = ACTIVITY_META[event.type] ?? ACTIVITY_META['usage'];
                                        const Icon = m.icon;
                                        return (
                                            <div key={event.id} className="px-4 py-2.5 flex items-center gap-3 hover:bg-white/[0.015] transition-colors">
                                                <div className="w-7 h-7 rounded-full bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                                                    <Icon className={`w-3 h-3 ${m.cls}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className={`text-[9px] font-black uppercase tracking-widest ${m.cls}`}>{m.label}</span>
                                                        {event.email && (
                                                            <span className="text-[10px] text-neutral-400 truncate max-w-[200px]">{event.email}</span>
                                                        )}
                                                        {event.meta && (
                                                            <span className="text-[9px] text-neutral-700 bg-white/[0.03] px-1.5 py-0.5 rounded-md">{event.meta}</span>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-neutral-600 truncate mt-0.5">{event.description}</p>
                                                </div>
                                                <div className="text-right flex-shrink-0 flex flex-col items-end gap-0.5">
                                                    <p className="text-[9px] text-neutral-600">{fmtRelative(event.created_at)}</p>
                                                    <p className="text-[8px] text-neutral-800 font-mono">{new Date(event.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                {activityLog.filter(e =>
                                    (activityTypeFilter === 'all' || e.type === activityTypeFilter) &&
                                    (!activitySearch || e.email?.toLowerCase().includes(activitySearch.toLowerCase()))
                                ).length === 0 && (
                                    <p className="py-12 text-center text-neutral-800 text-xs">Aucun événement{activityTypeFilter !== 'all' ? ' dans ce filtre' : ''}</p>
                                )}
                            </div>
                        )}
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
