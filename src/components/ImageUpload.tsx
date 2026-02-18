import { useRef, useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, AlertCircle, Loader2, Camera, Sparkles, Info, BookmarkPlus, CheckCircle2 } from 'lucide-react';
import { ImageData } from '../types';
import { loadImageWithOrientation } from '../utils/imageUtils';
import TattooGenerator from './TattooGenerator';
import PhotoGuide from './PhotoGuide';
import PlanPricingModal from './PlanPricingModal';
import BrandMark from './BrandMark';
import { useAuth } from '../contexts/AuthContext';
import { saveToMyLibrary } from '../utils/libraryUtils';
import { useLanguage } from '../contexts/LanguageContext';

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
  const { user } = useAuth();
  const { t } = useLanguage();
  const bodyInputRef = useRef<HTMLInputElement>(null);
  const bodyCameraInputRef = useRef<HTMLInputElement>(null);
  const tattooInputRef = useRef<HTMLInputElement>(null);
  const [isLoadingBody, setIsLoadingBody] = useState(false);
  const [isLoadingTattoo, setIsLoadingTattoo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [showPhotoGuide, setShowPhotoGuide] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

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

      if (!file.type.startsWith('image/')) {
        throw new Error('Please select a valid image file (JPG or PNG).');
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

  const handleBodyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file, onBodyImageChange, setIsLoadingBody);
    }
    e.target.value = '';
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

  return (
    <div className="min-h-[100dvh] flex flex-col items-center pt-20 md:pt-12 p-4 md:p-12 bg-neutral-950 overflow-x-hidden">
      <div className="max-w-6xl w-full flex flex-col min-h-full">
        {/* Brand Header */}
        <div className="mb-6 md:mb-12 opacity-0 animate-fade-up border-b border-[#27272a] pb-6 md:pb-8 flex flex-col items-center shrink-0">
          <BrandMark compact subtitle={t('upload_subtitle')} />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3 opacity-0 animate-fade-up shrink-0">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm font-mono">{error}</p>
          </div>
        )}

        {/* Upload Grid */}
        <div className="grid grid-cols-2 gap-3 md:gap-8 mb-6 md:mb-12 flex-1">
          {/* Target Photo */}
          <div className="opacity-0 animate-fade-up animation-delay-100 flex flex-col h-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 md:mb-4 px-1 gap-1">
              <label className="text-[10px] md:text-xs font-bold text-[#a1a1aa] uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0091FF]"></span>
                {t('upload_target')}
              </label>
              <button
                onClick={() => setShowPhotoGuide(true)}
                className="flex items-center gap-1.5 text-[#0091FF] hover:text-[#007AFF] text-[9px] md:text-[10px] uppercase font-bold tracking-wide transition-colors"
              >
                <Info className="w-3 h-3 md:w-3.5 md:h-3.5" />
                <span>{t('upload_tips')}</span>
              </button>
            </div>

            <div
              onClick={() => !isLoadingBody && bodyInputRef.current?.click()}
              className={`group relative flex-1 min-h-[200px] md:min-h-[400px] border-2 border-dashed rounded-xl overflow-hidden transition-all duration-300 cursor-pointer ${isLoadingBody
                ? 'cursor-wait border-[#27272a] bg-[#18181b]'
                : `${bodyImage ? 'border-[#27272a] bg-black' : 'border-[#27272a] bg-[#18181b] hover:border-[#0091FF]/50 hover:bg-[#0091FF]/5'}`
                }`}
            >
              {isLoadingBody ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-2 md:p-6">
                  <Loader2 className="w-6 h-6 md:w-8 md:h-8 text-[#0091FF] mb-2 md:mb-4 animate-spin" />
                  <p className="text-[10px] md:text-xs text-[#71717a] font-mono uppercase text-center">{t('upload_processing')}</p>
                </div>
              ) : bodyImage ? (
                <div className="w-full h-full relative group">
                  <img
                    src={bodyImage.url}
                    alt="Body"
                    className="w-full h-full object-cover md:object-contain pointer-events-none"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-white text-[10px] md:text-xs font-bold uppercase tracking-widest border border-white/20 px-3 py-1.5 md:px-4 md:py-2 rounded-full backdrop-blur-md">{t('studio_change_image')}</p>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 md:p-8 text-center pointer-events-none">
                  <div className="w-10 h-10 md:w-16 md:h-16 rounded-full bg-[#27272a] flex items-center justify-center mb-3 md:mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Upload className="w-4 h-4 md:w-6 md:h-6 text-[#a1a1aa] group-hover:text-white transition-colors" />
                  </div>
                  <p className="text-xs md:text-sm text-white font-medium mb-1 md:mb-2">{t('upload_target')}</p>
                  <p className="text-[9px] md:text-xs text-[#71717a] font-mono leading-tight">{t('upload_tap_to_upload')}</p>
                </div>
              )}
              <input ref={bodyInputRef} type="file" accept="image/*" onChange={handleBodyChange} className="hidden" />
              <input ref={bodyCameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleBodyChange} className="hidden" />
            </div>

            {isMobile && (
              <button
                onClick={() => !isLoadingBody && bodyCameraInputRef.current?.click()}
                className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2.5 bg-[#27272a] text-white rounded-lg text-[10px] font-bold uppercase tracking-wide"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{t('upload_camera')}</span>
              </button>
            )}
          </div>

          {/* Tattoo Photo */}
          <div className="opacity-0 animate-fade-up animation-delay-200 flex flex-col h-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-2 md:mb-4 px-1 gap-1">
              <label className="text-[10px] md:text-xs font-bold text-[#a1a1aa] uppercase tracking-wider flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${tattooImage ? 'bg-[#0091FF]' : 'bg-[#27272a]'}`}></span>
                {t('upload_tattoo')}
              </label>
            </div>

            <div
              className={`group relative flex-1 min-h-[200px] md:min-h-[400px] border-2 border-dashed rounded-xl overflow-hidden transition-all duration-300 ${isLoadingTattoo
                ? 'cursor-wait border-[#27272a] bg-[#18181b]'
                : `border-[#27272a] bg-[#18181b] ${!tattooImage ? 'hover:border-[#0091FF]/50 hover:bg-[#0091FF]/5' : 'bg-black'}`
                }`}
            >
              {isLoadingTattoo ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-2 md:p-6">
                  <Loader2 className="w-6 h-6 md:w-8 md:h-8 text-[#0091FF] mb-2 md:mb-4 animate-spin" />
                  <p className="text-[10px] md:text-xs text-[#71717a] font-mono uppercase text-center">{t('upload_processing')}</p>
                </div>
              ) : tattooImage ? (
                <div onClick={() => tattooInputRef.current?.click()} className="w-full h-full relative group cursor-pointer">
                  <img src={tattooImage.url} alt="Tattoo" className="w-full h-full object-contain p-4 md:p-8" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <p className="text-white text-[10px] md:text-xs font-bold uppercase tracking-widest border border-white/20 px-3 py-1.5 rounded-full backdrop-blur-md">{t('studio_change_image')}</p>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 md:p-8 text-center h-full">
                  <div className="flex flex-col items-center flex-1 justify-center">
                    <div onClick={() => tattooInputRef.current?.click()} className="w-10 h-10 md:w-16 md:h-16 rounded-full bg-[#27272a] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform cursor-pointer">
                      <ImageIcon className="w-4 h-4 md:w-6 md:h-6 text-[#a1a1aa] group-hover:text-white" />
                    </div>
                    <p className="text-xs md:text-sm text-white font-medium mb-1">{t('upload_tattoo')}</p>
                    <p className="text-[9px] md:text-xs text-[#71717a] font-mono leading-tight mb-6">{t('upload_tap_to_upload')}</p>
                  </div>

                  {/* AI Option Highlighted */}
                  <div className="w-full pt-4 border-t border-[#27272a]">
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowGenerator(true); }}
                      className="w-full py-3 bg-[#0091FF]/10 text-[#0091FF] border border-[#0091FF]/20 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#0091FF]/20 transition-all flex items-center justify-center gap-2 group/btn"
                    >
                      <Sparkles className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
                      {t('gen_title')}
                    </button>
                  </div>
                </div>
              )}
              <input ref={tattooInputRef} type="file" accept="image/*" onChange={handleTattooChange} className="hidden" />
            </div>

            {tattooImage && !isLoadingTattoo && (
              <div className="mt-4">
                <button
                  onClick={handleSaveToLibrary}
                  disabled={isSaving || saveSuccess}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 border border-[#27272a] rounded-lg transition-all text-xs font-bold uppercase tracking-wide ${saveSuccess ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-[#18181b] text-[#a1a1aa] hover:text-white'}`}
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saveSuccess ? <CheckCircle2 className="w-3.5 h-3.5" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
                  <span>{isSaving ? t('upload_saving') : saveSuccess ? t('upload_saved') : t('upload_add_to_library')}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Continue Button */}
        <div className="fixed bottom-24 left-0 right-0 px-4 md:static md:px-0 flex justify-end">
          <button
            onClick={onNext}
            disabled={!canProceed}
            className={`w-full md:w-auto px-12 py-4 rounded-lg text-sm font-bold tracking-wider uppercase transition-all ${canProceed ? 'bg-[#0091FF] text-white hover:bg-[#007AFF] shadow-lg shadow-[#0091FF]/20' : 'bg-[#18181b] text-[#52525b] border border-[#27272a]'}`}
          >
            {t('upload_continue')}
          </button>
        </div>
      </div>

      {showGenerator && <TattooGenerator onClose={() => setShowGenerator(false)} onGenerate={handleGeneratedTattoo} />}
      {showPaywall && <PlanPricingModal onClose={() => setShowPaywall(false)} />}
      {showPhotoGuide && <PhotoGuide onClose={() => setShowPhotoGuide(false)} />}
    </div>
  );
}
