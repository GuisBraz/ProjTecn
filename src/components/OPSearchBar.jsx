import React from 'react'
import { Search, X } from 'lucide-react'

export default function OPSearchBar({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
      <div style={{ position: 'relative', flex: 1, maxWidth: '420px' }}>
        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          className="form-input"
          style={{ paddingLeft: '32px' }}
          placeholder="Buscar por N° da OP, Commessa ou Desenho…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      {value && (
        <button className="btn btn-ghost btn-sm" onClick={() => onChange('')}>
          <X size={12} /> Limpar
        </button>
      )}
    </div>
  )
}
