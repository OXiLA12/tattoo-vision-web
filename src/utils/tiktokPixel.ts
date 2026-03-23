import { Capacitor } from '@capacitor/core';

export const TIKTOK_PIXEL_ID = import.meta.env.VITE_TIKTOK_PIXEL_ID || '';

const DEBUG_MODE = import.meta.env.VITE_TIKTOK_DEBUG === 'true' || localStorage.getItem('tv_debug_tiktok') === 'true';

// Never run TikTok pixel inside the native iOS/Android app:
// Apple ATT requires explicit permission before any cross-app tracking (guideline 5.1.2(i)).
const IS_NATIVE = Capacitor.isNativePlatform();

type EventParams = Record<string, any>;

const getUTMParams = (): EventParams => {
    const params = new URLSearchParams(window.location.search);
    const utmParams: EventParams = {};

    if (params.has('utm_source')) utmParams.utm_source = params.get('utm_source');
    if (params.has('utm_medium')) utmParams.utm_medium = params.get('utm_medium');
    if (params.has('utm_campaign')) utmParams.utm_campaign = params.get('utm_campaign');
    if (params.has('utm_term')) utmParams.utm_term = params.get('utm_term');
    if (params.has('utm_content')) utmParams.utm_content = params.get('utm_content');

    return utmParams;
};

const sendEvent = (eventName: string, params: EventParams = {}) => {
    if (IS_NATIVE) return;

    if (DEBUG_MODE) {
        console.log(`[TikTok Pixel Debug] Event: ${eventName}`, params);
    }

    if (!TIKTOK_PIXEL_ID) {
        if (DEBUG_MODE) console.warn('[TikTok Pixel Debug] No Pixel ID found. Event skipped.');
        return;
    }

    if (!(window as any).ttq) {
        if (DEBUG_MODE) console.warn('[TikTok Pixel Debug] ttq not found on window');
        return;
    }

    const utmParams = getUTMParams();
    const finalParams = { ...params, ...utmParams };

    try {
        if (eventName === 'Pageview') {
            (window as any).ttq.page();
        } else {
            (window as any).ttq.track(eventName, finalParams);
        }
    } catch (err) {
        console.error('[TikTok Pixel Debug] Failed to send event', err);
    }
};

export const tiktokPixel = {
    init: () => {
        if (IS_NATIVE) return;
        if (typeof window === 'undefined') return;
        if (!TIKTOK_PIXEL_ID) {
            console.warn('[TikTok Pixel] VITE_TIKTOK_PIXEL_ID is missing in environment variables');
            return;
        }
        if ((window as any).ttq) return;

        // TikTok Pixel SDK initialization code
        (function (w: any, d: Document, t: string) {
            w.TiktokAnalyticsObject = t;
            var ttq = w[t] = w[t] || [];
            ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie"];
            ttq.setAndDefer = function (t: any, e: string) {
                t[e] = function () {
                    t.push([e].concat(Array.prototype.slice.call(arguments, 0)))
                }
            };
            for (var i = 0; i < ttq.methods.length; i++) {
                ttq.setAndDefer(ttq, ttq.methods[i]);
            }
            ttq.instance = function (t: string) {
                for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) {
                    ttq.setAndDefer(e, ttq.methods[n]);
                }
                return e;
            };
            ttq.load = function (e: string, n: any) {
                var i = "https://analytics.tiktok.com/i18n/pixel/events.js";
                ttq._i = ttq._i || {};
                ttq._i[e] = [];
                ttq._i[e]._u = i;
                ttq._t = ttq._t || {};
                ttq._t[e] = +new Date();
                ttq._o = ttq._o || {};
                ttq._o[e] = n || {};
                var o = d.createElement("script");
                o.type = "text/javascript";
                o.async = true;
                o.src = i + "?sdkid=" + e + "&lib=" + t;
                var a = d.getElementsByTagName("script")[0];
                if (a && a.parentNode) {
                    a.parentNode.insertBefore(o, a);
                } else {
                    d.head.appendChild(o);
                }
            };

            ttq.load(TIKTOK_PIXEL_ID);
            // Fire the initial PageView after the script loads
            setTimeout(() => {
                if ((window as any).ttq) {
                    (window as any).ttq.page();
                }
            }, 500);
        })(window, document, 'ttq');
    },
    pageView: () => sendEvent('Pageview'),
    viewContent: (params?: EventParams) => sendEvent('ViewContent', {
        content_id: 'tattoo_vision',
        content_type: 'product',
        content_name: 'Tattoo Vision App',
        ...params,
    }),
    completeRegistration: (params?: EventParams) => sendEvent('CompleteRegistration', {
        content_id: 'registration',
        ...params,
    }),
    initiateCheckout: (params?: EventParams) => sendEvent('InitiateCheckout', {
        content_id: params?.content_id || 'subscription',
        content_type: 'product',
        content_name: 'Tattoo Vision Subscription',
        ...params,
    }),
    purchase: (value: number, currency = 'EUR', content_id?: string, content_type = 'product') => {
        sendEvent('CompletePayment', {
            value,
            currency,
            content_id: content_id || 'subscription',
            content_type,
            content_name: 'Tattoo Vision Subscription',
            quantity: 1,
        });
    }
};
