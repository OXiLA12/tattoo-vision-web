import { useState } from 'react';
import { X, Loader2, Sparkles, RefreshCw, Layers, Image as ImageIcon, Coins, Lightbulb, ChevronRight } from 'lucide-react';
import { invokeWithAuth } from '../lib/invokeWithAuth';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ImageData } from '../types';
import { loadImageFromDataUrl } from '../utils/imageUtils';
import PlanPricingModal from './PlanPricingModal';
import { generateUUID } from '../utils/uuid';
import { trackAIGenerationStarted, trackAIGenerationCompleted, trackPaywallViewed } from '../lib/analytics';

interface TattooGeneratorProps {
  onClose: () => void;
  onGenerate: (tattoo: ImageData) => void;
}

type TattooStyle = 'stencil' | 'realistic';

// Suggestions bilingues — triées par catégorie
const INSPIRATIONS = {
  en: [
    // Animaux
    'A geometric wolf head with moon phases',
    'A minimalist snake coiling around a rose',
    'A phoenix rising from flames',
    'A koi fish with cherry blossoms',
    'A lion portrait with crown, old school style',
    // Nature
    'A mountain range at sunset with pine trees',
    'A lotus flower, dotwork style',
    'An abstract wave, Japanese woodblock style',
    'A sunflower with mandala center',
    'A crescent moon with stars and clouds',
    // Géométrie & Abstract
    'Sacred geometry — metatron\'s cube',
    'A compass rose with fine linework',
    'A clock mechanism with gears, steampunk',
    'Abstract watercolor splash with birds',
    'A skull with floral ornaments',
    // Lettrage & Symboles
    'An ouroboros snake forming a circle',
    'A dagger wrapped in vine leaves',
    'An anchor with rope, nautical style',
    'An eye of providence inside a triangle',
    'A samurai helmet, Japanese style',
  ],
  fr: [
    // Animaux
    'Une tête de loup géométrique avec phases de lune',
    'Un serpent minimaliste enroulé autour d\'une rose',
    'Un phénix s\'élevant des flammes',
    'Un koi avec des fleurs de cerisier',
    'Un portrait de lion avec couronne, old school',
    // Nature
    'Une chaîne de montagnes au coucher de soleil',
    'Une fleur de lotus, style dotwork',
    'Une vague abstraite, style gravure japonaise',
    'Un tournesol avec un mandala au centre',
    'Un croissant de lune avec étoiles et nuages',
    // Géométrie & Abstract
    'Géométrie sacrée — cube de Métatron',
    'Une rose des vents avec traits fins',
    'Un mécanisme d\'horloge avec engrenages, steampunk',
    'Éclaboussure aquarelle abstraite avec oiseaux',
    'Un crâne orné de fleurs',
    // Lettrage & Symboles
    'Un ouroboros (serpent qui se mord la queue)',
    'Une dague enroulée de feuilles de vigne',
    'Une ancre avec corde, style nautique',
    'Un œil de la providence dans un triangle',
    'Un casque de samouraï, style japonais',
  ]
};

