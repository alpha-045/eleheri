import { Plus } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import Alert from '../../components/Alert'
import { useAuth } from '../../auth/AuthContext'
import PackModal from '../../features/packs/components/PackModal'
import DeletePackModal from '../../features/packs/components/DeletePackModal'
import { usePacksPage } from '../../features/packs/usePacksPage'
import '../../styles/packs.css'

export default function Packs() {
  const { hasAnyPermission } = useAuth()
  const outlet = useOutletContext() || {}
  const search = (outlet.search || '').toString()
  const setSearch = outlet.setSearch

  const enabled = hasAnyPermission(['packs.view', 'packs.manage', 'systeme.settings'])
  const canManage = hasAnyPermission(['packs.manage', 'systeme.settings'])

  const {
    loading,
    error,
    articles,
    open,
    modalMode,
    editing,
    confirmOpen,
    deleting,
    submitting,
    filtered,
    setOpen,
    setConfirmOpen,
    setDeleting,
    openCreate,
    openEdit,
    askDelete,
    submit,
    confirmDelete,
  } = usePacksPage({ search, enabled })

  if (!enabled) {
    return (
      <section className="content">
        <div className="products-empty">Accès refusé.</div>
      </section>
    )
  }

  return (
    <section className="content packs">
      <div className="page-head">
        <div>
          <div className="page-title">Packs</div>
          <div className="page-subtitle">Créer des packs et gérer les produits inclus</div>
        </div>
        <button
          className="primary primary-pill"
          type="button"
          onClick={openCreate}
          disabled={submitting || !canManage}
        >
          <Plus size={16} />
          Nouveau pack
        </button>
      </div>

      <Alert type="error" message={error} />

      <div className="packs-toolbar">
        <div className="tool-search packs-search">
          <input
            className="tool-search-input"
            placeholder="Rechercher un pack…"
            value={search}
            onChange={(e) => (setSearch ? setSearch(e.target.value) : null)}
          />
        </div>
      </div>

      <div className="packs-wrap">
        {loading ? <div className="packs-empty">Chargement…</div> : null}
        {!loading ? (
          <div className="packs-grid">
            {filtered.map((p) => (
              <div key={p.id} className="packs-card">
                <div className="packs-card-title">{p.nom}</div>
                <div className="packs-card-sub">{Array.isArray(p.items) ? `${p.items.length} produits` : '—'}</div>
                <div className="packs-card-price">{Number(p.prix_vente || 0).toLocaleString('fr-FR')} DH</div>
                <div className="packs-card-foot">
                  <span className={p.actif ? 'packs-pill packs-pill-green' : 'packs-pill packs-pill-gray'}>
                    {p.actif ? 'Actif' : 'Inactif'}
                  </span>
                  <div className="packs-actions">
                    <button
                      className="btn-ghost"
                      type="button"
                      onClick={() => openEdit(p)}
                      disabled={!canManage}
                    >
                      Modifier
                    </button>
                    <button
                      className="btn-danger"
                      type="button"
                      onClick={() => askDelete(p)}
                      disabled={!canManage}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filtered.length === 0 ? <div className="packs-empty packs-empty-inline">Aucun pack</div> : null}
          </div>
        ) : null}
      </div>

      <PackModal
        open={open}
        mode={modalMode}
        initialValues={modalMode === 'edit' ? editing : null}
        articles={articles}
        onClose={() => (submitting ? null : setOpen(false))}
        onSubmit={submit}
      />

      <DeletePackModal
        open={confirmOpen}
        packName={deleting?.nom || ''}
        submitting={submitting}
        onClose={() => {
          setConfirmOpen(false)
          setDeleting(null)
        }}
        onConfirm={confirmDelete}
      />
    </section>
  )
}
