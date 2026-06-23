import React, { useState } from 'react'
import { useAuth } from '../lib/auth'
import { roleLabel } from '../lib/permissions'
import { useTheme } from '../lib/theme'
import { useI18n } from '../lib/i18n'
import { useToast } from '../lib/toast'
import { Sun, Moon, Save } from 'lucide-react'

export default function Configuracoes() {
  const { profile, updateDisplayName } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { language, setLanguage, t } = useI18n()
  const toast = useToast()
  const [name, setName] = useState(profile?.displayName || '')
  const [saving, setSaving] = useState(false)

  const handleSaveName = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      await updateDisplayName(name.trim())
      toast?.('Nome atualizado.', 'success')
    } catch {
      toast?.('Não foi possível atualizar o nome.', 'error')
    }
    setSaving(false)
  }

  const handleLanguageChange = (lang) => {
    setLanguage(lang)
    toast?.(lang === 'pt' ? 'Idioma definido como Português.' : 'Language set to English.', 'success')
  }

  return (
    <div style={{ padding: '32px', maxWidth: '560px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '24px' }}>
        {t('settings_title')}
      </h1>

      {/* Perfil */}
      <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>{t('settings_profile')}</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          {profile?.email} · {roleLabel(profile?.role)}
        </p>
        <div className="form-group">
          <label className="form-label">{t('settings_display_name')}</label>
          <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={handleSaveName} disabled={saving}
          style={{ marginTop: '12px' }}>
          <Save size={14} /> {saving ? t('settings_saving') : t('settings_save_name')}
        </button>
      </div>

      {/* Tema */}
      <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>{t('settings_appearance')}</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          {t('settings_appearance_desc')}
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className={`btn ${theme === 'dark' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => theme !== 'dark' && toggleTheme()}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            <Moon size={14} /> {t('settings_dark')}
          </button>
          <button
            className={`btn ${theme === 'light' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => theme !== 'light' && toggleTheme()}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            <Sun size={14} /> {t('settings_light')}
          </button>
        </div>
      </div>

      {/* Idioma */}
      <div className="card" style={{ padding: '20px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>{t('settings_language')}</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          {t('settings_language_desc')}
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className={`btn ${language === 'pt' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => handleLanguageChange('pt')}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            Português
          </button>
          <button
            className={`btn ${language === 'en' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => handleLanguageChange('en')}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            English
          </button>
        </div>
      </div>
    </div>
  )
}
