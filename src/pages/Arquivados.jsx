import React, { useEffect, useState, useMemo } from 'react'
import { db } from '../lib/firebase'
import { collection, onSnapshot, updateDoc, doc, query, where } from 'firebase/firestore'
import { exportPGMs } from '../lib/exportXLSX'
import FilterBar from '../components/FilterBar'
import { Archive, Download, Eye, RotateCcw } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useToast } from '../lib/toast'

const EMPTY_FILTERS = { search: '', commessa: '', maquina: '', dataFrom: '', dataTo: '' }
const getMaquina = (esp) => { if (!esp || esp === 0) return null; return Number(esp) < 23 ? 'PLASMA' : 'OXICORTE' }

function DetailModal({ pgm, onClose }) {
  if (!pgm) return null
  const mq = getMaquina(pgm.espessura_mm)
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title mono" style={{ color: 'var(--green)' }}>{pgm.pgm}</span>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              ['PGM', pgm.pgm], ['Commessa', pgm.commessa],
              ['Espessura', pgm.espessura_mm ? `${pgm.espessura_mm} mm` : '—'],
              ['Máquina', mq || '—'], ['Peso', pgm.peso_kg ? `${pgm.peso_kg} kg` : '—'],
              ['Material', pgm.material || '—'], ['CR', pgm.cr || '—'],
              ['Fornecedor', pgm.fornecedor || '—'], ['Revisão', pgm.rev || '—'],
              ['Data de Emissão', pgm.data_emissao || '—'],
              ['Início do Corte', pgm.data_inicio_corte ? format(new Date(pgm.data_inicio_corte), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '—'],
              ['Finalizado em', pgm.data_corte ? format(new Date(pgm.data_corte), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '—'],
            ].map(([k, v]) => (
              <div key={k}>
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

export default function Arquivados() {
  const toast = useToast()
  const [pgms, setPgms] = useState([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState(null)
  const [filters, setFilters] = useState(EMPTY_FILTERS)

  useEffect(() => {
    const q = query(collection(db, 'pgms'), where('status', '==', 'Cortado'))
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      data.sort((a, b) => (b.data_corte || '') > (a.data_corte || '') ? 1 : -1)
      setPgms(data)
      setLoading(false)
    })
    return unsub
  }, [])

  const filtered = useMemo(() => pgms.filter(p => {
    if (filters.search) {
      const q = filters.search.toLowerCase()
      if (!p.pgm?.toLowerCase().includes(q) && !p.commessa?.toLowerCase().includes(q)) return false
    }
    if (filters.commessa && !p.commessa?.toLowerCase().includes(filters.commessa.toLowerCase())) return false
    const mq = getMaquina(p.espessura_mm)
    if (filters.maquina && mq !== filters.maquina) return false
    if (filters.dataFrom && p.data_corte && p.data_corte.slice(0,10) < filters.dataFrom) return false
    if (filters.dataTo && p.data_corte && p.data_corte.slice(0,10) > filters.dataTo) return false
    return true
  }), [pgms, filters])

  const handleReativar = async (pgm) => {
    await updateDoc(doc(db, 'pgms', pgm.id), { status: 'Aguardando Corte', data_corte: null, data_inicio_corte: null })
    toast(`${pgm.pgm} reativado.`, 'info')
  }

  const totalPeso = filtered.reduce((s, p) => s + (Number(p.peso_kg) || 0), 0)
  const exportData = filtered.map(p => ({ ...p, maquina: getMaquina(p.espessura_mm) }))

  return (
    <div style={{ padding: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700' }}>Arquivados</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
            {filtered.length} PGM{filtered.length !== 1 ? 's' : ''} cortados
            {totalPeso > 0 && ` · ${totalPeso.toFixed(1)} kg total`}
          </p>
        </div>
        <button className="btn btn-ghost" onClick={() => exportPGMs(exportData, { ...filters, status: 'Cortado' })}>
          <Download size={14} /> Exportar XLSX
        </button>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <FilterBar filters={filters} onChange={setFilters} onClear={() => setFilters(EMPTY_FILTERS)} showStatus={false} />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><span className="spinner" style={{ width: 28, height: 28 }} /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><Archive size={44} /><p>Nenhum PGM arquivado encontrado</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>PGM</th><th>Commessa</th><th>Máquina</th><th>Peso (kg)</th><th>Material</th><th>Início Corte</th><th>Finalizado em</th><th>Ações</th></tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const mq = getMaquina(p.espessura_mm)
                  return (
                    <tr key={p.id}>
                      <td className="mono" style={{ color: 'var(--green)', fontWeight: '600' }}>{p.pgm}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{p.commessa}</td>
                      <td>{mq ? <span className={`badge badge-${mq.toLowerCase()}`}>{mq}</span> : '—'}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{p.peso_kg ?? '—'}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{p.material || '—'}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                        {p.data_inicio_corte ? format(new Date(p.data_inicio_corte), "dd/MM/yy HH:mm", { locale: ptBR }) : '—'}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                        {p.data_corte ? format(new Date(p.data_corte), "dd/MM/yy HH:mm", { locale: ptBR }) : '—'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button className="btn-icon" title="Ver" onClick={() => setDetail(p)}><Eye size={13} /></button>
                          <button className="btn-icon" style={{ color: 'var(--yellow)', borderColor: 'rgba(234,179,8,0.3)' }} title="Reativar" onClick={() => handleReativar(p)}><RotateCcw size={13} /></button>
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
      <DetailModal pgm={detail} onClose={() => setDetail(null)} />
    </div>
  )
}
