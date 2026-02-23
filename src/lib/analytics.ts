/**
 * ============================================================
 *  TATTOO VISION — ANALYTICS SERVICE
 * ============================================================
 *  Design principles:
 *  - Fire-and-forget: ALL calls are async, NEVER block UI
 *  - Silent: errors are swallowed and logged to console only
 *  - Typed: full TypeScript for all event names & payloads
 *  - Singleton: one client per session
 * ============================================================
 */

import { supabase } from './supabaseClient';

// ─────────────────────────────────────────────
//  EVENT CATALOG  (strongly typed)
// ─────────────────────────────────────────────
export type AnalyticsEventName =
    // --- Acquisition ---
    | 'user_registered'
    | 'email_confirmed'
    | 'first_login'
    // --- Activation ---
    | 'first_image_uploaded'
    | 'first_ai_generation_started'
    | 'first_ai_generation_completed'
    | 'first_realistic_render_started'
    | 'first_realistic_render_completed'
    // --- Engagement ---
    | 'session_started'
    | 'session_ended'
    | 'page_viewed'
    // --- Paywall ---
    | 'paywall_viewed'
    | 'paywall_cta_clicked'
    | 'paywall_closed'
    | 'purchase_initiated'
    | 'purchase_completed'
    | 'purchase_failed'
    // --- Abandonment ---
    | 'result_viewed_blurred'
    | 'abandoned_after_blur'
    | 'abandoned_after_paywall'
    | 'abandoned_after_payment_click'
    | 'user_returned';

export interface AnalyticsEventProperties {
    // Common optional properties
    credits_remaining?: number;
    credits_spent?: number;
    paywall_type?: 'result_paywall' | 'plan_pricing';
    pack_id?: string;
    pack_price?: number;
    pack_credits?: number;
    page?: string;
    device?: 'mobile' | 'desktop';
    error_message?: string;
    session_duration_seconds?: number;
    time_since_registration_hours?: number;
    is_free_user?: boolean;
    generation_count?: number;
    render_count?: number;
    [key: string]: string | number | boolean | undefined;
}

// ─────────────────────────────────────────────
//  SESSION MANAGEMENT
// ─────────────────────────────────────────────
const SESSION_START_KEY = 'tv_session_start';
const SESSION_ID_KEY = 'tv_session_id';

function getOrCreateSessionId(): string {
    let id = sessionStorage.getItem(SESSION_ID_KEY);
    if (!id) {
        id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        sessionStorage.setItem(SESSION_ID_KEY, id);
        sessionStorage.setItem(SESSION_START_KEY, Date.now().toString());
    }
    return id;
}

function getSessionDurationSeconds(): number {
    const start = parseInt(sessionStorage.getItem(SESSION_START_KEY) || '0', 10);
    if (!start) return 0;
    return Math.round((Date.now() - start) / 1000);
}

function getDevice(): 'mobile' | 'desktop' {
    return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
}

function getUTMParams(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    const params = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(k => {
        const v = params.get(k);
        if (v) utm[k] = v;
    });
    // Persist UTMs in sessionStorage so they survive redirects
    if (Object.keys(utm).length > 0) {
        sessionStorage.setItem('tv_utms', JSON.stringify(utm));
    }
    const stored = sessionStorage.getItem('tv_utms');
    return stored ? JSON.parse(stored) : utm;
}

function getReferrer(): string | undefined {
    const ref = document.referrer;
    if (!ref || ref.includes(window.location.hostname)) return undefined;
    return ref;
}

// ─────────────────────────────────────────────
//  CORE TRACK FUNCTION
// ─────────────────────────────────────────────
/**
 * Track an analytics event. ALWAYS fire-and-forget.
 * Safe to call anywhere — errors are caught silently.
 */
export function track(
    eventName: AnalyticsEventName,
    properties: AnalyticsEventProperties = {}
): void {
    // Fire async without awaiting — zero UI impact
    _sendEvent(eventName, properties).catch(() => {/* swallow */ });
}

