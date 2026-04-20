import { UserPlus } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import Alert from '../../components/Alert'
import '../../styles/users.css'
import '../../styles/livreurs.css'
import { useLivreursPage } from '../../features/livreurs/useLivreursPage'
import { LivreurModal } from '../../components/Livreurs/LivreurModal'
import { ViewLivreurs } from '../../components/Livreurs/ViewLivreurs'
import { ConfirmModal } from '../../components/ConfirmModal'

export default function Livreurs() {
  const outlet = useOutletContext() || {}
  const search = (outlet.search || outlet.searchQuery || '').toString()
  const setSearch = outlet.setSearch || outlet.setSearchQuery

  const {
    hasPermission,
    hasAnyPermission,
    loading,
    error,
    submitting,
    open,
    setOpen,
    confirmOpen,
    setConfirmOpen,
    editing,
    setEditing,
    deleting,
    setDeleting,
    livreurs,
    livreurRoleId,
    statsByUserId,
    headerStats,
    openCreate,
    openEdit,
    askDelete,
    submitUser,
    confirmDelete
  } = useLivreursPage(search)

  if (!hasAnyPermission(['utilisateurs.view', 'utilisateurs.manage'])) {
    return (
      <section className="content livreurs">
        <div className="users-empty">Accès refusé.</div>
      </section>
    )
  }

  return (
    <section className="content livreurs">
      <div className="livreurs-head">
        <div>
          <div className="livreurs-title">Livreurs</div>
          <div className="livreurs-sub">Suivre et gérer les livreurs</div>
        </div>
        <button className="livreurs-add" type="button" onClick={openCreate} disabled={submitting || !hasPermission('utilisateurs.manage')}>
          <UserPlus size={18} />
          Ajouter Livreur
        </button>
      </div>

      <Alert type="error" message={error} />

      <div className="livreurs-stats">
        <div className="livreurs-stat">
          <div className="livreurs-stat-label">Livreurs en ligne</div>
          <div className="livreurs-stat-value livreurs-stat-value-green">{headerStats.online}</div>
        </div>
        <div className="livreurs-stat">
          <div className="livreurs-stat-label">Commandes actives</div>
          <div className="livreurs-stat-value">{headerStats.active}</div>
        </div>
        <div className="livreurs-stat">
          <div className="livreurs-stat-label">Livrées aujourd&apos;hui</div>
          <div className="livreurs-stat-value livreurs-stat-value-red">{headerStats.deliveredToday}</div>
        </div>
        <div className="livreurs-stat">
          <div className="livreurs-stat-label">Note moyenne</div>
          <div className="livreurs-stat-value livreurs-stat-value-amber">{headerStats.avg} ★</div>
        </div>
      </div>

      <div className="livreurs-bar">
        <div className="livreurs-search">
          <input
            className="livreurs-search-input"
            placeholder="Rechercher des livreurs…"
            value={search}
            onChange={(e) => (setSearch ? setSearch(e.target.value) : null)}
          />
        </div>
      </div>

      {loading ? <div className="users-empty">Loading…</div> : (
        <ViewLivreurs 
          livreurs={livreurs} 
          statsByUserId={statsByUserId} 
          openEdit={openEdit} 
          askDelete={askDelete}
          submitting={submitting}
          hasPermission={hasPermission} 
        />
      )}

      <LivreurModal
        open={open}
        roleId={livreurRoleId}
        initialValues={editing}
        onClose={() => {
          if (submitting) return
          setOpen(false)
          setEditing(null)
        }}
        onSubmit={submitUser}
      />

      <ConfirmModal
        open={confirmOpen}
        title="Supprimer"
        description={`Supprimer "${deleting?.nom || ''} ${deleting?.prenom || ''}" ?`}
        onClose={() => {
          setConfirmOpen(false)
          setDeleting(null)
        }}
        onConfirm={confirmDelete}
        disabled={submitting}
        confirmLabel="Supprimer"
      />
    </section>
  )
}

