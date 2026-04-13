import './styles/admin.css'
import './styles/auth.css'
import './styles/base.css'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import AdminLayout from './components/layout/AdminLayout'
import Login from './pages/Login'
import Account from './pages/admin/Account'
import Categories from './pages/admin/Categories'
import Clients from './pages/admin/Clients'
import Commandes from './pages/admin/Commandes'
import Dashboard from './pages/admin/Dashboard'
import EntreeStock from './pages/admin/EntreeStock'
import Fournisseurs from './pages/admin/Fournisseurs'
import Placeholder from './pages/admin/Placeholder'
import Prix from './pages/admin/Prix'
import Produits from './pages/admin/Produits'
import Promotions from './pages/admin/Promotions'
import SortieStock from './pages/admin/SortieStock'
import Stock from './pages/admin/Stock'
import SubCategories from './pages/admin/SubCategories'
import Ventes from './pages/admin/Ventes'

function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <div className="page">Loading…</div>

  if ((user?.role?.nom || '') === 'admin') return <Navigate to="/admin/produits" replace />

  return <Navigate to="/login" replace />
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/acount" element={<Navigate to="/admin/account" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="produits" replace />} />
          <Route path="account" element={<Account />} />
          <Route path="acount" element={<Navigate to="/admin/account" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="commandes" element={<Commandes />} />
          <Route path="produits" element={<Produits />} />
          <Route path="categories" element={<Categories />} />
          <Route path="categories/:categoryId" element={<SubCategories />} />

          {/* ── GESTION DE TRAVAIL ── */}
          <Route path="fournisseurs" element={<Fournisseurs />} />
          <Route path="clients" element={<Clients />} />
          <Route path="stock" element={<Stock />} />
          <Route path="mouvements-stock/entree" element={<EntreeStock />} />
          <Route path="mouvements-stock/sortie" element={<SortieStock />} />
          <Route path="ventes" element={<Ventes />} />
          <Route path="prix" element={<Prix />} />

          {/* ── GESTION ÉQUIPE ── */}
          <Route path="utilisateurs" element={<Placeholder title="Utilisateurs" subtitle="Gestion des utilisateurs" />} />
          <Route path="livreurs" element={<Placeholder title="Livreurs" subtitle="Gestion des livreurs" />} />
          <Route path="agents" element={<Placeholder title="Agents" subtitle="Gestion des agents" />} />
          <Route path="roles" element={<Placeholder title="Rôles & Permissions" subtitle="Gestion des rôles" />} />
          <Route path="promotions" element={<Promotions />} />

          {/* ── SYSTÈME ── */}
          <Route path="statistiques" element={<Placeholder title="Statistiques" subtitle="Aperçu des stats" />} />
          <Route path="parametres" element={<Placeholder title="Paramètres" subtitle="Réglages du système" />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App