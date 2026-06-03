import React, { createContext, useState, useContext, useEffect } from 'react';
import { translations } from '../utils/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  // Read initial language from localStorage or default to 'en'
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('lang') || 'en';
  });

  const toggleLanguage = () => {
    const nextLang = language === 'en' ? 'gu' : 'en';
    setLanguageState(nextLang);
    localStorage.setItem('lang', nextLang);
  };

  const setLanguage = (lang) => {
    if (lang === 'en' || lang === 'gu') {
      setLanguageState(lang);
      localStorage.setItem('lang', lang);
    }
  };

  // Helper to resolve dot notation path in the translation object
  // e.g. t('navbar.home')
  const t = (path) => {
    const keys = path.split('.');
    let value = translations[language];

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        // Fallback to English dictionary if not found in current language
        let fallbackValue = translations['en'];
        for (const fKey of keys) {
          if (fallbackValue && typeof fallbackValue === 'object' && fKey in fallbackValue) {
            fallbackValue = fallbackValue[fKey];
          } else {
            return path; // Return original path key if not found at all
          }
        }
        return fallbackValue;
      }
    }

    return value || path;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
