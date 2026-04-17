import { useEffect, useMemo, useState } from 'react'
import { LayoutGrid, List, Plus, Search } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import ProductModal from '../../components/products/ProductModal'
import ProductRow from '../../components/products/ProductRow'
import { apiFetch } from '../../lib/api'
import ProductCard from '../../components/products/ProductCard'
import Alert from '../../components/Alert'
import { toast } from '../../lib/toast'
import '../../styles/produits.css'

export default function Produits() {
  const { search, setSearch } = useOutletContext()
  const [open, setOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [editing, setEditing] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [view, setView] = useState('list')
  const [categoryId, setCategoryId] = useState('all')

  const [products, setProducts] = useState([])
  const [sousCategories, setSousCategories] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function loadAll() {
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const [articlesRes, scRes, catRes] = await Promise.all([
        apiFetch('/api/articles?per_page=100'),
        apiFetch('/api/sous_categories?per_page=200'),
        apiFetch('/api/categories?per_page=200'),
      ])

      const sc = Array.isArray(scRes?.data) ? scRes.data : scRes?.data?.data || []
      setSousCategories(sc)

      const cat = Array.isArray(catRes?.data) ? catRes.data : catRes?.data?.data || []
      setCategories(cat)

      const catById = new Map(cat.map((c) => [String(c.id), c]))
      const scById = new Map(sc.map((s) => [String(s.id), s]))

      const articles = Array.isArray(articlesRes?.data) ? articlesRes.data : articlesRes?.data?.data || []
      const mapped = articles.map((a) => ({
        id: a.id,
        code_article: a.code_article,
        nom: a.nom,
        subCategoryName: a?.sous_categorie?.nom || a?.sousCategorie?.nom || '',
        categoryName: (() => {
          const sid = String(a.sous_categorie_id ?? '')
          const s = scById.get(sid)
          const cid = String(s?.categorie_id ?? '')
          return catById.get(cid)?.nom || s?.categorie?.nom || ''
        })(),
        unite: a.unite || 'pièce',
        poids: 0,
        prix: Number(a?.prix?.prix_vente ?? 0),
        prix_achat: Number(a?.prix?.prix_achat ?? 0),
        prix_id: a?.prix?.id ?? null,
        stock: Number(a?.stock?.quantite ?? 0),
        stock_id: a?.stock?.id ?? null,
        seuil_min: Number(a?.stock?.seuil_min ?? 0),
        img: a.image || '/imagelogin.png',
        sous_categorie_id: a.sous_categorie_id,
        categorie_id: (() => {
          const sid = String(a.sous_categorie_id ?? '')
          const s = scById.get(sid)
          return s?.categorie_id ?? null
        })(),
      }))
      setProducts(mapped)
    } catch (e) {
      setError(e?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter((p) => {
      const okCategory =
        categoryId === 'all' ? true : String(p.categorie_id ?? '') === String(categoryId)
      const okQuery = !q ? true : p.nom.toLowerCase().includes(q)
      return okCategory && okQuery
    })
  }, [products, search, categoryId])

  function openCreate() {
    setError('')
    setSuccess('')
    setEditing(null)
    setModalMode('create')
    setOpen(true)
  }

  function openEdit(product) {
    setError('')
    setSuccess('')
    setEditing(product)
    setModalMode('edit')
    setOpen(true)
  }

  function askDelete(product) {
    setError('')
    setSuccess('')
    setDeleting(product)
    setConfirmOpen(true)
  }

  async function addProduct(values) {
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      const code_article = (values?.code_article || '').toString().trim() || `ART-${Date.now()}`

      const form = new FormData()
      form.append('sous_categorie_id', String(values.sous_categorie_id))
      form.append('code_article', code_article)
      form.append('nom', values.nom)
      form.append('unite', values.unite || 'pièce')
      form.append('actif', '1')
      if (values?.file) form.append('image', values.file)

      const article = await apiFetch('/api/articles', {
        method: 'POST',
        body: form,
      })

      await apiFetch('/api/prix_articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article_id: article.id,
          prix_achat: 0,
          prix_vente: values.prix,
          prix_gros: null,
          prix_promo: null,
        }),
      })

      await apiFetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article_id: article.id,
          quantite: 0,
          seuil_min: values.seuil_min,
        }),
      })

      setOpen(false)
      setSuccess('Produit ajouté.')
      toast({ type: 'success', message: 'Produit ajouté.' })
      await loadAll()
    } catch (e) {
      const msg = e?.message || 'Erreur'
      setError(msg)
      toast({ type: 'error', message: msg })
    } finally {
      setSubmitting(false)
    }
  }

  async function updateProduct(values) {
    if (!editing?.id) return
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      const nextCode = (values?.code_article || '').toString().trim() || editing.code_article

      if (values?.file) {
        const form = new FormData()
        form.append('_method', 'PUT')
        form.append('sous_categorie_id', String(values.sous_categorie_id))
        form.append('code_article', nextCode)
        form.append('nom', values.nom)
        form.append('unite', values.unite || editing.unite || 'pièce')
        form.append('image', values.file)

        await apiFetch(`/api/articles/${editing.id}`, {
          method: 'POST',
          body: form,
        })
      } else {
        await apiFetch(`/api/articles/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sous_categorie_id: values.sous_categorie_id,
            code_article: nextCode,
            nom: values.nom,
            unite: values.unite || editing.unite || 'pièce',
          }),
        })
      }

      if (editing.prix_id) {
        await apiFetch(`/api/prix_articles/${editing.prix_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prix_achat: Number(editing.prix_achat ?? 0),
            prix_vente: values.prix,
            prix_gros: null,
            prix_promo: null,
          }),
        })
      } else {
        await apiFetch('/api/prix_articles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            article_id: editing.id,
            prix_achat: 0,
            prix_vente: values.prix,
            prix_gros: null,
            prix_promo: null,
          }),
        })
      }

      if (editing.stock_id) {
        await apiFetch(`/api/stock/${editing.stock_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quantite: Number(editing.stock ?? 0),
            seuil_min: values.seuil_min,
          }),
        })
      } else {
        await apiFetch('/api/stock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            article_id: editing.id,
            quantite: 0,
            seuil_min: values.seuil_min,
          }),
        })
      }

      setOpen(false)
      setSuccess('Produit modifié.')
      toast({ type: 'success', message: 'Produit modifié.' })
      await loadAll()
    } catch (e) {
      const msg = e?.message || 'Erreur'
      setError(msg)
      toast({ type: 'error', message: msg })
    } finally {
      setSubmitting(false)
    }
  }

  async function deleteProduct(product) {
    if (!product?.id) return
    setSubmitting(true)
    setError('')
    setSuccess('')
    try {
      await apiFetch(`/api/articles/${product.id}`, { method: 'DELETE' })
      setConfirmOpen(false)
      setDeleting(null)
      setSuccess('Produit supprimé.')
      toast({ type: 'success', message: 'Produit supprimé.' })
      await loadAll()
    } catch (e) {
      const msg = e?.message || 'Erreur'
      setError(msg)
      toast({ type: 'error', message: msg })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="content">
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
              ? filtered.map((p) => <ProductRow key={p.id} product={p} onEdit={openEdit} onDelete={askDelete} />)
              : null}
          </div>
        </div>
      ) : (
        <div className="grid">
          {loading ? <div className="products-empty">Loading…</div> : null}
          {!loading && filtered.length === 0 ? <div className="products-empty">Aucun produit</div> : null}
          {!loading ? filtered.map((p) => <ProductCard key={p.id} product={p} onEdit={openEdit} onDelete={askDelete} />) : null}
        </div>
      )}

      <ProductModal
        open={open}
        mode={modalMode}
        initialValues={modalMode === 'edit' ? editing : null}
        sousCategories={sousCategories}
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
