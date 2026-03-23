import { useState, useRef, useEffect } from 'react';
import { Upload, Download, Loader2, Sparkles, Scan, Palette, CheckCircle2, BookmarkPlus, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { invokeWithAuth } from '../lib/invokeWithAuth';
import PlanPricingModal from './PlanPricingModal';
import { saveToMyLibrary } from '../utils/libraryUtils';
import { useLanguage } from '../contexts/LanguageContext';
import { loadImageWithOrientation } from '../utils/imageUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { MagicButton } from './ui/MagicButton';
import ExtractOnboarding from './ExtractOnboarding';

export default function Extract() {
    const { user } = useAuth();
    const { t, language } = useLanguage();
    const isFrench = language === 'fr';

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
    const [showOnboarding, setShowOnboarding] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const seen = localStorage.getItem('tv_extract_onboarding_seen');
        if (!seen) setShowOnboarding(true);
    }, []);

    const markOnboardingSeen = () => {
        localStorage.setItem('tv_extract_onboarding_seen', 'true');
        setShowOnboarding(false);
    };

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
    }, [loading]);

    useEffect(() => { setSaveSuccess(false); }, [extractedImage]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 50 * 1024 * 1024) {
            setError("Fichier trop lourd (max 50MB)");
            return;
        }

        try {
            const imageData = await loadImageWithOrientation(file);
            setImage(imageData.url);
            setExtractedImage(null);
            setError(null);
        } catch (err: any) {
            setError(err.message || "Failed to load media.");
        }
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
        setError(null);
        try {
            const name = `Extract ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
            const result = await saveToMyLibrary(user.id, extractedImage, name, 'imported');
            if (result.success) {
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000);
            } else {
                throw new Error("Erreur lors de la sauvegarde");
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Impossible d'ajouter à la bibliothèque.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-[100dvh] flex flex-col items-center bg-[#020202] text-white overflow-x-hidden pb-24 md:pb-16 pt-20 md:pt-16">
            <AnimatePresence>
                {showOnboarding && <ExtractOnboarding onClose={markOnboardingSeen} />}
            </AnimatePresence>

            <div className="max-w-4xl w-full px-5 md:px-8 flex flex-col">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-10"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0091FF]/10 text-[#0091FF] text-[10px] uppercase font-black tracking-[0.2em] mb-4 border border-[#0091FF]/20">
                        <Scan className="w-3 h-3" />
                        AI Extraction Studio
                    </div>
                    <h1 className="text-[32px] md:text-5xl font-black tracking-[-0.04em] leading-tight mb-3">
                        {isFrench ? 'Photo vers Tattoo' : 'AI Extract'}
                    </h1>
                    <p className="text-neutral-500 text-sm font-light max-w-xl mx-auto leading-relaxed" style={{ textWrap: 'balance' } as any}>
                        {isFrench
                            ? "Isolez n'importe quel dessin ou tatouage pour l'essayer instantanément."
                            : "Isolate any drawing or tattoo design instantly to try it on yourself."}
                    </p>
                </motion.div>

                {/* Main Area */}
                <div className="relative flex flex-col gap-8">
                    {/* Ambient glow */}
                    <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[30rem] h-[30rem] bg-[#0091FF]/5 rounded-full blur-[120px] pointer-events-none" />

                    <AnimatePresence mode="wait">
                        {!image ? (
                            /* Large dropzone */
                            <motion.div
                                key="dropzone"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                onClick={() => fileInputRef.current?.click()}
                                className="group relative h-[360px] md:h-[480px] rounded-[40px] border-2 border-dashed border-white/10 bg-[#070709] flex flex-col items-center justify-center cursor-pointer hover:border-[#0091FF]/30 hover:bg-[#09090b] transition-all duration-500 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-b from-[#0091FF]/0 to-[#0091FF]/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative z-10 text-center p-8">
                                    <div className="w-20 h-20 md:w-24 md:h-24 bg-[#111113] rounded-3xl flex items-center justify-center mx-auto mb-8 border border-white/10 group-hover:scale-110 group-hover:bg-[#18181b] group-hover:border-[#0091FF]/40 transition-all duration-500 shadow-2xl">
                                        <Upload className="w-8 h-8 md:w-10 md:h-10 text-neutral-400 group-hover:text-[#0091FF]" />
                                    </div>
                                    <h3 className="text-xl md:text-2xl font-black mb-3">
                                        {isFrench ? 'Commencez ici' : 'Start here'}
                                    </h3>
                                    <p className="text-neutral-500 text-xs md:text-sm uppercase tracking-widest font-black mb-1">
                                        {isFrench ? 'Cliquez pour importer' : 'Click to import'}
                                    </p>
                                    <p className="text-neutral-700 text-[10px] uppercase tracking-widest">
                                        {isFrench ? 'Glisser-déposer aussi supporté' : 'Drag & drop also supported'}
                                    </p>
                                </div>
                            </motion.div>
                        ) : (
                            /* Before / After grid */
                            <motion.div
                                key="content"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="grid md:grid-cols-2 gap-6 md:gap-8"
                            >
                                {/* Left: Source */}
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="space-y-4"
                                >
                                    <div className="rounded-[32px] bg-[#09090b] border border-white/5 overflow-hidden aspect-square flex items-center justify-center relative group shadow-2xl">
                                        <img src={image} alt="Source" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                className="px-6 py-2.5 rounded-full bg-white text-black font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform"
                                            >
                                                {isFrench ? 'Changer' : 'Change'}
                                            </button>
                                        </div>
                                        <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/60 border border-white/10 backdrop-blur-md text-[9px] font-black uppercase tracking-widest">
                                            Source
                                        </div>
                                    </div>

                                    {!extractedImage && (
                                        <>
                                        <MagicButton
                                            onClick={handleExtract}
                                            disabled={loading}
                                            className="w-full"
                                        >
                                            {loading ? (
                                                <><Loader2 className="w-4 h-4 animate-spin" />{t('extract_scanning')}</>
                                            ) : (
                                                <><Sparkles className="w-4 h-4" />{t('extract_run_scan')}</>
                                            )}
                                        </MagicButton>
                                        <p className="text-[10px] text-neutral-600 leading-relaxed text-center px-2">
                                            {t('ai_privacy_extract')}
                                        </p>
                                        </>
                                    )}
                                </motion.div>

                                {/* Right: Result */}
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="space-y-4"
                                >
                                    <div className="rounded-[32px] bg-[#070709] border border-white/5 overflow-hidden aspect-square flex items-center justify-center relative shadow-2xl">
                                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

                                        {loading ? (
                                            <div className="flex flex-col items-center justify-center text-center p-6 space-y-6">
                                                <div className="relative w-24 h-24">
                                                    <div className="absolute inset-0 border-2 border-[#0091FF]/20 rounded-full" />
                                                    <motion.div
                                                        animate={{ rotate: 360 }}
                                                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                                        className="absolute inset-0 border-t-2 border-[#0091FF] rounded-full"
                                                    />
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <Sparkles className="w-8 h-8 text-[#0091FF] animate-pulse" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0091FF]">{LOADING_STEPS[loadingStep]}</p>
                                                    <p className="text-neutral-500 text-xs italic">{isFrench ? "La magie opère..." : "Magic is happening..."}</p>
                                                </div>
                                            </div>
                                        ) : extractedImage ? (
                                            <motion.img
                                                initial={{ scale: 0.8, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                src={extractedImage}
                                                alt="Result"
                                                className="max-w-[85%] max-h-[85%] object-contain filter drop-shadow-[0_0_30px_rgba(0,145,255,0.2)]"
                                            />
                                        ) : (
                                            <div className="text-center opacity-20">
                                                <ImageIcon className="w-12 h-12 mx-auto mb-4" />
                                                <p className="text-[10px] uppercase font-black tracking-widest">{isFrench ? 'Attente scan' : 'Waiting'}</p>
                                            </div>
                                        )}

                                        {extractedImage && (
                                            <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#0091FF]/20 border border-[#0091FF]/30 backdrop-blur-md text-[#0091FF] text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
                                                {isFrench ? 'Design Isolé' : 'Isolated Design'}
                                            </div>
                                        )}
                                    </div>

                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-3"
                                        >
                                            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="text-[10px] text-red-500 font-bold mb-2 leading-relaxed">{error}</p>
                                                <button
                                                    onClick={() => setError(null)}
                                                    className="text-[9px] font-black uppercase tracking-widest text-red-500/60 hover:text-red-500 transition-colors"
                                                >
                                                    {isFrench ? 'Réessayer' : 'Try Again'}
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {extractedImage && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={handleSaveToLibrary}
                                                disabled={saving || saveSuccess}
                                                className={`h-11 rounded-2xl font-black uppercase tracking-[0.1em] text-[9px] flex items-center justify-center gap-2 transition-all border ${saveSuccess ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500' : 'border-white/5 bg-white/5 text-white hover:bg-white/10'}`}
                                            >
                                                {saveSuccess ? <CheckCircle2 className="w-4 h-4" /> : (saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookmarkPlus className="w-4 h-4" />)}
                                                {saveSuccess ? (isFrench ? 'Sauvé' : 'Saved') : (isFrench ? 'Ajouter' : 'Save')}
                                            </button>
                                            <button
                                                onClick={() => handleDownload(extractedImage)}
                                                className="h-11 rounded-2xl font-black uppercase tracking-[0.1em] text-[9px] flex items-center justify-center gap-2 transition-all border border-white/5 bg-white/5 text-white hover:bg-white/10"
                                            >
                                                <Download className="w-4 h-4" />
                                                {isFrench ? 'Télécharger' : 'Download'}
                                            </button>
                                        </div>
                                    )}

                                    {extractedImage && (
                                        <MagicButton
                                            onClick={handleExtract}
                                            disabled={loading}
                                            className="w-full"
                                        >
                                            {loading ? (
                                                <><Loader2 className="w-4 h-4 animate-spin" />{t('extract_scanning')}</>
                                            ) : (
                                                <><Sparkles className="w-4 h-4" />{isFrench ? 'Nouveau scan' : 'New scan'}</>
                                            )}
                                        </MagicButton>
                                    )}
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Tips */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mt-4 p-8 rounded-[40px] bg-[#070709] border border-white/5 relative overflow-hidden group"
                    >
                        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-[#0091FF]/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-[#0091FF]/10 transition-colors" />

                        <h3 className="text-sm font-black text-white mb-6 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Palette className="w-4 h-4 text-[#0091FF]" />
                            {t('extract_tips_title')}
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {[
                                { title: t('extract_tip_light_title'), desc: t('extract_tip_light_desc') },
                                { title: t('extract_tip_angle_title'), desc: t('extract_tip_angle_desc') },
                                { title: t('extract_tip_sharp_title'), desc: t('extract_tip_sharp_desc') },
                                { title: t('extract_tip_smart_title'), desc: t('extract_tip_smart_desc') }
                            ].map((tip, i) => (
                                <div key={i} className="space-y-1.5">
                                    <h4 className="text-[10px] font-black text-white/60 uppercase tracking-widest">{tip.title}</h4>
                                    <p className="text-[10px] text-neutral-500 leading-relaxed font-light">{tip.desc}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            <input ref={fileInputRef} type="file" className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
            {showPricing && <PlanPricingModal onClose={() => setShowPricing(false)} />}
        </div>
    );
}
