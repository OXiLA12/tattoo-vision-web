import { confirmAccountTemplate as confirmAccountEn } from './en/confirm-account';
import { resetPasswordTemplate as resetPasswordEn } from './en/reset-password';

import { confirmAccountTemplate as confirmAccountFr } from './fr/confirm-account';
import { resetPasswordTemplate as resetPasswordFr } from './fr/reset-password';

import { confirmAccountTemplate as confirmAccountVi } from './vi/confirm-account';
import { resetPasswordTemplate as resetPasswordVi } from './vi/reset-password';

const templates = {
    en: {
        'confirm-account': confirmAccountEn,
        'reset-password': resetPasswordEn
    },
    fr: {
        'confirm-account': confirmAccountFr,
        'reset-password': resetPasswordFr
    },
    vi: {
        'confirm-account': confirmAccountVi,
        'reset-password': resetPasswordVi
    }
};

export function getEmailTemplate(type: string, locale: string = 'en', actionUrl: string) {
    // Fallback to 'en' if the locale is not directly supported
    const safeLocale = (locale in templates) ? (locale as keyof typeof templates) : 'en';

    // Map Supabase auth types to our template names
    let templateName = 'confirm-account';
    if (type === 'recovery') {
        templateName = 'reset-password';
    } else if (type === 'signup' || type === 'invite') {
        templateName = 'confirm-account';
    } else if (type === 'magiclink') {
        templateName = 'confirm-account'; // we can fallback to confirm account for magic link
    }

    // Fallback if templateName somehow doesn't exist
    const langTemplates = templates[safeLocale];
    const templateFn = langTemplates[templateName as keyof typeof langTemplates] || templates['en']['confirm-account'];

    return templateFn(actionUrl);
}
