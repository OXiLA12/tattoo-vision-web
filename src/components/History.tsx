import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getHistory, deleteFromHistory } from '../utils/historyUtils';
import { Database } from '../types/database.types';
import { Trash2, RotateCw, Calendar, Sparkles, Loader2 } from 'lucide-react';
import { ImageData, TattooTransform } from '../types';
import PlanPricingModal from './PlanPricingModal';
import { loadImageFromUrl } from '../utils/imageUtils';
import CreditsDisplay from './CreditsDisplay';
import { useLanguage } from '../contexts/LanguageContext';

type HistoryItem = Database['public']['Tables']['tattoo_history']['Row'];

interface HistoryProps {
    onLoad: (body: ImageData, tattoo: ImageData, transform: TattooTransform) => void;
}

export default function History({ onLoad }: HistoryProps) {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [showPaywall, setShowPaywall] = useState(false);

    useEffect(() => {
        if (user) {
            loadHistory();
        }
    }, [user]);

    const loadHistory = async () => {
        if (!user) return;
        setLoading(true);
        const data = await getHistory(user.id);
        setHistory(data);
        setLoading(false);
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm(t('language') === 'fr' ? 'Êtes-vous sûr de vouloir supprimer cette création ?' : 'Are you sure you want to delete this creation?')) return;

        setDeletingId(id);
        const success = await deleteFromHistory(id);
        if (success) {
            setHistory(history.filter(item => item.id !== id));
        }
        setDeletingId(null);
    };

    const handleLoad = async (item: HistoryItem) => {
        if (item.transform_data) {
            try {
                setLoadingItemId(item.id);
                const [bodyData, tattooData] = await Promise.all([
                    loadImageFromUrl(item.body_image_url),
                    loadImageFromUrl(item.tattoo_image_url)
                ]);

                const transform = item.transform_data as TattooTransform;
                transform.opacity = 0.75;
                onLoad(bodyData, tattooData, transform);
            } catch (error) {
                console.error('Failed to load history item:', error);
                alert(t('language') === 'fr' ? 'Impossible de charger cette création. Réessayez.' : 'Failed to load this creation. Please try again.');
            } finally {
                setLoadingItemId(null);
            }
        }
    };

    // Skeleton loader pendant le chargement initial
    if (loading) {
        return (
            <div className="p-4 pt-24 md:p-12 max-w-7xl mx-auto min-h-[100dvh]">
                <div className="mb-10">
                    <div className="h-10 w-48 bg-neutral-800 rounded-xl animate-pulse mb-3" />
                    <div className="h-4 w-64 bg-neutral-900 rounded-lg animate-pulse" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="aspect-[3/4] rounded-2xl bg-neutral-800 animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 pt-24 md:p-12 max-w-7xl mx-auto animate-fade-in relative pb-32 md:pb-12 min-h-[100dvh]">
            <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black text-neutral-50 mb-2 tracking-tight">{t('history_title')}</h1>
                    <p className="text-neutral-400 font-light">{t('history_subtitle')}</p>
                </div>
                <CreditsDisplay />
            </div>

            {history.length === 0 ? (
                <div className="text-center py-20 bg-neutral-900/30 rounded-3xl border border-neutral-800 border-dashed">
                    <Sparkles className="w-10 h-10 text-neutral-700 mx-auto mb-4" />
                    <p className="text-neutral-500 font-light text-lg">{t('history_empty')}</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {history.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => !loadingItemId && handleLoad(item)}
                            className={`group relative aspect-[3/4] rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-neutral-900/50 hover:border-neutral-700 hover:scale-[1.02] ${loadingItemId === item.id ? 'opacity-70 cursor-wait' : ''}`}
                        >
                            {/* Image avec lazy loading natif */}
                            <img
                                src={item.result_image_url}
                                alt="Création"
                                loading="lazy"
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />

                            {/* Overlay de chargement */}
                            {loadingItemId === item.id && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                                </div>
                            )}

                            {/* Badge "Réaliste" — toujours visible */}
                            {item.is_realistic && (
                                <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[10px] text-[#00DC82] border border-[#00DC82]/20">
                                    <Sparkles className="w-3 h-3" />
                                    <span>{t('history_realistic')}</span>
                                </div>
                            )}

                            {/* Footer toujours visible */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 pt-10">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 text-neutral-400 text-[10px]">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(item.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {/* Bouton supprimer (visible au hover) */}
                                        <button
                                            onClick={(e) => handleDelete(item.id, e)}
                                            disabled={deletingId === item.id}
                                            className="p-1.5 bg-red-500/10 hover:bg-red-500/30 text-red-400 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            {deletingId === item.id ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-3 h-3" />
                                            )}
                                        </button>

                                        {/* Bouton charger (visible au hover) */}
                                        <span className="flex items-center gap-1 text-neutral-200 text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                            <RotateCw className="w-3 h-3" />
                                            {t('history_load')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showPaywall && (
                <PlanPricingModal onClose={() => setShowPaywall(false)} />
            )}
        </div>
    );
}
