import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getHistory, deleteFromHistory } from '../utils/historyUtils';
import { Database } from '../types/database.types';
import { Trash2, RotateCw, Calendar, Sparkles, Loader2 } from 'lucide-react';
import { ImageData, TattooTransform } from '../types';
import { canUseFeature } from '../utils/authRules';
import PlanPricingModal from './PlanPricingModal';
import { loadImageFromUrl } from '../utils/imageUtils';
import CreditsDisplay from './CreditsDisplay';

type HistoryItem = Database['public']['Tables']['tattoo_history']['Row'];

interface HistoryProps {
    onLoad: (body: ImageData, tattoo: ImageData, transform: TattooTransform) => void;
}

export default function History({ onLoad }: HistoryProps) {
    const { user, profile } = useAuth();
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [showPaywall, setShowPaywall] = useState(false);

    useEffect(() => {
        if (user && profile) {
            const { allowed } = canUseFeature(profile.plan, 'SAVE_HISTORY');
            if (allowed) {
                loadHistory();
            } else {
                setLoading(false);
            }
        }
    }, [user, profile]);

    const loadHistory = async () => {
        if (!user) return;
        setLoading(true);
        const data = await getHistory(user.id);
        setHistory(data);
        setLoading(false);
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this creation?')) return;

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
                // Convert Supabase storage URLs to persistent data URLs
                const [bodyData, tattooData] = await Promise.all([
                    loadImageFromUrl(item.body_image_url),
                    loadImageFromUrl(item.tattoo_image_url)
                ]);

                onLoad(bodyData, tattooData, item.transform_data as TattooTransform);
            } catch (error) {
                console.error('Failed to load history item:', error);
                alert('Failed to load this creation. Please try again.');
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-neutral-400 animate-spin" />
            </div>
        );
    }

    const { allowed } = canUseFeature(profile?.plan || 'free', 'SAVE_HISTORY');

    return (
        <div className="p-6 md:p-12 max-w-7xl mx-auto animate-fade-in relative">
            <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-light text-neutral-50 mb-2">History</h1>
                    <p className="text-neutral-400 font-light">Your past creations and realistic renders</p>
                </div>
                <div className="hidden md:block w-full md:w-auto">
                    <CreditsDisplay />
                </div>
            </div>

            {!allowed ? (
                <div className="text-center py-32 bg-neutral-900/20 rounded-[2rem] border border-neutral-800/50 border-dashed">
                    <div className="w-16 h-16 bg-neutral-800/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Calendar className="w-8 h-8 text-neutral-600" />
                    </div>
                    <h2 className="text-xl font-medium text-neutral-200 mb-2">History is for PLUS users</h2>
                    <p className="text-neutral-400 font-light max-w-md mx-auto mb-8">
                        Upgrade to PLUS or higher to save and access your past tattoo designs.
                    </p>
                    <button
                        onClick={() => setShowPaywall(true)}
                        className="px-8 py-4 bg-white text-neutral-950 rounded-2xl hover:bg-neutral-100 transition-premium font-bold text-sm shadow-xl active:scale-95"
                    >
                        Upgrade Now
                    </button>
                </div>
            ) : history.length === 0 ? (
                <div className="text-center py-20 bg-neutral-900/30 rounded-3xl border border-neutral-800 border-dashed">
                    <p className="text-neutral-500 font-light text-lg">No history yet. Start creating!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {history.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => handleLoad(item)}
                            className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 cursor-pointer transition-premium hover:shadow-2xl hover:shadow-neutral-900/50 hover:border-neutral-700"
                        >
                            <img
                                src={item.result_image_url}
                                alt="Creation"
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />

                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-neutral-300 text-xs font-light">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(item.created_at).toLocaleDateString()}
                                    </div>
                                    {item.is_realistic && (
                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-neutral-100/10 backdrop-blur-md rounded-lg text-xs text-neutral-200 border border-white/10">
                                            <Sparkles className="w-3 h-3" />
                                            <span>Realistic</span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 flex items-center justify-between">
                                    <span className="flex items-center gap-2 text-neutral-200 text-sm font-medium">
                                        <RotateCw className="w-4 h-4" />
                                        Load Project
                                    </span>

                                    <button
                                        onClick={(e) => handleDelete(item.id, e)}
                                        disabled={deletingId === item.id}
                                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-full transition-colors"
                                    >
                                        {deletingId === item.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="w-4 h-4" />
                                        )}
                                    </button>
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
