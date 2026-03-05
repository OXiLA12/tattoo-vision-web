import { useState, useEffect, useRef } from 'react';
import { Download, ArrowLeft, RefreshCw, Sparkles, AlertCircle, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { saveToHistory } from '../utils/historyUtils';
import { ImageData, TattooTransform } from '../types';
import { invokeWithAuth } from '../lib/invokeWithAuth';
import PlanPricingModal from './PlanPricingModal';
import LoadingOverlay from './LoadingOverlay';
import FinalReveal from './FinalReveal';
import SubscriptionPaywallModal from './SubscriptionPaywallModal';
import CreditPackModal from './CreditPackModal';
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
  const { user, profile, isEntitled, refreshProfile, refreshCredits, credits, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("Generating Realistic Render...");
  const [realisticImage, setRealisticImage] = useState<string | null>(null);
  const [cleanRealisticImage, setCleanRealisticImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showSubscriptionPaywall, setShowSubscriptionPaywall] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [showCreditPackModal, setShowCreditPackModal] = useState(false);
  const [isFakePreview, setIsFakePreview] = useState(false);

  const generateRef = useRef<() => void>();

  // Clear success query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Handle pending render after Stripe redirect
  useEffect(() => {
    if (authLoading) return;

    // Nettoyer immédiatement pour éviter tout re-déclenchement parasite
    const pendingRender = sessionStorage.getItem('tv_pending_render') === 'true';
    if (!pendingRender || !user) return;

    // Supprimer le flag en PREMIER pour éviter double déclenchement
    sessionStorage.removeItem('tv_pending_render');

    const waitForPaymentThenRender = async () => {
      setIsGenerating(true);
      setLoadingMessage('Activation de votre abonnement...');

      // Poll Supabase jusqu'à 30s pour entitled = true
      let confirmedEntitled = false;
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 1000));
        const { supabase } = await import('../lib/supabaseClient');
        const { data } = await supabase
          .from('profiles')
          .select('entitled')
          .eq('id', user.id)
          .single() as { data: { entitled: boolean } | null };

        if (data?.entitled === true) {
          confirmedEntitled = true;
          // Rafraîchir le contexte React
          await refreshProfile();
          await refreshCredits();
          // Attendre que le state React soit mis à jour
          await new Promise(r => setTimeout(r, 300));
          break;
        }
      }

      // Nettoyer les données de session
      sessionStorage.removeItem('tv_exported_image');
      sessionStorage.removeItem('tv_body_image');
      sessionStorage.removeItem('tv_tattoo_image');
      sessionStorage.removeItem('tv_transform');

      setIsGenerating(false);

      if (confirmedEntitled) {
        // Paiement confirmé → lancer le vrai rendu via le flux normal
        if (generateRef.current) generateRef.current();
      } else {
        // Timeout : profil pas encore mis à jour
        setError('Votre abonnement est en cours d\'activation. Réessayez dans quelques secondes.');
      }
    };

    waitForPaymentThenRender();
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
    if (!user || !profile) { setError('Log in required'); return; }

    if (!navigator.onLine) {
      setError(navigator.language.startsWith('fr')
        ? '📶 Pas de connexion internet. Reconnectez-vous avant de lancer la génération.'
        : '📶 No internet connection. Please reconnect before generating.');
      return;
    }

    // Vérification de l'entitlement — toujours confirmer avec la DB
    let actuallyEntitled = isEntitled;
    let freeTrialAlreadyUsed = profile?.free_trial_used || profile?.free_realistic_render_used || false;

    if (!actuallyEntitled) {
      try {
        const { supabase } = await import('../lib/supabaseClient');
        const { data: freshProfile } = await supabase
          .from('profiles')
          .select('entitled, free_trial_used, free_realistic_render_used')
          .eq('id', user.id)
          .single() as { data: { entitled: boolean; free_trial_used: boolean; free_realistic_render_used: boolean } | null };
        if (freshProfile?.entitled) actuallyEntitled = true;
        freeTrialAlreadyUsed = freshProfile?.free_trial_used || freshProfile?.free_realistic_render_used || false;
      } catch (e) {
        console.warn('Impossible de vérifier l\'entitlement depuis la DB', e);
      }
    }

    // Utilisateurs NON-abonnés → faux rendu flou
    // L'abonnement est OBLIGATOIRE — les crédits seuls ne suffisent pas
    if (!actuallyEntitled) {
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
        if (step < FakeMessages.length) setLoadingMessage(FakeMessages[step]);
      }, 1600);

      await new Promise(r => setTimeout(r, 6500));
      clearInterval(interval);
      setIsGenerating(false);
      setRealisticImage(exportedImage);
      setCleanRealisticImage(exportedImage);
      setIsFakePreview(true);

      try {
        sessionStorage.setItem('tv_exported_image', exportedImage);
        if (bodyImage) sessionStorage.setItem('tv_body_image', JSON.stringify(bodyImage));
        if (tattooImage) sessionStorage.setItem('tv_tattoo_image', JSON.stringify(tattooImage));
        sessionStorage.setItem('tv_transform', JSON.stringify(transform));
      } catch (e) { console.warn('Could not save session state:', e); }

      setShowReveal(true);
      return;
    }

    // Génération réelle pour les utilisateurs abonнés (entitled=true)
    setIsGenerating(true);
    setLoadingMessage(t('export_loading_realistic') || "Generating HD Render...");
    setError(null);

    try {
      const { data, error: invokeError } = await invokeWithAuth('generate-realistic-render', {
        body: { imageBase64: exportedImage, request_id: generateUUID() },
      });

      const responseData = data as any;
      if (invokeError) throw new Error(invokeError.message || 'Erreur réseau');
      if (responseData?.error) throw new Error(responseData.error);

      if (responseData?.imageBase64) {
        const cleanUrl = `data:image/png;base64,${responseData.imageBase64}`;
        setCleanRealisticImage(cleanUrl);
        setRealisticImage(cleanUrl);
        setIsFakePreview(false);

        if (bodyImage && tattooImage) {
          await saveToHistory(user.id, bodyImage, tattooImage, cleanUrl, transform, true);
        }
        await refreshProfile();
        setShowReveal(true);
      }
    } catch (err: any) {
      console.error(err);
      setError(null);

      const errMsg = err.message || '';

      if (errMsg === 'INSUFFICIENT_POINTS') {
        // Abonné mais plus de crédits
        setShowCreditPackModal(true);
      } else if (errMsg === 'NOT_ENTITLED') {
        // Serveur a rejeté : l'abonnement n'est plus actif côté Stripe
        // Afficher le bon paywall selon l'état du compte
        if (freeTrialAlreadyUsed) {
          setShowPaywall(true); // PlanPricingModal (abonnement payant)
        } else {
          setShowSubscriptionPaywall(true); // SubscriptionPaywallModal (essai gratuit)
        }
      } else {
        // Erreur technique → message + paywall de réabonnement
        setError(errMsg || 'Erreur lors de la génération. Réessayez.');
        setShowPaywall(true);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  generateRef.current = handleGenerateRealistic;

  if (isGenerating) return <LoadingOverlay message={loadingMessage} />;

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
                setShowPaywall(true);
              } else {
                setShowSubscriptionPaywall(true);
              }
            } else {
              handleDownload(cleanRealisticImage || realisticImage);
            }
          }}
        />
        {showPaywall && <PlanPricingModal onClose={() => setShowPaywall(false)} />}
        {showSubscriptionPaywall && (
          <SubscriptionPaywallModal
            onClose={() => setShowSubscriptionPaywall(false)}
            backgroundImage={exportedImage}
          />
        )}
        {showCreditPackModal && (
          <CreditPackModal onClose={() => setShowCreditPackModal(false)} />
        )}
      </>
    );
  }

  return (
    <div className="h-screen flex flex-col md:flex-row bg-[#09090b] overflow-hidden animate-fade-in relative">

      {/* LEFT: Image */}
      <div className="flex-1 bg-black relative flex items-center justify-center p-4 md:p-8 overflow-hidden order-2 md:order-1 h-[50vh] md:h-auto">
        <div className="relative w-full h-full flex items-center justify-center">
          <img src={exportedImage} alt="Preview" className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" />
          <div className="absolute top-4 left-4 bg-black/50 backdrop-blur text-white/50 text-xs px-2 py-1 rounded font-mono border border-white/10">
            {t('export_preview_mode')}
          </div>
        </div>
      </div>

      {/* RIGHT: Controls */}
      <div className="w-full md:w-[400px] bg-[#09090b] border-l border-[#27272a] flex flex-col p-6 z-10 order-1 md:order-2">
        <div className="flex items-center justify-between mb-8">
          <button onClick={onBack} className="text-[#a1a1aa] hover:text-white flex items-center gap-2 text-sm font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {t('editor_back')}
          </button>
          {isEntitled && (
            <div className="flex flex-col items-end gap-1">
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] text-[#0091FF] border border-[#0091FF]/30 bg-[#0091FF]/5">
                Pro
              </span>
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-1">
                <span className="text-white">{credits.toLocaleString()}</span> credits
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <h1 className="text-3xl font-bold text-white mb-2">{t('export_title')}</h1>
          <p className="text-[#a1a1aa] text-sm mb-8">{t('export_subtitle')}</p>

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
                className="w-full py-4 bg-[#0091FF] text-white rounded-xl text-sm font-bold uppercase tracking-wide hover:bg-[#007AFF] shadow-[0_0_20px_rgba(0,145,255,0.3)] transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {t('export_realistic_button')}
              </button>
            </div>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-[#27272a]" />
              <span className="flex-shrink-0 mx-4 text-[#52525b] text-xs font-mono">OR</span>
              <div className="flex-grow border-t border-[#27272a]" />
            </div>

            {/* Basic Download */}
            <button
              onClick={() => {
                if (!isEntitled) {
                  setShowSubscriptionPaywall(true);
                } else {
                  handleDownload(exportedImage);
                }
              }}
              className="w-full py-4 bg-[#18181b] text-white border border-[#27272a] rounded-xl text-sm font-bold uppercase tracking-wide hover:bg-[#27272a] hover:border-[#3f3f46] transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              {t('export_download_draft')}
            </button>
          </div>
        </div>

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
      {showCreditPackModal && (
        <CreditPackModal onClose={() => setShowCreditPackModal(false)} />
      )}
    </div>
  );
}
