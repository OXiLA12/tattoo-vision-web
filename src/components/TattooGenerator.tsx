import { useState } from 'react';
import { X, Loader2, Sparkles, RefreshCw, Layers, Image as ImageIcon, Coins } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { invokeWithAuth } from '../lib/invokeWithAuth';
import { useAuth } from '../contexts/AuthContext';
import { ImageData } from '../types';
import { loadImageFromDataUrl } from '../utils/imageUtils';
import PlanPricingModal from './PlanPricingModal';
import { canUseFeature } from '../utils/authRules';
import { generateUUID } from '../utils/uuid';
import { trackAIGenerationStarted, trackAIGenerationCompleted, trackPaywallViewed } from '../lib/analytics';

interface TattooGeneratorProps {
  onClose: () => void;
  onGenerate: (tattoo: ImageData) => void;
}

type TattooStyle = 'stencil' | 'realistic';

export default function TattooGenerator({ onClose, onGenerate }: TattooGeneratorProps) {
  const { profile, credits } = useAuth(); // Add credits
  const [promptText, setPromptText] = useState('');
  const [style, setStyle] = useState<TattooStyle>('stencil');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<ImageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  const handleGenerate = async () => {
    if (!promptText.trim()) {
      setError('Please describe the tattoo you want to create.');
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
      // Call Supabase Edge Function using supabase-js (adds apikey + Authorization automatically)
      const requestId = generateUUID();

      const { data, error: fnError } = await invokeWithAuth('generate-tattoo', {
        body: {
          user_description: promptText,
          style,
          request_id: requestId,
        },
      });

      if (fnError) {
        // supabase-js wraps non-2xx into FunctionsHttpError / FunctionsRelayError / FunctionsFetchError
        throw new Error(fnError.message || 'Edge Function error');
      }

      if (!data?.imageBase64) {
        throw new Error('No image was generated. Please check your prompt or point balance.');
      }

      const finalImage = `data:image/png;base64,${data.imageBase64}`;
      const imageData = await loadImageFromDataUrl(finalImage);
      setGeneratedImage(imageData);
      trackAIGenerationCompleted(credits);
    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : 'Generation failed. Please try again.');
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
      <div className="bg-neutral-900 border border-neutral-800 rounded-t-3xl md:rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90dvh] md:max-h-[90vh] flex flex-col animate-slide-up md:animate-scale-in">
        <div className="shrink-0 bg-neutral-900/80 backdrop-blur-md border-b border-neutral-800 p-6 flex items-center justify-between z-10 rounded-t-3xl md:rounded-t-3xl border-x-0 border-t-0">
          <h2 className="text-xl md:text-2xl font-light text-neutral-100 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-neutral-400" />
            AI Tattoo Creator
          </h2>
          <button
            onClick={onClose}
            className="p-3 md:p-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl md:rounded-lg transition-premium shadow-lg shadow-black/20"
          >
            <X className="w-6 h-6 md:w-5 md:h-5 text-white md:text-neutral-400" />
          </button>
        </div>

        <div className="p-6 md:p-8 space-y-8 overflow-y-auto pb-[calc(2rem+env(safe-area-inset-bottom))]">
          {error && (
            <div className="p-5 bg-red-950/30 border border-red-900/40 rounded-2xl text-red-300 text-sm animate-shake">
              {error}
            </div>
          )}

          {generatedImage ? (
            <div className="space-y-6">
              <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-8 flex items-center justify-center min-h-[350px] group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-neutral-800/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <img
                  src={generatedImage.url}
                  alt="Generated tattoo"
                  className="max-w-full max-h-[400px] object-contain relative z-10 drop-shadow-2xl"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 text-neutral-200 rounded-2xl transition-premium disabled:opacity-40"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span className="font-light">Regenerate</span>
                </button>
                <button
                  onClick={handleUse}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-neutral-100 text-neutral-950 rounded-2xl hover:bg-white hover:scale-[1.02] transition-premium shadow-lg shadow-white/5"
                >
                  <span className="font-medium">Use this design</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-4 tracking-widest uppercase">
                  Tattoo Description
                </label>
                <textarea
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="E.g. A geometric lion with cherry blossoms..."
                  className="w-full px-6 py-5 bg-neutral-950 border border-neutral-800 text-neutral-200 placeholder-neutral-600 rounded-3xl focus:border-neutral-600 focus:outline-none resize-none transition-premium min-h-[140px]"
                  disabled={isGenerating}
                />
                <p className="mt-3 text-xs text-neutral-500 font-light">
                  Describe precisely the elements, shapes, and mood you want.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-4 tracking-widest uppercase">
                  Design Style
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setStyle('stencil')}
                    disabled={isGenerating}
                    className={`flex flex-col items-center gap-3 p-6 rounded-3xl transition-premium border ${style === 'stencil'
                      ? 'bg-neutral-100 border-neutral-100 text-neutral-950 shadow-lg shadow-white/5'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                      }`}
                  >
                    <Layers className="w-6 h-6" />
                    <div className="text-center">
                      <span className="block text-sm font-medium">Stencil / Lineart</span>
                      <span className="text-[10px] opacity-60 uppercase tracking-tighter">Clean lines, no shading</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setStyle('realistic')}
                    disabled={isGenerating}
                    className={`flex flex-col items-center gap-3 p-6 rounded-3xl transition-premium border ${style === 'realistic'
                      ? 'bg-neutral-100 border-neutral-100 text-neutral-950 shadow-lg shadow-white/5'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                      }`}
                  >
                    <ImageIcon className="w-6 h-6" />
                    <div className="text-center">
                      <span className="block text-sm font-medium">Artistic / Realistic</span>
                      <span className="text-[10px] opacity-60 uppercase tracking-tighter">Shading, ink textures</span>
                    </div>
                  </button>
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !promptText.trim()}
                className="w-full flex items-center justify-center gap-3 px-6 py-5 bg-neutral-100 text-neutral-950 rounded-2xl hover:bg-white hover:scale-[1.01] transition-premium disabled:opacity-40 disabled:cursor-not-allowed font-medium text-base tracking-wide mt-4 shadow-xl shadow-white/5"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Generate Tattoo</span>
                    <span className="ml-2 flex items-center gap-1 text-[10px] bg-neutral-900/50 px-2 py-1 rounded-lg">
                      <Coins className="w-3 h-3" />
                      200 VP
                    </span>
                  </>
                )}
              </button>
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
