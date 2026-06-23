import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { can } from '../lib/permissions'
import { useI18n } from '../lib/i18n'
import {
  LayoutDashboard, ClipboardList, Archive, Factory,
  LogOut, Zap, Menu, X, Settings, Home as HomeIcon
} from 'lucide-react'

export default function Layout({ children }) {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const { t } = useI18n()
  const [open, setOpen] = useState(false)

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const verMaquina = can(profile?.role, 'cargaMaquina', 'view')
  const verFabrica = can(profile?.role, 'cargaFabrica', 'view')

  const NavLinkItem = ({ to, icon: Icon, label, end }) => (
    <NavLink
      to={to}
      end={end}
      onClick={() => setOpen(false)}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '10px 12px', borderRadius: 'var(--radius)',
        marginBottom: '2px', textDecoration: 'none', fontSize: '13px',
        fontWeight: isActive ? '600' : '400',
        color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
        background: isActive ? 'var(--accent-dim)' : 'transparent',
        transition: 'all 0.15s',
      })}
    >
      <Icon size={16} />
      {label}
    </NavLink>
  )

  const GroupLabel = ({ children }) => (
    <div style={{
      fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)',
      textTransform: 'uppercase', letterSpacing: '0.06em',
      padding: '14px 12px 6px',
    }}>
      {children}
    </div>
  )

  const NavContent = () => (
    <>
      {/* Brand */}
      <div style={{ padding: '20px 16px 28px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'var(--accent-dim)', border: '1px solid rgba(249,115,22,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Zap size={18} color="var(--accent)" />
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.2 }}>Carga Máquina</div>
            <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.2 }}>× Carga Fábrica</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '0 10px', flex: 1, overflowY: 'auto' }}>
        <NavLinkItem to="/" icon={HomeIcon} label={t('nav_home')} end />

        {verMaquina && (
          <>
            <GroupLabel>{t('group_carga_maquina')}</GroupLabel>
            <NavLinkItem to="/maquina" icon={LayoutDashboard} label={t('nav_dashboard')} end />
            <NavLinkItem to="/maquina/pgms" icon={ClipboardList} label={t('nav_pgms_ativos')} />
            <NavLinkItem to="/maquina/arquivados" icon={Archive} label={t('nav_arquivados')} />
          </>
        )}

        {verFabrica && (
          <>
            <GroupLabel>{t('group_carga_fabrica')}</GroupLabel>
            <NavLinkItem to="/fabrica" icon={LayoutDashboard} label={t('nav_dashboard')} end />
            <NavLinkItem to="/fabrica/ativas" icon={ClipboardList} label="OPs Ativas" />
            <NavLinkItem to="/fabrica/arquivadas" icon={Archive} label={t('nav_arquivados')} />
          </>
        )}

        <GroupLabel>{t('group_system')}</GroupLabel>
        {verFabrica && (
          <NavLinkItem to="/empreiteiras" icon={Factory} label={t('nav_empreiteiras')} />
        )}
        <NavLinkItem to="/configuracoes" icon={Settings} label={t('nav_settings')} />
      </nav>

      {/* User */}
      <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', paddingLeft: '4px' }}>
          {profile?.displayName || user?.email}
        </div>
        <button
          className="btn btn-ghost"
          onClick={handleLogout}
          style={{ width: '100%', justifyContent: 'flex-start', fontSize: '13px' }}
        >
          <LogOut size={14} /> {t('nav_logout')}
        </button>
      </div>
    </>
  )

  return (
    <div style={{ display: 'flex', height: 'var(--app-height)', overflow: 'hidden' }}>
      {/* Desktop sidebar */}
      <aside style={{
        width: '220px', flexShrink: 0,
        background: 'var(--bg-1)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        height: 'var(--app-height)', overflow: 'hidden'
      }} className="desktop-sidebar">
        <NavContent />
      </aside>

      {/* Mobile overlay sidebar */}
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setOpen(false)}
        />
      )}
      <aside style={{
        position: 'fixed', top: 0, left: open ? 0 : '-240px', width: '240px',
        height: 'var(--app-height)', background: 'var(--bg-1)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', zIndex: 400,
        transition: 'left 0.25s ease',
        paddingTop: 'env(safe-area-inset-top)',
      }} className="mobile-sidebar">
        <button
          onClick={() => setOpen(false)}
          style={{
            position: 'absolute', top: 'calc(12px + env(safe-area-inset-top))', right: '12px',
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)'
          }}
        >
          <X size={18} />
        </button>
        <NavContent />
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Mobile header */}
        <header style={{
          display: 'none', alignItems: 'center', gap: '12px',
          padding: '12px 16px', borderBottom: '1px solid var(--border)',
          background: 'var(--bg-1)',
          paddingTop: 'calc(12px + env(safe-area-inset-top))',
        }} className="mobile-header">
          <button onClick={() => setOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex' }}>
            <Menu size={20} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={16} color="var(--accent)" />
            <span style={{ fontWeight: '600', fontSize: '14px' }}>Carga Máquina × Fábrica</span>
          </div>
        </header>

        <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg-0)' }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .desktop-sidebar { display: none !important; }
          .mobile-header { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
