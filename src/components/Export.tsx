import { useState, useEffect, useRef } from 'react';
import { Download, ArrowLeft, RefreshCw, Sparkles, AlertCircle, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { saveToHistory } from '../utils/historyUtils';
import { applyWatermark } from '../utils/imageUtils';
import { ImageData, TattooTransform } from '../types';
import CreditsDisplay from './CreditsDisplay';
import { invokeWithAuth } from '../lib/invokeWithAuth';
import PlanPricingModal from './PlanPricingModal';
import LoadingOverlay from './LoadingOverlay';
import FinalReveal from './FinalReveal';
import ResultPaywallModal from './ResultPaywallModal';
import SubscriptionPaywallModal from './SubscriptionPaywallModal';
import { generateUUID } from '../utils/uuid';
import { useLanguage } from '../contexts/LanguageContext';

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
  const { user, profile, credits, hasPurchasedVP, refreshCredits, refreshProfile, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("Generating Realistic Render...");
  const [realisticImage, setRealisticImage] = useState<string | null>(null);
  const [cleanRealisticImage, setCleanRealisticImage] = useState<string | null>(null); // HD version, no watermark
  const [error, setError] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showResultPaywall, setShowResultPaywall] = useState(false);
  const [showSubscriptionPaywall, setShowSubscriptionPaywall] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [isFakePreview, setIsFakePreview] = useState(false);

  const isFreeUser = !profile?.entitled && !hasPurchasedVP;

  const generateRef = useRef<() => void>();

  // Clear query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Handle pending render
  useEffect(() => {
    if (authLoading) return;

    const pendingRender = sessionStorage.getItem('tv_pending_render') === 'true';
    if (pendingRender && user) {
      const waitForPaymentThenRender = async () => {
        setIsGenerating(true);
        const previousCredits = credits;

        // Poll Supabase directement jusqu'à 15s max waiting for BOTH entitlement AND credits
        for (let i = 0; i < 15; i++) {
          await new Promise(r => setTimeout(r, 1000));

          const { supabase } = await import('../lib/supabaseClient');
          const [profileRes, creditsRes] = await Promise.all([
            supabase.from('profiles').select('entitled').eq('id', user.id).single(),
            supabase.from('user_credits').select('credits').eq('user_id', user.id).single()
          ]);

          const freshIsEntitled = profileRes.data?.entitled === true;
          const freshCreditsAmount = creditsRes.data?.credits || 0;

          // Break loop IF we have enough credits AND we are entitled (Subscription case)
          // OR if we just received new credits that push us over 500 (Backup case)
          if ((freshIsEntitled && freshCreditsAmount >= 500) || (freshCreditsAmount > previousCredits && freshCreditsAmount >= 500)) {
            await refreshProfile();
            await refreshCredits();
            break;
          }
        }
        setIsGenerating(false);

        sessionStorage.removeItem('tv_pending_render');
        sessionStorage.removeItem('tv_exported_image');
        sessionStorage.removeItem('tv_body_image');
        sessionStorage.removeItem('tv_tattoo_image');
        sessionStorage.removeItem('tv_transform');

        if (generateRef.current) {
          generateRef.current();
        }
      };
      waitForPaymentThenRender();
    }
  }, [authLoading, user]); // eslint-disable-line react-hooks/exhaustive-deps

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

    if (!navigator.onLine) {
      setError(
        navigator.language.startsWith('fr')
          ? '📶 Pas de connexion internet. Reconnectez-vous avant de lancer la génération.'
          : '📶 No internet connection. Please reconnect before generating.'
      );
      return;
    }

    // Verify latest state from DB before proceeding with a fake render
    let actualIsFreeUser = isFreeUser;
    let actualCredits = credits;

    if (actualIsFreeUser || actualCredits < 500) {
      try {
        const { supabase } = await import('../lib/supabaseClient');
        const { data: freshProfile } = await supabase.from('profiles').select('entitled').eq('id', user.id).single();
        const { data: freshCredits } = await supabase.from('user_credits').select('credits').eq('user_id', user.id).single();

        if (freshProfile?.entitled) actualIsFreeUser = false;
        if (freshCredits) actualCredits = freshCredits.credits;
      } catch (e) {
        console.warn('Failed to verify fresh state', e);
      }
    }

    // Only force a fake render if they explicitly lack the credits to generate it.
    // Even if their subscription appears inactive, if they have VP, we let them use it.
    const needsFakeRender = actualCredits < 500;

    if (needsFakeRender) {
      setIsGenerating(true);
      setError(null);

      const FakeMessages = [
        "Analyse de la peau et de la lumière...",
        "Calcul des ombres de contact...",
        "Génération du rendu HD...",
        "Finalisation des détails de l'encre..."
      ];
      let step = 0;
      setLoadingMessage(FakeMessages[0]);

      const interval = setInterval(() => {
        step++;
        if (step < FakeMessages.length) {
          setLoadingMessage(FakeMessages[step]);
        }
      }, 1600);

      // Simulate fake processing time
      await new Promise(r => setTimeout(r, 6500));

      clearInterval(interval);

      setIsGenerating(false);
      setRealisticImage(exportedImage); // finalImage becomes the base image, but blurred in FinalReveal
      setCleanRealisticImage(exportedImage);
      setIsFakePreview(true);
      // Save state to sessionStorage before Stripe redirect (which will happen on ResultPaywallModal)
      try {
        sessionStorage.setItem('tv_exported_image', exportedImage);
        if (bodyImage) sessionStorage.setItem('tv_body_image', JSON.stringify(bodyImage));
        if (tattooImage) sessionStorage.setItem('tv_tattoo_image', JSON.stringify(tattooImage));
        sessionStorage.setItem('tv_transform', JSON.stringify(transform));
      } catch (e) {
        console.warn('Could not save session state:', e);
      }

      setShowReveal(true);
      return;
    }

    // 2. Real Generation (For paying users with enough credits)
    setIsGenerating(true);
    setLoadingMessage(t('export_loading_realistic') || "Generating HD Render...");
    setError(null);

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

        // Always keep the clean HD version for post-purchase download
        setCleanRealisticImage(cleanUrl);

        // Bake watermark into pixels for free users (not CSS — survives screenshots)
        const displayUrl = isFreeUser ? await applyWatermark(cleanUrl) : cleanUrl;
        setRealisticImage(displayUrl);
        setIsFakePreview(false);

        // Save to history
        if (bodyImage && tattooImage) {
          await saveToHistory(user.id, bodyImage, tattooImage, displayUrl, transform, true);
        }

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

  generateRef.current = handleGenerateRealistic;

  // 1. LOADING STATE
  if (isGenerating) {
    return <LoadingOverlay message={loadingMessage} />;
  }

  // 2. REVEAL STATE (Success)
  if (showReveal && realisticImage) {
    return (
      <>
        <FinalReveal
          originalImage={exportedImage}
          finalImage={realisticImage}
          cleanImage={cleanRealisticImage || realisticImage}
          isFreeUser={isFakePreview}
          isBlurredPreview={isFakePreview}
          onBack={() => setShowReveal(false)}
          onDownload={() => {
            if (isFakePreview) {
              if (profile?.free_trial_used) {
                setShowPaywall(true); // Normal subscription options
              } else {
                setShowSubscriptionPaywall(true); // Free trial teaser
              }
            } else {
              handleDownload(cleanRealisticImage || realisticImage);
            }
          }}
        />
        {showResultPaywall && (
          <ResultPaywallModal
            onClose={() => setShowResultPaywall(false)}
            onSuccess={() => {
              setShowResultPaywall(false);
              handleDownload(cleanRealisticImage || realisticImage);
            }}
          />
        )}
        {showPaywall && <PlanPricingModal onClose={() => setShowPaywall(false)} />}
        {showSubscriptionPaywall && (
          <SubscriptionPaywallModal
            onClose={() => setShowSubscriptionPaywall(false)}
            backgroundImage={exportedImage}
          />
        )}
      </>
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
            {t('export_preview_mode')}
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
          <CreditsDisplay />
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
                    <span>{t('export_realistic_button')}</span>
                  </div>
                  <div className="flex flex-col items-center text-[10px] font-mono opacity-80 gap-0.5">
                    <span>{t('export_cost_vp', { amount: 500 })}</span>
                    <span className={`${credits < 500 ? 'text-red-400 font-bold' : 'text-emerald-400'}`}>
                      {t('export_balance_left', { amount: credits })}
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
              onClick={() => {
                if (isFreeUser) {
                  setShowResultPaywall(true);
                } else {
                  handleDownload(exportedImage);
                }
              }}
              className="w-full py-4 bg-[#18181b] text-white border border-[#27272a] rounded-xl text-sm font-bold uppercase tracking-wide hover:bg-[#27272a] hover:border-[#3f3f46] transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>{t('export_download_draft')}</span>
            </button>
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

      {showSubscriptionPaywall && (
        <SubscriptionPaywallModal
          onClose={() => setShowSubscriptionPaywall(false)}
          backgroundImage={exportedImage}
        />
      )}

      {showResultPaywall && (
        <ResultPaywallModal
          onClose={() => setShowResultPaywall(false)}
          onSuccess={() => setShowResultPaywall(false)}
        />
      )}
    </div>
  );
}
