import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../lib/firebase'
import { collection, onSnapshot } from 'firebase/firestore'
import { ClipboardList, CheckCircle2, Clock, Flame, AlertTriangle, Weight, MonitorPlay } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getEsperaCorte } from '../lib/pgmTimers'

const getMaquina = (esp) => {
  if (!esp || esp === 0) return null
  return Number(esp) < 23 ? 'PLASMA' : 'OXICORTE'
}

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="stat-card" style={{ '--card-accent': color }}>
      <div style={{
        width: '42px', height: '42px', borderRadius: '11px', flexShrink: 0,
        background: `${color}18`, border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <Icon size={20} color={color} />
      </div>
      <div style={{ marginTop: '16px' }}>
        <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px', fontWeight: '500' }}>{label}</div>
        {sub && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>{sub}</div>}
      </div>
    </div>
  )
}

function SimpleBarRow({ label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
        <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>{label}</span>
        <span style={{ color: 'var(--text-muted)' }}>{value} · {pct}%</span>
      </div>
      <div className="simple-bar-track">
        <div className="simple-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [pgms, setPgms] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'pgms'), (snap) => {
      setPgms(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [])

  const total      = pgms.length
  const aguardando = pgms.filter(p => p.status === 'Aguardando Corte').length
  const emCorte    = pgms.filter(p => p.status === 'Em Corte').length
  const cortados   = pgms.filter(p => p.status === 'Cortado').length
  const plasma     = pgms.filter(p => getMaquina(p.espessura_mm) === 'PLASMA' && p.status !== 'Cortado').length
  const oxicorte   = pgms.filter(p => getMaquina(p.espessura_mm) === 'OXICORTE' && p.status !== 'Cortado').length
  const pesoTotal      = pgms.reduce((s, p) => s + (Number(p.peso_kg) || 0), 0)
  const pesoAguardando = pgms.filter(p => p.status !== 'Cortado').reduce((s, p) => s + (Number(p.peso_kg) || 0), 0)

  const atrasados = pgms.filter(p => getEsperaCorte(p)?.atrasado).length
  const emCargaTotal = plasma + oxicorte

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <span className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  )

  return (
    <div className="page-wrapper">
      <div className="section-header">
        <div>
          <h1 className="section-title">Dashboard</h1>
          <p className="section-sub">Atualização em tempo real · {format(new Date(), "dd 'de' MMMM, HH:mm", { locale: ptBR })}</p>
        </div>
        <button className="btn btn-ghost" onClick={() => navigate('/tv')} title="Tela cheia para monitor do chão de fábrica">
          <MonitorPlay size={15} /> Modo TV
        </button>
      </div>

      {atrasados > 0 && (
        <div className="alert-card" style={{ marginBottom: '20px' }}>
          <AlertTriangle size={22} />
          <div>
            <div style={{ fontWeight: '700', fontSize: '14px' }}>
              {atrasados} PGM{atrasados !== 1 ? 's' : ''} aguardando corte há mais de 3 dias
            </div>
            <div style={{ fontSize: '12px', opacity: 0.85 }}>Confira a lista em PGMs Ativos e priorize o corte.</div>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <StatCard icon={ClipboardList} label="Total de PGMs"    value={total}      color="#f97316" />
        <StatCard icon={Clock}         label="Aguardando Corte" value={aguardando} color="#f59e0b" sub={atrasados > 0 ? `${atrasados} atrasado${atrasados !== 1 ? 's' : ''}` : 'em dia'} />
        <StatCard icon={Flame}         label="Em Corte"         value={emCorte}    color="#3b82f6" />
        <StatCard icon={CheckCircle2}  label="Cortados"         value={cortados}   color="#10b981" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }} className="charts-row">
        {/* Carga por máquina */}
        <div className="card">
          <div className="chart-title">Carga atual por máquina</div>
          {emCargaTotal === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}><p style={{ fontSize: '12px' }}>Sem PGMs pendentes</p></div>
          ) : (
            <>
              <SimpleBarRow label="Plasma"   value={plasma}   total={emCargaTotal} color="var(--plasma)" />
              <SimpleBarRow label="Oxicorte" value={oxicorte} total={emCargaTotal} color="var(--oxicorte)" />
            </>
          )}
        </div>

        {/* Peso */}
        <div className="card">
          <div className="chart-title">Peso (kg)</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '14px' }}>
            <Weight size={18} color="var(--text-muted)" />
            <span style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)' }}>{pesoTotal.toFixed(0)}</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>total cadastrado</span>
          </div>
          <SimpleBarRow label="Pendente (aguardando + em corte)" value={Math.round(pesoAguardando)} total={Math.round(pesoTotal) || 1} color="var(--yellow)" />
          <SimpleBarRow label="Já cortado" value={Math.round(pesoTotal - pesoAguardando)} total={Math.round(pesoTotal) || 1} color="var(--green)" />
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .charts-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
