import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

// Production URLs for tattoovisionapp.com
export const PRIVACY_POLICY_URL = 'https://tattoovisionapp.com/privacy';
export const TERMS_OF_USE_URL = 'https://tattoovisionapp.com/legal';
export const SUPPORT_URL = 'https://tattoovisionapp.com/legal';

// Also reference Apple's standard EULA for the App Store Connect EULA field:
export const APPLE_STANDARD_EULA_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

export async function openExternalUrl(url: string) {
    if (Capacitor.isNativePlatform()) {
        await Browser.open({ url });
    } else {
        window.open(url, '_blank', 'noopener,noreferrer');
    }
}
