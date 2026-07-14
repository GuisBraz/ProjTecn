import React, { useState, useRef } from 'react'
import { X, Upload, FileSpreadsheet, AlertTriangle, Download } from 'lucide-react'
import { parsePGMsFromFile, downloadModelo } from '../lib/importXLSX'

export default function ImportModal({ open, onClose, onImport }) {
  const fileRef = useRef(null)
  const [preview, setPreview] = useState(null) // { pgms, erros, fileName }
  const [importing, setImporting] = useState(false)

  if (!open) return null

  const handleFile = async (file) => {
    if (!file) return
    try {
      const { pgms, erros } = await parsePGMsFromFile(file)
      setPreview({ pgms, erros, fileName: file.name })
    } catch {
      setPreview({ pgms: [], erros: ['Não foi possível ler o arquivo. Confira se é um .xlsx válido.'], fileName: file.name })
    }
  }

  const handleConfirm = async () => {
    setImporting(true)
    await onImport(preview.pgms)
    setImporting(false)
    setPreview(null)
  }

  const reset = () => { setPreview(null); onClose() }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && reset()}>
      <div className="modal" style={{ maxWidth: '560px' }}>
        <div className="modal-header">
          <span className="modal-title">Importar PGMs via Excel</span>
          <button className="btn-icon" onClick={reset}><X size={16} /></button>
        </div>
        <div className="modal-body">
          {!preview ? (
            <>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Envie um arquivo .xlsx com uma linha por PGM. Use a coluna <b>CORTES</b> quando o
                mesmo PGM precisar ser cortado mais de uma vez — ele será desdobrado
                automaticamente (ex.: CORTES=2 gera <span className="mono">PGM-0001-1</span> e <span className="mono">PGM-0001-2</span>).
              </p>
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]) }}
                style={{
                  border: '2px dashed var(--border-light)', borderRadius: 'var(--radius-lg)',
                  padding: '36px 20px', textAlign: 'center', cursor: 'pointer',
                  color: 'var(--text-muted)', marginBottom: '14px',
                }}
              >
                <FileSpreadsheet size={32} style={{ opacity: 0.4, marginBottom: '8px' }} />
                <div style={{ fontSize: '13px' }}>Clique ou arraste o arquivo .xlsx aqui</div>
              </div>
              <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }}
                onChange={(e) => handleFile(e.target.files?.[0])} />
              <button className="btn btn-ghost btn-sm" onClick={downloadModelo}>
                <Download size={13} /> Baixar planilha modelo
              </button>
            </>
          ) : (
            <>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                <b>{preview.fileName}</b> — {preview.pgms.length} PGM{preview.pgms.length !== 1 ? 's' : ''} pronto{preview.pgms.length !== 1 ? 's' : ''} para importar
                {preview.erros.length > 0 && `, ${preview.erros.length} linha${preview.erros.length !== 1 ? 's' : ''} com problema`}
              </div>
              {preview.erros.length > 0 && (
                <div style={{
                  background: 'var(--yellow-dim)', border: '1px solid rgba(245,158,11,0.3)',
                  borderRadius: 'var(--radius)', padding: '10px 12px', marginBottom: '12px',
                  fontSize: '12px', color: 'var(--yellow)', maxHeight: '110px', overflowY: 'auto',
                }}>
                  <AlertTriangle size={12} style={{ verticalAlign: '-1px', marginRight: '4px' }} />
                  Linhas ignoradas:
                  <ul style={{ margin: '6px 0 0 18px' }}>
                    {preview.erros.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}
              {preview.pgms.length > 0 && (
                <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                  <table>
                    <thead><tr><th>PGM</th><th>Commessa</th><th>Esp.</th><th>Peso</th></tr></thead>
                    <tbody>
                      {preview.pgms.slice(0, 60).map((p, i) => (
                        <tr key={i}>
                          <td className="mono" style={{ color: 'var(--accent)', fontSize: '12px' }}>{p.pgm}</td>
                          <td style={{ fontSize: '12px' }}>{p.commessa}</td>
                          <td style={{ fontSize: '12px' }}>{p.espessura_mm ?? '—'}</td>
                          <td style={{ fontSize: '12px' }}>{p.peso_kg ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {preview.pgms.length > 60 && (
                    <div style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      … e mais {preview.pgms.length - 60}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        <div className="modal-footer">
          {preview && <button className="btn btn-ghost" onClick={() => setPreview(null)}>Voltar</button>}
          <button className="btn btn-ghost" onClick={reset}>Cancelar</button>
          {preview && preview.pgms.length > 0 && (
            <button className="btn btn-primary" onClick={handleConfirm} disabled={importing}>
              {importing
                ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Importando…</>
                : <><Upload size={14} /> Importar {preview.pgms.length}</>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
