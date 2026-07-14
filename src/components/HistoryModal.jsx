import React, { useEffect, useState } from 'react'
import { X, History } from 'lucide-react'
import { fetchLogsForPgm } from '../lib/auditLog'

const ACTION_COLORS = {
  'criou': 'var(--green)',
  'editou': 'var(--blue)',
  'excluiu': 'var(--red)',
  'iniciou corte': 'var(--blue)',
  'finalizou corte': 'var(--green)',
  'reativou': 'var(--yellow)',
  'programou': 'var(--purple)',
  'removeu da programação': 'var(--yellow)',
  'salvou CR': 'var(--accent)',
}

export default function HistoryModal({ pgm, onClose }) {
  const [logs, setLogs] = useState(null)

  useEffect(() => {
    if (!pgm) { setLogs(null); return }
    fetchLogsForPgm(pgm.id)
      .then(setLogs)
      .catch(() => setLogs([]))
  }, [pgm])

  if (!pgm) return null

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <span className="modal-title">
            <History size={15} style={{ verticalAlign: '-2px', marginRight: '6px' }} />
            Histórico — <span className="mono" style={{ color: 'var(--accent)' }}>{pgm.pgm}</span>
          </span>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body" style={{ maxHeight: '420px', overflowY: 'auto' }}>
          {logs === null ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '30px' }}>
              <span className="spinner" style={{ width: 22, height: 22 }} />
            </div>
          ) : logs.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
              Nenhum registro de alteração ainda.
              <br /><span style={{ fontSize: '11px' }}>(O histórico passou a ser gravado a partir desta versão.)</span>
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {logs.map((l) => (
                <div key={l.id} style={{
                  display: 'flex', gap: '10px', padding: '10px 4px',
                  borderBottom: '1px solid var(--border)', alignItems: 'flex-start',
                }}>
                  <span style={{
                    width: '8px', height: '8px', borderRadius: '50%', marginTop: '5px', flexShrink: 0,
                    background: ACTION_COLORS[l.action] || 'var(--text-muted)',
                  }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                      <b>{l.userName}</b> {l.action}
                      {l.details && <span style={{ color: 'var(--text-muted)' }}> · {l.details}</span>}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {l.at?.seconds
                        ? new Date(l.at.seconds * 1000).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="modal-footer"><button className="btn btn-ghost" onClick={onClose}>Fechar</button></div>
      </div>
    </div>
  )
}
