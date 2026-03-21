import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Image as ImageIcon, AlertCircle, Loader2, Camera, Sparkles, Info, BookmarkPlus, CheckCircle2, ArrowRight, X, ChevronRight } from 'lucide-react';
import { ImageData } from '../types';
import { loadImageWithOrientation } from '../utils/imageUtils';
import TattooGenerator from './TattooGenerator';
import PhotoGuide from './PhotoGuide';
import PlanPricingModal from './PlanPricingModal';
import BrandMark from './BrandMark';
import { useAuth } from '../contexts/AuthContext';
import { saveToMyLibrary } from '../utils/libraryUtils';
import { useLanguage } from '../contexts/LanguageContext';
import { trackImageUploaded } from '../lib/analytics';
import { MagicButton } from './ui/MagicButton';

interface ImageUploadProps {
  bodyImage: ImageData | null;
  tattooImage: ImageData | null;
  onBodyImageChange: (image: ImageData | null) => void;
  onTattooImageChange: (image: ImageData | null) => void;
  onNext: () => void;
}

export default function ImageUpload({
  bodyImage,
  tattooImage,
  onBodyImageChange,
  onTattooImageChange,
  onNext,
}: ImageUploadProps) {
  const { user, credits } = useAuth();
  const { t } = useLanguage();
  const bodyInputRef = useRef<HTMLInputElement>(null);
  const bodyCameraInputRef = useRef<HTMLInputElement>(null);
  const tattooInputRef = useRef<HTMLInputElement>(null);
  const [isLoadingBody, setIsLoadingBody] = useState(false);
  const [isLoadingTattoo, setIsLoadingTattoo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [showPhotoGuide, setShowPhotoGuide] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [bodyDragging, setBodyDragging] = useState(false);
  const [tattooDragging, setTattooDragging] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    checkMobile();
  }, []);

  useEffect(() => {
    setSaveSuccess(false);
  }, [tattooImage]);

  const handleGeneratedTattoo = (tattoo: ImageData) => {
    onTattooImageChange(tattoo);
  };

  const handleImageUpload = async (
    file: File,
    callback: (image: ImageData | null) => void,
    setLoading: (loading: boolean) => void
  ) => {
    try {
      setError(null);
      setLoading(true);

      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error('File is too large. Please use an image smaller than 10MB.');
      }

      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        throw new Error('Please select a valid image or video file.');
      }

      const imageData = await loadImageWithOrientation(file);
      callback(imageData);
    } catch (err) {
      console.error('Error loading image:', err);
      setError(err instanceof Error ? err.message : 'Failed to load image. Please try again.');
      callback(null);
    } finally {
      setLoading(false);
    }
  };

  const triggerCamera = (inputRef: React.RefObject<HTMLInputElement>, fallbackRef?: React.RefObject<HTMLInputElement>) => {
    try {
      setCameraError(null);
      if (!inputRef.current) throw new Error('Camera not available');
      inputRef.current.click();
    } catch {
      setCameraError(typeof navigator !== 'undefined' && navigator.language?.startsWith('fr') ? "Impossible d'accéder à la caméra." : 'Unable to access camera.');
      setTimeout(() => { try { fallbackRef?.current?.click(); } catch {} }, 300);
    }
  };

  const handleBodyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file, (imageData) => {
        onBodyImageChange(imageData);
        if (imageData) {
          trackImageUploaded(credits);
        }
      }, setIsLoadingBody);
    }
    e.target.value = '';
    setCameraError(null);
  };

  const handleTattooChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file, (imageData) => {
        onTattooImageChange(imageData);
      }, setIsLoadingTattoo);
    }
    e.target.value = '';
  };

  // Drag & Drop handlers
  const handleBodyDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setBodyDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleImageUpload(file, (imageData) => {
        onBodyImageChange(imageData);
        if (imageData) trackImageUploaded(credits);
      }, setIsLoadingBody);
    }
  };

  const handleTattooDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setTattooDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleImageUpload(file, onTattooImageChange, setIsLoadingTattoo);
    }
  };

  const handleSaveToLibrary = async () => {
    if (!tattooImage || !user) return;

    setIsSaving(true);
    try {
      const name = `Uploaded Design ${new Date().toLocaleDateString()}`;
      const result = await saveToMyLibrary(user.id, tattooImage.url, name, 'imported');

      if (result.success) {
        setSaveSuccess(true);
      } else {
        setError("Failed to save to library");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to save to library");
    } finally {
      setIsSaving(false);
    }
  };

  const canProceed = bodyImage && tattooImage;
  const step1Done = !!bodyImage;
  const step2Done = !!tattooImage;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#080808] overflow-x-hidden relative" style={{ WebkitTapHighlightColor: 'transparent' }}>

      {/* Ambient background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#0091FF]/8 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 -right-40 w-80 h-80 bg-violet-500/6 rounded-full blur-[100px]" />
      </div>

      {/* Sticky Top Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-8 py-2.5 md:py-4 border-b border-white/5 bg-[#080808]/80 backdrop-blur-xl" style={{ paddingTop: 'max(env(safe-area-inset-top), 10px)' }}>
        <BrandMark compact horizontal />

        {/* Step progress */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Step 1 pill */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${step1Done
            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
            : 'bg-white/5 text-white/40 border border-white/10'
            }`}>
            {step1Done ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <span className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center text-[8px]">1</span>
            )}
            <span className="hidden sm:inline">Body</span>
          </div>

          <ChevronRight className="w-3 h-3 text-white/20" />

          {/* Step 2 pill */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${step2Done
            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
            : step1Done
              ? 'bg-[#0091FF]/15 text-[#0091FF] border border-[#0091FF]/30'
              : 'bg-white/5 text-white/40 border border-white/10'
            }`}>
            {step2Done ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <span className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center text-[8px]">2</span>
            )}
            <span className="hidden sm:inline">Design</span>
          </div>
        </div>

        {/* Tips button */}
        <button
          onClick={() => setShowPhotoGuide(true)}
          className="flex items-center gap-1.5 text-white/40 hover:text-white text-[10px] font-bold uppercase tracking-wider transition-colors"
        >
          <Info className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('upload_tips')}</span>
        </button>
      </header>

      {/* pb-[180px] = space for fixed CTA + mobile nav + safe area */}
      <main className="flex-1 flex flex-col px-4 md:px-8 py-5 md:py-10 max-w-2xl mx-auto w-full gap-4 md:gap-6" style={{ paddingBottom: 'calc(180px + env(safe-area-inset-bottom, 16px))' }}>

        {/* Errors */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-xs leading-relaxed flex-1">{error}</p>
              <button onClick={() => setError(null)} className="text-red-400/60 hover:text-red-400"><X className="w-4 h-4" /></button>
            </motion.div>
          )}
          {cameraError && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-start gap-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl">
              <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
              <p className="text-orange-400 text-xs leading-relaxed flex-1">{cameraError}</p>
              <button onClick={() => setCameraError(null)} className="text-orange-400/60 hover:text-orange-400"><X className="w-4 h-4" /></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── STEP 1 ── Body photo */}
        <section
          className={`upload-card group relative rounded-[28px] overflow-hidden border transition-all duration-500 ${isLoadingBody
            ? 'border-[#27272a] bg-[#111]'
            : bodyImage
              ? 'border-emerald-500/25 bg-[#0f1a0f]'
              : bodyDragging
                ? 'border-[#0091FF]/60 bg-[#0091FF]/8 scale-[1.01]'
                : 'border-white/8 bg-[#0f0f0f] hover:border-white/15 cursor-pointer'
            }`}
          onClick={() => !isLoadingBody && !bodyImage && bodyInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setBodyDragging(true); }}
          onDragLeave={() => setBodyDragging(false)}
          onDrop={handleBodyDrop}
        >
          {/* Step badge */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border transition-all ${bodyImage ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-white/8 border-white/15 text-white/60'
              }`}>
              {bodyImage ? <CheckCircle2 className="w-3.5 h-3.5" /> : '1'}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${bodyImage ? 'text-emerald-400' : 'text-white/40'
              }`}>
              {t('upload_target')}
            </span>
          </div>

          {/* Image preview state */}
          {isLoadingBody ? (
            <div className="h-64 md:h-80 flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-[#0091FF]/20 border-t-[#0091FF] animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#0091FF]" />
                </div>
              </div>
              <p className="text-white/40 text-xs uppercase tracking-widest">{t('upload_processing')}</p>
            </div>
          ) : bodyImage ? (
            <div className="relative">
              <img
                src={bodyImage.url}
                alt="Body"
                className="w-full max-h-80 md:max-h-96 object-cover"
              />
              {/* Overlay – always visible on touch, hover on desktop */}
              <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-all duration-300 flex flex-col items-center justify-end pb-5 gap-2.5 ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <button
                  onClick={(e) => { e.stopPropagation(); bodyInputRef.current?.click(); }}
                  className="flex items-center gap-2 px-5 min-h-[44px] bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white text-xs font-bold uppercase tracking-wider active:bg-white/25 transition-all"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {t('studio_change_image')}
                </button>
                {isMobile && (
                  <button
                    onClick={(e) => { e.stopPropagation(); bodyCameraInputRef.current?.click(); }}
                    className="flex items-center gap-2 px-5 min-h-[44px] bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white text-xs font-bold uppercase tracking-wider active:bg-white/25 transition-all"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    {t('upload_camera')}
                  </button>
                )}
              </div>
              {/* Emerald top bar */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-80" />
            </div>
          ) : (
            /* Empty state */
            <div className="h-64 md:h-80 flex flex-col items-center justify-center gap-5 px-8 pt-12">
              {/* Animated upload zone */}
              <div className={`relative w-20 h-20 rounded-[20px] flex items-center justify-center transition-all duration-300 group-hover:scale-105 ${bodyDragging ? 'bg-[#0091FF]/15 border-2 border-[#0091FF]/50' : 'bg-white/5 border border-white/10'
                }`}>
                <Upload className={`w-8 h-8 transition-colors ${bodyDragging ? 'text-[#0091FF]' : 'text-white/30 group-hover:text-white/60'}`} />
                {/* Animated corners */}
                <div className="absolute -top-px -left-px w-4 h-4 border-t-2 border-l-2 border-[#0091FF]/0 group-hover:border-[#0091FF]/60 transition-all duration-300 rounded-tl-[4px]" />
                <div className="absolute -top-px -right-px w-4 h-4 border-t-2 border-r-2 border-[#0091FF]/0 group-hover:border-[#0091FF]/60 transition-all duration-300 rounded-tr-[4px]" />
                <div className="absolute -bottom-px -left-px w-4 h-4 border-b-2 border-l-2 border-[#0091FF]/0 group-hover:border-[#0091FF]/60 transition-all duration-300 rounded-bl-[4px]" />
                <div className="absolute -bottom-px -right-px w-4 h-4 border-b-2 border-r-2 border-[#0091FF]/0 group-hover:border-[#0091FF]/60 transition-all duration-300 rounded-br-[4px]" />
              </div>

              <div className="text-center">
                <p className="text-white text-sm font-semibold mb-1.5">
                  {bodyDragging ? 'Drop your photo here' : 'Upload a photo of your body'}
                </p>
                <p className="text-white/30 text-xs leading-relaxed max-w-[200px]">
                  {!isMobile ? 'Drag & drop or click to browse' : 'Tap to choose from camera roll'}
                </p>
              </div>

              {isMobile && (
                <div className="flex gap-2 w-full">
                  <button
                    onClick={(e) => { e.stopPropagation(); bodyInputRef.current?.click(); }}
                    className="flex-1 flex items-center justify-center gap-2 min-h-[48px] bg-white/6 border border-white/10 rounded-xl text-white/70 text-[11px] font-bold uppercase tracking-wider active:bg-white/15 transition-all"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    Library
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); bodyCameraInputRef.current?.click(); }}
                    className="flex-1 flex items-center justify-center gap-2 min-h-[48px] bg-white/6 border border-white/10 rounded-xl text-white/70 text-[11px] font-bold uppercase tracking-wider active:bg-white/15 transition-all"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    {t('upload_camera')}
                  </button>
                </div>
              )}
            </div>
          )}

          <input ref={bodyInputRef} type="file" accept="image/*,video/*" onChange={handleBodyChange} className="hidden" />
          <input ref={bodyCameraInputRef} type="file" accept="image/*,video/*" capture="environment" onChange={handleBodyChange} className="hidden" />
        </section>

        {/* Connector arrow */}
        <div className="flex items-center justify-center gap-3 py-1">
          <div className={`h-px flex-1 transition-all duration-500 ${step1Done ? 'bg-gradient-to-r from-transparent via-emerald-500/40 to-[#0091FF]/40' : 'bg-white/5'}`} />
          <div className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all duration-500 ${step1Done ? 'border-[#0091FF]/40 bg-[#0091FF]/10' : 'border-white/10 bg-transparent'
            }`}>
            <ArrowRight className={`w-3.5 h-3.5 transition-all duration-500 ${step1Done ? 'text-[#0091FF]' : 'text-white/20'}`} />
          </div>
          <div className={`h-px flex-1 transition-all duration-500 ${step1Done ? 'bg-gradient-to-r from-[#0091FF]/40 via-violet-500/30 to-transparent' : 'bg-white/5'}`} />
        </div>

        {/* ── STEP 2 ── Tattoo design */}
        <section className={`rounded-[28px] overflow-hidden border transition-all duration-500 ${isLoadingTattoo
          ? 'border-[#27272a] bg-[#111]'
          : tattooImage
            ? 'border-[#0091FF]/25 bg-[#0a0f1a]'
            : tattooDragging
              ? 'border-[#0091FF]/60 bg-[#0091FF]/8 scale-[1.01]'
              : 'border-white/8 bg-[#0f0f0f]'
          }`}>

          {/* Section header */}
          <div className="px-5 pt-5 pb-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border transition-all ${tattooImage ? 'bg-[#0091FF] border-[#0091FF] text-white' : step1Done ? 'bg-[#0091FF]/15 border-[#0091FF]/40 text-[#0091FF]' : 'bg-white/8 border-white/15 text-white/40'
                }`}>
                {tattooImage ? <CheckCircle2 className="w-3.5 h-3.5" /> : '2'}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${tattooImage ? 'text-[#0091FF]' : step1Done ? 'text-[#0091FF]/80' : 'text-white/40'
                }`}>
                {t('upload_tattoo')}
              </span>
            </div>

            {tattooImage && !isLoadingTattoo && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveToLibrary}
                  disabled={isSaving || saveSuccess}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wide transition-all ${saveSuccess
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                    : 'bg-white/6 text-white/50 border border-white/10 hover:text-white hover:bg-white/10'
                    }`}
                >
                  {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : saveSuccess ? <CheckCircle2 className="w-3 h-3" /> : <BookmarkPlus className="w-3 h-3" />}
                  <span>{isSaving ? t('upload_saving') : saveSuccess ? t('upload_saved') : t('upload_add_to_library')}</span>
                </button>
              </div>
            )}
          </div>

          {/* Content */}
          {isLoadingTattoo ? (
            <div className="h-64 flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-[#0091FF]/20 border-t-[#0091FF] animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#0091FF]" />
                </div>
              </div>
              <p className="text-white/40 text-xs uppercase tracking-widest">{t('upload_processing')}</p>
            </div>
          ) : tattooImage ? (
            <div
              className="group relative cursor-pointer"
              onDragOver={(e) => { e.preventDefault(); setTattooDragging(true); }}
              onDragLeave={() => setTattooDragging(false)}
              onDrop={handleTattooDrop}
            >
              <div className="px-6 py-6">
                <img
                  src={tattooImage.url}
                  alt="Tattoo design"
                  className="w-full max-h-64 object-contain rounded-2xl bg-black/40"
                />
              </div>

              {/* Blue top accent */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#0091FF] to-transparent opacity-80" />

              {/* Swap button */}
              <div className="px-6 pb-5">
                <button
                  onClick={() => tattooInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white/50 text-[10px] font-bold uppercase tracking-wider hover:text-white hover:bg-white/10 transition-all active:scale-[0.98]"
                >
                  <Upload className="w-3 h-3" />
                  {t('studio_change_image')}
                </button>
              </div>

              <input ref={tattooInputRef} type="file" accept="image/*,video/*" onChange={handleTattooChange} className="hidden" />
            </div>
          ) : (
            /* Empty state – 3 CTAs */
            <div
              className="p-5 pt-4"
              onDragOver={(e) => { e.preventDefault(); setTattooDragging(true); }}
              onDragLeave={() => setTattooDragging(false)}
              onDrop={handleTattooDrop}
            >
              {/* AI Generate — primary CTA */}
              <button
                onClick={() => setShowGenerator(true)}
                className="w-full group/ai relative overflow-hidden rounded-2xl p-px mb-3 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] min-h-[64px]"
                style={{ background: 'linear-gradient(135deg, #0091FF40, #8B5CF640, #0091FF40)' }}
              >
                <div className="relative rounded-[15px] bg-[#090d14] px-5 py-4 flex items-center justify-between overflow-hidden">
                  {/* Animated background shimmer */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0091FF]/0 via-[#0091FF]/6 to-violet-500/6 translate-x-[-100%] group-hover/ai:translate-x-[100%] transition-transform duration-700 ease-out" />

                  <div className="flex items-center gap-3 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0091FF] to-violet-500 flex items-center justify-center shadow-lg shadow-[#0091FF]/30">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="text-white text-sm font-bold">{t('gen_title')}</p>
                      <p className="text-white/40 text-[10px] leading-tight">Generate with AI from a prompt</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 relative z-10">
                    <span className="text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-[#0091FF] to-violet-400 bg-clip-text text-transparent">AI</span>
                    <ChevronRight className="w-4 h-4 text-[#0091FF]/60 group-hover/ai:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px flex-1 bg-white/6" />
                <span className="text-white/25 text-[9px] uppercase tracking-widest font-bold">or</span>
                <div className="h-px flex-1 bg-white/6" />
              </div>

              {/* Upload / Camera row */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => tattooInputRef.current?.click()}
                  className={`group/up flex flex-col items-center justify-center gap-2.5 rounded-2xl py-5 min-h-[100px] border transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${tattooDragging
                    ? 'border-[#0091FF]/50 bg-[#0091FF]/10 text-[#0091FF]'
                    : 'border-white/8 bg-white/3 text-white/50 hover:border-white/20 hover:text-white hover:bg-white/6'
                    }`}
                >
                  <div className="w-9 h-9 rounded-[12px] bg-white/5 border border-white/8 group-hover/up:border-white/20 flex items-center justify-center transition-all">
                    <ImageIcon className="w-4.5 h-4.5" />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wide">{t('upload_tap_to_upload')}</p>
                    <p className="text-[9px] text-white/25 mt-0.5">{!isMobile ? 'or drag & drop' : 'from library'}</p>
                  </div>
                </button>

                {isMobile ? (
                  <button
                    onClick={() => bodyCameraInputRef.current?.click()}
                    className="group/cam flex flex-col items-center justify-center gap-2.5 rounded-2xl py-5 min-h-[100px] border border-white/8 bg-white/3 text-white/50 hover:border-white/20 hover:text-white hover:bg-white/6 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <div className="w-9 h-9 rounded-[12px] bg-white/5 border border-white/8 group-hover/cam:border-white/20 flex items-center justify-center transition-all">
                      <Camera className="w-4.5 h-4.5" />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wide">{t('upload_camera')}</p>
                      <p className="text-[9px] text-white/25 mt-0.5">Take a photo</p>
                    </div>
                  </button>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2.5 rounded-2xl py-5 min-h-[100px] border border-white/5 bg-white/2 text-white/20 select-none">
                    <div className="w-9 h-9 rounded-[12px] bg-white/3 border border-white/5 flex items-center justify-center">
                      <Camera className="w-4.5 h-4.5" />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold uppercase tracking-wide">Camera</p>
                      <p className="text-[9px] text-white/15 mt-0.5">Mobile only</p>
                    </div>
                  </div>
                )}
              </div>

              <input ref={tattooInputRef} type="file" accept="image/*,video/*" onChange={handleTattooChange} className="hidden" />
            </div>
          )}
        </section>

      </main>

      {/* ── Fixed bottom CTA ── */}
      <div
        className="fixed left-0 right-0 z-20 px-4 md:px-6 pt-12 pb-4 md:pb-6 bg-gradient-to-t from-[#080808] via-[#080808]/95 to-transparent bottom-[calc(64px+env(safe-area-inset-bottom,0px))] md:bottom-0"
      >
        <div className="max-w-2xl mx-auto flex flex-col items-center gap-3">
          <MagicButton
            onClick={onNext}
            disabled={!canProceed}
            className={`w-full h-16 rounded-[20px] transition-all duration-300 ${!canProceed ? 'opacity-50 grayscale' : 'shadow-[0_15px_40px_rgba(0,145,255,0.25)]'}`}
          >
            <span className="text-sm font-black tracking-[0.1em] uppercase flex items-center justify-center w-full">
              {t('upload_continue')}
              {canProceed && <ArrowRight className="w-5 h-5 ml-2" />}
            </span>
          </MagicButton>

          <AnimatePresence>
            {tattooImage && !isLoadingTattoo && (
              <motion.button
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                onClick={handleSaveToLibrary}
                disabled={isSaving || saveSuccess}
                className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40 hover:text-[#0091FF] transition-colors flex items-center gap-1.5"
              >
                {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : saveSuccess ? <CheckCircle2 className="w-3 h-3 text-[#0091FF]" /> : <BookmarkPlus className="w-3 h-3" />}
                {saveSuccess ? t('upload_saved') : t('upload_add_to_library')}
              </motion.button>
            )}
          </AnimatePresence>

          {!canProceed && (
            <p className="text-center text-white/25 text-[10px] uppercase tracking-widest font-medium">
              {!bodyImage ? '← Add a body photo first' : '← Now add your tattoo design'}
            </p>
          )}
        </div>
      </div>

      {showGenerator && <TattooGenerator onClose={() => setShowGenerator(false)} onGenerate={handleGeneratedTattoo} />}
      {showPaywall && <PlanPricingModal onClose={() => setShowPaywall(false)} />}
      {showPhotoGuide && <PhotoGuide onClose={() => setShowPhotoGuide(false)} />}
    </div>
  );
}
