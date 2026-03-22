import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from 'recharts';
import {
  RefreshCw, TrendingUp, Eye, Heart, Share2, MessageCircle,
  Users, Bookmark, Play, ExternalLink, Lightbulb, Pin,
  Mic, Hash, Clock, Zap, Target, AlertTriangle,
} from 'lucide-react';
import { fetchTikTokData, getSeedData, TikTokData, TikTokVideo } from '../services/apifyService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

function engagementRate(v: TikTokVideo): number {
  if (!v.playCount) return 0;
  return ((v.diggCount + v.shareCount + v.commentCount) / v.playCount) * 100;
}

function shortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

function shortTitle(text: string, max = 28): string {
  return text.length > max ? text.slice(0, max) + '…' : text;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color?: string;
  highlight?: boolean;
}

function StatCard({ label, value, sub, icon: Icon, color = '#0091FF', highlight }: StatCardProps) {
  return (
    <div
      className={`rounded-2xl p-4 border flex flex-col gap-2 transition-all
        ${highlight
          ? 'bg-[#0091FF]/10 border-[#0091FF]/40 shadow-[0_0_20px_rgba(0,145,255,0.15)]'
          : 'bg-[#18181b] border-[#27272a]'}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#71717a] font-medium uppercase tracking-wider">{label}</span>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="text-2xl font-black text-white">{value}</div>
      {sub && <div className="text-xs text-[#52525b]">{sub}</div>}
    </div>
  );
}

// ─── Recommendation Card ──────────────────────────────────────────────────────

interface RecCardProps {
  title: string;
  body: string;
  priority: 'high' | 'medium' | 'low';
  icon: React.ElementType;
}

function RecCard({ title, body, priority, icon: Icon }: RecCardProps) {
  const colors = {
    high: { bg: 'bg-red-500/10', border: 'border-red-500/30', dot: 'bg-red-500', text: 'text-red-400' },
    medium: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', dot: 'bg-yellow-500', text: 'text-yellow-400' },
    low: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', dot: 'bg-emerald-500', text: 'text-emerald-400' },
  }[priority];

  return (
    <div className={`rounded-xl p-4 border ${colors.bg} ${colors.border} flex gap-3`}>
      <div className="mt-0.5">
        <Icon className={`w-4 h-4 ${colors.text}`} />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
          <span className="text-sm font-bold text-white">{title}</span>
        </div>
        <p className="text-xs text-[#a1a1aa] leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

// ─── AI Analysis ──────────────────────────────────────────────────────────────

function buildRecommendations(data: TikTokData) {
  const videos = data.videos;
  const bestVideo = [...videos].sort((a, b) => b.playCount - a.playCount)[0];
  const worstVideo = [...videos].sort((a, b) => a.playCount - b.playCount)[0];
  const avgViews = videos.reduce((s, v) => s + v.playCount, 0) / (videos.length || 1);
  const viralRatio = bestVideo ? bestVideo.playCount / (avgViews || 1) : 0;

  const bestHashtags = bestVideo?.hashtags.map((h) => `#${h.name}`).join(' ') ?? '';
  const bestMusic = bestVideo?.musicMeta;

  const recs = [];

  // Viral format
  if (viralRatio > 50) {
    recs.push({
      priority: 'high' as const,
      icon: Zap,
      title: 'Reproduis ton format viral',
      body: `Ta vidéo "${shortTitle(bestVideo?.text ?? '')}" a ${fmt(bestVideo?.playCount ?? 0)} vues — ${Math.round(viralRatio)}x la moyenne. Fais des variations de ce format (prank, humour, émotion forte) chaque semaine.`,
    });
  }

  // Hashtags
  if (bestHashtags) {
    recs.push({
      priority: 'high' as const,
      icon: Hash,
      title: 'Utilise les hashtags gagnants',
      body: `Les hashtags ${bestHashtags} t'ont apporté le plus de vues. Mixe hashtags EN + FR : #tattoo #tattooart #tatouage pour toucher les deux audiences.`,
    });
  }

  // Music
  if (bestMusic && !bestMusic.musicOriginal) {
    recs.push({
      priority: 'medium' as const,
      icon: Mic,
      title: 'Son trending > son original',
      body: `Ta vidéo virale utilisait "${bestMusic.musicName}". TikTok booste les vidéos avec des sons trending — vérifie chaque semaine les sons populaires dans #tattoo.`,
    });
  }

  // Posting frequency
  if (data.profile.video < 15) {
    recs.push({
      priority: 'high' as const,
      icon: Clock,
      title: 'Poste plus souvent',
      body: `${data.profile.video} vidéos au total — c'est insuffisant. Vise 4-5 vidéos/semaine pour que l'algorithme TikTok te pousse. Les créateurs qui percent postent en continu.`,
    });
  }

  // CTA
  recs.push({
    priority: 'medium' as const,
    icon: Target,
    title: 'Ajoute un CTA clair dans chaque vidéo',
    body: `Dis "Essaie tattoovisionapp.com — lien en bio !" à la fin de chaque vidéo. Avec 458K vues sur ta meilleure vidéo, 1% de conversion = 4 580 visites.`,
  });

  // Engagement
  const avgEng = videos.reduce((s, v) => s + engagementRate(v), 0) / (videos.length || 1);
  if (avgEng > 5) {
    recs.push({
      priority: 'low' as const,
      icon: Heart,
      title: 'Taux d\'engagement excellent',
      body: `${avgEng.toFixed(1)}% de taux d'engagement (moyenne industrie = 2-3%). Tes abonnés sont très engagés. Réponds aux commentaires pour booster encore plus l'algorithme.`,
    });
  }

  // Slideshow vs video
  const slideshows = videos.filter((v) => v.isSlideshow);
  const vids = videos.filter((v) => !v.isSlideshow);
  if (slideshows.length && vids.length) {
    const avgSlide = slideshows.reduce((s, v) => s + v.playCount, 0) / slideshows.length;
    const avgVid = vids.reduce((s, v) => s + v.playCount, 0) / vids.length;
    if (avgVid > avgSlide * 2) {
      recs.push({
        priority: 'medium' as const,
        icon: Play,
        title: 'Vidéos > Slideshows',
        body: `Les vidéos génèrent ${Math.round(avgVid / avgSlide)}x plus de vues que tes slideshows. Privilégie le format vidéo (même 15 secondes) pour maximiser la portée.`,
      });
    }
  }

  return recs;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TikTokManager() {
  const [data, setData] = useState<TikTokData>(getSeedData());
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);

  useEffect(() => {
    setData(getSeedData());
  }, []);

  async function handleRefresh() {
    setLoading(true);
    try {
      const fresh = await fetchTikTokData(true);
      setData(fresh);
      setLastRefresh(new Date().toLocaleTimeString('fr-FR'));
    } finally {
      setLoading(false);
    }
  }

  const videos = data.videos;
  const totalViews = videos.reduce((s, v) => s + v.playCount, 0);
  const totalLikes = videos.reduce((s, v) => s + v.diggCount, 0);
  const totalShares = videos.reduce((s, v) => s + v.shareCount, 0);
  const totalComments = videos.reduce((s, v) => s + v.commentCount, 0);
  const avgEng = videos.reduce((s, v) => s + engagementRate(v), 0) / (videos.length || 1);
  const bestVideo = [...videos].sort((a, b) => b.playCount - a.playCount)[0];

  const chartData = [...videos]
    .sort((a, b) => new Date(a.createTimeISO).getTime() - new Date(b.createTimeISO).getTime())
    .map((v) => ({
      name: shortDate(v.createTimeISO),
      Vues: v.playCount,
      Likes: v.diggCount,
      Partages: v.shareCount,
    }));

  const engagementData = videos.map((v) => ({
    name: shortDate(v.createTimeISO),
    Engagement: parseFloat(engagementRate(v).toFixed(2)),
  }));

  const radarData = bestVideo
    ? [
        { metric: 'Vues', value: Math.min(100, (bestVideo.playCount / 500000) * 100) },
        { metric: 'Likes', value: Math.min(100, (bestVideo.diggCount / 35000) * 100) },
        { metric: 'Partages', value: Math.min(100, (bestVideo.shareCount / 3000) * 100) },
        { metric: 'Commentaires', value: Math.min(100, (bestVideo.commentCount / 500) * 100) },
        { metric: 'Saves', value: Math.min(100, (bestVideo.collectCount / 2500) * 100) },
      ]
    : [];

  const recommendations = buildRecommendations(data);

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-sm font-bold">
                T
              </div>
              <h1 className="text-xl font-black text-white">Social Manager</h1>
              <span className="text-xs text-[#52525b] bg-[#18181b] border border-[#27272a] rounded-full px-2 py-0.5">
                @kali.aitools
              </span>
            </div>
            <p className="text-xs text-[#52525b]">
              {data.profile.video} vidéos · {fmt(data.profile.fans)} abonnés ·{' '}
              {fmt(data.profile.heart)} likes totaux
              {lastRefresh && ` · Mis à jour à ${lastRefresh}`}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0091FF]/10 border border-[#0091FF]/30 text-[#0091FF] text-sm font-semibold hover:bg-[#0091FF]/20 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Scraping…' : 'Rafraîchir'}
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <StatCard label="Vues totales" value={fmt(totalViews)} sub={`${videos.length} vidéos scrapées`} icon={Eye} />
          <StatCard label="Likes totaux" value={fmt(totalLikes)} sub={`Profil: ${fmt(data.profile.heart)}`} icon={Heart} color="#ec4899" />
          <StatCard label="Partages" value={fmt(totalShares)} icon={Share2} color="#a78bfa" />
          <StatCard label="Engagement moyen" value={`${avgEng.toFixed(1)}%`} sub="Industrie ~2.5%" icon={TrendingUp} color="#34d399" highlight={avgEng > 5} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <StatCard label="Abonnés" value={fmt(data.profile.fans)} icon={Users} />
          <StatCard label="Commentaires" value={fmt(totalComments)} icon={MessageCircle} color="#fb923c" />
          <StatCard label="Meilleure vidéo" value={fmt(bestVideo?.playCount ?? 0)} sub="vues" icon={TrendingUp} color="#fbbf24" highlight />
          <StatCard label="Saves" value={fmt(videos.reduce((s, v) => s + v.collectCount, 0))} icon={Bookmark} color="#38bdf8" />
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">

          {/* Views Bar Chart */}
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-5">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#0091FF]" />
              Vues par vidéo
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} tickFormatter={fmt} />
                <Tooltip
                  contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8 }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(v: number) => [fmt(v), '']}
                />
                <Bar dataKey="Vues" fill="#0091FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Engagement Line */}
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-5">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Taux d'engagement (%)
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={engagementData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="name" tick={{ fill: '#71717a', fontSize: 11 }} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8 }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(v: number) => [`${v}%`, 'Engagement']}
                />
                <Bar dataKey="Engagement" fill="#34d399" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Best Video Radar + Video Table */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">

          {/* Best Video Radar */}
          {bestVideo && (
            <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-5">
              <h2 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                <Pin className="w-4 h-4 text-yellow-400" />
                Meilleure vidéo — Analyse
              </h2>
              <p className="text-xs text-[#52525b] mb-4 line-clamp-1">{bestVideo.text}</p>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#27272a" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: '#71717a', fontSize: 10 }} />
                  <Radar name="score" dataKey="value" stroke="#0091FF" fill="#0091FF" fillOpacity={0.25} />
                </RadarChart>
              </ResponsiveContainer>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="text-center">
                  <div className="text-sm font-black text-white">{fmt(bestVideo.playCount)}</div>
                  <div className="text-xs text-[#52525b]">vues</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-black text-pink-400">{engagementRate(bestVideo).toFixed(1)}%</div>
                  <div className="text-xs text-[#52525b]">engagement</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-black text-purple-400">{fmt(bestVideo.shareCount)}</div>
                  <div className="text-xs text-[#52525b]">partages</div>
                </div>
              </div>
            </div>
          )}

          {/* AI Recommendations */}
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-5">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-400" />
              Recommandations IA
            </h2>
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {recommendations.map((rec, i) => (
                <RecCard key={i} {...rec} />
              ))}
            </div>
          </div>
        </div>

        {/* Video Table */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-5 mb-8">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Play className="w-4 h-4 text-[#0091FF]" />
            Toutes les vidéos scrapées
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-[#52525b] border-b border-[#27272a]">
                  <th className="text-left pb-2 pr-4 font-medium">Vidéo</th>
                  <th className="text-left pb-2 pr-4 font-medium">Date</th>
                  <th className="text-right pb-2 pr-4 font-medium">Vues</th>
                  <th className="text-right pb-2 pr-4 font-medium">Likes</th>
                  <th className="text-right pb-2 pr-4 font-medium">Partages</th>
                  <th className="text-right pb-2 pr-4 font-medium">Comments</th>
                  <th className="text-right pb-2 font-medium">Eng.%</th>
                </tr>
              </thead>
              <tbody>
                {[...videos]
                  .sort((a, b) => b.playCount - a.playCount)
                  .map((v) => (
                    <tr key={v.id} className="border-b border-[#27272a]/50 hover:bg-white/2 transition-colors">
                      <td className="py-3 pr-4 max-w-[200px]">
                        <div className="flex items-center gap-2">
                          {v.isPinned && <Pin className="w-3 h-3 text-yellow-400 flex-shrink-0" />}
                          {v.isSlideshow && <Bookmark className="w-3 h-3 text-blue-400 flex-shrink-0" />}
                          <a
                            href={v.webVideoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white hover:text-[#0091FF] truncate transition-colors flex items-center gap-1"
                            title={v.text}
                          >
                            <span className="truncate">{shortTitle(v.text, 32)}</span>
                            <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-50" />
                          </a>
                        </div>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {v.hashtags.slice(0, 3).map((h) => (
                            <span key={h.name} className="text-xs text-[#0091FF]/70">#{h.name}</span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-[#71717a] text-xs whitespace-nowrap">
                        {shortDate(v.createTimeISO)}
                      </td>
                      <td className="py-3 pr-4 text-right font-bold tabular-nums">
                        {fmt(v.playCount)}
                      </td>
                      <td className="py-3 pr-4 text-right text-pink-400 tabular-nums">
                        {fmt(v.diggCount)}
                      </td>
                      <td className="py-3 pr-4 text-right text-purple-400 tabular-nums">
                        {fmt(v.shareCount)}
                      </td>
                      <td className="py-3 pr-4 text-right text-orange-400 tabular-nums">
                        {fmt(v.commentCount)}
                      </td>
                      <td className={`py-3 text-right font-bold tabular-nums ${engagementRate(v) > 5 ? 'text-emerald-400' : 'text-[#71717a]'}`}>
                        {engagementRate(v).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {data.profile.video > videos.length && (
            <div className="mt-4 flex items-center gap-2 text-xs text-[#52525b]">
              <AlertTriangle className="w-3 h-3 text-yellow-500/70" />
              {data.profile.video - videos.length} vidéo(s) manquante(s) — clique "Rafraîchir" pour tenter de récupérer plus de données TikTok.
            </div>
          )}
        </div>

        {/* Strategy Summary */}
        <div className="bg-gradient-to-br from-[#0091FF]/10 to-[#a855f7]/10 border border-[#0091FF]/20 rounded-2xl p-6">
          <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-[#0091FF]" />
            Stratégie pour acquérir des clients tattoovisionapp.com
          </h2>
          <div className="grid md:grid-cols-3 gap-4 text-xs text-[#a1a1aa]">
            <div>
              <div className="font-bold text-white mb-1">Contenu qui convertit</div>
              <ul className="space-y-1 list-disc list-inside">
                <li>Vidéos prank/humour avec tatouage visible</li>
                <li>Avant/après tatouage (réel vs app)</li>
                <li>"J'ai utilisé une IA pour choisir mon tattoo"</li>
                <li>Réactions de tatoueurs à l'app</li>
              </ul>
            </div>
            <div>
              <div className="font-bold text-white mb-1">Hashtags à tester</div>
              <ul className="space-y-1 list-disc list-inside">
                <li>#tattoo #tattooart #tattoolife</li>
                <li>#tatouage #tatoueur #ink</li>
                <li>#AIart #tattooideas</li>
                <li>#prankvideo #fyp</li>
              </ul>
            </div>
            <div>
              <div className="font-bold text-white mb-1">CTA dans les vidéos</div>
              <ul className="space-y-1 list-disc list-inside">
                <li>"Lien en bio → tattoovisionapp.com"</li>
                <li>Montre l'app en action dans la vidéo</li>
                <li>Demande "Quel tatouage tu ferais ?"</li>
                <li>Réponds aux comments avec le lien</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