async function _sendEvent(
    eventName: AnalyticsEventName,
    properties: AnalyticsEventProperties
): Promise<void> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return; // don't track anonymous events at DB level

        const sessionId = getOrCreateSessionId();
        const utms = getUTMParams();
        const referrer = getReferrer();
        const device = getDevice();

        const payload = {
            p_user_id: user.id,
            p_event_name: eventName,
            p_session_id: sessionId,
            p_device: device,
            p_properties: {
                ...properties,
                ...utms,
                ...(referrer ? { referrer } : {}),
            },
        };

        await (supabase.rpc as any)('track_event', payload);
    } catch (err) {
        // Silent failure — analytics must NEVER break the app
        if (import.meta.env.DEV) {
            console.debug('[Analytics]', eventName, err);
        }
    }
}

// ─────────────────────────────────────────────
//  CONVENIENCE HELPERS  (semantic, strongly typed)
// ─────────────────────────────────────────────

/** Call once on successful registration */
export function trackRegistration(): void {
    track('user_registered', { device: getDevice() });
}

/** Call once on successful sign-in */
export function trackLogin(isFirstLogin = false): void {
    if (isFirstLogin) track('first_login', { device: getDevice() });
    track('session_started', { device: getDevice() });
}

/** Call when session ends (beforeunload / signout) */
export function trackSessionEnd(): void {
    track('session_ended', {
        session_duration_seconds: getSessionDurationSeconds(),
        device: getDevice(),
    });
}

/** Call when user uploads their first image */
export function trackImageUploaded(credits: number): void {
    track('first_image_uploaded', {
        credits_remaining: credits,
        device: getDevice(),
    });
}

/** Call when AI tattoo generation starts */
export function trackAIGenerationStarted(credits: number): void {
    track('first_ai_generation_started', { credits_remaining: credits });
}

/** Call when AI tattoo generation completes */
export function trackAIGenerationCompleted(credits: number): void {
    track('first_ai_generation_completed', { credits_remaining: credits });
}

/** Call when realistic render generation starts */
export function trackRealisticRenderStarted(credits: number): void {
    track('first_realistic_render_started', { credits_remaining: credits });
}

/** Call when realistic render generation completes */
export function trackRealisticRenderCompleted(credits: number, isFreeUser: boolean): void {
    track('first_realistic_render_completed', {
        credits_remaining: credits,
        is_free_user: isFreeUser,
    });
    if (isFreeUser) {
        track('result_viewed_blurred', { credits_remaining: credits });
    }
}

/** Call when any paywall modal opens */
export function trackPaywallViewed(type: 'result_paywall' | 'plan_pricing', credits: number): void {
    track('paywall_viewed', { paywall_type: type, credits_remaining: credits });
}

/** Call when user clicks a CTA inside a paywall */
export function trackPaywallCTAClicked(packId: string, packPrice: number, packCredits: number): void {
    track('paywall_cta_clicked', {
        pack_id: packId,
        pack_price: packPrice,
        pack_credits: packCredits,
    });
}

/** Call when paywall closes WITHOUT purchase */
export function trackPaywallClosed(type: 'result_paywall' | 'plan_pricing', credits: number): void {
    track('paywall_closed', { paywall_type: type, credits_remaining: credits });
    track('abandoned_after_paywall', { paywall_type: type, credits_remaining: credits });
}

/** Call just before redirecting to Stripe (purchase initiated) */
export function trackPurchaseInitiated(packId: string, packPrice: number, packCredits: number): void {
    track('purchase_initiated', {
        pack_id: packId,
        pack_price: packPrice,
        pack_credits: packCredits,
    });
    track('abandoned_after_payment_click', {
        pack_id: packId,
        pack_price: packPrice,
    });
}

/** Call on successful purchase confirmation */
export function trackPurchaseCompleted(packId: string, packPrice: number, packCredits: number): void {
    track('purchase_completed', {
        pack_id: packId,
        pack_price: packPrice,
        pack_credits: packCredits,
    });
}

/** Call on purchase failure */
export function trackPurchaseFailed(packId: string, errorMessage: string): void {
    track('purchase_failed', { pack_id: packId, error_message: errorMessage });
}

// ─────────────────────────────────────────────
//  SESSION LIFECYCLE HOOK  (call in App.tsx)
// ─────────────────────────────────────────────

/**
 * Sets up session tracking — call once on app mount.
 * Tracks session_started on load, session_ended on tab close.
 */
export function initAnalyticsSession(): () => void {
    getOrCreateSessionId(); // ensures session is created

    const handleUnload = () => trackSessionEnd();
    window.addEventListener('beforeunload', handleUnload);

    return () => {
        window.removeEventListener('beforeunload', handleUnload);
    };
}
