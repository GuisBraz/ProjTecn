import React, { useState, useEffect } from 'react'
import { useAuth } from '../lib/auth'
import { roleLabel, canSchedulePGMs } from '../lib/permissions'
import { useTheme } from '../lib/theme'
import { useI18n } from '../lib/i18n'
import { useToast } from '../lib/toast'
import { useExpediente, salvarExpediente } from '../lib/config'
import { Save, Check, Clock } from 'lucide-react'

const SWATCHES = {
  dark:   { bg: '#0e1118', accent: '#f97316', card: '#1c2130' },
  claude: { bg: '#f5f2ea', accent: '#c96442', card: '#ffffff' },
  pastel: { bg: '#f5f4fb', accent: '#8b7ae0', card: '#ffffff' },
  mono:   { bg: '#ffffff', accent: '#111111', card: '#fafafa' },
}

export default function Configuracoes() {
  const { profile, updateDisplayName } = useAuth()
  const { palette, setPalette, palettes } = useTheme()
  const { language, setLanguage, t } = useI18n()
  const toast = useToast()
  const [name, setName] = useState(profile?.displayName || '')
  const [saving, setSaving] = useState(false)
  const podeConfigurarExpediente = canSchedulePGMs(profile?.role)
  const { expediente } = useExpediente()
  const [horaInicio, setHoraInicio] = useState('06:00')
  const [horaFim, setHoraFim] = useState('22:00')
  const [savingExpediente, setSavingExpediente] = useState(false)

  useEffect(() => {
    setHoraInicio(`${String(expediente.horaInicio).padStart(2, '0')}:00`)
    setHoraFim(`${String(expediente.horaFim).padStart(2, '0')}:00`)
  }, [expediente])

  const handleSaveExpediente = async () => {
    const hi = parseInt(horaInicio.split(':')[0], 10)
    const hf = parseInt(horaFim.split(':')[0], 10)
    if (isNaN(hi) || isNaN(hf) || hi >= hf) {
      toast?.('Horário inválido — o início precisa ser antes do fim.', 'error')
      return
    }
    setSavingExpediente(true)
    try {
      await salvarExpediente(hi, hf)
      toast?.('Expediente atualizado. A Fila e a Programação já recalculam com o novo horário.', 'success')
    } catch {
      toast?.('Erro ao salvar o expediente.', 'error')
    }
    setSavingExpediente(false)
  }

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

      {/* Aparência */}
      <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>{t('settings_appearance')}</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          {t('settings_appearance_desc')}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          {palettes.map((p) => {
            const s = SWATCHES[p.id]
            const active = palette === p.id
            return (
              <button
                key={p.id}
                onClick={() => setPalette(p.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '12px', borderRadius: 'var(--radius)',
                  border: active ? '2px solid var(--accent)' : '1px solid var(--border)',
                  background: 'var(--bg-1)', cursor: 'pointer', textAlign: 'left',
                }}
              >
                <div style={{
                  width: '30px', height: '30px', borderRadius: '8px', flexShrink: 0,
                  background: s.bg, border: `1px solid ${s.accent}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: s.accent }} />
                </div>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', flex: 1 }}>{p.label}</span>
                {active && <Check size={15} color="var(--accent)" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Expediente */}
      {podeConfigurarExpediente && (
        <div className="card" style={{ padding: '20px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
            <Clock size={14} style={{ verticalAlign: '-2px', marginRight: '6px' }} />
            Expediente
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Horário de funcionamento das máquinas. A Fila e a Programação de Corte usam isso
            pra calcular automaticamente os horários — mude aqui sempre que os turnos mudarem.
          </p>
          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label">Início</label>
              <input className="form-input" type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Fim</label>
              <input className="form-input" type="time" value={horaFim} onChange={(e) => setHoraFim(e.target.value)} />
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleSaveExpediente} disabled={savingExpediente} style={{ marginTop: '12px' }}>
            <Save size={14} /> {savingExpediente ? 'Salvando…' : 'Salvar expediente'}
          </button>
        </div>
      )}

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
