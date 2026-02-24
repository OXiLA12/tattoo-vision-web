import { useState, useEffect } from 'react';
import { Download, ArrowLeft, RefreshCw, Sparkles, AlertCircle, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { applyWatermark } from '../utils/imageUtils';
import { ImageData, TattooTransform } from '../types';
import { invokeWithAuth } from '../lib/invokeWithAuth';
import PlanPricingModal from './PlanPricingModal';
import LoadingOverlay from './LoadingOverlay';
import FinalReveal from './FinalReveal';
import LaunchOfferPaywall from './LaunchOfferPaywall';
import ResultPaywallModal from './ResultPaywallModal';
import { generateUUID } from '../utils/uuid';
import { useLanguage } from '../contexts/LanguageContext';
import {
  trackRealisticRenderStarted,
  trackRealisticRenderCompleted,
  trackPaywallViewed,
  trackPaywallClosed,
} from '../lib/analytics';

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
  const { user, profile, credits, hasPurchasedVP, refreshCredits, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const [isGenerating, setIsGenerating] = useState(false);
  const [realisticImage, setRealisticImage] = useState<string | null>(null);
  const [cleanRealisticImage, setCleanRealisticImage] = useState<string | null>(null); // HD version, no watermark
  const [error, setError] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showResultPaywall, setShowResultPaywall] = useState(false);
  const [showReveal, setShowReveal] = useState(false);

  const isFreeUser = !hasPurchasedVP;

  // Effect to check for auto-render action on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'render' && sessionStorage.getItem('tv_pending_render_after_stripe') === 'true') {
      // Clear the flag and URL parameter
      sessionStorage.removeItem('tv_pending_render_after_stripe');
      window.history.replaceState({}, document.title, window.location.pathname);
      handleGenerateRealistic(true);
    }
  }, []);


  const handleDownload = (imageToDownload: string) => {
    const link = document.createElement('a');
    link.href = imageToDownload;
    link.download = `tattoo-vision-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateRealistic = async (forceBypassCheck = false) => {
    // Micro-vibration mobile au clic pour sensation premium
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }

    if (!user || !profile) {
      setError('Log in required');
      return;
    }

    // Gating by credits. Bypass if forced (e.g., just coming from successful payment callback)
    if (!forceBypassCheck && user && credits < 500) {
      trackPaywallViewed('result_paywall', credits);
      // Save current generated image in case of Stripe redirect
      try {
        sessionStorage.setItem('tv_pending_image', exportedImage);
        sessionStorage.setItem('tv_pending_render_after_stripe', 'true'); // Flag to trigger render after successful payment
      } catch (e) { /* Ignore if too big */ }

      const hasUsedTrialOrPurchased = profile.free_trial_used || hasPurchasedVP;
      if (hasUsedTrialOrPurchased) {
        setShowPaywall(true); // Standard Plan Prices
      } else {
        setShowResultPaywall(true); // Launch Offer / Free Trial
      }
      return;
    }

    setIsGenerating(true);
    setError(null);
    trackRealisticRenderStarted(credits);

    try {
      const { data, error: invokeError } = await invokeWithAuth('generate-realistic-render', {
        body: {
          imageBase64: exportedImage,
          request_id: generateUUID(),
        },
      });

      const responseData = data as any;

      if (invokeError || responseData?.error) {
        throw new Error(invokeError?.message || responseData?.error || 'Generation failed');
      }

      if (responseData?.imageBase64) {
        const cleanUrl = `data:image/png;base64,${responseData.imageBase64}`;

        setCleanRealisticImage(cleanUrl);
        setRealisticImage(cleanUrl);

        trackRealisticRenderCompleted(credits, false);
        await refreshCredits();
        await refreshProfile();
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
        cleanImage={realisticImage}
        isFreeUser={isFreeUser}
        onBack={() => setShowReveal(false)}
        onDownload={() => {
          if (isFreeUser) {
            setShowResultPaywall(true);
          } else {
            handleDownload(realisticImage);
          }
        }}
      />
    );
  }

  // 3. DEFAULT PREVIEW STATE (Split Layout)
  return (
    <div className="h-screen flex flex-col md:flex-row bg-[#09090b] overflow-hidden animate-fade-in relative">

      {/* LEFT: Image Preview (Fit to screen) */}
      <div className="flex-1 bg-[#111] relative flex items-center justify-center overflow-hidden order-2 md:order-1 h-[50vh] md:h-auto border-r border-white/5">
        <div className="relative w-full h-full flex items-center justify-center p-4 md:p-8">

          {/* Mockup Preview */}
          <img
            src={exportedImage}
            alt="Preview"
            className="w-full h-full object-contain shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-xl blur-[4px] opacity-60 transition-all duration-1000 scale-105"
          />

          {/* AI render simulation animation */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0091FF]/15 to-transparent h-1/2 animate-scan" style={{ backdropFilter: 'blur(2px)' }} />

          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30 -rotate-12">
            <span className="text-[clamp(4rem,10vw,8rem)] font-black uppercase tracking-widest text-white mix-blend-overlay">PREVIEW</span>
          </div>

          <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 flex flex-col items-center justify-center pointer-events-none">
            <div className="bg-black/80 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 flex items-center gap-3 shadow-[0_0_30px_rgba(0,145,255,0.2)]">
              <Sparkles className="w-5 h-5 text-[#0091FF] animate-pulse" />
              <span className="text-white font-bold uppercase tracking-widest text-sm">AI Rendering</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: Controls Sidebar */}
      <div className="w-full md:w-[400px] bg-[#09090b] border-l border-[#27272a] flex flex-col p-6 z-10 order-1 md:order-2">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={onBack} className="text-[#a1a1aa] hover:text-white flex items-center gap-2 text-sm font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {t('editor_back')}
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <h1 className="text-3xl font-bold text-white mb-2">{t('export_title')}</h1>
          <p className="text-[#a1a1aa] text-sm mb-8">
            {t('export_subtitle')}
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <div className="space-y-4 pt-4">
            {/* Unique Premium CTA */}
            <div className="relative group p-1 rounded-2xl bg-gradient-to-r from-[#0091FF]/40 to-[#00DC82]/40 animate-pulse-glow">
              <button
                onClick={() => handleGenerateRealistic(false)}
                className="w-full py-5 bg-[#0091FF] text-white rounded-[20px] text-sm font-black uppercase tracking-widest hover:bg-[#007AFF] hover:-translate-y-1 shadow-[0_10px_30px_rgba(0,145,255,0.4)] transition-all flex flex-col items-center justify-center gap-1.5 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                <div className="flex items-center gap-3 relative z-10">
                  <Sparkles className="w-5 h-5" />
                  <span>Generate ultra-realistic version</span>
                </div>
              </button>
            </div>

            {/* Social Proof */}
            <div className="flex flex-col items-center gap-1.5 mt-6 pb-2">
              <div className="flex items-center gap-2 text-neutral-400 text-xs font-bold uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Over 3,000 tattoos generated
              </div>
              <p className="text-[#a1a1aa] text-[10px] uppercase tracking-wider opacity-60">
                Used by creators on TikTok
              </p>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
              <p className="text-amber-500 text-[10px] font-bold uppercase tracking-widest">
                Your preview will not be saved unless generated.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-[#27272a] flex justify-between items-center text-xs text-[#52525b]">
          <button onClick={onStartOver} className="flex items-center gap-1.5 hover:text-[#a1a1aa] transition-colors">
            <RefreshCw className="w-3 h-3" />
            {t('export_start_over')}
          </button>
          <div className="flex items-center gap-1">
            <Info className="w-3 h-3" />
            <span>{t('export_auto_saved')}</span>
          </div>
        </div>
      </div>

      {showPaywall && <PlanPricingModal onClose={() => setShowPaywall(false)} />}

      {showResultPaywall && (
        <ResultPaywallModal
          onClose={() => {
            trackPaywallClosed('result_paywall', credits);
            setShowResultPaywall(false);
          }}
          onSuccess={() => {
            setShowResultPaywall(false);
            // Si on vient de payer depuis le modal, on force le render
            handleGenerateRealistic(true);
          }}
        />
      )}
    </div>
  );
}
