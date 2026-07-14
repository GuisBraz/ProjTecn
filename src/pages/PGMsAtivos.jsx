import React, { useEffect, useState, useMemo } from 'react'
import { db } from '../lib/firebase'
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, query, where, writeBatch,
} from 'firebase/firestore'
import { useAuth } from '../lib/auth'
import { canCreatePGMs, canEditPGMs, canDeletePGMs, canStartCut, canFinishCut, canEditCR } from '../lib/permissions'
import { useToast } from '../lib/toast'
import PGMModal from '../components/PGMModal'
import ImportModal from '../components/ImportModal'
import HistoryModal from '../components/HistoryModal'
import FilterBar from '../components/FilterBar'
import { exportPGMs } from '../lib/exportXLSX'
import { logAction } from '../lib/auditLog'
import { Plus, Play, CheckCircle, Pencil, Trash2, Download, Upload, ClipboardList, Eye, Tag, History } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getEsperaCorte, getTempoCorteTexto } from '../lib/pgmTimers'

const EMPTY_FILTERS = { search: '', commessa: '', maquina: '', status: '', dataFrom: '', dataTo: '' }

const getMaquina = (esp) => {
  if (!esp || esp === 0) return null
  return Number(esp) < 23 ? 'PLASMA' : 'OXICORTE'
}

function ConfirmModal({ open, onConfirm, onCancel, title, body, danger }) {
  if (!open) return null
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className="modal" style={{ maxWidth: '400px' }}>
        <div className="modal-header"><span className="modal-title">{title}</span></div>
        <div className="modal-body"><p style={{ color: 'var(--text-secondary)' }}>{body}</p></div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
          <button className={`btn ${danger ? 'btn-red' : 'btn-primary'}`} onClick={onConfirm}>Confirmar</button>
        </div>
      </div>
    </div>
  )
}

