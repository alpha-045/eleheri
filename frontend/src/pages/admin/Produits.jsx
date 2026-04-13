import { useEffect, useMemo, useState } from 'react'
import { LayoutGrid, List, Plus, Search } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import ProductModal from '../../components/products/ProductModal'
import ProductRow from '../../components/products/ProductRow'
import { apiFetch } from '../../lib/api'
import ProductCard from '../../components/products/ProductCard'
import '../../styles/produits.css'

export default function Produits() {
  const { search, setSearch } = useOutletContext()
  const [open, setOpen] = useState(false)
  const [view, setView] = useState('list')
  const [categoryId, setCategoryId] = useState('all')

  const [products, setProducts] = useState([])
  const [sousCategories, setSousCategories] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadAll() {
    setError('')
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
        stock: Number(a?.stock?.quantite ?? 0),
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

  async function addProduct(values) {
    const code_article = `ART-${Date.now()}`

    const article = await apiFetch('/api/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sous_categorie_id: values.sous_categorie_id,
        code_article,
        nom: values.nom,
        unite: 'kg',
        actif: true,
      }),
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
        quantite: values.stock,
        seuil_min: 0,
      }),
    })

    setOpen(false)
    await loadAll()
  }

  async function deleteProduct(product) {
    await apiFetch(`/api/articles/${product.id}`, { method: 'DELETE' })
    await loadAll()
  }

  return (
    <section className="content">
      <div className="page-head">
        <div>
          <div className="page-title">Produits</div>
          <div className="page-subtitle">Gérer le catalogue de produits</div>
        </div>
        <button className="primary primary-pill" type="button" onClick={() => setOpen(true)}>
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

      {error ? <div className="banner banner-err">{error}</div> : null}

      {view === 'list' ? (
        <div className="products-wrap">
          <div className="products-table">
            {loading ? <div className="products-empty">Loading…</div> : null}
            {!loading && filtered.length === 0 ? <div className="products-empty">Aucun produit</div> : null}
            {!loading
              ? filtered.map((p) => <ProductRow key={p.id} product={p} onDelete={deleteProduct} />)
              : null}
          </div>
        </div>
      ) : (
        <div className="grid">
          {loading ? <div className="products-empty">Loading…</div> : null}
          {!loading && filtered.length === 0 ? <div className="products-empty">Aucun produit</div> : null}
          {!loading ? filtered.map((p) => <ProductCard key={p.id} product={p} onDelete={deleteProduct} />) : null}
        </div>
      )}

      <ProductModal
        open={open}
        sousCategories={sousCategories}
        onClose={() => setOpen(false)}
        onSubmit={addProduct}
      />
    </section>
  )
}
