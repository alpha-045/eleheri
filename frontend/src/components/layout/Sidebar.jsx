import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  ArrowDown,
  ArrowLeftRight,
  ArrowRight,
  BarChart3,
  Boxes,
  Building2,
  CircleDollarSign,
  LayoutDashboard,
  PackageSearch,
  Receipt,
  Settings,
  ShoppingCart,
  Tags,
  Truck,
  UserCog,
  Users,
  Warehouse,
  X,
  User,
} from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'

export default function Sidebar({ open, onClose, onLogout }) {
  const [openSub, setOpenSub] = useState(null)
  const { hasAnyPermission, hasPermission } = useAuth()

  const navItemClass = ({ isActive }) =>
    isActive ? 'nav-item nav-item-active' : 'nav-item'

  function close() {
    onClose?.()
  }

  function toggleSub(key) {
    setOpenSub(prev => (prev === key ? null : key))
  }

  return (
    <aside className={open ? 'sidebar sidebar-open' : 'sidebar'}>
      <div className="brand">
        <div className="brand-mark">
          <img className="brand-logo" src="/logo.png" alt="Logo" />
        </div>
        <div>
          <div className="brand-title">El Herri</div>
          <div className="brand-sub">Management Portal</div>
        </div>
        <button className="sidebar-close" type="button" onClick={close} aria-label="Fermer">
          <X size={18} />
        </button>
      </div>

      <div className="sidebar-nav">
        {/* ── MENU PRINCIPAL ── */}
        <div className="nav-section">
          <div className="nav-title">MENU PRINCIPAL</div>
          {hasPermission('systeme.stats') ? (
            <NavLink className={navItemClass} to="/admin/dashboard" onClick={close}>
              <LayoutDashboard className="nav-icon" size={18} />
              Dashboard
            </NavLink>
          ) : null}
          {hasAnyPermission(['commandes.view', 'commandes.edit', 'commandes.cancel']) ? (
            <NavLink className={navItemClass} to="/admin/commandes" onClick={close}>
              <ShoppingCart className="nav-icon" size={18} />
              Commandes
            </NavLink>
          ) : null}
          {hasAnyPermission(['produits.view', 'produits.create', 'produits.edit']) ? (
            <NavLink className={navItemClass} to="/admin/produits" onClick={close}>
              <Boxes className="nav-icon" size={18} />
              Produits
            </NavLink>
          ) : null}
          {hasAnyPermission(['categories.view', 'categories.manage']) ? (
            <NavLink className={navItemClass} to="/admin/categories" onClick={close}>
              <PackageSearch className="nav-icon" size={18} />
              Catégories
            </NavLink>
          ) : null}
        </div>

        {/* ── GESTION DE TRAVAIL ── */}
        <div className="nav-section">
          <div className="nav-title">GESTION DE TRAVAIL</div>
          <NavLink className={navItemClass} to="/admin/fournisseurs" onClick={close}>
            <Building2 className="nav-icon" size={18} />
            Fournisseurs
          </NavLink>
          <NavLink className={navItemClass} to="/admin/clients" onClick={close}>
            <User className="nav-icon" size={18} />
            Clients
          </NavLink>
          <NavLink className={navItemClass} to="/admin/stock" onClick={close}>
            <Warehouse className="nav-icon" size={18} />
            Stock
          </NavLink>

          {/* ── Mouvement de Stock (dropdown) ── */}
          <button
            className={`nav-item nav-parent ${openSub === 'mouvement' ? 'nav-parent-open' : ''}`}
            type="button"
            onClick={() => toggleSub('mouvement')}
          >
            <ArrowLeftRight className="nav-icon" size={18} />
            Mouvement de Stock
          </button>
          <div className={`nav-sub ${openSub === 'mouvement' ? 'nav-sub-open' : ''}`}>
            <NavLink className={navItemClass} to="/admin/mouvements-stock/entree" onClick={close}>
              <ArrowRight className="nav-icon" size={18} />
              Entrée
            </NavLink>
            <NavLink className={navItemClass} to="/admin/mouvements-stock/sortie" onClick={close}>
              <ArrowRight className="nav-icon" size={18} />
              Sortie
            </NavLink>
          </div>

          <NavLink className={navItemClass} to="/admin/ventes" onClick={close}>
            <Receipt className="nav-icon" size={18} />
            Ventes
          </NavLink>
          <NavLink className={navItemClass} to="/admin/prix" onClick={close}>
            <CircleDollarSign className="nav-icon" size={18} />
            Prix 
          </NavLink>
        </div>

        {/* ── GESTION ÉQUIPE ── */}
        <div className="nav-section">
          <div className="nav-title">GESTION ÉQUIPE</div>
          {hasAnyPermission(['utilisateurs.view', 'utilisateurs.manage']) ? (
            <>
              <NavLink className={navItemClass} to="/admin/utilisateurs" onClick={close}>
                <Users className="nav-icon" size={18} />
                Utilisateurs
              </NavLink>
              <NavLink className={navItemClass} to="/admin/livreurs" onClick={close}>
                <Truck className="nav-icon" size={18} />
                Livreurs
              </NavLink>
              <NavLink className={navItemClass} to="/admin/agents" onClick={close}>
                <Users className="nav-icon" size={18} />
                Agents
              </NavLink>
            </>
          ) : null}
          {hasPermission('systeme.settings') ? (
            <NavLink className={navItemClass} to="/admin/roles" onClick={close}>
              <UserCog className="nav-icon" size={18} />
              Rôles &amp; Permissions
            </NavLink>
          ) : null}
          {hasAnyPermission(['promotions.view', 'promotions.manage']) ? (
            <NavLink className={navItemClass} to="/admin/promotions" onClick={close}>
              <Tags className="nav-icon" size={18} />
              Promotions
            </NavLink>
          ) : null}
        </div>

        {/* ── SYSTÈME ── */}
        <div className="nav-section">
          <div className="nav-title">SYSTÈME</div>
       
          <NavLink className={navItemClass} to="/admin/parametres" onClick={close}>
            <Settings className="nav-icon" size={18} />
            Paramètres
          </NavLink>
        </div>
      </div>

      <div className="sidebar-footer">
        <button
          className="logout"
          type="button"
          onClick={() => {
            close()
            onLogout?.()
          }}
        >
          Déconnexion
        </button>
      </div>
    </aside>
  )
}
