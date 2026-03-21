import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, translations } from '../translations';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string, params?: Record<string, any>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>(() => {
        const saved = localStorage.getItem('app_language');
        if (saved === 'en' || saved === 'fr') return saved;

        // Auto-detect browser language
        const userLanguages = navigator.languages || [navigator.language];
        const frenchCodes = ['fr', 'fr-FR', 'fr-CA', 'fr-BE', 'fr-CH', 'fr-LU', 'fr-MC'];

        const isFrancophone = userLanguages.some(lang =>
            frenchCodes.some(code => lang.startsWith(code))
        );

        return isFrancophone ? 'fr' : 'en';
    });

    useEffect(() => {
        localStorage.setItem('app_language', language);
    }, [language]);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
    };

    const t = (key: string, params?: Record<string, any>): string => {
        const translation = (translations[language] as any)[key] || (translations['en'] as any)[key] || key;

        if (params) {
            let result = translation;
            Object.entries(params).forEach(([k, v]) => {
                result = result.replace(`{${k}}`, v.toString());
            });
            return result;
        }

        return translation;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
