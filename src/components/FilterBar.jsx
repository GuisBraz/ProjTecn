import React from 'react'
import { Search, X } from 'lucide-react'

export default function FilterBar({ filters, onChange, onClear, showStatus = true }) {
  const set = (k, v) => onChange({ ...filters, [k]: v })
  const hasFilters = Object.values(filters).some(v => v)

  return (
    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
      {/* Search */}
      <div style={{ position: 'relative', flex: '1', minWidth: '180px' }}>
        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          className="form-input"
          style={{ paddingLeft: '32px' }}
          placeholder="Buscar PGM, Commessa…"
          value={filters.search || ''}
          onChange={e => set('search', e.target.value)}
        />
      </div>

      {/* Commessa */}
      <div style={{ minWidth: '140px' }}>
        <input
          className="form-input"
          placeholder="Commessa"
          value={filters.commessa || ''}
          onChange={e => set('commessa', e.target.value)}
        />
      </div>

      {/* Máquina */}
      <select className="form-select" style={{ minWidth: '130px' }}
        value={filters.maquina || ''} onChange={e => set('maquina', e.target.value)}>
        <option value="">Todas as máquinas</option>
        <option value="PLASMA">Plasma</option>
        <option value="OXICORTE">Oxicorte</option>
      </select>

      {/* Status */}
      {showStatus && (
        <select className="form-select" style={{ minWidth: '160px' }}
          value={filters.status || ''} onChange={e => set('status', e.target.value)}>
          <option value="">Todos os status</option>
          <option value="Aguardando Corte">Aguardando Corte</option>
          <option value="Em Corte">Em Corte</option>
          <option value="Cortado">Cortado</option>
        </select>
      )}

      {/* Data início */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <input className="form-input" type="date" style={{ minWidth: '140px' }}
          title="Data de emissão — de"
          value={filters.dataFrom || ''} onChange={e => set('dataFrom', e.target.value)} />
        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>até</span>
        <input className="form-input" type="date" style={{ minWidth: '140px' }}
          title="Data de emissão — até"
          value={filters.dataTo || ''} onChange={e => set('dataTo', e.target.value)} />
      </div>

      {/* Clear */}
      {hasFilters && (
        <button className="btn btn-ghost btn-sm" onClick={onClear} style={{ whiteSpace: 'nowrap' }}>
          <X size={12} /> Limpar filtros
        </button>
      )}
    </div>
  )
}
