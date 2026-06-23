import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const INITIAL = {
  pgm: '', commessa: '', espessura_mm: '', peso_kg: '',
  data_emissao: '', rev: '00', material: '',
  cr: '', fornecedor: '', observacoes: ''
}

export default function PGMModal({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState(INITIAL)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (initial) {
      setForm({
        pgm: initial.pgm || '',
        commessa: initial.commessa || '',
        espessura_mm: initial.espessura_mm ?? '',
        peso_kg: initial.peso_kg ?? '',
        data_emissao: initial.data_emissao || '',
        rev: initial.rev || '00',
        material: initial.material || '',
        cr: initial.cr || '',
        fornecedor: initial.fornecedor || '',
        observacoes: initial.observacoes || '',
      })
    } else {
      setForm(INITIAL)
    }
  }, [initial, open])

  if (!open) return null

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const maquinaPreview = () => {
    const e = parseFloat(form.espessura_mm)
    if (!e || e === 0) return null
    return e < 23 ? 'PLASMA' : 'OXICORTE'
  }

  const mq = maquinaPreview()

  const handleSave = async () => {
    setSaving(true)
    const payload = {
      pgm: form.pgm.trim(),
      commessa: form.commessa.trim(),
      espessura_mm: form.espessura_mm ? parseFloat(form.espessura_mm) : null,
      peso_kg: form.peso_kg ? parseFloat(form.peso_kg) : null,
      data_emissao: form.data_emissao || null,
      rev: form.rev,
      material: form.material.trim() || null,
      cr: form.cr.trim() || null,
      fornecedor: form.fornecedor.trim() || null,
      observacoes: form.observacoes.trim() || null,
    }
    await onSave(payload)
    setSaving(false)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{initial ? 'Editar PGM' : 'Novo Plano de Corte'}</span>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="form-grid" style={{ gap: '20px' }}>

            {/* PGM + Commessa */}
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">PGM *</label>
                <input className="form-input mono" placeholder="Ex: PGM-2025-001"
                  value={form.pgm} onChange={e => set('pgm', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Commessa *</label>
                <input className="form-input" placeholder="Ex: 2025-006"
                  value={form.commessa} onChange={e => set('commessa', e.target.value)} />
              </div>
            </div>

            {/* Espessura + Máquina preview + Peso */}
            <div className="form-grid form-grid-3">
              <div className="form-group">
                <label className="form-label">Espessura (mm)</label>
                <input className="form-input" type="number" min="0" step="0.1"
                  placeholder="Ex: 12.5"
                  value={form.espessura_mm} onChange={e => set('espessura_mm', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Máquina (auto)</label>
                <div style={{
                  padding: '9px 12px', borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-0)',
                  color: mq === 'PLASMA' ? 'var(--plasma)' : mq === 'OXICORTE' ? 'var(--oxicorte)' : 'var(--text-muted)',
                  fontSize: '13px', fontWeight: mq ? '600' : '400'
                }}>
                  {mq || '—'}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Peso (kg)</label>
                <input className="form-input" type="number" min="0" step="0.01"
                  placeholder="Ex: 125.50"
                  value={form.peso_kg} onChange={e => set('peso_kg', e.target.value)} />
              </div>
            </div>

            {/* Material + CR + Fornecedor */}
            <div className="form-grid form-grid-3">
              <div className="form-group">
                <label className="form-label">Material</label>
                <input className="form-input" placeholder="Ex: ASTM A36"
                  value={form.material} onChange={e => set('material', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">CR</label>
                <input className="form-input" placeholder="Ex: CR-001"
                  value={form.cr} onChange={e => set('cr', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Fornecedor</label>
                <input className="form-input" placeholder="Ex: Açominas"
                  value={form.fornecedor} onChange={e => set('fornecedor', e.target.value)} />
              </div>
            </div>

            {/* Data emissão + Rev */}
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">Data de Emissão</label>
                <input className="form-input" type="date"
                  value={form.data_emissao} onChange={e => set('data_emissao', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Revisão</label>
                <input className="form-input" placeholder="00"
                  value={form.rev} onChange={e => set('rev', e.target.value)} />
              </div>
            </div>

            {/* Observações */}
            <div className="form-group">
              <label className="form-label">Observações</label>
              <textarea className="form-textarea" placeholder="Notas adicionais…"
                value={form.observacoes} onChange={e => set('observacoes', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || !form.pgm.trim() || !form.commessa.trim()}
          >
            {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Salvando…</> : (initial ? 'Salvar Alterações' : 'Cadastrar PGM')}
          </button>
        </div>
      </div>
    </div>
  )
}
