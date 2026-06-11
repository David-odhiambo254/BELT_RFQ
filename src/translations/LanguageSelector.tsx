import React, { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { useTranslation } from './TranslationContext';

const LanguageSelector: React.FC = () => {
    const { language, setLanguage, t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 hover:border-slate-400 transition-colors bg-white text-slate-700 font-medium"
                title={t('language')}
            >
                <Globe size={18} />
                <span className="hidden sm:inline">{language === 'en' ? t('english') : t('french')}</span>
                <span className="sm:hidden">{language.toUpperCase()}</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-300 rounded-xl shadow-lg z-50 overflow-hidden">
                    <button
                        onClick={() => {
                            setLanguage('en');
                            setIsOpen(false);
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-slate-100 transition-colors flex items-center gap-3 ${language === 'en' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-700'
                            }`}
                    >
                        <span className="text-lg">🇬🇧</span>
                        <span>English</span>
                    </button>
                    <button
                        onClick={() => {
                            setLanguage('fr');
                            setIsOpen(false);
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-slate-100 transition-colors flex items-center gap-3 border-t border-slate-200 ${language === 'fr' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-700'
                            }`}
                    >
                        <span className="text-lg">🇫🇷</span>
                        <span>Français</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default LanguageSelector;
