import React, { createContext, useContext, useState, useEffect } from 'react'

const dictionaries = {
  pt: {
    greeting_morning: 'Bom dia',
    greeting_afternoon: 'Boa tarde',
    greeting_evening: 'Boa noite',
    home_subtitle: 'Escolha onde quer trabalhar agora.',
    home_no_modules: 'Nenhum módulo disponível para o seu perfil de acesso.',
    nav_home: 'Início',
    nav_dashboard: 'Dashboard',
    nav_pgms_ativos: 'PGMs Ativos',
    nav_programacao: 'Programação',
    nav_fila: 'Fila',
    nav_tv: 'Modo TV',
    nav_finalizados: 'Finalizados',
    nav_settings: 'Configurações',
    nav_logout: 'Sair',
    group_carga_maquina: 'Carga Máquina',
    group_system: 'Sistema',
    carga_maquina_desc: 'Planos de corte CNC em tempo real',
    settings_title: 'Configurações',
    settings_profile: 'Seu perfil',
    settings_display_name: 'Nome de exibição',
    settings_save_name: 'Salvar nome',
    settings_saving: 'Salvando…',
    settings_appearance: 'Aparência',
    settings_appearance_desc: 'Escolha a paleta de cores do app.',
    settings_language: 'Idioma',
    settings_language_desc: 'Português ou Inglês.',
  },
  en: {
    greeting_morning: 'Good morning',
    greeting_afternoon: 'Good afternoon',
    greeting_evening: 'Good evening',
    home_subtitle: 'Choose where you want to work now.',
    home_no_modules: 'No modules available for your access profile.',
    nav_home: 'Home',
    nav_dashboard: 'Dashboard',
    nav_pgms_ativos: 'Active PGMs',
    nav_programacao: 'Scheduling',
    nav_fila: 'Queue',
    nav_tv: 'TV Mode',
    nav_finalizados: 'Finished',
    nav_settings: 'Settings',
    nav_logout: 'Log out',
    group_carga_maquina: 'Machine Load',
    group_system: 'System',
    carga_maquina_desc: 'CNC cutting plans in real time',
    settings_title: 'Settings',
    settings_profile: 'Your profile',
    settings_display_name: 'Display name',
    settings_save_name: 'Save name',
    settings_saving: 'Saving…',
    settings_appearance: 'Appearance',
    settings_appearance_desc: 'Choose the app color palette.',
    settings_language: 'Language',
    settings_language_desc: 'Portuguese or English.',
  },
}

const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(() => localStorage.getItem('app-language') || 'pt')

  useEffect(() => {
    document.documentElement.setAttribute('lang', language === 'en' ? 'en' : 'pt-BR')
  }, [language])

  const setLanguage = (lang) => {
    setLanguageState(lang)
    localStorage.setItem('app-language', lang)
  }

  const t = (key) => dictionaries[language]?.[key] ?? dictionaries.pt[key] ?? key

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export const useI18n = () => useContext(I18nContext)
