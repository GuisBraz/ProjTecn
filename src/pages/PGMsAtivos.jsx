import React, { useEffect, useState, useMemo } from 'react'
import { db } from '../lib/firebase'
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, query, where
} from 'firebase/firestore'
import { useAuth } from '../lib/auth'
import { canCreatePGMs, canEditPGMs, canDeletePGMs } from '../lib/permissions'
import { useToast } from '../lib/toast'
import PGMModal from '../components/PGMModal'
import FilterBar from '../components/FilterBar'
import { exportPGMs } from '../lib/exportXLSX'
import { Plus, Play, CheckCircle, Pencil, Trash2, Download, ClipboardList, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

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
    ['Fornecedor', pgm.fornecedor || '—'], ['Revisão', pgm.rev || '—'],
    ['Data de Emissão', pgm.data_emissao || '—'],
    ['Início do Corte', pgm.data_inicio_corte ? format(new Date(pgm.data_inicio_corte), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '—'],
    ['Finalização', pgm.data_corte ? format(new Date(pgm.data_corte), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '—'],
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
  const { profile } = useAuth()
  const podeCriar  = canCreatePGMs(profile?.role)
  const podeEditar = canEditPGMs(profile?.role)
  const podeExcluir = canDeletePGMs(profile?.role)

  const [pgms, setPgms] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [detail, setDetail] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [filters, setFilters] = useState(EMPTY_FILTERS)

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
        toast('PGM atualizado!', 'success')
      } else {
        await addDoc(collection(db, 'pgms'), { ...payload, status: 'Aguardando Corte', createdAt: serverTimestamp() })
        toast('PGM cadastrado!', 'success')
      }
      setModalOpen(false); setEditing(null)
    } catch { toast('Erro ao salvar.', 'error') }
  }

  const handleIniciar = async (pgm) => {
    try {
      await updateDoc(doc(db, 'pgms', pgm.id), { status: 'Em Corte', data_inicio_corte: new Date().toISOString() })
      toast(`Corte iniciado: ${pgm.pgm}`, 'info')
    } catch { toast('Erro ao iniciar.', 'error') }
  }

  const handleFinalizar = (pgm) => {
    setConfirm({
      title: 'Finalizar Corte',
      body: `Confirma a finalização do corte de "${pgm.pgm}"?`,
      onConfirm: async () => {
        await updateDoc(doc(db, 'pgms', pgm.id), { status: 'Cortado', data_corte: new Date().toISOString() })
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
            <button className="btn btn-primary" onClick={() => { setEditing(null); setModalOpen(true) }}>
              <Plus size={15} /> Novo PGM
            </button>
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
                <tr><th>PGM</th><th>Commessa</th><th>Máquina</th><th>Esp. (mm)</th><th>Peso (kg)</th><th>Material</th><th>Fornecedor</th><th>Emissão</th><th>Status</th><th style={{ textAlign: 'center' }}>Ações</th></tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const mq = getMaquina(p.espessura_mm)
                  return (
                    <tr key={p.id}>
                      <td className="mono" style={{ color: 'var(--accent)', fontWeight: '600' }}>{p.pgm}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{p.commessa}</td>
                      <td>{mq ? <span className={`badge badge-${mq.toLowerCase()}`}>{mq}</span> : '—'}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{p.espessura_mm ?? '—'}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{p.peso_kg ?? '—'}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{p.material || '—'}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{p.fornecedor || '—'}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{p.data_emissao || '—'}</td>
                      <td>{statusBadge(p.status)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button className="btn-icon" title="Ver detalhes" onClick={() => setDetail(p)}><Eye size={16} /></button>
                          {podeEditar && (
                            <button className="btn-icon" title="Editar" onClick={() => { setEditing(p); setModalOpen(true) }}><Pencil size={16} /></button>
                          )}
                          {podeEditar && p.status === 'Aguardando Corte' && (
                            <button className="btn-icon" style={{ color: 'var(--blue)', borderColor: 'rgba(59,130,246,0.3)' }} title="Iniciar corte" onClick={() => handleIniciar(p)}><Play size={16} /></button>
                          )}
                          {podeEditar && p.status === 'Em Corte' && (
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
      <DetailModal pgm={detail} onClose={() => setDetail(null)} />
      <ConfirmModal open={!!confirm} title={confirm?.title} body={confirm?.body} danger={confirm?.danger} onConfirm={confirm?.onConfirm} onCancel={() => setConfirm(null)} />
    </div>
  )
}
