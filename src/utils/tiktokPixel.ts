export const TIKTOK_PIXEL_ID = import.meta.env.VITE_TIKTOK_PIXEL_ID || '';

const DEBUG_MODE = import.meta.env.VITE_TIKTOK_DEBUG === 'true' || localStorage.getItem('tv_debug_tiktok') === 'true';

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
    if (DEBUG_MODE) {
        console.log(`[TikTok Pixel Debug] Event: ${eventName}`, params);
    }

    if (!window.ttq) {
        if (DEBUG_MODE) console.warn('[TikTok Pixel Debug] ttq not found on window');
        return;
    }

    const utmParams = getUTMParams();
    const finalParams = { ...params, ...utmParams };

    if (eventName === 'Pageview') {
        window.ttq.page();
    } else {
        window.ttq.track(eventName, finalParams);
    }
};

export const tiktokPixel = {
    pageView: () => sendEvent('Pageview'),
    viewContent: (params?: EventParams) => sendEvent('ViewContent', params),
    completeRegistration: (params?: EventParams) => sendEvent('CompleteRegistration', params),
    initiateCheckout: (params?: EventParams) => sendEvent('InitiateCheckout', params),
    purchase: (value: number, currency = 'EUR', content_id?: string, content_type = 'product') => {
        sendEvent('CompletePayment', {
            value,
            currency,
            content_id,
            content_type,
            quantity: 1,
        });
    }
};
