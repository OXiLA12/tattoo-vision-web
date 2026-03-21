import { Capacitor } from '@capacitor/core';

// Production URLs for tattoovisionapp.com
export const PRIVACY_POLICY_URL = 'https://tattoovisionapp.com/privacy';
export const TERMS_OF_USE_URL = 'https://tattoovisionapp.com/legal';
export const SUPPORT_URL = 'https://tattoovisionapp.com/legal';

// Also reference Apple's standard EULA for the App Store Connect EULA field:
export const APPLE_STANDARD_EULA_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

export async function openExternalUrl(url: string) {
    if (Capacitor.isNativePlatform()) {
        // Dynamic import: @capacitor/browser is native-only, never load it on web
        const { Browser } = await import('@capacitor/browser');
        await Browser.open({ url });
    } else {
        window.open(url, '_blank', 'noopener,noreferrer');
    }
}
