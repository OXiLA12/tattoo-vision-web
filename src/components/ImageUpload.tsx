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
    <div className="flex flex-col h-[100dvh] bg-[#020202] overflow-hidden items-stretch w-full relative" style={{ WebkitTapHighlightColor: 'transparent' }}>

      {/* Subtle radial background */}
      <div className="absolute inset-x-0 -top-40 h-[1000px] w-full bg-[radial-gradient(100%_50%_at_50%_0%,rgba(0,145,255,0.06)_0,transparent_50%)] pointer-events-none z-0" />

      {/* Header */}
      <header className="relative z-30 flex items-center justify-between px-5 md:px-8 py-4 border-b border-white/5 bg-[#050505]/80 backdrop-blur-2xl">
        <BrandMark compact horizontal />

        {/* Step pills */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${step1Done ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-white/5 text-white/40 border border-white/10'}`}>
            {step1Done ? <CheckCircle2 className="w-3 h-3" /> : <span className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center text-[8px]">1</span>}
            <span className="hidden sm:inline">Body</span>
          </div>
          <ChevronRight className="w-3 h-3 text-white/20" />
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${step2Done ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : step1Done ? 'bg-[#0091FF]/15 text-[#0091FF] border border-[#0091FF]/30' : 'bg-white/5 text-white/40 border border-white/10'}`}>
            {step2Done ? <CheckCircle2 className="w-3 h-3" /> : <span className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center text-[8px]">2</span>}
            <span className="hidden sm:inline">Design</span>
          </div>
        </div>

        <button onClick={() => setShowPhotoGuide(true)} className="flex items-center gap-1.5 text-white/40 hover:text-[#0091FF] text-[10px] font-bold uppercase tracking-wider transition-colors">
          <Info className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('upload_tips')}</span>
        </button>
      </header>

      <main className="flex-1 flex flex-col px-4 pt-5 pb-44 max-w-xl mx-auto w-full relative z-10 gap-4 overflow-hidden">

        {/* Errors */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-xs flex-1">{error}</p>
              <button onClick={() => setError(null)}><X className="w-4 h-4 text-red-400/60 hover:text-red-400" /></button>
            </motion.div>
          )}
          {cameraError && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
              <p className="text-orange-400 text-xs flex-1">{cameraError}</p>
              <button onClick={() => setCameraError(null)}><X className="w-4 h-4 text-orange-400/60 hover:text-orange-400" /></button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative w-full flex-1 flex flex-col gap-4 min-h-0">

          {/* ── STEP 1 ── Body */}
          <div
            className="flex flex-col gap-2 relative z-20 transition-all duration-500"
            style={{ height: step1Done ? '40%' : '100%', minHeight: step1Done ? '180px' : '380px' }}
          >
            <div className="flex items-center justify-between px-1 flex-shrink-0">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">{t('upload_target')}</p>
            </div>

            <motion.div
              className={`flex-1 relative overflow-hidden rounded-[24px] backdrop-blur-2xl flex flex-col cursor-pointer transition-all duration-300 ${bodyImage ? 'border border-[#0091FF]/20 bg-white/[0.02]' : bodyDragging ? 'border-2 border-dashed border-[#0091FF] bg-[#0091FF]/10' : 'border-2 border-dashed border-[#0091FF]/30 bg-white/[0.02] hover:bg-white/[0.04]'}`}
              onClick={() => !isLoadingBody && !bodyImage && bodyInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setBodyDragging(true); }}
              onDragLeave={() => setBodyDragging(false)}
              onDrop={handleBodyDrop}
            >
              {bodyImage && (
                <div className="absolute top-3 right-3 z-30">
                  <button
                    onClick={(e) => { e.stopPropagation(); bodyInputRef.current?.click(); }}
                    className="px-3 py-1.5 bg-black/60 hover:bg-black/80 rounded-xl text-[10px] text-white font-bold uppercase tracking-wider backdrop-blur-xl border border-white/10"
                  >
                    {t('upload_change')}
                  </button>
                </div>
              )}

              <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                {isLoadingBody ? (
                  <Loader2 className="w-10 h-10 text-[#0091FF] animate-spin" />
                ) : bodyImage ? (
                  <motion.img initial={{ opacity: 0 }} animate={{ opacity: 1 }} src={bodyImage.url} alt="Body" className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-luminosity" />
                ) : (
                  <div className="flex flex-col items-center gap-4 px-8">
                    <div className="w-16 h-16 rounded-full bg-[#0091FF]/5 border border-[#0091FF]/20 flex items-center justify-center">
                      <Upload className="w-6 h-6 text-[#0091FF]" />
                    </div>
                    <div className="text-center">
                      <p className="text-white/80 text-sm font-bold tracking-wide">{t('upload_tap_drop')}</p>
                      <p className="text-white/30 text-xs mt-1">{isMobile ? t('upload_tap_to_upload') : 'Drag & drop or click to browse'}</p>
                    </div>
                    {isMobile && (
                      <div className="flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); bodyInputRef.current?.click(); }} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-white/50 uppercase tracking-widest">
                          <ImageIcon className="w-3 h-3" /> {t('upload_library')}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); triggerCamera(bodyCameraInputRef, bodyInputRef); }} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-white/50 uppercase tracking-widest">
                          <Camera className="w-3 h-3" /> {t('upload_camera_btn')}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <input ref={bodyInputRef} type="file" accept="image/*,video/*" onChange={handleBodyChange} className="hidden" />
              <input ref={bodyCameraInputRef} type="file" accept="image/*,video/*" capture="environment" onChange={handleBodyChange} className="hidden" />
            </motion.div>
          </div>

          {/* ── STEP 2 ── Tattoo design (slides in) */}
          <AnimatePresence>
            {step1Done && (
              <motion.div
                className="flex flex-col gap-2 relative z-30"
                style={{ height: '60%' }}
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', damping: 25, stiffness: 120, delay: 0.05 }}
              >
                <div className="flex items-center justify-between px-1 flex-shrink-0">
                  <p className="text-[10px] uppercase font-black tracking-[0.25em] text-white/40">{t('upload_tattoo')}</p>
                </div>

                <div
                  className={`flex-1 relative overflow-hidden rounded-[24px] backdrop-blur-2xl flex flex-col transition-all duration-300 ${tattooImage ? 'border border-[#0055FF]/30 bg-gradient-to-b from-[#0055FF]/[0.05] to-black' : tattooDragging ? 'border-2 border-dashed border-[#0055FF] bg-[#0055FF]/10' : 'border-2 border-dashed border-[#0055FF]/30 bg-white/[0.02]'}`}
                  onDragOver={(e) => { e.preventDefault(); setTattooDragging(true); }}
                  onDragLeave={() => setTattooDragging(false)}
                  onDrop={handleTattooDrop}
                >
                  <div className="flex-1 overflow-y-auto p-4 pb-6 flex flex-col gap-4 justify-center relative">
                    {isLoadingTattoo ? (
                      <div className="flex justify-center items-center h-full"><Loader2 className="w-10 h-10 text-[#0055FF] animate-spin" /></div>
                    ) : tattooImage ? (
                      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full h-full flex flex-col items-center justify-center">
                        <div className="absolute top-0 right-0 z-30">
                          <button onClick={() => tattooInputRef.current?.click()} className="px-3 py-1.5 bg-black/60 hover:bg-black/80 rounded-xl text-[10px] text-white font-bold uppercase tracking-wider backdrop-blur-xl border border-white/10">
                            {t('upload_change')}
                          </button>
                        </div>
                        <img src={tattooImage.url} alt="Tattoo" className="max-h-36 object-contain drop-shadow-[0_0_30px_rgba(138,43,226,0.4)]" />
                      </motion.div>
                    ) : (
                      <div className="w-full h-full flex flex-col justify-center gap-3">
                        {/* AI Generate CTA */}
                        <MagicButton onClick={() => setShowGenerator(true)} className="w-full min-h-[64px]">
                          <div className="flex items-center gap-3 w-full">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0091FF] to-[#0055FF] flex items-center justify-center shadow-[0_0_20px_rgba(0,145,255,0.3)] flex-shrink-0">
                              <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <div className="text-left flex-1">
                              <p className="text-white text-sm font-bold">{t('gen_title')}</p>
                              <p className="text-white/50 text-[9px] uppercase tracking-widest">{t('upload_ai_gen')}</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-white/30 flex-shrink-0" />
                          </div>
                        </MagicButton>

                        <div className="flex items-center gap-3">
                          <div className="h-px flex-1 bg-white/6" />
                          <span className="text-white/25 text-[9px] uppercase tracking-widest font-bold">or</span>
                          <div className="h-px flex-1 bg-white/6" />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => tattooInputRef.current?.click()} className="flex items-center justify-center gap-2 py-4 rounded-[20px] bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                            <ImageIcon className="w-4 h-4 text-[#0055FF]" />
                            <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">{t('upload_library')}</span>
                          </motion.button>
                          {isMobile ? (
                            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => triggerCamera(tattooInputRef)} className="flex items-center justify-center gap-2 py-4 rounded-[20px] bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                              <Camera className="w-4 h-4 text-[#0055FF]" />
                              <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">{t('upload_camera_btn')}</span>
                            </motion.button>
                          ) : (
                            <div className="flex items-center justify-center gap-2 py-4 rounded-[20px] bg-white/[0.02] border border-white/5 opacity-40">
                              <Camera className="w-4 h-4 text-white/30" />
                              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{t('upload_mobile')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <input ref={tattooInputRef} type="file" accept="image/*,video/*" onChange={handleTattooChange} className="hidden" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>

      {/* ── Fixed bottom CTA ── */}
      <div className="fixed left-0 right-0 z-40 px-4 md:px-8 pb-6 md:pb-8 bottom-[calc(env(safe-area-inset-bottom,0px)+64px)] md:bottom-0 pointer-events-none bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent pt-12">
        <div className="max-w-xl mx-auto pointer-events-auto flex flex-col items-center gap-3">
          <MagicButton
            onClick={onNext}
            disabled={!canProceed}
            className={`w-full h-16 rounded-[20px] transition-all duration-300 ${!canProceed ? 'opacity-50 grayscale' : 'shadow-[0_15px_40px_rgba(0,145,255,0.25)]'}`}
          >
            <span className="text-sm font-black tracking-[0.1em] uppercase flex items-center justify-center w-full">
              {t('upload_start_placement')}
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
        </div>
      </div>

      {showGenerator && <TattooGenerator onClose={() => setShowGenerator(false)} onGenerate={handleGeneratedTattoo} />}
      {showPaywall && <PlanPricingModal onClose={() => setShowPaywall(false)} />}
      {showPhotoGuide && <PhotoGuide onClose={() => setShowPhotoGuide(false)} />}
    </div>
  );
}
