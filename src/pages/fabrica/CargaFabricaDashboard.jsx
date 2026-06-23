import React, { useEffect, useState } from 'react'
import { listenAllOps } from '../../lib/ops'
import { listenEmpreiteiras } from '../../lib/empreiteiras'
import { getOpSituacao } from '../../lib/opStatus'
import { exportAllOps } from '../../lib/exportXLSX'
import { ClipboardList, CheckCircle2, Clock, AlertTriangle, Download, Weight, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="stat-card" style={{ '--card-accent': color }}>
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
          <div key={i} style={{ color: p.color || 'var(--text-primary)', fontWeight: '600' }}>{p.name}: {p.value}</div>
        ))}
      </div>
    )
  }
  return null
}

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899']

export default function CargaFabricaDashboard() {
  const [ops, setOps] = useState([])
  const [empreiteiras, setEmpreiteiras] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub1 = listenAllOps((data) => { setOps(data); setLoading(false) })
    const unsub2 = listenEmpreiteiras((data) => setEmpreiteiras(data.filter(e => e.ativo)))
    return () => { unsub1(); unsub2() }
  }, [])

  const ativas      = ops.filter(o => o.status === 'ativa')
  const finalizadas = ops.filter(o => o.status === 'finalizada')
  const emDia       = ativas.filter(o => getOpSituacao(o.previsao_termino) === 'andamento').length
  const atrasadas   = ativas.filter(o => getOpSituacao(o.previsao_termino) === 'atrasado').length

  const pesoTotal    = ops.reduce((s, o) => s + (Number(o.peso) || 0), 0)
  const pesoAtivo    = ativas.reduce((s, o) => s + (Number(o.peso) || 0), 0)

  const porEmpreiteira = empreiteiras.map((emp, i) => ({
    name: emp.nome,
    ativas: ativas.filter(o => o.empreiteiraId === emp.id).length,
    finalizadas: finalizadas.filter(o => o.empreiteiraId === emp.id).length,
    peso: ativas.filter(o => o.empreiteiraId === emp.id).reduce((s, o) => s + (Number(o.peso) || 0), 0),
    color: COLORS[i % COLORS.length],
  }))

  const pieData = porEmpreiteira.filter(e => e.ativas > 0).map(e => ({
    name: e.name, value: e.ativas, color: e.color
  }))

  const pesoPieData = [
    { name: 'Em produção', value: parseFloat(pesoAtivo.toFixed(1)),                    color: '#f97316' },
    { name: 'Finalizado',  value: parseFloat((pesoTotal - pesoAtivo).toFixed(1)),      color: '#10b981' },
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
          <h1 className="section-title">Dashboard — Carga Fábrica</h1>
          <p className="section-sub">Visão geral das ordens de produção · {format(new Date(), "dd 'de' MMMM, HH:mm", { locale: ptBR })}</p>
        </div>
        <button className="btn btn-ghost" onClick={() => exportAllOps(ops, empreiteiras)}>
          <Download size={15} /> Exportar Relatório Geral
        </button>
      </div>

      {/* Stats row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px', marginBottom: '14px' }}>
        <StatCard icon={ClipboardList}  label="OPs em Fábrica"  value={ativas.length}      color="#f97316" />
        <StatCard icon={Clock}          label="Em Dia"           value={emDia}              color="#3b82f6" />
        <StatCard icon={AlertTriangle}  label="Atrasadas"        value={atrasadas}          color="#ef4444" />
        <StatCard icon={CheckCircle2}   label="Finalizadas"      value={finalizadas.length} color="#10b981" />
      </div>

      {/* Stats row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px', marginBottom: '28px' }}>
        <StatCard icon={Weight}     label="Peso Total (kg)"    value={pesoTotal.toFixed(0)}  color="#8b5cf6" />
        <StatCard icon={TrendingUp} label="Peso em Produção"   value={pesoAtivo.toFixed(0)}  color="#f59e0b" sub="kg ativos" />
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '28px' }}>
        {/* Bar — empreiteiras */}
        <div className="chart-card" style={{ gridColumn: '1 / 2' }}>
          <div className="chart-title">OPs por Empreiteira</div>
          {porEmpreiteira.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 0' }}><p style={{ fontSize: '12px' }}>Sem dados</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={porEmpreiteira} barSize={28}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-4)' }} />
                <Bar dataKey="ativas" name="Ativas" radius={[6, 6, 0, 0]}>
                  {porEmpreiteira.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie — distribuição OPs */}
        <div className="chart-card">
          <div className="chart-title">Distribuição de OPs</div>
          {pieData.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 0' }}><p style={{ fontSize: '12px' }}>Sem OPs ativas</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{v}</span>} />
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

      {/* Empreiteiras table */}
      {porEmpreiteira.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '14px', fontWeight: '700' }}>Resumo por Empreiteira</h2>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Empreiteira</th><th>OPs Ativas</th><th>Finalizadas</th><th>Peso em Produção (kg)</th></tr>
              </thead>
              <tbody>
                {porEmpreiteira.map((emp, i) => (
                  <tr key={i}>
                    <td style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: emp.color, flexShrink: 0 }} />
                      <span style={{ fontWeight: '600' }}>{emp.name}</span>
                    </td>
                    <td><span className="badge badge-orange">{emp.ativas}</span></td>
                    <td><span className="badge badge-green">{emp.finalizadas}</span></td>
                    <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{emp.peso.toFixed(1)} kg</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
