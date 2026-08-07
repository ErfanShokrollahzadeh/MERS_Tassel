'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { en } from '../locales/en';
import { tr } from '../locales/tr';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en');

  // Load saved language preference from localStorage on mount
  useEffect(() => {
    const savedLang = localStorage.getItem('mers_language');
    if (savedLang && (savedLang === 'en' || savedLang === 'tr')) {
      setLang(savedLang);
    }
  }, []);

  const changeLanguage = (newLang) => {
    setLang(newLang);
    localStorage.setItem('mers_language', newLang);
  };

  const t = (key) => {
    const dictionary = lang === 'tr' ? tr : en;
    return dictionary[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
