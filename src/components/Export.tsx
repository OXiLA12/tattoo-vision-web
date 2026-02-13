import { useState, useEffect } from 'react';
import { Download, ArrowLeft, RefreshCw, Sparkles, Loader2, AlertCircle, Coins, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { saveToHistory } from '../utils/historyUtils';
import { ImageData, TattooTransform } from '../types';
import CreditsDisplay from './CreditsDisplay';
import { supabase } from '../lib/supabaseClient';
import { invokeWithAuth } from '../lib/invokeWithAuth';
import PlanPricingModal from './PlanPricingModal';
import { canUseFeature } from '../utils/authRules';
import LoadingOverlay from './LoadingOverlay';
import FinalReveal from './FinalReveal';
import { generateUUID } from '../utils/uuid';

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
  const { user, profile, credits, refreshCredits, refreshProfile } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [realisticImage, setRealisticImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showReveal, setShowReveal] = useState(false);

  // Auto-save initial preview
  useEffect(() => {
    if (user && profile && bodyImage && tattooImage) {
      const { allowed } = canUseFeature(profile.plan, 'SAVE_HISTORY');
      if (allowed) {
        saveToHistory(user.id, bodyImage, tattooImage, exportedImage, transform, false);
      }
    }
  }, []); // Run once on mount

  const handleDownload = (imageToDownload: string) => {
    const link = document.createElement('a');
    link.href = imageToDownload;
    link.download = `tattoo-vision-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateRealistic = async () => {
    if (!user || !profile) {
      setError('Log in required');
      return;
    }

    // We don't gate by plan anymore, just credits
    // const { allowed } = canUseFeature(...) 

    if (user && credits < 500) { // 500 VP
      setShowPaywall(true);
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const { data, error: invokeError } = await invokeWithAuth('generate-realistic-render', {
        body: {
          imageBase64: exportedImage,
          request_id: generateUUID(),
          // Backend should handle deduction
        },
      });

      if (invokeError || data?.error) {
        throw new Error(invokeError?.message || data?.error || 'Generation failed');
      }

      if (data?.imageBase64) {
        const realisticUrl = `data:image/png;base64,${data.imageBase64}`;
        setRealisticImage(realisticUrl);

        // Save realistic version (Everyone can save now if configured in SQL, or just frontend allows it)
        if (bodyImage && tattooImage) {
          // We try to save, if it fails because of SQL restriction on Free plan (legacy), it's fine for now, or assume SQL is updated.
          await saveToHistory(user.id, bodyImage, tattooImage, realisticUrl, transform, true);
        }

        await refreshCredits();
        await refreshProfile();

        // Show Reveal Screen
        setShowReveal(true);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error generating render');
      if (err.message.includes('credits') || err.message.includes('Insufficient')) {
        setShowPaywall(true);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // 1. LOADING STATE
  if (isGenerating) {
    return <LoadingOverlay message="Generating Realistic Render..." />;
  }

  // 2. REVEAL STATE (Success)
  if (showReveal && realisticImage) {
    return (
      <FinalReveal
        originalImage={exportedImage}
        finalImage={realisticImage}
        onBack={() => setShowReveal(false)}
        onDownload={() => handleDownload(realisticImage)}
      />
    );
  }

  // 3. DEFAULT PREVIEW STATE (Split Layout)
  return (
    <div className="h-screen flex flex-col md:flex-row bg-[#09090b] overflow-hidden animate-fade-in relative">

      {/* LEFT: Image Preview (Fit to screen) */}
      <div className="flex-1 bg-black relative flex items-center justify-center p-4 md:p-8 overflow-hidden order-2 md:order-1 h-[50vh] md:h-auto">
        <div className="relative w-full h-full flex items-center justify-center">
          <img
            src={exportedImage}
            alt="Preview"
            className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
          />
          <div className="absolute top-4 left-4 bg-black/50 backdrop-blur text-white/50 text-xs px-2 py-1 rounded font-mono border border-white/10">
            PREVIEW MODE
          </div>
        </div>
      </div>

      {/* RIGHT: Controls Sidebar */}
      <div className="w-full md:w-[400px] bg-[#09090b] border-l border-[#27272a] flex flex-col p-6 z-10 order-1 md:order-2">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={onBack} className="text-[#a1a1aa] hover:text-white flex items-center gap-2 text-sm font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <CreditsDisplay />
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <h1 className="text-3xl font-bold text-white mb-2">Almost Done.</h1>
          <p className="text-[#a1a1aa] text-sm mb-8">
            Your placement is ready. Download the draft or generate a photorealistic render using AI.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Realistic Render Button */}
            <div className="p-1 rounded-2xl bg-gradient-to-r from-[#0091FF]/20 to-[#00DC82]/20 border border-[#0091FF]/30">
              <button
                onClick={handleGenerateRealistic}
                className="w-full py-4 bg-[#0091FF] text-white rounded-xl text-sm font-bold uppercase tracking-wide hover:bg-[#007AFF] shadow-[0_0_20px_rgba(0,145,255,0.3)] transition-all flex flex-col items-center justify-center gap-1 group"
              >
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Realistic Render (AI)</span>
                  </div>
                  <div className="flex flex-col items-center text-[10px] font-mono opacity-80 gap-0.5">
                    <span>This realistic render costs 500 VP</span>
                    <span className={`${credits < 500 ? 'text-red-400 font-bold' : 'text-emerald-400'}`}>
                      You have {credits} VP left
                    </span>
                  </div>
                </div>
              </button>
            </div>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-[#27272a]"></div>
              <span className="flex-shrink-0 mx-4 text-[#52525b] text-xs font-mono">OR</span>
              <div className="flex-grow border-t border-[#27272a]"></div>
            </div>

            {/* Basic Download */}
            <button
              onClick={() => handleDownload(exportedImage)}
              className="w-full py-4 bg-[#18181b] text-white border border-[#27272a] rounded-xl text-sm font-bold uppercase tracking-wide hover:bg-[#27272a] hover:border-[#3f3f46] transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Draft</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-[#27272a] flex justify-between items-center text-xs text-[#52525b]">
          <button onClick={onStartOver} className="flex items-center gap-1.5 hover:text-[#a1a1aa] transition-colors">
            <RefreshCw className="w-3 h-3" />
            Start Over
          </button>
          <div className="flex items-center gap-1">
            <Info className="w-3 h-3" />
            <span>Auto-saved to history</span>
          </div>
        </div>
      </div>

      {showPaywall && <PlanPricingModal onClose={() => setShowPaywall(false)} />}
    </div>
  );
}
