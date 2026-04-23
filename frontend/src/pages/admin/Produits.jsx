import { useOutletContext } from 'react-router-dom'
import { LayoutGrid, List, Plus, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ProductModal from '../../components/products/ProductModal'
import ProductRow from '../../components/products/ProductRow'
import ProductCard from '../../components/products/ProductCard'
import Alert from '../../components/Alert'
import { useProduitsPage } from '../../features/produits/useProduitsPage'
import '../../styles/produits.css'

export default function Produits() {
  const { search, setSearch } = useOutletContext()
  const navigate = useNavigate()
  const {
    open,
    modalMode,
    editing,
    confirmOpen,
    deleting,
    view,
    categoryId,
    sousCategories,
    categories,
    unites,
    loading,
    error,
    success,
    submitting,
    filtered,
    setView,
    setCategoryId,
    setOpen,
    setConfirmOpen,
    setDeleting,
    openCreate,
    openEdit,
    openDetails,
    askDelete,
    addProduct,
    updateProduct,
    deleteProduct,
  } = useProduitsPage({ search, setSearch, navigate })

  return (
    <section className="content">
      <Alert type="error" message={error} />
      <Alert type="success" message={success} />
      <div className="page-head">
        <div>
          <div className="page-title">Produits</div>
          <div className="page-subtitle">Gérer le catalogue de produits</div>
        </div>
        <button className="primary primary-pill" type="button" onClick={openCreate}>
          <Plus size={16} />
          Ajouter Produit
        </button>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <div className="tool-search">
            <Search size={16} color="#94a3b8" />
            <input
              className="tool-search-input"
              placeholder="Rechercher un produit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select className="tool-select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="all">Toutes catégories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>
        </div>

        <div className="toolbar-right">
          <button
            className={`view-btn ${view === 'grid' ? 'view-btn-active' : ''}`}
            type="button"
            onClick={() => setView('grid')}
            aria-label="Vue grille"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            className={`view-btn ${view === 'list' ? 'view-btn-active' : ''}`}
            type="button"
            onClick={() => setView('list')}
            aria-label="Vue liste"
          >
            <List size={16} />
          </button>
        </div>
      </div>


      {view === 'list' ? (
        <div className="products-wrap">
          <div className="products-table">
            {loading ? <div className="products-empty">Loading…</div> : null}
            {!loading && filtered.length === 0 ? <div className="products-empty">Aucun produit</div> : null}
            {!loading
              ? filtered.map((p) => <ProductRow key={p.id} product={p} onDetails={openDetails} onEdit={openEdit} onDelete={askDelete} />)
              : null}
          </div>
        </div>
      ) : (
        <div className="grid">
          {loading ? <div className="products-empty">Loading…</div> : null}
          {!loading && filtered.length === 0 ? <div className="products-empty">Aucun produit</div> : null}
          {!loading ? filtered.map((p) => <ProductCard key={p.id} product={p} onDetails={openDetails} onEdit={openEdit} onDelete={askDelete} />) : null}
        </div>
      )}

      <ProductModal
        key={`${modalMode}-${open ? '1' : '0'}-${editing?.id || 'new'}`}
        open={open}
        mode={modalMode}
        initialValues={modalMode === 'edit' ? editing : null}
        sousCategories={sousCategories}
        unites={unites}
        onClose={() => setOpen(false)}
        onSubmit={modalMode === 'edit' ? updateProduct : addProduct}
      />

      {confirmOpen ? (
        <div className="modal-overlay" onMouseDown={() => setConfirmOpen(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-title">Supprimer le produit</div>
            </div>
            <div className="modal-body">
              <div className="form-label">{`Voulez-vous supprimer "${deleting?.nom || ''}" ?`}</div>
              <div className="modal-foot">
                <button
                  className="btn-ghost"
                  type="button"
                  onClick={() => {
                    setConfirmOpen(false)
                    setDeleting(null)
                  }}
                  disabled={submitting}
                >
                  Annuler
                </button>
                <button className="btn-primary" type="button" onClick={() => deleteProduct(deleting)} disabled={submitting}>
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
