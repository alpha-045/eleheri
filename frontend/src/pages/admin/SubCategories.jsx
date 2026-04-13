import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Plus, Trash2, X } from 'lucide-react'
import { apiFetch } from '../../lib/api'
import '../../styles/categories.css'

function SubCategoryModal({ open, onClose, onSubmit }) {
  const [nom, setNom] = useState('')

  if (!open) return null

  function submit(e) {
    e.preventDefault()
    if (!nom.trim()) return
    onSubmit({ nom: nom.trim() })
    setNom('')
  }

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">Ajouter une sous-catégorie</div>
          <button className="modal-x" type="button" onClick={onClose} aria-label="Fermer">
            <X size={18} />
          </button>
        </div>
        <form className="modal-body" onSubmit={submit}>
          <label className="form-label">
            Nom
            <input className="form-input" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex: Pâtes" />
          </label>
          <div className="modal-foot">
            <button className="btn-ghost" type="button" onClick={onClose}>
              Annuler
            </button>
            <button className="btn-primary" type="submit" disabled={!nom.trim()}>
              Ajouter
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function SubCategories() {
  const { categoryId } = useParams()
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState(null)
  const [subCategories, setSubCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setError('')
    setLoading(true)
    try {
      const [cat, res] = await Promise.all([
        apiFetch(`/api/categories/${categoryId}`),
        apiFetch('/api/sous_categories?per_page=300'),
      ])

      setCategory(cat)

      const items = Array.isArray(res?.data) ? res.data : res?.data?.data || []
      const filtered = items
        .filter((s) => String(s.categorie_id) === String(categoryId))
        .map((s) => ({
          id: s.id,
          nom: s.nom,
          produits: Math.floor(Math.random() * 30),
        }))

      setSubCategories(filtered)
    } catch (e) {
      setError(e?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [categoryId])

  const totals = useMemo(() => {
    const totalSous = subCategories.length
    const totalProduits = subCategories.reduce((sum, s) => sum + s.produits, 0)
    return { totalSous, totalProduits }
  }, [subCategories])

  async function addSub(values) {
    await apiFetch('/api/sous_categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categorie_id: Number(categoryId),
        nom: values.nom,
        description: null,
      }),
    })
    setOpen(false)
    await load()
  }

  async function deleteSub(s) {
    await apiFetch(`/api/sous_categories/${s.id}`, { method: 'DELETE' })
    await load()
  }

  return (
    <section className="content">
      <div className="breadcrumb">
        <Link className="breadcrumb-link" to="/admin/categories">
          Catégories
        </Link>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">Sous-catégories</span>
      </div>

      <div className="page-head">
        <div>
          <div className="page-title">Sous-catégories</div>
          <div className="page-subtitle">{category?.nom ? `Catégorie: ${category.nom}` : `Catégorie ID: ${categoryId}`}</div>
        </div>
        <button className="primary primary-pill" type="button" onClick={() => setOpen(true)}>
          <Plus size={16} />
          Ajouter Sous-catégorie
        </button>
      </div>

      <div className="cat-grid">
        {error ? <div className="banner banner-err">{error}</div> : null}
        {loading ? <div className="products-empty">Loading…</div> : null}
        {!loading &&
          subCategories.map((s) => (
            <div key={s.id} className="cat-card">
              <div className="cat-top">
                <div className="cat-ico">📁</div>
                <div>
                  <div className="cat-name">{s.nom}</div>
                  <div className="cat-count">{s.produits} produits</div>
                </div>
              </div>
              <div className="cat-actions">
                <button className="cat-icon-btn cat-icon-btn-danger" type="button" onClick={() => deleteSub(s)} aria-label="Supprimer">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
      </div>

      <div className="cat-stats">
        <div>
          <div className="cat-stats-label">Total Sous-catégories</div>
          <div className="cat-stats-value">{totals.totalSous}</div>
        </div>
        <div className="cat-stats-right">
          <div className="cat-stats-label">Total Produits</div>
          <div className="cat-stats-value">{totals.totalProduits}</div>
        </div>
      </div>

      <SubCategoryModal open={open} onClose={() => setOpen(false)} onSubmit={addSub} />
    </section>
  )
}
