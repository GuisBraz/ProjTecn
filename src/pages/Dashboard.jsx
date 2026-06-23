import React, { useEffect, useState } from 'react'
import { db } from '../lib/firebase'
import { collection, onSnapshot } from 'firebase/firestore'
import { ClipboardList, CheckCircle2, Clock, Flame, Zap, TrendingUp, Weight } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const getMaquina = (esp) => {
  if (!esp || esp === 0) return null
  return Number(esp) < 23 ? 'PLASMA' : 'OXICORTE'
}

function StatCard({ icon: Icon, label, value, sub, color, accentColor }) {
  return (
    <div className="stat-card" style={{ '--card-accent': accentColor || color }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0,
          background: `${color}18`, border: `1px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Icon size={22} color={color} />
        </div>
      </div>
      <div style={{ marginTop: '16px' }}>
        <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px', fontWeight: '500' }}>{label}</div>
        {sub && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>{sub}</div>}
      </div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border-light)', borderRadius: '8px', padding: '10px 14px', fontSize: '12px' }}>
        <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color, fontWeight: '600' }}>{p.name}: {p.value}</div>
        ))}
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const [pgms, setPgms] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'pgms'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      setPgms(data)
      setLoading(false)
    })
    return unsub
  }, [])

  const total      = pgms.length
  const aguardando = pgms.filter(p => p.status === 'Aguardando Corte').length
  const emCorte    = pgms.filter(p => p.status === 'Em Corte').length
  const cortados   = pgms.filter(p => p.status === 'Cortado').length
  const plasma     = pgms.filter(p => getMaquina(p.espessura_mm) === 'PLASMA').length
  const oxicorte   = pgms.filter(p => getMaquina(p.espessura_mm) === 'OXICORTE').length
  const pesoTotal     = pgms.reduce((s, p) => s + (Number(p.peso_kg) || 0), 0)
  const pesoAguardando = pgms.filter(p => p.status !== 'Cortado').reduce((s, p) => s + (Number(p.peso_kg) || 0), 0)
  const recent = pgms.slice(0, 8)

  const statusColors = {
    'Aguardando Corte': { bg: 'var(--yellow-dim)', c: 'var(--yellow)' },
    'Em Corte': { bg: 'var(--blue-dim)', c: 'var(--blue)' },
    'Cortado': { bg: 'var(--green-dim)', c: 'var(--green)' },
  }

  const barData = [
    { name: 'Aguardando', qtd: aguardando, fill: '#f59e0b' },
    { name: 'Em Corte',   qtd: emCorte,   fill: '#3b82f6' },
    { name: 'Cortados',   qtd: cortados,  fill: '#10b981' },
  ]

  const pieData = [
    { name: 'Plasma',    value: plasma,    color: '#3b82f6' },
    { name: 'Oxicorte',  value: oxicorte,  color: '#f97316' },
  ].filter(d => d.value > 0)

  const pesoPieData = [
    { name: 'Cortado',    value: parseFloat((pesoTotal - pesoAguardando).toFixed(1)), color: '#10b981' },
    { name: 'Pendente',   value: parseFloat(pesoAguardando.toFixed(1)),               color: '#f59e0b' },
  ].filter(d => d.value > 0)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <span className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  )

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="section-header">
        <div>
          <h1 className="section-title">Dashboard — Carga Máquina</h1>
          <p className="section-sub">Atualização em tempo real · {format(new Date(), "dd 'de' MMMM, HH:mm", { locale: ptBR })}</p>
        </div>
      </div>

      {/* Stat cards — row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px', marginBottom: '14px' }}>
        <StatCard icon={ClipboardList} label="Total de PGMs"      value={total}      color="#f97316" accentColor="#f97316" />
        <StatCard icon={Clock}         label="Aguardando Corte"   value={aguardando} color="#f59e0b" accentColor="#f59e0b" />
        <StatCard icon={Flame}         label="Em Corte"           value={emCorte}    color="#3b82f6" accentColor="#3b82f6" />
        <StatCard icon={CheckCircle2}  label="Cortados"           value={cortados}   color="#10b981" accentColor="#10b981" />
      </div>

      {/* Stat cards — row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px', marginBottom: '28px' }}>
        <StatCard icon={Zap}       label="Plasma"              value={plasma}                         color="#3b82f6" />
        <StatCard icon={Flame}     label="Oxicorte"            value={oxicorte}                       color="#f97316" />
        <StatCard icon={Weight}    label="Peso Total (kg)"     value={pesoTotal.toFixed(0)}            color="#8b5cf6" sub={`${pesoAguardando.toFixed(0)} kg pendentes`} />
        <StatCard icon={TrendingUp} label="Peso Pendente (kg)" value={pesoAguardando.toFixed(0)}      color="#f59e0b" sub={`${((pesoAguardando/pesoTotal)||0*100).toFixed(0)}% do total`} />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '28px' }}>
        {/* Bar chart — status */}
        <div className="chart-card" style={{ gridColumn: '1 / 2' }}>
          <div className="chart-title">PGMs por Status</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={barData} barSize={32}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-4)' }} />
              <Bar dataKey="qtd" name="QTD" radius={[6, 6, 0, 0]}>
                {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie — máquinas */}
        <div className="chart-card">
          <div className="chart-title">Distribuição por Máquina</div>
          {pieData.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 0' }}><p style={{ fontSize: '12px' }}>Sem dados</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie — peso */}
        <div className="chart-card">
          <div className="chart-title">Distribuição de Peso (kg)</div>
          {pesoPieData.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 0' }}><p style={{ fontSize: '12px' }}>Sem dados</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pesoPieData} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3}>
                  {pesoPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} formatter={(v) => `${v} kg`} />
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent PGMs table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>Últimos PGMs cadastrados</h2>
        </div>
        {recent.length === 0 ? (
          <div className="empty-state"><ClipboardList size={40} /><p>Nenhum PGM cadastrado ainda</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>PGM</th><th>Commessa</th><th>Máquina</th><th>Peso (kg)</th><th>Status</th><th>Emissão</th></tr>
              </thead>
              <tbody>
                {recent.map(p => {
                  const mq = getMaquina(p.espessura_mm)
                  const s = statusColors[p.status] || { bg: 'var(--bg-3)', c: 'var(--text-muted)' }
                  return (
                    <tr key={p.id}>
                      <td className="mono" style={{ color: 'var(--accent)', fontWeight: '600' }}>{p.pgm}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{p.commessa}</td>
                      <td>{mq ? <span className={`badge badge-${mq.toLowerCase()}`}>{mq}</span> : '—'}</td>
                      <td style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>{p.peso_kg ? `${p.peso_kg} kg` : '—'}</td>
                      <td><span className="badge" style={{ background: s.bg, color: s.c }}>{p.status}</span></td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                        {p.data_emissao ? format(new Date(p.data_emissao), 'dd MMM yyyy', { locale: ptBR }) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .charts-row { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 640px) {
          .charts-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
