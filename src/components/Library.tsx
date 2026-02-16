import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { Database } from '../types/database.types';
import { Plus, Search, Trash2, Heart, Upload, Loader2, X } from 'lucide-react';
import { ImageData } from '../types';
import PlanPricingModal from './PlanPricingModal';
import { saveToMyLibrary } from '../utils/libraryUtils';
import { canUseFeature } from '../utils/authRules';
import { loadImageFromUrl } from '../utils/imageUtils';
import CreditsDisplay from './CreditsDisplay';

type LibraryItem = Database['public']['Tables']['tattoo_library']['Row'];
type LibraryUpdate = Database['public']['Tables']['tattoo_library']['Update'];

interface LibraryProps {
    onSelect: (tattoo: ImageData) => void;
}

export default function Library({ onSelect }: LibraryProps) {
    const { user, profile } = useAuth();
    const [activeTab, setActiveTab] = useState<'predefined' | 'mine'>('predefined');
    const [sourceFilter, setSourceFilter] = useState<'all' | 'generated' | 'imported'>('all');
    const [items, setItems] = useState<LibraryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showPaywall, setShowPaywall] = useState(false);

    // Upload state
    const [newTattooName, setNewTattooName] = useState('');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            loadLibrary();
        }
    }, [user, activeTab]);

    const handleUploadClick = () => {
        // Everyone can now upload tattoos - no plan restrictions
        setShowUploadModal(true);
    };

    const loadLibrary = async () => {
        if (!user) return;
        setLoading(true);

        let query = supabase
            .from('tattoo_library')
            .select('*')
            .order('created_at', { ascending: false });

        if (activeTab === 'predefined') {
            query = query.eq('source', 'predefined');
        } else {
            query = query.eq('user_id', user.id).in('source', ['generated', 'imported']);
        }

        const { data, error } = await query;

        if (!error && data) {
            setItems(data as LibraryItem[]);
        }
        setLoading(false);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            setPreviewUrl(result);
        };
        reader.readAsDataURL(file);
    };

    const handleSaveTattoo = async () => {
        if (!user || !previewUrl || !newTattooName) return;

        setUploading(true);
        // Using our new utility which handles hashing and storage
        const result = await saveToMyLibrary(
            user.id,
            previewUrl,
            newTattooName,
            'imported'
        );

        if (result.success) {
            setShowUploadModal(false);
            setPreviewUrl(null);
            setNewTattooName('');
            loadLibrary();
        }
        setUploading(false);
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Delete this tattoo from library?')) return;

        const { error } = await supabase
            .from('tattoo_library')
            .delete()
            .eq('id', id);

        if (!error) {
            setItems(items.filter(item => item.id !== id));
        }
    };

    const toggleFavorite = async (id: string, currentStatus: boolean, e: React.MouseEvent) => {
        e.stopPropagation();

        const updateData: LibraryUpdate = { is_favorite: !currentStatus };
        const { error } = await (supabase
            .from('tattoo_library') as any)
            .update(updateData)
            .eq('id', id);

        if (!error) {
            setItems(items.map(item =>
                item.id === id ? { ...item, is_favorite: !currentStatus } : item
            ));
        }
    };

    const filteredItems = items.filter(item => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
            item.name.toLowerCase().includes(searchLower) ||
            item.category?.toLowerCase().includes(searchLower) ||
            (item.tags && item.tags.some(tag => tag.toLowerCase().includes(searchLower)));

        const matchesSource = sourceFilter === 'all' || item.source === sourceFilter;

        return matchesSearch && matchesSource;
    });

    const handleSelect = async (item: LibraryItem) => {
        try {
            // Convert Supabase storage URL to persistent data URL
            const imageData = await loadImageFromUrl(item.image_url);
            onSelect(imageData);
        } catch (error) {
            console.error('Failed to load tattoo from library:', error);
            alert('Failed to load this tattoo. Please try again.');
        }
    };

    if (loading && items.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-neutral-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-12 max-w-7xl mx-auto animate-fade-in relative pb-32 md:pb-12 min-h-[100dvh]">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-4xl font-light text-neutral-50 mb-2">Tattoo Library</h1>
                    <p className="text-neutral-400 font-light">Explore and manage your collection</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:block">
                        <CreditsDisplay />
                    </div>
                    <button
                        onClick={handleUploadClick}
                        className="flex items-center gap-2 px-6 py-3 bg-neutral-100 text-neutral-900 rounded-xl hover:bg-white transition-premium shadow-lg shadow-white/5"
                    >
                        <Plus className="w-5 h-5" />
                        <span className="font-medium text-sm">Add New Tattoo</span>
                    </button>
                </div>
            </div>

            {/* Tabs & Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="flex p-1 bg-neutral-900/50 border border-neutral-800 rounded-2xl w-fit">
                    <button
                        onClick={() => setActiveTab('predefined')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-premium ${activeTab === 'predefined'
                            ? 'bg-neutral-800 text-neutral-50 shadow-lg'
                            : 'text-neutral-500 hover:text-neutral-300'
                            }`}
                    >
                        Official Library
                    </button>
                    <button
                        onClick={() => setActiveTab('mine')}
                        className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-premium ${activeTab === 'mine'
                            ? 'bg-neutral-800 text-neutral-50 shadow-lg'
                            : 'text-neutral-500 hover:text-neutral-300'
                            }`}
                    >
                        My Tattoos
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                    {activeTab === 'mine' && (
                        <div className="flex items-center gap-2 p-1 bg-neutral-900/30 rounded-xl border border-neutral-800/50">
                            {(['all', 'generated', 'imported'] as const).map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => setSourceFilter(filter)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-premium ${sourceFilter === filter
                                        ? 'bg-neutral-700 text-neutral-100'
                                        : 'text-neutral-500 hover:text-neutral-300'
                                        }`}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search tattoos..."
                            className="w-full pl-11 pr-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-premium text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Grid */}
            {filteredItems.length === 0 ? (
                <div className="text-center py-32 bg-neutral-900/20 rounded-[2rem] border border-neutral-800/50 border-dashed">
                    <div className="w-16 h-16 bg-neutral-800/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Search className="w-8 h-8 text-neutral-600" />
                    </div>
                    <p className="text-neutral-400 font-light text-lg">
                        {items.length === 0 ? "Your collection is empty." : "No tattoos found matching your criteria."}
                    </p>
                    {activeTab === 'mine' && items.length === 0 && (
                        <button
                            onClick={handleUploadClick}
                            className="mt-6 text-sm text-neutral-500 hover:text-white transition-colors underline underline-offset-4"
                        >
                            Upload your first tattoo
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {filteredItems.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => handleSelect(item)}
                            className="group relative aspect-square rounded-[2rem] overflow-hidden bg-neutral-900/40 border border-neutral-800 cursor-pointer transition-all duration-500 hover:border-neutral-700 hover:scale-[1.02]"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-neutral-800/10 to-transparent z-0" />
                            <img
                                src={item.image_url}
                                alt={item.name}
                                className="w-full h-full object-contain p-6 group-hover:scale-110 transition-transform duration-700 relative z-10"
                            />

                            {/* Badges */}
                            <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
                                {item.source && (item.source === 'generated' || item.source === 'imported') && (
                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest backdrop-blur-md border ${item.source === 'generated'
                                        ? 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                                        : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                        }`}>
                                        {item.source === 'generated' ? 'AI' : 'User'}
                                    </span>
                                )}
                            </div>

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-[#0a0a0a]/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-6 flex flex-col justify-between z-30 backdrop-blur-sm">
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={(e) => toggleFavorite(item.id, item.is_favorite || false, e)}
                                        className={`p-3 rounded-2xl transition-all active:scale-90 ${item.is_favorite ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-neutral-800 text-neutral-400 hover:text-red-400 hover:bg-neutral-700'}`}
                                    >
                                        <Heart className={`w-4 h-4 ${item.is_favorite ? 'fill-current' : ''}`} />
                                    </button>
                                    {item.user_id === user?.id && (
                                        <button
                                            onClick={(e) => handleDelete(item.id, e)}
                                            className="p-3 bg-neutral-800 text-neutral-400 rounded-2xl hover:bg-red-900/30 hover:text-red-400 transition-all active:scale-90 border border-transparent hover:border-red-900/20"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-neutral-100 truncate mb-1">{item.name}</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-neutral-500 bg-neutral-900 px-2 py-1 rounded-lg border border-neutral-800 uppercase tracking-widest font-bold">
                                            {item.category || 'Tattoo'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-fade-in">
                    <div className="bg-[#0a0a0a] border border-neutral-800 rounded-[2.5rem] p-10 w-full max-w-xl relative animate-scale-in shadow-2xl">
                        <button
                            onClick={() => setShowUploadModal(false)}
                            className="absolute top-8 right-8 w-10 h-10 flex items-center justify-center bg-neutral-900 hover:bg-neutral-800 rounded-full text-neutral-400 hover:text-neutral-200 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h2 className="text-3xl font-bold text-neutral-50 mb-2">Add to Collection</h2>
                        <p className="text-neutral-500 text-sm mb-10">Upload your own designs to use in the editor</p>

                        <div className="space-y-8">
                            <div className="relative">
                                {previewUrl ? (
                                    <div className="relative aspect-video rounded-3xl overflow-hidden bg-neutral-950 border border-neutral-800 group">
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-contain p-4" />
                                        <button
                                            onClick={() => setPreviewUrl(null)}
                                            className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md rounded-xl text-neutral-200 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center aspect-video rounded-3xl border-2 border-dashed border-neutral-800 hover:border-neutral-600 hover:bg-neutral-800/10 cursor-pointer transition-all group">
                                        <div className="w-16 h-16 bg-neutral-900 rounded-2xl flex items-center justify-center mb-4 border border-neutral-800 group-hover:scale-110 transition-transform">
                                            <Upload className="w-6 h-6 text-neutral-500" />
                                        </div>
                                        <span className="text-sm font-medium text-neutral-400">Drag or click to upload</span>
                                        <span className="text-[10px] text-neutral-600 mt-2 uppercase tracking-widest">PNG or JPG</span>
                                        <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                                    </label>
                                )}
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] mb-3">Tattoo Name</label>
                                    <input
                                        type="text"
                                        value={newTattooName}
                                        onChange={(e) => setNewTattooName(e.target.value)}
                                        className="w-full px-6 py-4 bg-neutral-950 border border-neutral-800 rounded-2xl text-neutral-100 focus:border-neutral-600 focus:outline-none transition-premium placeholder:text-neutral-700"
                                        placeholder="E.g. Traditional Dagger"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleSaveTattoo}
                                disabled={!previewUrl || !newTattooName || uploading}
                                className="w-full py-5 bg-white text-neutral-950 rounded-2xl hover:bg-neutral-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm tracking-wide shadow-xl active:scale-95"
                            >
                                {uploading ? (
                                    <span className="flex items-center justify-center gap-3">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Saving Tattoo...
                                    </span>
                                ) : (
                                    'Save to Collection'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showPaywall && (
                <PlanPricingModal onClose={() => setShowPaywall(false)} />
            )}
        </div>
    );
}
