import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getHistory, deleteFromHistory } from '../utils/historyUtils';
import { Database } from '../types/database.types';
import { Trash2, RotateCw, Calendar, Sparkles, Loader2 } from 'lucide-react';
import { ImageData, TattooTransform } from '../types';
import PlanPricingModal from './PlanPricingModal';
import { loadImageFromUrl } from '../utils/imageUtils';
import CreditsDisplay from './CreditsDisplay';

type HistoryItem = Database['public']['Tables']['tattoo_history']['Row'];

interface HistoryProps {
    onLoad: (body: ImageData, tattoo: ImageData, transform: TattooTransform) => void;
}

export default function History({ onLoad }: HistoryProps) {
    const { user } = useAuth();
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [showPaywall, setShowPaywall] = useState(false);

    useEffect(() => {
        if (user) {
            // Everyone can now access history - no plan restrictions
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

    return (
        <div className="p-4 md:p-12 max-w-7xl mx-auto animate-fade-in relative pb-32 md:pb-12 min-h-[100dvh]">
            <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-light text-neutral-50 mb-2">History</h1>
                    <p className="text-neutral-400 font-light">Your past creations and realistic renders</p>
                </div>
                <div className="hidden md:block w-full md:w-auto">
                    <CreditsDisplay />
                </div>
            </div>

            {history.length === 0 ? (
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
