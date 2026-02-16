import { useState, useRef, useEffect } from 'react';
import { Upload, Download, AlertCircle, Loader2, Sparkles, Scan, Wand2, Calculator, Palette, CheckCircle2, BookmarkPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { invokeWithAuth } from '../lib/invokeWithAuth';
import PlanPricingModal from './PlanPricingModal';
import { saveToMyLibrary } from '../utils/libraryUtils';
import { generateUUID } from '../utils/uuid';
import { useLanguage } from '../contexts/LanguageContext';

type Mode = 'extract' | 'generate';

export default function Extract() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [mode, setMode] = useState<Mode>('extract');

    // Extract State
    const [image, setImage] = useState<string | null>(null);
    const [extractedImage, setExtractedImage] = useState<string | null>(null);

    // Generate State
    const [description, setDescription] = useState('');
    const [style, setStyle] = useState<'realistic' | 'stencil'>('realistic');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);

    // Shared State
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
    }, [loading, mode, LOADING_STEPS]);

    // Reset save success on new generation
    useEffect(() => { setSaveSuccess(false); }, [extractedImage, generatedImage]);

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

    const handleGenerate = async () => {
        if (!description.trim()) return;
        setLoading(true); setError(null);
        try {
            const { data, error: invokeError } = await invokeWithAuth('generate-tattoo', {
                body: { user_description: description, style, request_id: generateUUID() }
            });
            if (invokeError) throw new Error(invokeError.message || "Connection failed");

            const responseData = data as any;
            if (responseData?.error) throw new Error(responseData.details || responseData.error);
            if (responseData?.imageBase64) {
                const prefix = responseData.imageBase64.startsWith('data:') ? '' : 'data:image/png;base64,';
                setGeneratedImage(prefix + responseData.imageBase64);
            } else throw new Error("No image data found");
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to generate design.");
        } finally { setLoading(false); }
    };

    const handleDownload = (imgData: string | null) => {
        if (!imgData) return;
        const a = document.createElement('a');
        a.href = imgData;
        a.download = `tattoo-vision-${mode}-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleSaveToLibrary = async () => {
        const targetImage = mode === 'extract' ? extractedImage : generatedImage;
        if (!targetImage || !user) return;

        setSaving(true);
        try {
            // Determine name and source
            const name = mode === 'extract'
                ? `Extracted Design ${new Date().toLocaleDateString()}`
                : `AI: ${description.slice(0, 20)}...`;

            const source = mode === 'extract' ? 'imported' : 'generated';

            const result = await saveToMyLibrary(user.id, targetImage, name, source);
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

    const LOADING_STEPS = mode === 'extract' ? [
        t('studio_step_scan'), t('studio_step_isolate'), t('studio_step_skin'), t('studio_step_contrast'), t('studio_step_final')
    ] : [
        t('studio_step_analysis'), t('studio_step_sketch'), t('studio_step_refine'), t('studio_step_shading'), t('studio_step_artwork')
    ];

    return (
        <div className="min-h-screen p-6 md:p-12 flex flex-col items-center animate-fade-in pb-32 md:pb-12">
            <div className="max-w-4xl w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0091FF]/10 text-[#0091FF] text-[10px] uppercase font-bold tracking-wider mb-4 border border-[#0091FF]/20">
                        <Sparkles className="w-3 h-3" />
                        AI Studio
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">{t('studio_title')}</h1>
                    <p className="text-[#a1a1aa] font-medium">{t('studio_subtitle')}</p>
                </div>

                {/* Mode Switcher */}
                <div className="flex justify-center mb-10">
                    <div className="bg-[#18181b] p-1 rounded-xl border border-[#27272a] inline-flex">
                        <button
                            onClick={() => setMode('extract')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === 'extract' ? 'bg-[#27272a] text-white shadow-lg' : 'text-[#71717a] hover:text-white'}`}
                        >
                            <Scan className="w-4 h-4" />
                            {t('studio_mode_extract')}
                        </button>
                        <button
                            onClick={() => setMode('generate')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === 'generate' ? 'bg-[#27272a] text-white shadow-lg' : 'text-[#71717a] hover:text-white'}`}
                        >
                            <Wand2 className="w-4 h-4" />
                            {t('studio_mode_generate')}
                        </button>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Input Section */}
                    <div className="flex flex-col gap-4">
                        <div className="p-1 px-1 flex justify-between items-center">
                            <label className="text-xs font-bold text-[#a1a1aa] uppercase tracking-wider">
                                {mode === 'extract' ? t('studio_source_image') : t('studio_design_request')}
                            </label>
                        </div>

                        {mode === 'extract' ? (
                            // EXTRACT INPUT
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={`group border-2 border-dashed rounded-xl h-[400px] flex flex-col items-center justify-center overflow-hidden transition-all bg-[#09090b] relative ${image ? 'border-[#27272a]' : 'border-[#27272a] hover:border-[#0091FF]/50 hover:bg-[#18181b] cursor-pointer'}`}
                            >
                                {image ? (
                                    <>
                                        <div className="relative w-full h-full">
                                            <img src={image} alt="Source" className="w-full h-full object-contain p-4" />
                                            {loading && (
                                                <div className="absolute inset-0 bg-[#09090b]/50 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                                                    <div className="w-full h-1 bg-[#0091FF]/30 absolute top-0 animate-[scan_2s_linear_infinite]"></div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-20">
                                            <p className="text-xs font-mono font-bold text-white border border-white/20 px-4 py-2 rounded-full">{t('studio_change_image')}</p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center p-6">
                                        <div className="w-12 h-12 bg-[#18181b] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#27272a]">
                                            <Upload className="w-5 h-5 text-[#a1a1aa]" />
                                        </div>
                                        <p className="text-sm text-white font-medium">{t('studio_upload_prompt')}</p>
                                        <p className="text-xs text-[#71717a] mt-2 font-mono">JPG/PNG • MAX 10MB</p>
                                    </div>
                                )}
                                <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                            </div>
                        ) : (
                            // GENERATE INPUT
                            <div className="bg-[#09090b] border border-[#27272a] rounded-xl p-6 h-[400px] flex flex-col gap-6">
                                <div>
                                    <label className="text-xs font-bold text-white mb-2 block">{t('gen_label')}</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder={t('gen_placeholder')}
                                        className="w-full h-32 bg-[#18181b] border border-[#27272a] rounded-lg p-3 text-sm text-white placeholder:text-[#52525b] focus:outline-none focus:border-[#0091FF] resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-white mb-2 block">{t('studio_style')}</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setStyle('realistic')}
                                            className={`p-3 rounded-lg border text-left transition-all ${style === 'realistic' ? 'bg-[#0091FF]/10 border-[#0091FF] text-white' : 'bg-[#18181b] border-[#27272a] text-[#71717a] hover:border-[#3f3f46]'}`}
                                        >
                                            <div className="flex justify-between mb-1">
                                                <Palette className="w-4 h-4" />
                                                {style === 'realistic' && <CheckCircle2 className="w-4 h-4 text-[#0091FF]" />}
                                            </div>
                                            <div className="text-sm font-bold">{t('gen_style_realistic')}</div>
                                        </button>
                                        <button
                                            onClick={() => setStyle('stencil')}
                                            className={`p-3 rounded-lg border text-left transition-all ${style === 'stencil' ? 'bg-[#0091FF]/10 border-[#0091FF] text-white' : 'bg-[#18181b] border-[#27272a] text-[#71717a] hover:border-[#3f3f46]'}`}
                                        >
                                            <div className="flex justify-between mb-1">
                                                <Calculator className="w-4 h-4" />
                                                {style === 'stencil' && <CheckCircle2 className="w-4 h-4 text-[#0091FF]" />}
                                            </div>
                                            <div className="text-sm font-bold">{t('gen_style_stencil')}</div>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={mode === 'extract' ? handleExtract : handleGenerate}
                            disabled={loading || (mode === 'extract' ? !image : !description.trim())}
                            className={`w-full py-4 rounded-lg font-bold uppercase tracking-wide text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${loading
                                ? 'bg-[#0091FF] text-white opacity-80 cursor-wait'
                                : 'bg-[#0091FF] text-white hover:bg-[#007AFF] shadow-[#0091FF]/20'
                                }`}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>{t('upload_processing')}</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    <span>{mode === 'extract' ? t('studio_extract_button') : t('studio_generate_button')}</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Output Section */}
                    <div className="flex flex-col gap-4">
                        <div className="p-1 px-1 flex justify-between items-center">
                            <label className="text-xs font-bold text-[#a1a1aa] uppercase tracking-wider">{t('studio_result')}</label>
                            {((mode === 'extract' && extractedImage) || (mode === 'generate' && generatedImage)) &&
                                <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">SUCCESS</span>
                            }
                        </div>

                        <div className="border border-[#27272a] bg-[#18181b] rounded-xl h-[400px] flex items-center justify-center relative overflow-hidden bg-[linear-gradient(45deg,#09090b_25%,transparent_25%,transparent_75%,#09090b_75%,#09090b),linear-gradient(45deg,#09090b_25%,transparent_25%,transparent_75%,#09090b_75%,#09090b)] bg-[length:20px_20px] bg-[position:0_0,10px_10px]">
                            {loading ? (
                                <div className="text-center px-8 w-full max-w-sm">
                                    <div className="relative w-16 h-16 mx-auto mb-6">
                                        <div className="absolute inset-0 border-t-2 border-[#0091FF] rounded-full animate-spin"></div>
                                        <div className="absolute inset-2 border-r-2 border-[#0091FF]/50 rounded-full animate-spin [animation-direction:reverse]"></div>
                                    </div>
                                    <h3 className="text-white font-bold mb-2">{t('studio_magic')}</h3>
                                    <div className="space-y-2">
                                        <div className="h-1 w-full bg-[#27272a] rounded-full overflow-hidden">
                                            <div className="h-full bg-[#0091FF] animate-[loading_2s_ease-in-out_infinite]"></div>
                                        </div>
                                        <p className="text-xs font-mono text-[#0091FF] animate-pulse">
                                            {LOADING_STEPS[loadingStep] || t('upload_processing')}
                                        </p>
                                    </div>
                                </div>
                            ) : (mode === 'extract' ? extractedImage : generatedImage) ? (
                                <div className="w-full h-full p-4 flex items-center justify-center animate-scale-in">
                                    <img
                                        src={mode === 'extract' ? extractedImage! : generatedImage!}
                                        alt="Result"
                                        className="max-w-full max-h-full object-contain drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                                    />
                                </div>
                            ) : (
                                <div className="text-center opacity-40">
                                    {mode === 'extract' ? <Scan className="w-8 h-8 mx-auto mb-2" /> : <Wand2 className="w-8 h-8 mx-auto mb-2" />}
                                    <p className="text-xs uppercase font-bold">{t('studio_waiting')}</p>
                                </div>
                            )}

                            {error && (
                                <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-6 z-50">
                                    <div className="bg-[#18181b] border border-red-500/30 p-4 rounded-xl text-center max-w-sm">
                                        <AlertCircle className="w-6 h-6 text-red-500 mx-auto mb-2" />
                                        <p className="text-red-400 text-sm mb-4">{error}</p>
                                        <button
                                            onClick={() => setError(null)}
                                            className="px-4 py-2 bg-[#27272a] rounded hover:bg-[#3f3f46] text-white text-xs font-bold uppercase tracking-wide transition-colors"
                                        >
                                            {t('studio_try_again')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={handleSaveToLibrary}
                                disabled={saving || saveSuccess || (mode === 'extract' ? !extractedImage : !generatedImage)}
                                className={`flex-1 py-4 rounded-lg font-bold uppercase tracking-wide text-sm flex items-center justify-center gap-2 transition-all border border-[#27272a] bg-[#18181b] text-white hover:bg-[#27272a] hover:border-[#3f3f46] disabled:opacity-50 disabled:cursor-not-allowed ${saveSuccess ? 'text-emerald-500 border-emerald-500/20' : ''}`}
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>{t('upload_saving')}</span>
                                    </>
                                ) : saveSuccess ? (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span>{t('upload_saved')}</span>
                                    </>
                                ) : (
                                    <>
                                        <BookmarkPlus className="w-4 h-4" />
                                        <span>{t('upload_add_to_library')}</span>
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => handleDownload(mode === 'extract' ? extractedImage : generatedImage)}
                                disabled={mode === 'extract' ? !extractedImage : !generatedImage}
                                className="flex-1 py-4 rounded-lg font-bold uppercase tracking-wide text-sm flex items-center justify-center gap-2 transition-all border border-[#27272a] bg-[#18181b] text-white hover:bg-[#27272a] hover:border-[#3f3f46] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Download className="w-4 h-4" />
                                <span>{t('studio_download')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {showPricing && <PlanPricingModal onClose={() => setShowPricing(false)} />}
        </div>
    );
}