function DetailModal({ pgm, onClose }) {
  if (!pgm) return null
  const mq = getMaquina(pgm.espessura_mm)
  const rows = [
    ['PGM', pgm.pgm], ['Commessa', pgm.commessa],
    ['Espessura', pgm.espessura_mm ? `${pgm.espessura_mm} mm` : '—'],
    ['Máquina', mq || '—'], ['Peso', pgm.peso_kg ? `${pgm.peso_kg} kg` : '—'],
    ['Material', pgm.material || '—'], ['CR', pgm.cr || '—'],
    ['Revisão', pgm.rev || '—'],
    ['Tempo de Corte Estimado', pgm.tempo_corte_estimado_horas ? `${pgm.tempo_corte_estimado_horas}h` : '—'],
    ['Data de Emissão', pgm.data_emissao || '—'],
    ['Início do Corte', pgm.data_inicio_corte ? format(new Date(pgm.data_inicio_corte), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '—'],
    ['Finalização', pgm.data_corte ? format(new Date(pgm.data_corte), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '—'],
    ['Tempo de Corte', getTempoCorteTexto(pgm)],
    ['Status', pgm.status], ['Observações', pgm.observacoes || '—'],
  ]
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title mono" style={{ color: 'var(--accent)' }}>{pgm.pgm}</span>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {rows.map(([k, v]) => (
              <div key={k} style={{ gridColumn: k === 'Observações' ? '1 / -1' : undefined }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{k}</div>
                <div style={{ color: 'var(--text-primary)', fontSize: '13px' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="modal-footer"><button className="btn btn-ghost" onClick={onClose}>Fechar</button></div>
      </div>
    </div>
  )
}

export default function PGMsAtivos() {
  const toast = useToast()
  const { profile, user } = useAuth()
  const audit = { displayName: profile?.displayName, email: profile?.email || user?.email, uid: user?.uid }
  const podeCriar     = canCreatePGMs(profile?.role)
  const podeEditar    = canEditPGMs(profile?.role)
  const podeExcluir   = canDeletePGMs(profile?.role)
  const podeIniciar   = canStartCut(profile?.role)
  const podeFinalizar = canFinishCut(profile?.role)
  const podeEditarCR  = canEditCR(profile?.role)

  const [pgms, setPgms] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [crEditing, setCrEditing] = useState(null)
  const [importOpen, setImportOpen] = useState(false)
  const [historyPgm, setHistoryPgm] = useState(null)
  const [detail, setDetail] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [, forceTick] = useState(0)

  useEffect(() => {
    const q = query(collection(db, 'pgms'), where('status', '!=', 'Cortado'))
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      setPgms(data)
      setLoading(false)
    })
    return unsub
  }, [])

  // Reavalia os temporizadores (espera / tempo de corte) a cada minuto
  useEffect(() => {
    const id = setInterval(() => forceTick(t => t + 1), 60000)
    return () => clearInterval(id)
  }, [])

  const filtered = useMemo(() => pgms.filter(p => {
    if (filters.search) {
      const q = filters.search.toLowerCase()
      if (!p.pgm?.toLowerCase().includes(q) && !p.commessa?.toLowerCase().includes(q) &&
          !p.material?.toLowerCase().includes(q)) return false
    }
    if (filters.commessa && !p.commessa?.toLowerCase().includes(filters.commessa.toLowerCase())) return false
    const mq = getMaquina(p.espessura_mm)
    if (filters.maquina && mq !== filters.maquina) return false
    if (filters.status && p.status !== filters.status) return false
    if (filters.dataFrom && p.data_emissao && p.data_emissao < filters.dataFrom) return false
    if (filters.dataTo && p.data_emissao && p.data_emissao > filters.dataTo) return false
    return true
  }), [pgms, filters])

  const handleSave = async (payload) => {
    try {
      if (editing) {
        await updateDoc(doc(db, 'pgms', editing.id), { ...payload, updatedAt: serverTimestamp() })
        logAction({ user: audit, action: 'editou', pgmId: editing.id, pgmLabel: editing.pgm })
        toast('PGM atualizado!', 'success')
      } else {
        const { cortes = 1, ...data } = payload
        if (cortes > 1) {
          // Desdobra: PGM-0001-1, PGM-0001-2, ... — um registro por corte
          const batch = writeBatch(db)
          const refs = []
          for (let c = 1; c <= cortes; c++) {
            const ref = doc(collection(db, 'pgms'))
            refs.push({ ref, label: `${data.pgm}-${c}` })
            batch.set(ref, {
              ...data,
              pgm: `${data.pgm}-${c}`,
              corte_n: c, corte_total: cortes,
              status: 'Aguardando Corte', createdAt: serverTimestamp(),
            })
          }
          await batch.commit()
          refs.forEach(({ ref, label }) => logAction({ user: audit, action: 'criou', pgmId: ref.id, pgmLabel: label, details: `corte ${label.slice(-1)} de ${cortes}` }))
          toast(`${cortes} cortes cadastrados: ${data.pgm}-1 a ${data.pgm}-${cortes}`, 'success')
        } else {
          const ref = await addDoc(collection(db, 'pgms'), { ...data, status: 'Aguardando Corte', createdAt: serverTimestamp() })
          logAction({ user: audit, action: 'criou', pgmId: ref.id, pgmLabel: data.pgm })
          toast('PGM cadastrado!', 'success')
        }
      }
      setModalOpen(false); setEditing(null)
    } catch { toast('Erro ao salvar.', 'error') }
  }

  const handleImport = async (rows) => {
    // rows já vêm desdobradas pelo importador (coluna CORTES)
    try {
      const CHUNK = 400 // limite do Firestore é 500 operações por batch
      for (let i = 0; i < rows.length; i += CHUNK) {
        const batch = writeBatch(db)
        rows.slice(i, i + CHUNK).forEach((r) => {
          const ref = doc(collection(db, 'pgms'))
          batch.set(ref, { ...r, status: 'Aguardando Corte', createdAt: serverTimestamp() })
        })
        await batch.commit()
      }
      logAction({ user: audit, action: 'importou', pgmLabel: `${rows.length} PGMs via Excel` })
      toast(`${rows.length} PGM${rows.length !== 1 ? 's' : ''} importado${rows.length !== 1 ? 's' : ''}!`, 'success')
      setImportOpen(false)
    } catch { toast('Erro na importação.', 'error') }
  }

  const handleSaveCR = async (payload) => {
    try {
      await updateDoc(doc(db, 'pgms', crEditing.id), payload)
      logAction({ user: audit, action: 'salvou CR', pgmId: crEditing.id, pgmLabel: crEditing.pgm, details: payload.cr })
      toast('CR salvo!', 'success')
      setCrEditing(null)
    } catch { toast('Erro ao salvar CR.', 'error') }
  }

  const handleIniciar = async (pgm) => {
    try {
      await updateDoc(doc(db, 'pgms', pgm.id), { status: 'Em Corte', data_inicio_corte: new Date().toISOString() })
      logAction({ user: audit, action: 'iniciou corte', pgmId: pgm.id, pgmLabel: pgm.pgm })
      toast(`Corte iniciado: ${pgm.pgm}`, 'info')
    } catch { toast('Erro ao iniciar.', 'error') }
  }

  const handleFinalizar = (pgm) => {
    setConfirm({
      title: 'Finalizar Corte',
      body: `Confirma a finalização do corte de "${pgm.pgm}"?`,
      onConfirm: async () => {
        await updateDoc(doc(db, 'pgms', pgm.id), { status: 'Cortado', data_corte: new Date().toISOString() })
        logAction({ user: audit, action: 'finalizou corte', pgmId: pgm.id, pgmLabel: pgm.pgm })
        toast(`${pgm.pgm} finalizado!`, 'success')
        setConfirm(null)
      }
    })
  }

  const handleDelete = (pgm) => {
    setConfirm({
      title: 'Excluir PGM', danger: true,
      body: `Tem certeza que deseja excluir "${pgm.pgm}"?`,
      onConfirm: async () => {
        await deleteDoc(doc(db, 'pgms', pgm.id))
        logAction({ user: audit, action: 'excluiu', pgmId: pgm.id, pgmLabel: pgm.pgm })
        toast('PGM excluído.', 'success')
        setConfirm(null)
      }
    })
  }

  const exportData = filtered.map(p => ({ ...p, maquina: getMaquina(p.espessura_mm) }))

  const statusBadge = (s) => {
    const map = { 'Aguardando Corte': 'badge-yellow', 'Em Corte': 'badge-blue', 'Cortado': 'badge-green' }
    return <span className={`badge ${map[s] || ''}`}>{s}</span>
  }

  return (
    <div className="page-wrapper">
      <div className="section-header">
        <div>
          <h1 className="section-title">PGMs Ativos</h1>
          <p className="section-sub">{filtered.length} plano{filtered.length !== 1 ? 's' : ''} em fábrica</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-ghost" onClick={() => exportPGMs(exportData, filters)}>
            <Download size={15} /> Exportar XLSX
          </button>
          {podeCriar && (
            <>
              <button className="btn btn-ghost" onClick={() => setImportOpen(true)}>
                <Upload size={15} /> Importar
              </button>
              <button className="btn btn-primary" onClick={() => { setEditing(null); setModalOpen(true) }}>
                <Plus size={15} /> Novo PGM
              </button>
            </>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <FilterBar filters={filters} onChange={setFilters} onClear={() => setFilters(EMPTY_FILTERS)} />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><span className="spinner" style={{ width: 28, height: 28 }} /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><ClipboardList size={44} /><p>Nenhum PGM encontrado</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>PGM</th><th>Commessa</th><th>Máquina</th><th>CR</th><th>Peso (kg)</th>
                  <th>Status</th><th>Espera / Corte</th><th style={{ textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const mq = getMaquina(p.espessura_mm)
                  const espera = getEsperaCorte(p)
                  return (
                    <tr key={p.id}>
                      <td className="mono" style={{ color: 'var(--accent)', fontWeight: '600' }}>{p.pgm}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{p.commessa}</td>
                      <td>{mq ? <span className={`badge badge-${mq.toLowerCase()}`}>{mq}</span> : '—'}</td>
                      <td style={{ color: p.cr ? 'var(--text-primary)' : 'var(--text-muted)' }}>{p.cr || '—'}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{p.peso_kg ?? '—'}</td>
                      <td>{statusBadge(p.status)}</td>
                      <td>
                        {p.status === 'Aguardando Corte' && espera && (
                          <span className={`badge ${espera.atrasado ? 'badge-red' : 'badge-gray'}`}>
                            {espera.dias === 0 ? '< 1 dia' : `${espera.dias}d aguardando`}
                          </span>
                        )}
                        {p.status === 'Em Corte' && (
                          <span className="badge badge-blue">{getTempoCorteTexto(p)} cortando</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button className="btn-icon" title="Ver detalhes" onClick={() => setDetail(p)}><Eye size={16} /></button>
                          <button className="btn-icon" title="Histórico" onClick={() => setHistoryPgm(p)}><History size={16} /></button>
                          {podeEditar && (
                            <button className="btn-icon" title="Editar" onClick={() => { setEditing(p); setModalOpen(true) }}><Pencil size={16} /></button>
                          )}
                          {podeEditarCR && !podeEditar && (
                            <button className="btn-icon" title="Preencher CR" onClick={() => setCrEditing(p)}><Tag size={16} /></button>
                          )}
                          {podeIniciar && p.status === 'Aguardando Corte' && (
                            <button className="btn-icon" style={{ color: 'var(--blue)', borderColor: 'rgba(59,130,246,0.3)' }} title="Iniciar corte" onClick={() => handleIniciar(p)}><Play size={16} /></button>
                          )}
                          {podeFinalizar && p.status === 'Em Corte' && (
                            <button className="btn-icon" style={{ color: 'var(--green)', borderColor: 'rgba(34,197,94,0.3)' }} title="Finalizar corte" onClick={() => handleFinalizar(p)}><CheckCircle size={16} /></button>
                          )}
                          {podeExcluir && (
                            <button className="btn-icon" style={{ color: 'var(--red)', borderColor: 'rgba(239,68,68,0.2)' }} title="Excluir" onClick={() => handleDelete(p)}><Trash2 size={16} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PGMModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }} onSave={handleSave} initial={editing} />
      <PGMModal mode="cr" open={!!crEditing} onClose={() => setCrEditing(null)} onSave={handleSaveCR} initial={crEditing} />
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} onImport={handleImport} />
      <HistoryModal pgm={historyPgm} onClose={() => setHistoryPgm(null)} />
      <DetailModal pgm={detail} onClose={() => setDetail(null)} />
      <ConfirmModal open={!!confirm} title={confirm?.title} body={confirm?.body} danger={confirm?.danger} onConfirm={confirm?.onConfirm} onCancel={() => setConfirm(null)} />
    </div>
  )
}
