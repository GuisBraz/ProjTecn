import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import { ToastProvider } from './lib/toast'
import { ThemeProvider } from './lib/theme'
import { I18nProvider } from './lib/i18n'
import { can } from './lib/permissions'
import Layout from './components/Layout'
import Login from './pages/Login'
import Home from './pages/Home'
import Configuracoes from './pages/Configuracoes'
import Dashboard from './pages/Dashboard'
import PGMsAtivos from './pages/PGMsAtivos'
import Finalizados from './pages/Finalizados'
import ProgramacaoCorte from './pages/ProgramacaoCorte'
import Fila from './pages/Fila'
import ModoTV from './pages/ModoTV'

function FullScreenSpinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'var(--app-height)' }}>
      <span className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  )
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <FullScreenSpinner />
  return user ? <Navigate to="/" replace /> : children
}

function PrivateRoute({ children, module }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <FullScreenSpinner />
  if (!user) return <Navigate to="/login" replace />
  // Se a rota exige um módulo específico e o papel do usuário não tem acesso, manda pra Home.
  if (module && !can(profile?.role, module, 'view')) return <Navigate to="/" replace />
  return <Layout>{children}</Layout>
}

// Igual à PrivateRoute, mas sem o Layout (sem sidebar) — usada pelo Modo TV
function FullscreenRoute({ children, module }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <FullScreenSpinner />
  if (!user) return <Navigate to="/login" replace />
  if (module && !can(profile?.role, module, 'view')) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <I18nProvider>
          <ToastProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

                <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
                <Route path="/configuracoes" element={<PrivateRoute><Configuracoes /></PrivateRoute>} />

                {/* Carga Máquina */}
                <Route path="/maquina" element={<PrivateRoute module="cargaMaquina"><Dashboard /></PrivateRoute>} />
                <Route path="/maquina/pgms" element={<PrivateRoute module="cargaMaquina"><PGMsAtivos /></PrivateRoute>} />
                <Route path="/maquina/programacao" element={<PrivateRoute module="cargaMaquina"><ProgramacaoCorte /></PrivateRoute>} />
                <Route path="/maquina/fila" element={<PrivateRoute module="cargaMaquina"><Fila /></PrivateRoute>} />
                <Route path="/maquina/finalizados" element={<PrivateRoute module="cargaMaquina"><Finalizados /></PrivateRoute>} />
                {/* Modo TV: tela cheia, sem sidebar */}
                <Route path="/tv" element={<FullscreenRoute module="cargaMaquina"><ModoTV /></FullscreenRoute>} />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </I18nProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}
