import React, { useEffect, useState, useMemo } from 'react'
import { db } from '../lib/firebase'
import { collection, onSnapshot } from 'firebase/firestore'
import { Download, AlertTriangle, Flame, CalendarClock, CalendarDays } from 'lucide-react'
import { useExpediente, useParadas } from '../lib/config'
import { getMaquina, ordenarFila, calcularCronograma } from '../lib/schedule'
import CalendarioMensal from '../components/CalendarioMensal'
import * as XLSX from 'xlsx'

// Programação de Corte — 100% calculada a partir da ordem definida na Fila +
// o Tempo de Corte estimado de cada PGM. Ninguém edita hora aqui: pra mudar
// a ordem, é na página Fila.

function DiaBloco({ dia, itens, color }) {
  const hoje = new Date().toDateString() === dia.toDateString()
  return (
    <div style={{ display: 'flex', gap: '16px', marginBottom: '4px' }}>
      <div style={{ width: '86px', flexShrink: 0, textAlign: 'right', paddingTop: '2px' }}>
        <div style={{ fontSize: '12px', fontWeight: '700', color: hoje ? 'var(--accent)' : 'var(--text-secondary)', textTransform: 'capitalize' }}>
          {dia.toLocaleDateString('pt-BR', { weekday: 'short' })}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {dia.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
        </div>
      </div>
      <div style={{ flex: 1, borderLeft: '2px solid var(--border)', paddingLeft: '16px', paddingBottom: '18px', position: 'relative' }}>
        <span style={{ position: 'absolute', left: '-6px', top: '2px', width: '10px', height: '10px', borderRadius: '50%', background: hoje ? 'var(--accent)' : 'var(--border-light)' }} />
        {itens.length === 0 ? (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>—</div>
        ) : itens.map(({ pgm, seg, calc, isPrimeiroSegmento }) => (
          <div key={`${pgm.id}-${seg.inicio.toISOString()}`} style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', marginBottom: '6px',
            borderRadius: 'var(--radius)',
            background: calc.emAndamento ? (calc.atrasado ? 'var(--red-dim)' : 'var(--blue-dim)') : 'var(--bg-2)',
            border: `1px solid ${calc.emAndamento ? (calc.atrasado ? 'var(--red)' : 'var(--blue)') : 'var(--border)'}`,
          }}>
            {calc.emAndamento && <Flame size={13} color={calc.atrasado ? 'var(--red)' : 'var(--blue)'} />}
            <span className="mono" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)' }}>{pgm.pgm}</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{pgm.commessa}</span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
              {seg.inicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              {' – '}
              {seg.fim.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              {!isPrimeiroSegmento && ' (continuação)'}
              {calc.segmentos.length > 1 && isPrimeiroSegmento && ' → continua amanhã'}
            </span>
            {calc.atrasado && (
              <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--red)' }}>
                <AlertTriangle size={11} style={{ verticalAlign: '-1px', marginRight: '3px' }} />+{calc.atrasoMin}min
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function CapacityBar({ horasAlocadas, horasDisponiveis }) {
  const pct = horasDisponiveis > 0 ? Math.min(100, Math.round((horasAlocadas / horasDisponiveis) * 100)) : 0
  const cor = pct >= 100 ? 'var(--red)' : pct >= 80 ? 'var(--yellow)' : 'var(--green)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, maxWidth: '320px' }}>
      <div className="simple-bar-track" style={{ flex: 1 }}>
        <div className="simple-bar-fill" style={{ width: `${pct}%`, background: cor }} />
      </div>
      <span style={{ fontSize: '12px', color: cor, fontWeight: '600', whiteSpace: 'nowrap' }}>{horasAlocadas.toFixed(0)}h / {horasDisponiveis}h</span>
    </div>
  )
}

function MaquinaTimeline({ label, color, cronograma, horasPorDia }) {
  // Agrupa os segmentos calculados por dia, pra desenhar o cronograma vertical
  const porDia = useMemo(() => {
    const mapa = new Map()
    cronograma.forEach((calc) => {
      calc.segmentos.forEach((seg, i) => {
        const key = seg.inicio.toDateString()
        if (!mapa.has(key)) mapa.set(key, { dia: new Date(seg.inicio.getFullYear(), seg.inicio.getMonth(), seg.inicio.getDate()), itens: [] })
        mapa.get(key).itens.push({ pgm: calc.pgm, seg, calc, isPrimeiroSegmento: i === 0 })
      })
    })
    return [...mapa.values()].sort((a, b) => a.dia - b.dia)
  }, [cronograma])

  const proximos14 = useMemo(() => {
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
    const dias = []
    for (let i = 0; i < 14; i++) {
      const d = new Date(hoje); d.setDate(d.getDate() + i)
      const encontrado = porDia.find((x) => x.dia.toDateString() === d.toDateString())
      dias.push(encontrado || { dia: d, itens: [] })
    }
    return dias
  }, [porDia])

  // Horas alocadas nos próximos 7 dias (pra barra de capacidade)
  const horasSemana = proximos14.slice(0, 7).reduce((soma, dia) => (
    soma + dia.itens.reduce((s, { seg }) => s + (seg.fim.getTime() - seg.inicio.getTime()) / 3600000, 0)
  ), 0)

  return (
    <div className="card" style={{ marginBottom: '22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: color }} />
          <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{label}</span>
        </div>
        <CapacityBar horasAlocadas={horasSemana} horasDisponiveis={horasPorDia * 7} />
      </div>
      {cronograma.length === 0 ? (
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Nada programado.</p>
      ) : (
        proximos14.map((d) => <DiaBloco key={d.dia.toISOString()} dia={d.dia} itens={d.itens} color={color} />)
      )}
    </div>
  )
}

export default function ProgramacaoCorte() {
  const { expediente } = useExpediente()
  const paradas = useParadas()
  const [pgms, setPgms] = useState([])
  const [loading, setLoading] = useState(true)
  const [calendarioAberto, setCalendarioAberto] = useState(false)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'pgms'), (snap) => {
      setPgms(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((p) => p.status !== 'Cortado'))
      setLoading(false)
    })
    return unsub
  }, [])

  const plasma = useMemo(() => ordenarFila(pgms.filter((p) => getMaquina(p.espessura_mm) === 'PLASMA')), [pgms])
  const oxicorte = useMemo(() => ordenarFila(pgms.filter((p) => getMaquina(p.espessura_mm) === 'OXICORTE')), [pgms])

  const cronPlasma = useMemo(() => calcularCronograma(plasma, { paradas, horaInicio: expediente.horaInicio, horaFim: expediente.horaFim, maquina: 'PLASMA' }), [plasma, paradas, expediente])
  const cronOxicorte = useMemo(() => calcularCronograma(oxicorte, { paradas, horaInicio: expediente.horaInicio, horaFim: expediente.horaFim, maquina: 'OXICORTE' }), [oxicorte, paradas, expediente])

  const totalAtrasados = [...cronPlasma, ...cronOxicorte].filter((c) => c.atrasado).length

  const exportar = () => {
    const linha = (calc, maq) => calc.segmentos.map((seg) => ({
      'MÁQUINA': maq,
      'PGM': calc.pgm.pgm,
      'COMMESSA': calc.pgm.commessa,
      'INÍCIO PREVISTO': seg.inicio.toLocaleString('pt-BR'),
      'FIM PREVISTO': seg.fim.toLocaleString('pt-BR'),
      'TEMPO DE CORTE (H)': calc.pgm.tempo_corte_estimado_horas ?? '',
      'CR': calc.pgm.cr || '',
      'STATUS': calc.emAndamento ? (calc.atrasado ? 'Em corte (atrasado)' : 'Em corte') : 'Programado',
    }))
    const rows = [
      ...cronPlasma.flatMap((c) => linha(c, 'PLASMA')),
      ...cronOxicorte.flatMap((c) => linha(c, 'OXICORTE')),
    ]
    const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ 'MÁQUINA': '', 'PGM': 'Nada programado' }])
    ws['!cols'] = [{ wch: 10 }, { wch: 18 }, { wch: 14 }, { wch: 20 }, { wch: 20 }, { wch: 12 }, { wch: 10 }, { wch: 16 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Programação')
    XLSX.writeFile(wb, `Programacao_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <span className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  )

  return (
    <div className="page-wrapper">
      <div className="section-header">
        <div>
          <h1 className="section-title">Programação de Corte</h1>
          <p className="section-sub">
            <CalendarClock size={12} style={{ verticalAlign: '-1px', marginRight: '4px' }} />
            Calculada a partir da Fila — pra mudar a ordem, use a página Fila
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-ghost" onClick={exportar}><Download size={15} /> Exportar</button>
          <button className="btn btn-primary" onClick={() => setCalendarioAberto(true)}>
            <CalendarDays size={15} /> Ver calendário do mês
          </button>
        </div>
      </div>

      {totalAtrasados > 0 && (
        <div className="alert-card" style={{ marginBottom: '20px' }}>
          <AlertTriangle size={22} />
          <div>
            <div style={{ fontWeight: '700', fontSize: '14px' }}>
              {totalAtrasados} corte{totalAtrasados !== 1 ? 's' : ''} passando do tempo estimado
            </div>
            <div style={{ fontSize: '12px', opacity: 0.85 }}>O restante da fila é recalculado automaticamente a partir de agora.</div>
          </div>
        </div>
      )}

      <MaquinaTimeline label="Plasma" color="var(--plasma)" cronograma={cronPlasma} horasPorDia={expediente.horaFim - expediente.horaInicio} />
      <MaquinaTimeline label="Oxicorte" color="var(--oxicorte)" cronograma={cronOxicorte} horasPorDia={expediente.horaFim - expediente.horaInicio} />

      <CalendarioMensal
        open={calendarioAberto}
        onClose={() => setCalendarioAberto(false)}
        cronPlasma={cronPlasma}
        cronOxicorte={cronOxicorte}
        paradas={paradas}
      />
    </div>
  )
}
