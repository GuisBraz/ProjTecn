import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const INITIAL = {
  numero_op: '', numero_produto: '', commessa: '', desenho: '',
  descricao: '', quantidade: '', peso: '', data_inicio: '', previsao_termino: '',
}

export default function OPModal({ open, onClose, onSave, initial, empreiteiraNome }) {
  const [form, setForm] = useState(INITIAL)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (initial) {
      setForm({
        numero_op: initial.numero_op || '',
        numero_produto: initial.numero_produto || '',
        commessa: initial.commessa || '',
        desenho: initial.desenho || '',
        descricao: initial.descricao || '',
        quantidade: initial.quantidade ?? '',
        peso: initial.peso ?? '',
        data_inicio: initial.data_inicio || '',
        previsao_termino: initial.previsao_termino || '',
      })
    } else {
      setForm(INITIAL)
    }
  }, [initial, open])

  if (!open) return null

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    const payload = {
      numero_op: form.numero_op.trim(),
      numero_produto: form.numero_produto.trim(),
      commessa: form.commessa.trim(),
      desenho: form.desenho.trim(),
      descricao: form.descricao.trim(),
      quantidade: form.quantidade ? parseFloat(form.quantidade) : null,
      peso: form.peso ? parseFloat(form.peso) : null,
      data_inicio: form.data_inicio || null,
      previsao_termino: form.previsao_termino || null,
    }
    await onSave(payload)
    setSaving(false)
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">
            {initial ? 'Editar OP' : 'Nova Ordem de Produção'}
            {empreiteiraNome && (
              <span style={{ color: 'var(--text-muted)', fontWeight: '400', fontSize: '12px', marginLeft: '8px' }}>
                · {empreiteiraNome}
              </span>
            )}
          </span>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="form-grid" style={{ gap: '20px' }}>

            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">Número da OP *</label>
                <input className="form-input mono" placeholder="Ex: OP-2025-014"
                  value={form.numero_op} onChange={(e) => set('numero_op', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Número do Produto</label>
                <input className="form-input" placeholder="Ex: PR-3321"
                  value={form.numero_produto} onChange={(e) => set('numero_produto', e.target.value)} />
              </div>
            </div>

            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">Commessa *</label>
                <input className="form-input" placeholder="Ex: 2025-006"
                  value={form.commessa} onChange={(e) => set('commessa', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Desenho</label>
                <input className="form-input" placeholder="Ex: DES-1182-A"
                  value={form.desenho} onChange={(e) => set('desenho', e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Descrição</label>
              <input className="form-input" placeholder="Descrição do item/peça"
                value={form.descricao} onChange={(e) => set('descricao', e.target.value)} />
            </div>

            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">Quantidade</label>
                <input className="form-input" type="number" min="0" step="1"
                  value={form.quantidade} onChange={(e) => set('quantidade', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Peso (kg)</label>
                <input className="form-input" type="number" min="0" step="0.01"
                  value={form.peso} onChange={(e) => set('peso', e.target.value)} />
              </div>
            </div>

            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">Data de Início</label>
                <input className="form-input" type="date"
                  value={form.data_inicio} onChange={(e) => set('data_inicio', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Previsão de Término *</label>
                <input className="form-input" type="date"
                  value={form.previsao_termino} onChange={(e) => set('previsao_termino', e.target.value)} />
              </div>
            </div>

          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || !form.numero_op.trim() || !form.commessa.trim()}
          >
            {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Salvando…</> : (initial ? 'Salvar Alterações' : 'Cadastrar OP')}
          </button>
        </div>
      </div>
    </div>
  )
}
