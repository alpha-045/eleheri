import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderTree, Pencil, Plus, Trash2, X } from 'lucide-react'
import { apiFetch } from '../../lib/api'
import Alert from '../../components/Alert'
import '../../styles/categories.css'

const COUNT_KEY = 'gs_category_count'

function getMap(key) {
  const raw = localStorage.getItem(key)
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function setMap(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function CategoryModal({ open, mode = 'create', initialValues, onClose, onSubmit }) {
  const [nom, setNom] = useState(() => initialValues?.nom ?? '')
  const [file, setFile] = useState(null)

  if (!open) return null

  function submit(e) {
    e.preventDefault()
    if (!nom.trim()) return
    if (mode !== 'edit' && !file) return
    onSubmit({ nom: nom.trim(), file })
  }

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">{mode === 'edit' ? 'Modifier la catégorie' : 'Ajouter une catégorie'}</div>
          <button className="modal-x" type="button" onClick={onClose} aria-label="Fermer">
            <X size={18} />
          </button>
        </div>
        <form className="modal-body" onSubmit={submit}>
          <label className="form-label">
            Nom
            <input className="form-input" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex: Épicerie" />
          </label>
          {mode === 'edit' && initialValues?.image ? (
            <div className="cat-image-preview">
              <img src={initialValues.image} alt={initialValues.nom || 'Catégorie'} />
            </div>
          ) : null}
          <label className="form-label">
            Image
            <input className="form-input" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
          <div className="modal-foot">
            <button className="btn-ghost" type="button" onClick={onClose}>
              Annuler
            </button>
            <button className="btn-primary" type="submit" disabled={!nom.trim() || (mode !== 'edit' && !file)}>
              {mode === 'edit' ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Categories() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const errTimerRef = useRef(null)

  function showTempError(message) {
    const msg = (message || '').toString()
    if (!msg) return
    setError(msg)
    if (errTimerRef.current) window.clearTimeout(errTimerRef.current)
    errTimerRef.current = window.setTimeout(() => setError(''), 3800)
  }

  async function load() {
    setError('')
    setLoading(true)
    try {
      const res = await apiFetch('/api/categories?per_page=1000')
      const items = Array.isArray(res?.data) ? res.data : res?.data?.data || []

      const countMap = getMap(COUNT_KEY)

      const nextCount = { ...countMap }

      for (const c of items) {
        if (nextCount[c.id] == null) nextCount[c.id] = Math.floor(Math.random() * 70) + 5
      }

      setMap(COUNT_KEY, nextCount)

      setCategories(
        items.map((c) => ({
          id: c.id,
          nom: c.nom,
          image: c.image || null,
          produits: nextCount[c.id],
        }))
      )
    } catch (e) {
      setError(e?.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    return () => {
      if (errTimerRef.current) window.clearTimeout(errTimerRef.current)
    }
  }, [])

  const totals = useMemo(() => {
    const totalCategories = categories.length
    const totalProduits = categories.reduce((sum, c) => sum + c.produits, 0)
    return { totalCategories, totalProduits }
  }, [categories])

  async function addCategory(values) {
    const form = new FormData()
    form.append('nom', values.nom)
    form.append('description', '')
    form.append('image', values.file)

    const countMap = getMap(COUNT_KEY)
    setMap(COUNT_KEY, countMap)

    setOpen(false)
    await apiFetch('/api/categories', {
      method: 'POST',
      body: form,
    })
    await load()
  }

  async function updateCategory(values) {
    if (!editing?.id) return
    try {
      const form = new FormData()
      form.append('_method', 'PUT')
      form.append('nom', values.nom)
      form.append('description', '')
      if (values.file) form.append('image', values.file)

      await apiFetch(`/api/categories/${editing.id}`, {
        method: 'POST',
        body: form,
      })

      setEditOpen(false)
      setEditing(null)
      await load()
    } catch (e) {
      showTempError(e?.message || 'Erreur')
    }
  }

  async function deleteCategory(cat) {
    try {
      await apiFetch(`/api/categories/${cat.id}`, { method: 'DELETE' })
      await load()
    } catch (e) {
      showTempError(e?.message || 'Erreur')
    }
  }

  return (
    <section className="content">
      <div className="page-head">
        <div>
          <div className="page-title page-title-xl">Catégories</div>
          <div className="page-subtitle">Organiser les produits par catégorie</div>
        </div>
        <button className="primary primary-pill" type="button" onClick={() => setOpen(true)}>
          <Plus size={16} />
          Ajouter Catégorie
        </button>
      </div>

      <Alert type="error" message={error} />

      <div className="cat-grid">
        {loading ? <div className="products-empty">Loading…</div> : null}
        {!loading &&
          categories.map((c) => (
          <div key={c.id} className="cat-card" onClick={() => navigate(`/admin/categories/${c.id}`)} role="button" tabIndex={0}>
            <div className="cat-top">
              <div className="cat-ico">
                {c.image ? <img className="cat-img" src={c.image} alt={c.nom} /> : <div className="cat-img-fallback">{(c.nom || '?')[0]}</div>}
              </div>
              <div>
                <div className="cat-name">{c.nom}</div>
                <div className="cat-count">{c.produits} produits</div>
              </div>
            </div>

            <div className="cat-actions" onClick={(e) => e.stopPropagation()}>
              <button
                className="cat-btn"
                type="button"
                onClick={() => {
                  setEditing(c)
                  setEditOpen(true)
                }}
              >
                <Pencil size={16} />
                Modifier
              </button>
              <button
                className="cat-icon-btn"
                type="button"
                onClick={() => navigate(`/admin/categories/${c.id}`)}
                aria-label="Sous-catégories"
              >
                <FolderTree size={16} />
              </button>
              <button className="cat-icon-btn cat-icon-btn-danger" type="button" onClick={() => deleteCategory(c)} aria-label="Supprimer">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="cat-stats">
        <div>
          <div className="cat-stats-label">Total Catégories</div>
          <div className="cat-stats-value">{totals.totalCategories}</div>
        </div>
        <div className="cat-stats-right">
          <div className="cat-stats-label">Total Produits</div>
          <div className="cat-stats-value">{totals.totalProduits}</div>
        </div>
      </div>

      <CategoryModal key={`create-${open ? '1' : '0'}`} open={open} mode="create" onClose={() => setOpen(false)} onSubmit={addCategory} />
      <CategoryModal
        key={`edit-${editOpen ? editing?.id || 'x' : '0'}`}
        open={editOpen}
        mode="edit"
        initialValues={editing}
        onClose={() => {
          setEditOpen(false)
          setEditing(null)
        }}
        onSubmit={updateCategory}
      />
    </section>
  )
}
