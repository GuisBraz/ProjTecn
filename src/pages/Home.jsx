import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { can } from '../lib/permissions'
import { useI18n } from '../lib/i18n'
import { Cog, Factory } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR, enUS } from 'date-fns/locale'

function useGreetingKey() {
  const h = new Date().getHours()
  if (h < 12) return 'greeting_morning'
  if (h < 18) return 'greeting_afternoon'
  return 'greeting_evening'
}

export default function Home() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { t, language } = useI18n()
  const firstName = (profile?.displayName || '').split(' ')[0] || ''
  const greetingKey = useGreetingKey()
  const locale = language === 'en' ? enUS : ptBR
  const dateLabel = format(new Date(), language === 'en' ? 'EEEE, MMMM d, yyyy' : "EEEE, dd 'de' MMMM 'de' yyyy", { locale })

  const cards = [
    {
      key: 'maquina',
      title: 'Carga Máquina',
      desc: t('carga_maquina_desc'),
      icon: Cog,
      to: '/maquina',
      visible: can(profile?.role, 'cargaMaquina', 'view'),
    },
    {
      key: 'fabrica',
      title: 'Carga Fábrica',
      desc: t('carga_fabrica_desc'),
      icon: Factory,
      to: '/fabrica',
      visible: can(profile?.role, 'cargaFabrica', 'view'),
    },
  ].filter((c) => c.visible)

  return (
    <div style={{ padding: '40px 32px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
        <h1 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Carga Máquina × Carga Fábrica
        </h1>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {dateLabel}
        </span>
      </div>
      <h2 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '8px' }}>
        {t(greetingKey)}{firstName ? `, ${firstName}` : ''}.
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '6px' }}>
        {t('home_subtitle')}
      </p>

      <div style={{
        display: 'grid', gridTemplateColumns: `repeat(${Math.min(cards.length, 2)}, 1fr)`,
        gap: '16px', marginTop: '32px'
      }}>
        {cards.map(({ key, title, desc, icon: Icon, to }) => (
          <button
            key={key}
            onClick={() => navigate(to)}
            className="card"
            style={{
              padding: '24px', textAlign: 'left', cursor: 'pointer',
              border: '1px solid var(--border)', background: 'var(--bg-1)',
              display: 'flex', flexDirection: 'column', gap: '12px',
            }}
          >
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'var(--accent-dim)', border: '1px solid rgba(249,115,22,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Icon size={20} color="var(--accent)" />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>{title}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>{desc}</div>
            </div>
          </button>
        ))}
      </div>

      {cards.length === 0 && (
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '24px' }}>
          {t('home_no_modules')}
        </p>
      )}
    </div>
  )
}
