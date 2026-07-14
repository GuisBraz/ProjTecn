import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const INITIAL = {
  pgm: '', commessa: '', espessura_mm: '', peso_kg: '',
  data_emissao: '', rev: '00', material: '',
  cr: '', observacoes: '', cortes: 1, tempo_corte_estimado_horas: 4,
}

// mode="full" (padrão) — Programador/Gestão cadastram e editam tudo.
// mode="cr" — Operador de Máquina só preenche/edita o CR (código de rastreio da chapa).
export default function PGMModal({ open, onClose, onSave, initial, mode = 'full' }) {
  const [form, setForm] = useState(INITIAL)
  const [saving, setSaving] = useState(false)
  const crOnly = mode === 'cr'

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
        observacoes: initial.observacoes || '',
        tempo_corte_estimado_horas: initial.tempo_corte_estimado_horas ?? 4,
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
    if (crOnly) {
      await onSave({ cr: form.cr.trim() || null })
      setSaving(false)
      return
    }
    const payload = {
      pgm: form.pgm.trim(),
      commessa: form.commessa.trim(),
      espessura_mm: form.espessura_mm ? parseFloat(form.espessura_mm) : null,
      peso_kg: form.peso_kg ? parseFloat(form.peso_kg) : null,
      data_emissao: form.data_emissao || null,
      rev: form.rev,
      material: form.material.trim() || null,
      cr: form.cr.trim() || null,
      observacoes: form.observacoes.trim() || null,
      tempo_corte_estimado_horas: Math.max(0.5, parseFloat(form.tempo_corte_estimado_horas) || 4),
    }
    // Quantidade de cortes só faz sentido no cadastro (a página desdobra em N PGMs)
    if (!initial) payload.cortes = Math.max(1, Math.min(20, parseInt(form.cortes, 10) || 1))
    await onSave(payload)
    setSaving(false)
  }

  if (crOnly) {
    return (
      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="modal" style={{ maxWidth: '420px' }}>
          <div className="modal-header">
            <span className="modal-title">Código de Rastreio (CR)</span>
            <button className="btn-icon" onClick={onClose}><X size={16} /></button>
          </div>
          <div className="modal-body">
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>PGM</div>
              <div className="mono" style={{ color: 'var(--accent)', fontWeight: '600', fontSize: '14px' }}>{initial?.pgm}</div>
            </div>
            <div className="form-group">
              <label className="form-label">CR — Código de Rastreio da Chapa</label>
              <input className="form-input" placeholder="Ex: CR-001" autoFocus
                value={form.cr} onChange={e => set('cr', e.target.value)} />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Salvando…</> : 'Salvar CR'}
            </button>
          </div>
        </div>
      </div>
    )
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

            {/* Material + CR + Tempo de Corte */}
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
                <label className="form-label">Tempo de Corte Estimado (h)</label>
                <input className="form-input" type="number" min="0.5" step="0.5"
                  title="Usado para calcular a Fila e a Programação automaticamente"
                  value={form.tempo_corte_estimado_horas} onChange={e => set('tempo_corte_estimado_horas', e.target.value)} />
              </div>
            </div>

            {/* Data emissão + Rev + Cortes */}
            <div className="form-grid form-grid-3">
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
              {!initial && (
                <div className="form-group">
                  <label className="form-label">Qtd. de cortes</label>
                  <input className="form-input" type="number" min="1" max="20" step="1"
                    title="Quantas vezes este PGM precisa ser cortado. Acima de 1, ele é desdobrado em PGM-1, PGM-2…"
                    value={form.cortes} onChange={e => set('cortes', e.target.value)} />
                </div>
              )}
            </div>
            {!initial && parseInt(form.cortes, 10) > 1 && form.pgm.trim() && (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '-8px' }}>
                Será cadastrado como:{' '}
                <span className="mono" style={{ color: 'var(--accent)' }}>
                  {Array.from({ length: Math.min(parseInt(form.cortes, 10) || 1, 20) }, (_, i) => `${form.pgm.trim()}-${i + 1}`).join(', ')}
                </span>
              </div>
            )}

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
