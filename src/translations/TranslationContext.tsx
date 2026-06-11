import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations, getTranslation as getTranslationKey } from './translations';

interface TranslationContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: keyof typeof translations.en, arg?: string) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>(() => {
        const saved = localStorage.getItem('preferredLanguage');
        return (saved as Language) || 'en';
    });

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('preferredLanguage', lang);
    };

    const t = (key: keyof typeof translations.en, arg?: string): string => {
        const translation = getTranslationKey(language, key);
        if (typeof translation === 'function' && arg) {
            return translation(arg);
        }
        return typeof translation === 'string' ? translation : String(key);
    };

    return (
        <TranslationContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </TranslationContext.Provider>
    );
};

export const useTranslation = () => {
    const context = useContext(TranslationContext);
    if (!context) {
        throw new Error('useTranslation must be used within a TranslationProvider');
    }
    return context;
};
