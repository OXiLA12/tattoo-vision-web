-- Table d'idempotence pour les webhooks Stripe
-- Empêche les doublons si Stripe re-livre le même event plusieurs fois

CREATE TABLE IF NOT EXISTS public.processed_stripe_events (
  event_id TEXT PRIMARY KEY,           -- ID unique de l'event Stripe (ex: evt_xxx)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour nettoyage périodique (optionnel)
CREATE INDEX IF NOT EXISTS idx_processed_stripe_events_created
  ON public.processed_stripe_events (created_at);

-- RLS: seulement le service role peut accéder (utilisé uniquement côté webhook serveur)
ALTER TABLE public.processed_stripe_events ENABLE ROW LEVEL SECURITY;

-- Optionnel: nettoyer les vieux events après 90 jours (Stripe ne re-livre jamais après ça)
-- À exécuter manuellement ou via pg_cron si disponible:
-- DELETE FROM public.processed_stripe_events WHERE created_at < NOW() - INTERVAL '90 days';
