import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../lib/firebase'
import { collection, onSnapshot } from 'firebase/firestore'
import { Zap, Flame, Clock, CheckCircle2, AlertTriangle, X } from 'lucide-react'
import { getMaquina, ordenarFila, calcularCronograma } from '../lib/schedule'
import { useExpediente, useParadas } from '../lib/config'
import { getEsperaCorte, getTempoCorteTexto } from '../lib/pgmTimers'

// Modo TV: tela cheia, sem sidebar, pensada pra um monitor no chão de fábrica.
// Sai com Esc ou pelo botão no canto.

export default function ModoTV() {
  const navigate = useNavigate()
  const { expediente } = useExpediente()
  const paradas = useParadas()
  const [pgms, setPgms] = useState([])
  const [agora, setAgora] = useState(new Date())

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'pgms'), (snap) => {
      setPgms(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return unsub
  }, [])

  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), 30000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') navigate('/maquina') }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])

  const ativos = useMemo(() => pgms.filter((p) => p.status !== 'Cortado'), [pgms])
  const aguardando = ativos.filter((p) => p.status === 'Aguardando Corte')
  const emCorte = ativos.filter((p) => p.status === 'Em Corte')
  const cortadosHoje = pgms.filter((p) =>
    p.status === 'Cortado' && p.data_corte && new Date(p.data_corte).toDateString() === agora.toDateString()
  )
  const atrasados = ativos.filter((p) => getEsperaCorte(p)?.atrasado)

  const filaMaquina = (maq) => {
    const itensMaquina = ativos.filter((p) => getMaquina(p.espessura_mm) === maq)
    const ordenados = ordenarFila(itensMaquina)
    const cronograma = calcularCronograma(ordenados, {
      paradas, horaInicio: expediente.horaInicio, horaFim: expediente.horaFim, agora, maquina: maq,
    })
    const atualCalc = cronograma.find((c) => c.emAndamento)
    const fila = cronograma
      .filter((c) => !c.emAndamento)
      .slice(0, 4)
      .map((c) => ({ p: c.pgm, ag: { inicio: c.inicio } }))
    return { atual: atualCalc?.pgm || null, fila }
  }

  const Metric = ({ icon: Icon, label, value, color }) => (
    <div style={{
      flex: 1, background: 'var(--bg-2)', border: '1px solid var(--border)',
      borderRadius: '16px', padding: '22px 26px', borderTop: `3px solid ${color}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <Icon size={20} color={color} />
        <span style={{ fontSize: '15px', color: 'var(--text-secondary)', fontWeight: '600' }}>{label}</span>
      </div>
      <div style={{ fontSize: '52px', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
    </div>
  )

  const MaquinaCol = ({ maq }) => {
    const { atual, fila } = filaMaquina(maq)
    const cor = maq === 'PLASMA' ? 'var(--plasma)' : 'var(--oxicorte)'
    return (
      <div style={{ flex: 1, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '16px', padding: '24px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
          <span style={{ width: '14px', height: '14px', borderRadius: '4px', background: cor }} />
          <span style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)' }}>
            {maq === 'PLASMA' ? 'Plasma' : 'Oxicorte'}
          </span>
        </div>

        <div style={{
          padding: '18px', borderRadius: '12px', marginBottom: '14px',
          background: atual ? 'var(--blue-dim)' : 'var(--bg-3)',
          border: `1px solid ${atual ? 'var(--blue)' : 'var(--border)'}`,
        }}>
          <div style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '0.08em', color: atual ? 'var(--blue)' : 'var(--text-muted)', marginBottom: '8px' }}>
            CORTANDO AGORA
          </div>
          {atual ? (
            <>
              <div className="mono" style={{ fontSize: '30px', fontWeight: '800', color: 'var(--text-primary)' }}>{atual.pgm}</div>
              <div style={{ fontSize: '16px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {atual.commessa} · ⏱ {getTempoCorteTexto(atual)}
              </div>
            </>
          ) : (
            <div style={{ fontSize: '18px', color: 'var(--text-muted)' }}>Máquina livre</div>
          )}
        </div>

        <div style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '10px' }}>
          PRÓXIMOS DA FILA
        </div>
        {fila.length === 0 ? (
          <div style={{ fontSize: '15px', color: 'var(--text-muted)' }}>Fila vazia</div>
        ) : fila.map(({ p, ag }, i) => (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px',
            borderRadius: '10px', marginBottom: '6px', background: 'var(--bg-3)',
          }}>
            <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-muted)', width: '22px' }}>{i + 1}º</span>
            <span className="mono" style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.pgm}</span>
            {ag && (
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                {ag.inicio.toLocaleString('pt-BR', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{
      minHeight: 'var(--app-height)', background: 'var(--bg-0)',
      padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '20px',
    }}>
      {/* Topo */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Zap size={26} color="var(--accent)" />
          <span style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>Carga Máquina</span>
          {atrasados.length > 0 && (
            <span className="badge badge-red" style={{ fontSize: '14px', padding: '7px 14px' }}>
              <AlertTriangle size={14} /> {atrasados.length} atrasado{atrasados.length !== 1 ? 's' : ''} (+3 dias)
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <span style={{ fontSize: '26px', fontWeight: '700', color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
            {agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <button className="btn-icon" title="Sair do modo TV (Esc)" onClick={() => navigate('/maquina')}>
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Métricas */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <Metric icon={Clock} label="Aguardando" value={aguardando.length} color="var(--yellow)" />
        <Metric icon={Flame} label="Em Corte" value={emCorte.length} color="var(--blue)" />
        <Metric icon={CheckCircle2} label="Cortados hoje" value={cortadosHoje.length} color="var(--green)" />
      </div>

      {/* Máquinas */}
      <div style={{ display: 'flex', gap: '16px', flex: 1, flexWrap: 'wrap' }}>
        <MaquinaCol maq="PLASMA" />
        <MaquinaCol maq="OXICORTE" />
      </div>
    </div>
  )
}
