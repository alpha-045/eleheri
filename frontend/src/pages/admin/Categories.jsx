import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderTree, Pencil, Plus, Trash2, X } from 'lucide-react'
import { apiFetch } from '../../lib/api'
import '../../styles/categories.css'

const EMOJI_KEY = 'gs_category_emoji'
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

function pickEmoji() {
  const list = ['🥖', '🍿', '🥤', '🧴', '🧹', '🐶', '🍅', '🍚', '🍝', '🫒', '🧀']
  return list[Math.floor(Math.random() * list.length)]
}

function CategoryModal({ open, onClose, onSubmit }) {
  const [nom, setNom] = useState('')
  const [emoji, setEmoji] = useState('🍞')

  if (!open) return null

  function submit(e) {
    e.preventDefault()
    if (!nom.trim()) return
    onSubmit({ nom: nom.trim(), emoji })
    setNom('')
    setEmoji('🍞')
  }

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">Ajouter une catégorie</div>
          <button className="modal-x" type="button" onClick={onClose} aria-label="Fermer">
            <X size={18} />
          </button>
        </div>
        <form className="modal-body" onSubmit={submit}>
          <label className="form-label">
            Nom
            <input className="form-input" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex: Épicerie" />
          </label>
          <label className="form-label">
            Icône (emoji)
            <input className="form-input" value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="🍞" />
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

export default function Categories() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setError('')
    setLoading(true)
    try {
      const res = await apiFetch('/api/categories?per_page=200')
      const items = Array.isArray(res?.data) ? res.data : res?.data?.data || []

      const emojiMap = getMap(EMOJI_KEY)
      const countMap = getMap(COUNT_KEY)

      const nextEmoji = { ...emojiMap }
      const nextCount = { ...countMap }

      for (const c of items) {
        if (!nextEmoji[c.id]) nextEmoji[c.id] = pickEmoji()
        if (nextCount[c.id] == null) nextCount[c.id] = Math.floor(Math.random() * 70) + 5
      }

      setMap(EMOJI_KEY, nextEmoji)
      setMap(COUNT_KEY, nextCount)

      setCategories(
        items.map((c) => ({
          id: c.id,
          nom: c.nom,
          emoji: nextEmoji[c.id],
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

  const totals = useMemo(() => {
    const totalCategories = categories.length
    const totalProduits = categories.reduce((sum, c) => sum + c.produits, 0)
    return { totalCategories, totalProduits }
  }, [categories])

  async function addCategory(values) {
    const created = await apiFetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nom: values.nom,
        description: null,
      }),
    })

    const emojiMap = getMap(EMOJI_KEY)
    emojiMap[created.id] = values.emoji || pickEmoji()
    setMap(EMOJI_KEY, emojiMap)

    const countMap = getMap(COUNT_KEY)
    countMap[created.id] = 0
    setMap(COUNT_KEY, countMap)

    setOpen(false)
    await load()
  }

  async function deleteCategory(cat) {
    await apiFetch(`/api/categories/${cat.id}`, { method: 'DELETE' })
    await load()
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

      {error ? <div className="banner banner-err">{error}</div> : null}

      <div className="cat-grid">
        {loading ? <div className="products-empty">Loading…</div> : null}
        {!loading &&
          categories.map((c) => (
          <div key={c.id} className="cat-card" onClick={() => navigate(`/admin/categories/${c.id}`)} role="button" tabIndex={0}>
            <div className="cat-top">
              <div className="cat-ico">{c.emoji}</div>
              <div>
                <div className="cat-name">{c.nom}</div>
                <div className="cat-count">{c.produits} produits</div>
              </div>
            </div>

            <div className="cat-actions" onClick={(e) => e.stopPropagation()}>
              <button className="cat-btn" type="button">
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

      <CategoryModal open={open} onClose={() => setOpen(false)} onSubmit={addCategory} />
    </section>
  )
}
