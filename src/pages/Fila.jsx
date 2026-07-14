import React, { useEffect, useState, useMemo } from 'react'
import { db } from '../lib/firebase'
import { collection, onSnapshot, writeBatch, doc } from 'firebase/firestore'
import { useAuth } from '../lib/auth'
import { canSchedulePGMs } from '../lib/permissions'
import { useToast } from '../lib/toast'
import { useExpediente, useParadas, addParada, removeParada } from '../lib/config'
import { logAction } from '../lib/auditLog'
import { getMaquina, ordenarFila, calcularCronograma } from '../lib/schedule'
import { getEsperaCorte } from '../lib/pgmTimers'
import { getFeriadosContagemMG } from '../lib/holidays'
import {
  GripVertical, Flame, AlertTriangle, ArrowUpToLine, CalendarClock,
  Plus, Trash2, CalendarOff, CalendarDays,
} from 'lucide-react'

function ParadasPanel({ paradas, onAdd, onRemove, onImportarFeriados }) {
  const [data, setData] = useState('')
  const [maquina, setMaquina] = useState('AMBAS')
  const [motivo, setMotivo] = useState('')
  const [importando, setImportando] = useState(false)
  const anoAlvo = new Date().getMonth() >= 10 ? new Date().getFullYear() + 1 : new Date().getFullYear()

  const handleImportar = async () => {
    setImportando(true)
    await onImportarFeriados(anoAlvo)
    setImportando(false)
  }

  const handleAdd = () => {
    if (!data) return
    onAdd({ data, maquina, motivo })
    setData(''); setMotivo('')
  }

  return (
    <div className="card" style={{ marginBottom: '20px' }}>
      <div className="chart-title" style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <span>
          <CalendarOff size={13} style={{ verticalAlign: '-2px', marginRight: '5px' }} />
          Paradas programadas (feriados, manutenção)
        </span>
        <button className="btn btn-ghost btn-sm" onClick={handleImportar} disabled={importando}>
          <CalendarDays size={13} /> {importando ? 'Importando…' : `Importar feriados ${anoAlvo} (Contagem/MG)`}
        </button>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Data</label>
          <input className="form-input" type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </div>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Máquina</label>
          <select className="form-input" value={maquina} onChange={(e) => setMaquina(e.target.value)}>
            <option value="AMBAS">Ambas</option>
            <option value="PLASMA">Plasma</option>
            <option value="OXICORTE">Oxicorte</option>
          </select>
        </div>
        <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '160px' }}>
          <label className="form-label">Motivo (opcional)</label>
          <input className="form-input" placeholder="Ex: Manutenção preventiva" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={handleAdd} disabled={!data}><Plus size={14} /> Adicionar</button>
      </div>
      {paradas.length === 0 ? (
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Nenhuma parada programada.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {paradas.sort((a, b) => a.data.localeCompare(b.data)).map((p) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', padding: '6px 10px', background: 'var(--bg-2)', borderRadius: 'var(--radius)' }}>
              <span className="mono" style={{ fontWeight: '600' }}>{new Date(p.data + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
              <span className={`badge ${p.maquina === 'AMBAS' ? 'badge-gray' : `badge-${p.maquina.toLowerCase()}`}`}>{p.maquina === 'AMBAS' ? 'Ambas' : p.maquina}</span>
              {p.motivo && <span style={{ color: 'var(--text-muted)', flex: 1 }}>{p.motivo}</span>}
              <button className="btn-icon" style={{ color: 'var(--red)' }} onClick={() => onRemove(p.id)}><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function MachineQueue({ maquina, label, color, itens, cronograma, podeEditar, onReorder, onPriorizar }) {
  const [dragIndex, setDragIndex] = useState(null)
  const emCorte = itens.find((p) => p.status === 'Em Corte')
  const aguardando = itens.filter((p) => p.status === 'Aguardando Corte')
  const emCorteCalc = cronograma.find((c) => c.pgm.id === emCorte?.id)

  const ultimo = cronograma.length ? cronograma[cronograma.length - 1] : null

  const handleDrop = (targetIndex) => {
    if (dragIndex === null || dragIndex === targetIndex) { setDragIndex(null); return }
    const nova = [...aguardando]
    const [item] = nova.splice(dragIndex, 1)
    nova.splice(targetIndex, 0, item)
    onReorder(nova)
    setDragIndex(null)
  }

  return (
    <div className="card" style={{ marginBottom: '22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: color }} />
          <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{label}</span>
        </div>
        {ultimo && (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            <CalendarClock size={12} style={{ verticalAlign: '-1px', marginRight: '4px' }} />
            Última peça sai em{' '}
            <b style={{ color: 'var(--text-secondary)' }}>
              {ultimo.fim.toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </b>
          </span>
        )}
      </div>

      {/* Em corte agora */}
      {emCorte ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', marginBottom: '10px',
          borderRadius: 'var(--radius)', background: emCorteCalc?.atrasado ? 'var(--red-dim)' : 'var(--blue-dim)',
          border: `1px solid ${emCorteCalc?.atrasado ? 'var(--red)' : 'var(--blue)'}`,
        }}>
          <Flame size={16} color={emCorteCalc?.atrasado ? 'var(--red)' : 'var(--blue)'} />
          <span className="mono" style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{emCorte.pgm}</span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{emCorte.commessa}</span>
          <span style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: '600', color: emCorteCalc?.atrasado ? 'var(--red)' : 'var(--blue)' }}>
            {emCorteCalc?.atrasado
              ? <><AlertTriangle size={12} style={{ verticalAlign: '-1px', marginRight: '3px' }} />Atrasado {emCorteCalc.atrasoMin}min vs. estimado</>
              : `Previsto até ${emCorteCalc?.previstoFim.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
          </span>
        </div>
      ) : (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>Máquina livre agora</div>
      )}

      {/* Fila reordenável */}
      {aguardando.length === 0 ? (
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Nenhum PGM aguardando corte.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {aguardando.map((p, i) => {
            const espera = getEsperaCorte(p)
            const calc = cronograma.find((c) => c.pgm.id === p.id)
            return (
              <div
                key={p.id}
                draggable={podeEditar}
                onDragStart={() => setDragIndex(i)}
                onDragOver={(e) => podeEditar && e.preventDefault()}
                onDrop={() => podeEditar && handleDrop(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
                  borderRadius: 'var(--radius)', border: '1px solid var(--border)',
                  background: dragIndex === i ? 'var(--bg-3)' : 'var(--bg-2)',
                  cursor: podeEditar ? 'grab' : 'default',
                }}
              >
                {podeEditar && <GripVertical size={15} color="var(--text-muted)" />}
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', width: '20px' }}>{i + 1}º</span>
                <span className="mono" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--accent)', minWidth: '110px' }}>{p.pgm}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', minWidth: '80px' }}>{p.commessa}</span>
                {espera && (
                  <span className={`badge ${espera.atrasado ? 'badge-red' : 'badge-gray'}`} style={{ fontSize: '11px' }}>
                    {espera.dias === 0 ? '< 1 dia' : `${espera.dias}d aguardando`}
                  </span>
                )}
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.tempo_corte_estimado_horas || 4}h</span>
                {calc && (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                    previsto {calc.inicio.toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    {calc.atravessaDias && ' · atravessa dia'}
                  </span>
                )}
                {podeEditar && i > 0 && (
                  <button className="btn-icon" title="Priorizar (mandar pro topo)" onClick={() => onPriorizar(p)} style={{ marginLeft: calc ? 0 : 'auto' }}>
                    <ArrowUpToLine size={13} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function Fila() {
  const toast = useToast()
  const { profile, user } = useAuth()
  const podeEditar = canSchedulePGMs(profile?.role)
  const audit = { displayName: profile?.displayName, email: profile?.email || user?.email, uid: user?.uid }
  const { expediente } = useExpediente()
  const paradas = useParadas()

  const [pgms, setPgms] = useState([])
  const [loading, setLoading] = useState(true)
  const [, tick] = useState(0)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'pgms'), (snap) => {
      setPgms(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((p) => p.status !== 'Cortado'))
      setLoading(false)
    })
    return unsub
  }, [])

  useEffect(() => {
    const id = setInterval(() => tick((t) => t + 1), 60000)
    return () => clearInterval(id)
  }, [])

  const plasma = useMemo(() => ordenarFila(pgms.filter((p) => getMaquina(p.espessura_mm) === 'PLASMA')), [pgms])
  const oxicorte = useMemo(() => ordenarFila(pgms.filter((p) => getMaquina(p.espessura_mm) === 'OXICORTE')), [pgms])

  const cronPlasma = useMemo(() => calcularCronograma(plasma, { paradas, horaInicio: expediente.horaInicio, horaFim: expediente.horaFim, maquina: 'PLASMA' }), [plasma, paradas, expediente])
  const cronOxicorte = useMemo(() => calcularCronograma(oxicorte, { paradas, horaInicio: expediente.horaInicio, horaFim: expediente.horaFim, maquina: 'OXICORTE' }), [oxicorte, paradas, expediente])

  const salvarOrdem = async (maquina, novaOrdemAguardando) => {
    try {
      const batch = writeBatch(db)
      novaOrdemAguardando.forEach((p, i) => batch.update(doc(db, 'pgms', p.id), { prioridade: i }))
      await batch.commit()
      logAction({ user: audit, action: 'reordenou a fila', pgmLabel: maquina })
    } catch { toast('Erro ao salvar a nova ordem.', 'error') }
  }

  const handlePriorizar = async (maquina, pgm, aguardandoAtual) => {
    const nova = [pgm, ...aguardandoAtual.filter((p) => p.id !== pgm.id)]
    await salvarOrdem(maquina, nova)
    toast(`${pgm.pgm} priorizado.`, 'success')
  }

  const handleAddParada = async (dados) => {
    try {
      await addParada(dados)
      logAction({ user: audit, action: 'adicionou parada', pgmLabel: `${dados.maquina} · ${dados.data}` })
      toast('Parada adicionada.', 'success')
    } catch { toast('Erro ao adicionar parada.', 'error') }
  }

  const handleImportarFeriados = async (ano) => {
    try {
      const feriados = getFeriadosContagemMG(ano)
      const jaExistem = new Set(paradas.filter((p) => p.maquina === 'AMBAS').map((p) => p.data))
      const novos = feriados.filter((f) => !jaExistem.has(f.data))
      if (novos.length === 0) {
        toast(`Os feriados de ${ano} já estão todos cadastrados.`, 'info')
        return
      }
      for (const f of novos) {
        await addParada({ data: f.data, maquina: 'AMBAS', motivo: f.nome })
      }
      logAction({ user: audit, action: 'importou feriados', pgmLabel: `Contagem/MG ${ano} (${novos.length})` })
      toast(`${novos.length} feriado${novos.length !== 1 ? 's' : ''} de ${ano} importado${novos.length !== 1 ? 's' : ''}.`, 'success')
    } catch { toast('Erro ao importar feriados.', 'error') }
  }

  const handleRemoveParada = async (id) => {
    try {
      await removeParada(id)
      toast('Parada removida.', 'info')
    } catch { toast('Erro ao remover.', 'error') }
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
          <h1 className="section-title">Fila</h1>
          <p className="section-sub">
            {podeEditar ? 'Arraste pra definir a ordem de corte — isso alimenta a Programação automaticamente' : 'Ordem de corte definida pela programação (somente leitura)'}
          </p>
        </div>
      </div>

      {podeEditar && <ParadasPanel paradas={paradas} onAdd={handleAddParada} onRemove={handleRemoveParada} onImportarFeriados={handleImportarFeriados} />}

      <MachineQueue
        maquina="PLASMA" label="Plasma" color="var(--plasma)" itens={plasma} cronograma={cronPlasma}
        podeEditar={podeEditar}
        onReorder={(nova) => salvarOrdem('PLASMA', nova)}
        onPriorizar={(pgm) => handlePriorizar('PLASMA', pgm, plasma.filter((p) => p.status === 'Aguardando Corte'))}
      />
      <MachineQueue
        maquina="OXICORTE" label="Oxicorte" color="var(--oxicorte)" itens={oxicorte} cronograma={cronOxicorte}
        podeEditar={podeEditar}
        onReorder={(nova) => salvarOrdem('OXICORTE', nova)}
        onPriorizar={(pgm) => handlePriorizar('OXICORTE', pgm, oxicorte.filter((p) => p.status === 'Aguardando Corte'))}
      />
    </div>
  )
}
