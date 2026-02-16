import { useState, useRef, useEffect } from 'react';
import { Upload, Download, AlertCircle, Loader2, Sparkles, Scan, Palette, CheckCircle2, BookmarkPlus, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { invokeWithAuth } from '../lib/invokeWithAuth';
import PlanPricingModal from './PlanPricingModal';
import { saveToMyLibrary } from '../utils/libraryUtils';
import { useLanguage } from '../contexts/LanguageContext';

export default function Extract() {
    const { user } = useAuth();
    const { t } = useLanguage();

    const LOADING_STEPS = [
        t('studio_step_scan'), t('studio_step_isolate'), t('studio_step_skin'), t('studio_step_contrast'), t('studio_step_final')
    ];

    // State
    const [image, setImage] = useState<string | null>(null);
    const [extractedImage, setExtractedImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [showPricing, setShowPricing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (loading) {
            setLoadingStep(0);
            const steps = LOADING_STEPS;

            let i = 0;
            interval = setInterval(() => {
                i++;
                if (i < steps.length) setLoadingStep(i);
            }, 2500);
        }
        return () => clearInterval(interval);
    }, [loading, LOADING_STEPS]);

    useEffect(() => { setSaveSuccess(false); }, [extractedImage]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            setError("Image too large (max 10MB)");
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            setImage(reader.result as string);
            setExtractedImage(null);
            setError(null);
        };
        reader.readAsDataURL(file);
    };

    const handleExtract = async () => {
        if (!image) return;
        setLoading(true); setError(null);
        try {
            const { data, error: invokeError } = await invokeWithAuth('extract-design', { body: { image } });
            if (invokeError) throw new Error(invokeError.message || "Connection failed");

            const responseData = data as any;
            if (responseData?.error) throw new Error(responseData.details || responseData.error);
            if (responseData?.imageBase64) {
                const prefix = responseData.imageBase64.startsWith('data:') ? '' : 'data:image/png;base64,';
                setExtractedImage(prefix + responseData.imageBase64);
            } else throw new Error("No image data found");
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to extract design.");
        } finally { setLoading(false); }
    };

    const handleDownload = (imgData: string | null) => {
        if (!imgData) return;
        const a = document.createElement('a');
        a.href = imgData;
        a.download = `tattoo-vision-extracted-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleSaveToLibrary = async () => {
        if (!extractedImage || !user) return;

        setSaving(true);
        try {
            const name = `Extracted Design ${new Date().toLocaleDateString()}`;
            const result = await saveToMyLibrary(user.id, extractedImage, name, 'imported');
            if (result.success) {
                setSaveSuccess(true);
            } else {
                setError("Failed to save to library");
            }
        } catch (err) {
            console.error(err);
            setError("Failed to save to library");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen p-6 md:p-12 flex flex-col items-center animate-fade-in pb-32 md:pb-12">
            <div className="max-w-5xl w-full">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0091FF]/10 text-[#0091FF] text-[10px] uppercase font-bold tracking-wider mb-4 border border-[#0091FF]/20">
                        <Scan className="w-3 h-3" />
                        Smart Extraction
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">Convertir une photo en Tattoo</h1>
                    <p className="text-[#a1a1aa] text-lg max-w-2xl mx-auto">
                        Prenez en photo un tatouage sur la peau ou sur papier, et notre IA l'isole parfaitement pour que vous puissiez l'essayer sur vous.
                    </p>
                </div>

                {/* Tutorial / Steps */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                    {[
                        { icon: Upload, title: "1. Télécharger", desc: "Prenez une photo claire d'un tatouage existant." },
                        { icon: Sparkles, title: "2. Extraire", desc: "Notre IA retire la peau, les poils et les ombres." },
                        { icon: CheckCircle2, title: "3. Appliquer", desc: "Le design est prêt à être placé sur votre corps." }
                    ].map((step, idx) => (
                        <div key={idx} className="bg-[#18181b] border border-[#27272a] rounded-2xl p-6 flex flex-col items-center text-center group hover:border-[#0091FF]/30 transition-all">
                            <div className="w-10 h-10 rounded-full bg-[#27272a] flex items-center justify-center mb-4 group-hover:bg-[#0091FF]/10 transition-colors">
                                <step.icon className="w-5 h-5 text-[#a1a1aa] group-hover:text-[#0091FF]" />
                            </div>
                            <h3 className="text-white font-bold mb-1">{step.title}</h3>
                            <p className="text-xs text-[#71717a]">{step.desc}</p>
                        </div>
                    ))}
                </div>

                <div className="grid lg:grid-cols-2 gap-8 items-start">
                    {/* Left: Input */}
                    <div className="space-y-6">
                        <div className="bg-[#09090b] border border-[#27272a] rounded-2xl overflow-hidden">
                            <div className="p-4 border-b border-[#27272a] bg-[#18181b]/50">
                                <span className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#0091FF]"></div>
                                    Image Source
                                </span>
                            </div>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={`group h-[400px] flex flex-col items-center justify-center relative transition-all ${image ? 'cursor-default' : 'cursor-pointer hover:bg-[#18181b]'}`}
                            >
                                {image ? (
                                    <>
                                        <div className="relative w-full h-full p-4 flex items-center justify-center">
                                            <img src={image} alt="Source" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
                                            {loading && (
                                                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center">
                                                    <div className="w-full h-1 bg-[#0091FF] absolute top-0 shadow-[0_0_15px_#0091FF] animate-[scan_2s_linear_infinite]"></div>
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                            className="absolute bottom-4 right-4 bg-black/80 hover:bg-black text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-md border border-white/10 transition-all active:scale-95"
                                        >
                                            Changer l'image
                                        </button>
                                    </>
                                ) : (
                                    <div className="text-center p-8">
                                        <div className="w-16 h-16 bg-[#18181b] rounded-3xl flex items-center justify-center mx-auto mb-6 border border-[#27272a] group-hover:scale-110 transition-transform">
                                            <Upload className="w-6 h-6 text-[#71717a] group-hover:text-white" />
                                        </div>
                                        <p className="text-white font-bold mb-2">Glissez ou cliquez pour charger</p>
                                        <p className="text-xs text-[#71717a] font-mono uppercase tracking-tighter">Photo de tatouage réel ou dessin</p>
                                    </div>
                                )}
                                <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                            </div>
                        </div>

                        <button
                            onClick={handleExtract}
                            disabled={loading || !image}
                            className={`w-full py-5 rounded-2xl font-bold uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 transition-all shadow-xl ${loading
                                ? 'bg-neutral-800 text-[#52525b] cursor-wait'
                                : 'bg-[#0091FF] text-white hover:bg-[#007AFF] hover:shadow-[#0091FF]/30 active:scale-[0.98]'
                                }`}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Extraction en cours...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    <span>Lancer le scan IA</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Right: Output */}
                    <div className="space-y-6">
                        <div className="bg-[#09090b] border border-[#27272a] rounded-2xl overflow-hidden h-full">
                            <div className="p-4 border-b border-[#27272a] bg-[#18181b]/50 flex justify-between items-center">
                                <span className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-widest flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${extractedImage ? 'bg-emerald-500' : 'bg-[#27272a]'}`}></div>
                                    Résultat Transparent
                                </span>
                                {extractedImage && <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded uppercase tracking-widest border border-emerald-500/20">Isolé</span>}
                            </div>

                            <div className="h-[400px] flex items-center justify-center relative overflow-hidden bg-[linear-gradient(45deg,#0e0e0e_25%,transparent_25%,transparent_75%,#0e0e0e_75%,#0e0e0e),linear-gradient(45deg,#0e0e0e_25%,transparent_25%,transparent_75%,#0e0e0e_75%,#0e0e0e)] bg-[length:24px_24px] bg-[position:0_0,12px_12px]">
                                {loading ? (
                                    <div className="text-center px-10 w-full">
                                        <div className="w-20 h-20 mx-auto mb-8 relative">
                                            <div className="absolute inset-0 border-2 border-[#0091FF]/20 rounded-full"></div>
                                            <div className="absolute inset-0 border-t-2 border-[#0091FF] rounded-full animate-spin"></div>
                                            <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-[#0091FF] animate-pulse" />
                                        </div>
                                        <h3 className="text-white font-bold text-lg mb-3 tracking-tight">{t('studio_magic')}</h3>
                                        <div className="max-w-xs mx-auto space-y-3">
                                            <div className="h-1.5 w-full bg-[#18181b] rounded-full overflow-hidden border border-[#27272a]">
                                                <div
                                                    className="h-full bg-gradient-to-r from-[#0091FF] to-[#00D4FF] transition-all duration-700 ease-out"
                                                    style={{ width: `${((loadingStep + 1) / LOADING_STEPS.length) * 100}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-[10px] font-mono text-[#0091FF] uppercase tracking-widest">
                                                {LOADING_STEPS[loadingStep] || t('upload_processing')}
                                            </p>
                                        </div>
                                    </div>
                                ) : extractedImage ? (
                                    <div className="w-full h-full p-8 flex items-center justify-center animate-scale-in">
                                        <img
                                            src={extractedImage}
                                            alt="Result"
                                            className="max-w-full max-h-full object-contain filter drop-shadow-[0_0_25px_rgba(0,0,0,1)]"
                                        />
                                    </div>
                                ) : (
                                    <div className="text-center space-y-4 px-12 group">
                                        <div className="w-16 h-16 bg-[#18181b] rounded-full flex items-center justify-center mx-auto border border-[#27272a] opacity-40 group-hover:opacity-100 transition-opacity">
                                            <ImageIcon className="w-6 h-6 text-[#71717a]" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px] uppercase font-bold text-[#52525b] tracking-[0.2em]">{t('studio_waiting')}</p>
                                            <p className="text-[10px] text-[#3f3f46] font-light max-w-[180px] leading-relaxed mx-auto">Veuillez charger une image pour commencer l'extraction IA.</p>
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <div className="absolute inset-0 bg-black/90 flex items-center justify-center p-8 z-50 backdrop-blur-sm">
                                        <div className="bg-[#18181b] border border-red-500/20 p-6 rounded-2xl text-center shadow-2xl">
                                            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                                                <AlertCircle className="w-6 h-6 text-red-500" />
                                            </div>
                                            <p className="text-sm text-red-400 font-medium mb-6 leading-relaxed">{error}</p>
                                            <button
                                                onClick={() => setError(null)}
                                                className="w-full py-3 bg-[#27272a] hover:bg-[#3f3f46] text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all"
                                            >
                                                Réessayer
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={handleSaveToLibrary}
                                disabled={saving || saveSuccess || !extractedImage}
                                className={`py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all border border-[#27272a] bg-[#18181b] text-white hover:bg-[#27272a] disabled:opacity-40 disabled:cursor-not-allowed ${saveSuccess ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' : ''}`}
                            >
                                {saving ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : saveSuccess ? (
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                ) : (
                                    <BookmarkPlus className="w-3.5 h-3.5" />
                                )}
                                <span>{saving ? t('upload_saving') : saveSuccess ? t('upload_saved') : t('upload_add_to_library')}</span>
                            </button>

                            <button
                                onClick={() => handleDownload(extractedImage)}
                                disabled={!extractedImage}
                                className="py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all border border-[#27272a] bg-[#18181b] text-white hover:bg-[#27272a] disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span>{t('studio_download')}</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Pro Tips Footer */}
                <div className="mt-16 p-8 bg-[#18181b] border border-[#27272a] rounded-3xl">
                    <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                        <Palette className="w-5 h-5 text-[#0091FF]" />
                        Conseils pour un résultat parfait
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { title: "Lumière", desc: "Évitez les reflets directs sur le tatouage." },
                            { title: "Angle", desc: "Prenez la photo bien en face, pas de travers." },
                            { title: "Netteté", desc: "L'image ne doit pas être floue pour isoler les détails." },
                            { title: "Supports", desc: "L'IA fonctionne sur la peau, le papier ou les murs." }
                        ].map((tip, i) => (
                            <div key={i}>
                                <h4 className="text-xs font-bold text-white mb-1 uppercase tracking-wider">{tip.title}</h4>
                                <p className="text-[11px] text-[#71717a] leading-relaxed">{tip.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {showPricing && <PlanPricingModal onClose={() => setShowPricing(false)} />}
        </div>
    );
}
