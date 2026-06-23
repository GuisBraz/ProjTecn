import React, { useEffect, useState } from 'react'
import { useAuth } from '../../lib/auth'
import { canManageEmpreiteiras } from '../../lib/permissions'
import { listenEmpreiteiras, criarEmpreiteira, renomearEmpreiteira, desativarEmpreiteira, reativarEmpreiteira } from '../../lib/empreiteiras'
import { useToast } from '../../lib/toast'
import { Factory, Plus, Pencil, EyeOff, Eye, Check, X } from 'lucide-react'

export default function GerenciarEmpreiteiras() {
  const { profile } = useAuth()
  const toast = useToast()
  const podeGerenciar = canManageEmpreiteiras(profile?.role)

  const [empreiteiras, setEmpreiteiras] = useState([])
  const [loading, setLoading] = useState(true)
  const [novoNome, setNovoNome] = useState('')
  const [editandoId, setEditandoId] = useState(null)
  const [editNome, setEditNome] = useState('')

  useEffect(() => {
    const unsub = listenEmpreiteiras((lista) => {
      setEmpreiteiras(lista)
      setLoading(false)
    })
    return unsub
  }, [])

  const handleCriar = async (e) => {
    e.preventDefault()
    if (!novoNome.trim()) return
    try {
      await criarEmpreiteira(novoNome)
      setNovoNome('')
      toast?.('Empreiteira cadastrada.', 'success')
    } catch {
      toast?.('Não foi possível cadastrar.', 'error')
    }
  }

  const handleRenomear = async (id) => {
    if (!editNome.trim()) return
    try {
      await renomearEmpreiteira(id, editNome)
      setEditandoId(null)
      toast?.('Nome atualizado.', 'success')
    } catch {
      toast?.('Não foi possível renomear.', 'error')
    }
  }

  const toggleAtivo = async (emp) => {
    try {
      if (emp.ativo) await desativarEmpreiteira(emp.id)
      else await reativarEmpreiteira(emp.id)
    } catch {
      toast?.('Não foi possível atualizar.', 'error')
    }
  }

  if (loading) {
    return <div style={{ padding: '32px' }}><span className="spinner" /></div>
  }

  const ativas = empreiteiras.filter((e) => e.ativo)
  const inativas = empreiteiras.filter((e) => !e.ativo)

  return (
    <div style={{ padding: '32px', maxWidth: '720px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>Empreiteiras</h1>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', marginBottom: '24px' }}>
        Cadastro das empresas terceirizadas que recebem ordens de produção.
      </p>

      {ativas.length === 0 && !podeGerenciar && (
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          Nenhuma empreiteira cadastrada ainda.
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {ativas.map((emp) => (
          <div key={emp.id} className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
              background: 'var(--accent-dim)', border: '1px solid rgba(249,115,22,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Factory size={16} color="var(--accent)" />
            </div>

            {editandoId === emp.id ? (
              <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
                <input className="form-input" value={editNome} onChange={(e) => setEditNome(e.target.value)} autoFocus />
                <button className="btn btn-ghost" onClick={() => handleRenomear(emp.id)}><Check size={14} /></button>
                <button className="btn btn-ghost" onClick={() => setEditandoId(null)}><X size={14} /></button>
              </div>
            ) : (
              <span style={{ flex: 1, fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                {emp.nome}
              </span>
            )}

            {podeGerenciar && editandoId !== emp.id && (
              <div style={{ display: 'flex', gap: '4px' }}>
                <button className="btn btn-ghost" onClick={() => { setEditandoId(emp.id); setEditNome(emp.nome) }} title="Renomear">
                  <Pencil size={14} />
                </button>
                <button className="btn btn-ghost" onClick={() => toggleAtivo(emp)} title="Desativar">
                  <EyeOff size={14} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {podeGerenciar && (
        <>
          <form onSubmit={handleCriar} style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
            <input
              className="form-input"
              placeholder="Nome da nova empreiteira (ex: 1ª Empreiteira)"
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
            />
            <button className="btn btn-primary" type="submit"><Plus size={14} /> Adicionar</button>
          </form>

          {inativas.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Desativadas
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {inativas.map((emp) => (
                  <div key={emp.id} className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: 0.6 }}>
                    <span style={{ fontSize: '13px' }}>{emp.nome}</span>
                    <button className="btn btn-ghost" onClick={() => toggleAtivo(emp)} title="Reativar">
                      <Eye size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
