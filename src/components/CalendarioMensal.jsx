import React, { useState, useMemo } from 'react'
import { X, ChevronUp, ChevronDown, Flame } from 'lucide-react'

const DIAS_HEADER = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const isoDay = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// Agrupa os segmentos calculados (de ambas as máquinas) por dia
function agruparPorDia(cronPlasma, cronOxicorte) {
  const mapa = new Map()
  const add = (calc, maquina, cor) => {
    calc.segmentos.forEach((seg) => {
      const key = isoDay(seg.inicio)
      if (!mapa.has(key)) mapa.set(key, [])
      mapa.get(key).push({ pgm: calc.pgm, seg, maquina, cor, emAndamento: calc.emAndamento, atrasado: calc.atrasado })
    })
  }
  cronPlasma.forEach((c) => add(c, 'Plasma', 'var(--plasma)'))
  cronOxicorte.forEach((c) => add(c, 'Oxicorte', 'var(--oxicorte)'))
  return mapa
}

export default function CalendarioMensal({ open, onClose, cronPlasma, cronOxicorte, paradas }) {
  const [mes, setMes] = useState(() => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d })
  const [selecionado, setSelecionado] = useState(() => new Date())

  const porDia = useMemo(() => agruparPorDia(cronPlasma, cronOxicorte), [cronPlasma, cronOxicorte])
  const paradasPorData = useMemo(() => {
    const m = new Map()
    paradas.forEach((p) => { if (!m.has(p.data)) m.set(p.data, []); m.get(p.data).push(p) })
    return m
  }, [paradas])

  if (!open) return null

  const celulas = []
  const primeiroDiaSemana = mes.getDay()
  const inicio = new Date(mes); inicio.setDate(inicio.getDate() - primeiroDiaSemana)
  for (let i = 0; i < 42; i++) {
    const d = new Date(inicio); d.setDate(inicio.getDate() + i)
    celulas.push(d)
  }

  const hoje = new Date()
  const itensDoSelecionado = porDia.get(isoDay(selecionado)) || []
  itensDoSelecionado.sort((a, b) => a.seg.inicio - b.seg.inicio)
  const paradaSelecionado = paradasPorData.get(isoDay(selecionado))

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'var(--bg-0)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid var(--border)' }}>
        <span style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)', textTransform: 'capitalize' }}>
          {selecionado.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
        </span>
        <button className="btn-icon" onClick={onClose}><X size={18} /></button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px', maxWidth: '820px', margin: '0 auto', width: '100%' }}>
        {/* Navegação do mês */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)',
          padding: '14px 18px', marginBottom: '18px',
        }}>
          <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', textTransform: 'capitalize' }}>
            {mes.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <button className="btn-icon" onClick={() => setMes((m) => { const d = new Date(m); d.setMonth(d.getMonth() - 1); return d })}><ChevronUp size={15} /></button>
            <button className="btn-icon" onClick={() => setMes((m) => { const d = new Date(m); d.setMonth(d.getMonth() + 1); return d })}><ChevronDown size={15} /></button>
          </div>
        </div>

        {/* Cabeçalho dos dias da semana */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '6px' }}>
          {DIAS_HEADER.map((d, i) => (
            <div key={i} style={{ textAlign: 'center', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', padding: '4px 0' }}>{d}</div>
          ))}
        </div>

        {/* Grade */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
          {celulas.map((d, i) => {
            const foraDoMes = d.getMonth() !== mes.getMonth()
            const isHoje = d.toDateString() === hoje.toDateString()
            const isSelecionado = d.toDateString() === selecionado.toDateString()
            const fimDeSemana = d.getDay() === 0 || d.getDay() === 6
            const itens = porDia.get(isoDay(d)) || []
            const parada = paradasPorData.get(isoDay(d))
            const maquinasComItem = [...new Set(itens.map((x) => x.maquina))]

            return (
              <button
                key={i}
                onClick={() => setSelecionado(d)}
                style={{
                  aspectRatio: '1', border: 'none', borderRadius: '10px', cursor: 'pointer',
                  background: isSelecionado ? 'var(--accent-dim)' : parada ? 'var(--red-dim)' : fimDeSemana && !foraDoMes ? 'var(--bg-2)' : 'transparent',
                  outline: isSelecionado ? '1.5px solid var(--accent)' : 'none',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px',
                  padding: '4px', opacity: foraDoMes ? 0.35 : 1,
                }}
              >
                <span style={{
                  width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: isHoje ? '800' : '500',
                  background: isHoje ? 'var(--blue)' : 'transparent',
                  color: isHoje ? '#fff' : parada ? 'var(--red)' : 'var(--text-primary)',
                }}>
                  {d.getDate()}
                </span>
                <div style={{ display: 'flex', gap: '2px', height: '5px' }}>
                  {maquinasComItem.map((m) => (
                    <span key={m} style={{ width: '5px', height: '5px', borderRadius: '50%', background: m === 'Plasma' ? 'var(--plasma)' : 'var(--oxicorte)' }} />
                  ))}
                </div>
              </button>
            )
          })}
        </div>

        {/* Detalhe do dia selecionado */}
        <div style={{ marginTop: '22px' }}>
          {paradaSelecionado && (
            <div className="alert-card" style={{ marginBottom: '14px' }}>
              <span style={{ fontWeight: '700', fontSize: '13px' }}>
                Parada programada: {paradaSelecionado.map((p) => p.motivo || p.maquina).join(', ')}
              </span>
            </div>
          )}
          {(selecionado.getDay() === 0 || selecionado.getDay() === 6) && itensDoSelecionado.length > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', marginBottom: '14px',
              borderRadius: 'var(--radius)', background: 'var(--yellow-dim)', border: '1px solid rgba(234,179,8,0.3)',
              fontSize: '12px', color: 'var(--yellow)', fontWeight: '600',
            }}>
              ⚠ Tem corte programado num fim de semana
            </div>
          )}
          {itensDoSelecionado.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Nada programado neste dia.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {itensDoSelecionado.map(({ pgm, seg, maquina, cor, emAndamento, atrasado }, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: 'var(--radius)',
                  background: atrasado ? 'var(--red-dim)' : 'var(--bg-2)', border: `1px solid ${atrasado ? 'var(--red)' : 'var(--border)'}`,
                }}>
                  {emAndamento && <Flame size={13} color={cor} />}
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: cor, flexShrink: 0 }} />
                  <span className="mono" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>{pgm.pgm}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{pgm.commessa} · {maquina}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
                    {seg.inicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} – {seg.fim.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
