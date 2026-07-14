import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { Zap, AlertCircle, CheckCircle } from 'lucide-react'

const ACCESS_CODES = ['01001', '01011', '01100', '01101']

export default function Login() {
  const { user, signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [accessCode, setAccessCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [mode, setMode] = useState('login')

  // Redireciona automaticamente assim que o Firebase confirma o usuário autenticado
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true })
    }
  }, [user, navigate])

  const handle = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      if (mode === 'signup') {
        if (!ACCESS_CODES.includes(accessCode)) {
          setError('Código de acesso inválido. Confira com a gestão.')
          setLoading(false)
          return
        }
        await signUp(email, password, accessCode, displayName)
        setSuccess('Conta criada com sucesso! Faça login agora.')
        setMode('login')
      } else {
        await signIn(email, password)
      }
    } catch (err) {
      const msgs = {
        'auth/user-not-found': 'Usuário não encontrado.',
        'auth/wrong-password': 'Senha incorreta.',
        'auth/invalid-credential': 'E-mail ou senha incorretos.',
        'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
        'auth/weak-password': 'Senha muito fraca. Use pelo menos 6 caracteres.',
        'auth/invalid-email': 'E-mail inválido.',
        'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos.',
        'auth/invalid-access-code': 'Código de acesso inválido. Confira com a gestão.',
      }
      setError(msgs[err.code] || err.message)
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: 'var(--app-height)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg-0)', padding: '20px'
    }}>
      <div style={{ width: '100%', maxWidth: '380px' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '52px', height: '52px', borderRadius: '14px',
            background: 'var(--accent-dim)', border: '1px solid rgba(249,115,22,0.3)',
            marginBottom: '16px'
          }}>
            <Zap size={24} color="var(--accent)" />
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>Carga Máquina</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>Gestão de Produção em Tempo Real</p>
        </div>

        <div className="card" style={{ padding: '28px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '20px', color: 'var(--text-primary)' }}>
            {mode === 'login' ? 'Entrar na conta' : 'Criar nova conta'}
          </h2>
          <form onSubmit={handle} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {mode === 'signup' && (
              <div className="form-group">
                <label className="form-label">Seu nome</label>
                <input className="form-input" type="text" placeholder="Como você quer aparecer no sistema"
                  value={displayName} onChange={e => setDisplayName(e.target.value)} required />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input className="form-input" type="email" placeholder="seu@email.com"
                value={email} onChange={e => setEmail(e.target.value)} required autoFocus={mode === 'login'} />
            </div>
            <div className="form-group">
              <label className="form-label">Senha</label>
              <input className="form-input" type="password" placeholder="mínimo 6 caracteres"
                value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>
            {mode === 'signup' && (
              <div className="form-group">
                <label className="form-label">Código de acesso</label>
                <input className="form-input" type="text" placeholder="Fornecido pela gestão da fábrica"
                  value={accessCode} onChange={e => setAccessCode(e.target.value.trim())} required maxLength={5} />
              </div>
            )}

            {error && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 12px',
                borderRadius: 'var(--radius)', background: 'var(--red-dim)', color: 'var(--red)',
                border: '1px solid rgba(239,68,68,0.25)', fontSize: '13px'
              }}>
                <AlertCircle size={14} style={{ marginTop: '1px', flexShrink: 0 }} />
                {error}
              </div>
            )}

            {success && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px',
                borderRadius: 'var(--radius)', background: 'var(--green-dim)', color: 'var(--green)',
                border: '1px solid rgba(34,197,94,0.25)', fontSize: '13px'
              }}>
                <CheckCircle size={14} /> {success}
              </div>
            )}

            <button className="btn btn-primary" type="submit" disabled={loading}
              style={{ marginTop: '4px', justifyContent: 'center', padding: '11px' }}>
              {loading
                ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Aguarde…</>
                : mode === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
            {mode === 'login' ? (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Primeiro acesso?{' '}
                <button onClick={() => { setMode('signup'); setError(''); setSuccess('') }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontWeight: '600' }}>
                  Criar conta
                </button>
              </p>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Já tem conta?{' '}
                <button onClick={() => { setMode('login'); setError(''); setSuccess('') }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontWeight: '600' }}>
                  Fazer login
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
