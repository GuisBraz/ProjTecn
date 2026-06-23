import React, { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from '../../lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { useAuth } from '../../lib/auth'
import { canCreateOps, canEditOps, canFinalizeOps, canDeleteOps } from '../../lib/permissions'
import { useToast } from '../../lib/toast'
import { listenOps, criarOp, atualizarOp, finalizarOp, reabrirOp, excluirOp } from '../../lib/ops'
import { listenEmpreiteiras } from '../../lib/empreiteiras'
import { getOpSituacao, getOpPrazoTexto } from '../../lib/opStatus'
import { exportOps } from '../../lib/exportXLSX'
import OPModal from '../../components/OPModal'
import OPSearchBar from '../../components/OPSearchBar'
import {
  Factory, Plus, Download, ArrowLeft, Pencil, Trash2, Eye,
  CheckCircle, RotateCcw, ClipboardList, AlertTriangle, Clock, Weight,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

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

function DetailModal({ op, onClose }) {
  if (!op) return null
  const rows = [
    ['N° OP', op.numero_op], ['N° Produto', op.numero_produto || '—'],
    ['Commessa', op.commessa], ['Desenho', op.desenho || '—'],
    ['Descrição', op.descricao || '—'], ['Quantidade', op.quantidade ?? '—'],
    ['Peso', op.peso ? `${op.peso} kg` : '—'],
    ['Data de Início', op.data_inicio || '—'],
    ['Previsão de Término', op.previsao_termino || '—'],
    ['Situação', op.status === 'finalizada' ? 'Finalizada' : getOpPrazoTexto(op.previsao_termino)],
    ['Finalizada em', op.dataFinalizacao ? format(new Date(op.dataFinalizacao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '—'],
  ]
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title mono" style={{ color: 'var(--accent)' }}>{op.numero_op}</span>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {rows.map(([k, v]) => (
              <div key={k} style={{ gridColumn: k === 'Descrição' ? '1 / -1' : undefined }}>
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

const situacaoBadge = (op) => {
  if (op.status === 'finalizada') return <span className="badge badge-green">Finalizada</span>
  const sit = getOpSituacao(op.previsao_termino)
  if (sit === 'atrasado')  return <span className="badge badge-red">Atrasada</span>
  if (sit === 'andamento') return <span className="badge badge-blue">Em andamento</span>
  return <span className="badge">—</span>
}

export default function OPsList({ arquivado = false }) {
  const { empreiteiraId } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const toast = useToast()
  const podeCriar           = canCreateOps(profile?.role)
  const podeEditar          = canEditOps(profile?.role)
  const podeFinalizarOuReabrir = canFinalizeOps(profile?.role)
  const podeExcluir         = canDeleteOps(profile?.role)
  const basePath = arquivado ? '/fabrica/arquivadas' : '/fabrica/ativas'

  const [empreiteiras, setEmpreiteiras] = useState([])
  const [empreiteira, setEmpreiteira] = useState(null)
  const [ops, setOps] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [detail, setDetail] = useState(null)
  const [confirm, setConfirm] = useState(null)

  useEffect(() => {
    const unsub = listenEmpreiteiras(lista => setEmpreiteiras(lista.filter(e => e.ativo)))
    return unsub
  }, [])

  useEffect(() => {
    if (!empreiteiraId) { setOps([]); setEmpreiteira(null); setLoading(false); return }
    setLoading(true)
    getDoc(doc(db, 'empreiteiras', empreiteiraId)).then(snap => {
      if (snap.exists()) setEmpreiteira({ id: snap.id, ...snap.data() })
    })
    const unsub = listenOps(empreiteiraId, arquivado ? 'finalizada' : 'ativa', lista => {
      setOps(lista); setLoading(false)
    })
    return unsub
  }, [empreiteiraId, arquivado])

  const filtered = useMemo(() => {
    if (!search.trim()) return ops
    const q = search.toLowerCase()
    return ops.filter(o =>
      o.numero_op?.toLowerCase().includes(q) ||
      o.commessa?.toLowerCase().includes(q) ||
      o.desenho?.toLowerCase().includes(q)
    )
  }, [ops, search])

  const emAndamento = ops.filter(o => getOpSituacao(o.previsao_termino) === 'andamento').length
  const atrasadas   = ops.filter(o => getOpSituacao(o.previsao_termino) === 'atrasado').length
  const pesoTotal   = ops.reduce((s, o) => s + (Number(o.peso) || 0), 0)

  const handleSave = async (payload) => {
    try {
      if (editing) {
        await atualizarOp(editing.id, payload)
        toast('OP atualizada!', 'success')
      } else {
        await criarOp({ ...payload, empreiteiraId, empreiteiraNome: empreiteira?.nome || '' })
        toast('OP cadastrada!', 'success')
      }
      setModalOpen(false); setEditing(null)
    } catch { toast('Erro ao salvar.', 'error') }
  }

  const handleFinalizar = (op) => setConfirm({
    title: 'Finalizar OP',
    body: `Confirma a finalização da OP "${op.numero_op}"?`,
    onConfirm: async () => { await finalizarOp(op.id); toast(`${op.numero_op} finalizada!`, 'success'); setConfirm(null) },
  })

  const handleReabrir = (op) => setConfirm({
    title: 'Reabrir OP',
    body: `Mover "${op.numero_op}" de volta para OPs Ativas?`,
    onConfirm: async () => { await reabrirOp(op.id); toast(`${op.numero_op} reaberta.`, 'success'); setConfirm(null) },
  })

  const handleDelete = (op) => setConfirm({
    title: 'Excluir OP', danger: true,
    body: `Tem certeza que deseja excluir "${op.numero_op}"?`,
    onConfirm: async () => { await excluirOp(op.id); toast('OP excluída.', 'success'); setConfirm(null) },
  })

  // ---- Tela 1: seleção de empreiteira ----
  if (!empreiteiraId) {
    return (
      <div className="page-wrapper">
        <div className="section-header">
          <div>
            <h1 className="section-title">{arquivado ? 'OPs Arquivadas' : 'OPs Ativas'}</h1>
            <p className="section-sub">Selecione a empreiteira para ver as ordens de produção</p>
          </div>
        </div>

        {empreiteiras.length === 0 ? (
          <div className="empty-state"><Factory size={44} /><p>Nenhuma empreiteira cadastrada</p></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
            {empreiteiras.map((emp, i) => {
              return (
                <button
                  key={emp.id}
                  onClick={() => navigate(`${basePath}/${emp.id}`)}
                  className="stat-card"
                  style={{
                    '--card-accent': '#f97316',
                    textAlign: 'left', cursor: 'pointer', border: 'none',
                    width: '100%', background: 'var(--bg-2)',
                  }}
                >
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    background: 'var(--accent-dim)', border: '1px solid rgba(249,115,22,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Factory size={22} color="var(--accent)" />
                  </div>
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>{emp.nome}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Ver ordens de produção →</div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // ---- Tela 2: lista de OPs ----
  return (
    <div className="page-wrapper">
      <button onClick={() => navigate(basePath)} className="btn btn-ghost btn-sm" style={{ marginBottom: '20px' }}>
        <ArrowLeft size={14} /> Voltar
      </button>

      <div className="section-header">
        <div>
          <h1 className="section-title">{empreiteira?.nome || '…'}</h1>
          <p className="section-sub">
            {filtered.length} OP{filtered.length !== 1 ? 's' : ''} {arquivado ? 'arquivada' : 'ativa'}{filtered.length !== 1 ? 's' : ''}
            {!arquivado && <> · <span style={{ color: 'var(--blue)' }}>{emAndamento} em dia</span> · <span style={{ color: 'var(--red)' }}>{atrasadas} atrasada{atrasadas !== 1 ? 's' : ''}</span></>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-ghost" onClick={() => exportOps(filtered, empreiteira?.nome)}>
            <Download size={15} /> Exportar XLSX
          </button>
          {podeCriar && !arquivado && (
            <button className="btn btn-primary" onClick={() => { setEditing(null); setModalOpen(true) }}>
              <Plus size={15} /> Nova OP
            </button>
          )}
        </div>
      </div>

      {/* Mini stat cards */}
      {!arquivado && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px' }}>
            <Clock size={20} color="var(--blue)" />
            <div>
              <div style={{ fontSize: '20px', fontWeight: '700' }}>{emAndamento}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Em dia</div>
            </div>
          </div>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px' }}>
            <AlertTriangle size={20} color="var(--red)" />
            <div>
              <div style={{ fontSize: '20px', fontWeight: '700' }}>{atrasadas}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Atrasadas</div>
            </div>
          </div>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px' }}>
            <Weight size={20} color="var(--purple)" />
            <div>
              <div style={{ fontSize: '20px', fontWeight: '700' }}>{pesoTotal.toFixed(0)}<span style={{ fontSize: '12px', fontWeight: '400', color: 'var(--text-muted)', marginLeft: '3px' }}>kg</span></div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Peso total</div>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: '20px' }}>
        <OPSearchBar value={search} onChange={setSearch} />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><span className="spinner" style={{ width: 28, height: 28 }} /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><ClipboardList size={44} /><p>Nenhuma OP encontrada</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>N° OP</th><th>Commessa</th><th>Desenho</th><th>Qtd.</th><th>Peso (kg)</th>
                  <th>Previsão Término</th><th>Situação</th><th style={{ textAlign: 'center' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o.id}>
                    <td className="mono" style={{ color: 'var(--accent)', fontWeight: '600' }}>{o.numero_op}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{o.commessa}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{o.desenho || '—'}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{o.quantidade ?? '—'}</td>
                    <td style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>{o.peso ? `${o.peso} kg` : '—'}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                      {o.previsao_termino ? format(new Date(o.previsao_termino), 'dd/MM/yyyy') : '—'}
                      {!arquivado && o.previsao_termino && (
                        <div style={{ fontSize: '11px', marginTop: '2px' }}>{getOpPrazoTexto(o.previsao_termino)}</div>
                      )}
                    </td>
                    <td>{situacaoBadge(o)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button className="btn-icon" title="Ver detalhes" onClick={() => setDetail(o)}><Eye size={17} /></button>
                        {podeEditar && !arquivado && (
                          <button className="btn-icon" title="Editar" onClick={() => { setEditing(o); setModalOpen(true) }}><Pencil size={17} /></button>
                        )}
                        {podeFinalizarOuReabrir && !arquivado && (
                          <button className="btn-icon" style={{ color: 'var(--green)', borderColor: 'rgba(34,197,94,0.3)' }} title="Finalizar" onClick={() => handleFinalizar(o)}><CheckCircle size={17} /></button>
                        )}
                        {podeFinalizarOuReabrir && arquivado && (
                          <button className="btn-icon" title="Reabrir" onClick={() => handleReabrir(o)}><RotateCcw size={17} /></button>
                        )}
                        {podeExcluir && (
                          <button className="btn-icon" style={{ color: 'var(--red)', borderColor: 'rgba(239,68,68,0.2)' }} title="Excluir" onClick={() => handleDelete(o)}><Trash2 size={17} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <OPModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSave={handleSave}
        initial={editing}
        empreiteiraNome={empreiteira?.nome}
      />
      <DetailModal op={detail} onClose={() => setDetail(null)} />
      <ConfirmModal open={!!confirm} title={confirm?.title} body={confirm?.body} danger={confirm?.danger} onConfirm={confirm?.onConfirm} onCancel={() => setConfirm(null)} />
    </div>
  )
}