export default function TattooGenerator({ onClose, onGenerate }: TattooGeneratorProps) {
  const { profile, credits } = useAuth();
  const { t, language } = useLanguage();
  const [promptText, setPromptText] = useState('');
  const [style, setStyle] = useState<TattooStyle>('stencil');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<ImageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showInspirations, setShowInspirations] = useState(false);

  const inspirations = language === 'fr' ? INSPIRATIONS.fr : INSPIRATIONS.en;

  const handleGenerate = async () => {
    if (!promptText.trim()) {
      setError(t('gen_error_empty'));
      return;
    }

    if (credits < 200) {
      trackPaywallViewed('plan_pricing', credits);
      setShowPaywall(true);
      return;
    }

    try {
      setError(null);
      setIsGenerating(true);
      trackAIGenerationStarted(credits);
      const requestId = generateUUID();

      const { data, error: fnError } = await invokeWithAuth('generate-tattoo', {
        body: {
          user_description: promptText,
          style,
          request_id: requestId,
        },
      });

      if (fnError) {
        throw new Error(fnError.message || t('gen_error_failed'));
      }

      if (!data?.imageBase64) {
        throw new Error(t('gen_error_no_image'));
      }

      const finalImage = `data:image/png;base64,${data.imageBase64}`;
      const imageData = await loadImageFromDataUrl(finalImage);
      setGeneratedImage(imageData);
      trackAIGenerationCompleted(credits);
    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : t('gen_error_failed'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUse = () => {
    if (generatedImage) {
      onGenerate(generatedImage);
      onClose();
    }
  };

  const handleRegenerate = () => {
    setGeneratedImage(null);
    handleGenerate();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-4 z-50 animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-t-3xl md:rounded-3xl shadow-2xl max-w-2xl w-full max-h-[93dvh] md:max-h-[90vh] flex flex-col animate-slide-up md:animate-scale-in">

        {/* Header */}
        <div className="shrink-0 bg-neutral-900/80 backdrop-blur-md border-b border-neutral-800 p-6 flex items-center justify-between z-10 rounded-t-3xl">
          <h2 className="text-xl md:text-2xl font-light text-neutral-100 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-[#0091FF]" />
            {t('gen_title')}
          </h2>
          <button
            onClick={onClose}
            className="p-3 md:p-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl md:rounded-lg transition-all shadow-lg shadow-black/20"
          >
            <X className="w-6 h-6 md:w-5 md:h-5 text-white md:text-neutral-400" />
          </button>
        </div>

        <div className="p-6 md:p-8 space-y-6 overflow-y-auto pb-[calc(2rem+env(safe-area-inset-bottom))]">

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-950/30 border border-red-900/40 rounded-2xl text-red-300 text-sm animate-shake">
              {error}
            </div>
          )}

          {generatedImage ? (
            <div className="space-y-6">
              <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-8 flex items-center justify-center min-h-[280px] md:min-h-[350px] group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0091FF]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <img
                  src={generatedImage.url}
                  alt="Generated tattoo"
                  className="max-w-full max-h-[350px] object-contain relative z-10 drop-shadow-2xl"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 text-neutral-200 rounded-2xl transition-all disabled:opacity-40"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span className="font-light">{t('gen_regenerate')}</span>
                </button>
                <button
                  onClick={handleUse}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-[#0091FF] to-[#00DC82] text-white rounded-2xl hover:opacity-90 hover:scale-[1.02] transition-all shadow-lg shadow-[#0091FF]/20 font-medium"
                >
                  <ChevronRight className="w-5 h-5" />
                  <span>{t('gen_use')}</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Textarea */}
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-3 tracking-widest uppercase">
                  {t('gen_label')}
                </label>
                <textarea
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder={t('gen_placeholder')}
                  className="w-full px-5 py-4 bg-neutral-950 border border-neutral-800 text-neutral-200 placeholder-neutral-600 rounded-2xl focus:border-[#0091FF]/50 focus:outline-none resize-none transition-all min-h-[120px] text-sm"
                  disabled={isGenerating}
                />
                <p className="mt-2 text-xs text-neutral-500 font-light">{t('gen_hint')}</p>
              </div>

              {/* Inspirations */}
              <div>
                <button
                  onClick={() => setShowInspirations(!showInspirations)}
                  className="flex items-center gap-2 text-xs text-[#0091FF] hover:text-[#007AFF] transition-colors font-medium tracking-wide"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  {t('gen_inspirations')}
                  <ChevronRight className={`w-3 h-3 transition-transform duration-200 ${showInspirations ? 'rotate-90' : ''}`} />
                </button>

                {showInspirations && (
                  <div className="mt-3 flex flex-wrap gap-2 animate-fade-in">
                    {inspirations.map((idea, i) => (
                      <button
                        key={i}
                        onClick={() => { setPromptText(idea); setShowInspirations(false); }}
                        className="px-3 py-1.5 bg-neutral-800/60 hover:bg-[#0091FF]/15 border border-neutral-700 hover:border-[#0091FF]/40 text-neutral-400 hover:text-[#0091FF] rounded-full text-[11px] transition-all"
                      >
                        {idea.length > 40 ? idea.slice(0, 38) + '…' : idea}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Style */}
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-3 tracking-widest uppercase">
                  {t('gen_style')}
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setStyle('stencil')}
                    disabled={isGenerating}
                    className={`flex flex-col items-center gap-3 p-5 rounded-2xl transition-all border ${style === 'stencil'
                      ? 'bg-neutral-100 border-neutral-100 text-neutral-950 shadow-lg shadow-white/5'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                      }`}
                  >
                    <Layers className="w-5 h-5" />
                    <div className="text-center">
                      <span className="block text-sm font-medium">{t('gen_style_stencil')}</span>
                      <span className="text-[10px] opacity-60 uppercase tracking-tighter">{t('gen_style_stencil_desc')}</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setStyle('realistic')}
                    disabled={isGenerating}
                    className={`flex flex-col items-center gap-3 p-5 rounded-2xl transition-all border ${style === 'realistic'
                      ? 'bg-neutral-100 border-neutral-100 text-neutral-950 shadow-lg shadow-white/5'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                      }`}
                  >
                    <ImageIcon className="w-5 h-5" />
                    <div className="text-center">
                      <span className="block text-sm font-medium">{t('gen_style_realistic')}</span>
                      <span className="text-[10px] opacity-60 uppercase tracking-tighter">{t('gen_style_realistic_desc')}</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Generate button */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !promptText.trim()}
                className="w-full flex items-center justify-center gap-3 px-6 py-5 bg-gradient-to-r from-[#0091FF] to-[#0060CC] text-white rounded-2xl hover:opacity-90 hover:scale-[1.01] transition-all disabled:opacity-40 disabled:cursor-not-allowed font-medium text-base tracking-wide mt-2 shadow-xl shadow-[#0091FF]/20"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{t('gen_creating')}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>{t('gen_button')}</span>
                  </>
                )}
              </button>
              <p className="text-[10px] text-neutral-600 leading-relaxed text-center px-2">
                {t('ai_privacy_gen')}
              </p>
            </>
          )}
        </div>
      </div>

      {showPaywall && (
        <PlanPricingModal onClose={() => setShowPaywall(false)} />
      )}
    </div>
  );
}
