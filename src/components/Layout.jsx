import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { can } from '../lib/permissions'
import { useI18n } from '../lib/i18n'
import {
  LayoutDashboard, ClipboardList, Archive,
  LogOut, Zap, Menu, X, Settings, Home as HomeIcon,
  PanelLeftClose, PanelLeftOpen, CalendarClock, ListOrdered, MonitorPlay,
} from 'lucide-react'

export default function Layout({ children }) {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar-collapsed') === '1')

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      localStorage.setItem('sidebar-collapsed', c ? '0' : '1')
      return !c
    })
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const verMaquina = can(profile?.role, 'cargaMaquina', 'view')

  const NavLinkItem = ({ to, icon: Icon, label, end }) => (
    <NavLink
      to={to}
      end={end}
      title={collapsed ? label : undefined}
      onClick={() => setOpen(false)}
      className="sidebar-nav-item"
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
      <Icon size={16} style={{ flexShrink: 0 }} />
      <span className="sidebar-label">{label}</span>
    </NavLink>
  )

  const GroupLabel = ({ children }) => (
    <div className="sidebar-group-label" style={{
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
      <div className="sidebar-brand" style={{ padding: '20px 16px 28px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'var(--accent-dim)', border: '1px solid rgba(249,115,22,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Zap size={18} color="var(--accent)" />
          </div>
          <div className="sidebar-brand-text">
            <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.2 }}>Carga Máquina</div>
          </div>
        </div>
        <button
          className="btn-icon collapse-toggle"
          onClick={toggleCollapsed}
          title={collapsed ? 'Expandir menu' : 'Ocultar menu'}
          style={{ minWidth: '28px', minHeight: '28px', padding: '6px', flexShrink: 0 }}
        >
          {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
        </button>
      </div>

      {/* Nav */}
      <nav style={{ padding: '0 10px', flex: 1, overflowY: 'auto' }}>
        <NavLinkItem to="/" icon={HomeIcon} label={t('nav_home')} end />

        {verMaquina && (
          <>
            <GroupLabel>{t('group_carga_maquina')}</GroupLabel>
            <NavLinkItem to="/maquina" icon={LayoutDashboard} label={t('nav_dashboard')} end />
            <NavLinkItem to="/maquina/pgms" icon={ClipboardList} label={t('nav_pgms_ativos')} />
            <NavLinkItem to="/maquina/programacao" icon={CalendarClock} label={t('nav_programacao')} />
            <NavLinkItem to="/maquina/fila" icon={ListOrdered} label={t('nav_fila')} />
            <NavLinkItem to="/maquina/finalizados" icon={Archive} label={t("nav_finalizados")} />
            <NavLinkItem to="/tv" icon={MonitorPlay} label={t('nav_tv')} />
          </>
        )}

        <GroupLabel>{t('group_system')}</GroupLabel>
        <NavLinkItem to="/configuracoes" icon={Settings} label={t('nav_settings')} />
      </nav>

      {/* User */}
      <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
        <div className="sidebar-user-name" style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', paddingLeft: '4px' }}>
          {profile?.displayName || user?.email}
        </div>
        <button
          className="btn btn-ghost sidebar-nav-item"
          onClick={handleLogout}
          title={collapsed ? t('nav_logout') : undefined}
          style={{ width: '100%', justifyContent: collapsed ? 'center' : 'flex-start', fontSize: '13px' }}
        >
          <LogOut size={14} /> <span className="sidebar-label">{t('nav_logout')}</span>
        </button>
      </div>
    </>
  )

  return (
    <div style={{ display: 'flex', height: 'var(--app-height)', overflow: 'hidden' }}>
      {/* Desktop sidebar */}
      <aside style={{
        width: collapsed ? '68px' : '220px', flexShrink: 0,
        background: 'var(--bg-1)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        height: 'var(--app-height)', overflow: 'hidden',
        transition: 'width 0.18s ease',
      }} className={`desktop-sidebar${collapsed ? ' collapsed' : ''}`}>
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
            <span style={{ fontWeight: '600', fontSize: '14px' }}>Carga Máquina</span>
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
