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
import Agents from './pages/admin/Agents'
import Livreurs from './pages/admin/Livreurs'
import Placeholder from './pages/admin/Placeholder'
import Prix from './pages/admin/Prix'
import Produits from './pages/admin/Produits'
import Promotions from './pages/admin/Promotions'
import Roles from './pages/admin/Roles'
import SortieStock from './pages/admin/SortieStock'
import Stock from './pages/admin/Stock'
import SubCategories from './pages/admin/SubCategories'
import Utilisateurs from './pages/admin/Utilisateurs'
import Ventes from './pages/admin/Ventes'
import ProductDetails from './pages/admin/ProductDetails'
import Packs from './pages/admin/Packs'
import Parametres from './pages/admin/Parametres'

function RootRedirect() {
  const { user, loading, hasAnyPermission } = useAuth()
  if (loading) return <div className="page">Loading…</div>

  if (user) {
    if (hasAnyPermission(['produits.view', 'produits.create', 'produits.edit'])) return <Navigate to="/admin/produits" replace />
    if (hasAnyPermission(['commandes.view', 'commandes.edit'])) return <Navigate to="/admin/commandes" replace />
    if (hasAnyPermission(['categories.view', 'categories.manage'])) return <Navigate to="/admin/categories" replace />
    return <Navigate to="/admin/account" replace />
  }

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
          <Route path="produits/:id" element={<ProductDetails />} />
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
          <Route path="utilisateurs" element={<Utilisateurs />} />
          <Route path="livreurs" element={<Livreurs />} />
          <Route path="agents" element={<Agents />} />
          <Route path="packs" element={<Packs />} />
          <Route path="roles" element={<Roles />} />
          <Route path="promotions" element={<Promotions />} />

          {/* ── SYSTÈME ── */}
          <Route path="statistiques" element={<Placeholder title="Statistiques" subtitle="Aperçu des stats" />} />
          <Route path="parametres" element={<Parametres />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
