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
import Arquivados from './pages/Arquivados'
import CargaFabricaDashboard from './pages/fabrica/CargaFabricaDashboard'
import OPsList from './pages/fabrica/OPsList'
import GerenciarEmpreiteiras from './pages/fabrica/GerenciarEmpreiteiras'

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
                <Route path="/maquina/arquivados" element={<PrivateRoute module="cargaMaquina"><Arquivados /></PrivateRoute>} />

                {/* Carga Fábrica */}
                <Route path="/fabrica" element={<PrivateRoute module="cargaFabrica"><CargaFabricaDashboard /></PrivateRoute>} />
                <Route path="/fabrica/ativas" element={<PrivateRoute module="cargaFabrica"><OPsList arquivado={false} /></PrivateRoute>} />
                <Route path="/fabrica/ativas/:empreiteiraId" element={<PrivateRoute module="cargaFabrica"><OPsList arquivado={false} /></PrivateRoute>} />
                <Route path="/fabrica/arquivadas" element={<PrivateRoute module="cargaFabrica"><OPsList arquivado={true} /></PrivateRoute>} />
                <Route path="/fabrica/arquivadas/:empreiteiraId" element={<PrivateRoute module="cargaFabrica"><OPsList arquivado={true} /></PrivateRoute>} />

                {/* Sistema */}
                <Route path="/empreiteiras" element={<PrivateRoute module="cargaFabrica"><GerenciarEmpreiteiras /></PrivateRoute>} />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </I18nProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}
