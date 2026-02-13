import { useState, useEffect } from 'react';
import { Download, ArrowLeft, RefreshCw, Sparkles, Loader2, AlertCircle, Coins } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { saveToHistory } from '../utils/historyUtils';
import { ImageData, TattooTransform } from '../types';
import CreditsDisplay from './CreditsDisplay';
import { supabase } from '../lib/supabaseClient';
import { invokeWithAuth } from '../lib/invokeWithAuth';
import PlanPricingModal from './PlanPricingModal';
import { canUseFeature } from '../utils/authRules';

interface ExportProps {
  exportedImage: string;
  bodyImage: ImageData | null;
  tattooImage: ImageData | null;
  transform: TattooTransform;
  onBack: () => void;
  onStartOver: () => void;
}

export default function Export({
  exportedImage,
  bodyImage,
  tattooImage,
  transform,
  onBack,
  onStartOver,
}: ExportProps) {
  const { user, profile, refreshCredits, refreshProfile } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [realisticImage, setRealisticImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  // Save to history when component mounts
  useEffect(() => {
    if (user && profile && bodyImage && tattooImage && !saved) {
      const { allowed } = canUseFeature(profile.plan, 'SAVE_HISTORY');
      if (!allowed) return;

      saveToHistory(
        user.id,
        bodyImage,
        tattooImage,
        exportedImage,
        transform,
        false
      ).then((success) => {
        if (success) setSaved(true);
      });
    }
  }, [user, profile, bodyImage, tattooImage, exportedImage, transform, saved]);

  const handleDownload = (imageToDownload: string) => {
    const link = document.createElement('a');
    link.href = imageToDownload;
    link.download = `tattoo-${realisticImage ? 'realistic' : 'preview'}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateRealistic = async () => {
    if (!user || !profile) {
      setError('You must be logged in to generate realistic renders');
      return;
    }

    // Check plan and trial status using centralized rules
    const { allowed } = canUseFeature(profile.plan, 'REALISTIC_RENDER', {
      freeRealisticUsed: profile.free_realistic_render_used
    });

    if (!allowed) {
      setShowPaywall(true);
      return;
    }

    setIsGenerating(true);
    setError(null);
    setDebugInfo(null);

    try {
      const { data: sess } = await supabase.auth.getSession();
      console.log("session exists?", !!sess.session, "user?", sess.session?.user?.id);

      const { data, error: invokeError } = await invokeWithAuth('generate-realistic-render', {
        body: {
          imageBase64: exportedImage,
          request_id: crypto.randomUUID(),
        },
      });

      if (invokeError) {
        console.log("invoke error", invokeError);
        throw invokeError;
      }

      // If the function returned a 402 or similar through data.error
      if (data?.error) {
        if (data.error.includes('Upgrade') || data.error.includes('Insufficient')) {
          setShowPaywall(true);
        }
        setError(data.error);
        return;
      }

      if (data?.imageBase64) {
        const realisticUrl = `data:image/png;base64,${data.imageBase64}`;
        setRealisticImage(realisticUrl);

        // Save realistic version to history (Only for paid plans)
        if (profile.plan !== 'free' && bodyImage && tattooImage) {
          await saveToHistory(
            user.id,
            bodyImage,
            tattooImage,
            realisticUrl,
            transform,
            true
          );
        }

        // Refresh points and trial status
        await refreshCredits();
        await refreshProfile();
      } else {
        setError('No image was generated');
        if (data?.debug) {
          setDebugInfo(JSON.stringify(data.debug, null, 2));
        }
      }
    } catch (err) {
      console.error('Error generating realistic render:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const displayImage = realisticImage || exportedImage;

  return (
    <div className="min-h-screen flex flex-col bg-neutral-950 animate-fade-in">
      {/* Header */}
      <div className="bg-neutral-900/60 backdrop-blur-md border-b border-neutral-800/50 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-neutral-300 hover:bg-neutral-800/50 rounded-xl transition-premium btn-premium"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline font-light">Back</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <h1 className="text-xl tracking-tight font-light text-neutral-50">
                Tattoo Vision
              </h1>
              <div className="text-xs text-neutral-400 font-light tracking-wide mt-1">
                {realisticImage ? 'Realistic render' : 'Your result'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CreditsDisplay />
            <button
              onClick={onStartOver}
              className="flex items-center gap-2 px-4 py-2 text-neutral-300 hover:bg-neutral-800/50 rounded-xl transition-premium btn-premium"
            >
              <RefreshCw className="w-5 h-5" />
              <span className="hidden sm:inline font-light">Start Over</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 md:p-12 flex items-center justify-center">
        <div className="max-w-4xl w-full">
          {/* Image Display with Reveal Animation */}
          <div className="mb-12 relative flex justify-center bg-black/40 border border-neutral-800/50 rounded-3xl p-8 md:p-12 opacity-0 animate-scale-in">
            <img
              src={displayImage}
              alt="Final result"
              className="max-w-full h-auto rounded-2xl shadow-2xl shadow-black/50"
            />
            {realisticImage && (
              <div className="absolute top-8 right-8 bg-neutral-800/90 border border-neutral-700 text-neutral-100 px-4 py-2 rounded-xl text-xs flex items-center gap-2 backdrop-blur-sm animate-fade-up animation-delay-300">
                <Sparkles className="w-3.5 h-3.5" />
                Realistic Render
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-8 p-5 bg-red-950/30 border border-red-900/40 rounded-2xl opacity-0 animate-fade-up animation-delay-100">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              </div>
              {debugInfo && (
                <details className="mt-4">
                  <summary className="text-xs text-red-400 cursor-pointer hover:text-red-300">
                    Debug Information
                  </summary>
                  <pre className="mt-3 p-4 bg-red-950/60 rounded text-xs text-red-300 overflow-x-auto">
                    {debugInfo}
                  </pre>
                </details>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4 opacity-0 animate-fade-up animation-delay-200">
            {!realisticImage && (
              <button
                onClick={handleGenerateRealistic}
                disabled={isGenerating}
                className={`w-full py-6 rounded-2xl text-base tracking-wide transition-premium flex items-center justify-center gap-3 border ${isGenerating
                  ? 'bg-neutral-900/50 border-neutral-800/50 text-neutral-600 cursor-not-allowed'
                  : 'bg-neutral-900/50 border-neutral-800 hover:bg-neutral-900 hover:border-neutral-700 text-neutral-200 hover:shadow-lg hover:shadow-neutral-900/50 btn-premium'
                  }`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating realistic render...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Realistic Render
                    <span className="ml-2 flex items-center gap-1 text-xs bg-neutral-800 px-2 py-1 rounded-lg">
                      <Coins className="w-3 h-3" />
                      {profile?.plan === 'free' ? 'Free Trial' : '1,200 Vision Points'}
                    </span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={() => handleDownload(displayImage)}
              className="w-full py-6 bg-neutral-800 border border-neutral-700 text-neutral-50 rounded-2xl text-base tracking-wide hover:bg-neutral-700 hover:shadow-lg hover:shadow-neutral-900/50 transition-premium flex items-center justify-center gap-3 btn-premium"
            >
              <Download className="w-5 h-5" />
              Download {realisticImage ? 'Realistic' : 'Preview'} Image
            </button>
          </div>

          {/* Helper Text */}
          <p className="text-center text-sm text-neutral-500 mt-8 opacity-0 animate-fade-up animation-delay-300">
            {realisticImage
              ? 'Your realistic render has been generated with AI'
              : 'Your preview is ready to download'}
          </p>
        </div>
      </div>

      {showPaywall && (
        <PlanPricingModal onClose={() => setShowPaywall(false)} />
      )}
    </div>
  );
}
