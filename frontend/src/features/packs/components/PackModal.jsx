import { useEffect, useMemo, useState } from 'react'
import { Search, Trash2, X } from 'lucide-react'

export default function PackModal({ open, mode, initialValues, articles, onClose, onSubmit }) {
  const [nom, setNom] = useState('')
  const [description, setDescription] = useState('')
  const [prixVente, setPrixVente] = useState('')
  const [actif, setActif] = useState(true)
  const [items, setItems] = useState([])
  const [articleQuery, setArticleQuery] = useState('')

  useEffect(() => {
    if (!open) return
    setNom(initialValues?.nom ?? '')
    setDescription(initialValues?.description ?? '')
    setPrixVente(initialValues?.prix_vente != null ? String(initialValues.prix_vente) : '')
    setActif(initialValues?.actif != null ? !!initialValues.actif : true)
    const initItems = Array.isArray(initialValues?.items)
      ? initialValues.items.map((it) => ({
          article_id: it.article_id ?? it.article?.id,
          quantite: it.quantite != null ? String(it.quantite) : '1',
        }))
      : []
    setItems(initItems.filter((x) => x.article_id != null))
    setArticleQuery('')
  }, [open, initialValues])

  const canSubmit = nom.trim() && prixVente !== '' && items.length > 0

  const selectable = useMemo(() => {
    const picked = new Set(items.map((x) => String(x.article_id)))
    return articles.filter((a) => !picked.has(String(a.id)))
  }, [articles, items])

  const itemsView = useMemo(() => {
    const byId = new Map(articles.map((a) => [String(a.id), a]))
    return items.map((it) => ({
      ...it,
      article: byId.get(String(it.article_id)) || null,
    }))
  }, [articles, items])

  if (!open) return null

  function addItem(article) {
    setItems((prev) => [...prev, { article_id: article.id, quantite: '1' }])
    setArticleQuery('')
  }

  function updateQty(articleId, qty) {
    setItems((prev) => prev.map((x) => (String(x.article_id) === String(articleId) ? { ...x, quantite: qty } : x)))
  }

  function removeItem(articleId) {
    setItems((prev) => prev.filter((x) => String(x.article_id) !== String(articleId)))
  }

  function submit(e) {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit?.({
      nom: nom.trim(),
      description: description.trim() ? description.trim() : null,
      prix_vente: Number(prixVente),
      actif,
      items: items.map((it) => ({ article_id: Number(it.article_id), quantite: Number(it.quantite || 1) })),
    })
  }

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal packs-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">{mode === 'edit' ? 'Modifier un pack' : 'Ajouter un pack'}</div>
          <button className="modal-x" type="button" onClick={onClose} aria-label="Fermer">
            <X size={18} />
          </button>
        </div>

        <form className="modal-body" onSubmit={submit}>
          <div className="form-grid">
            <label className="form-label">
              Nom
              <input className="form-input" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex: Pack Ramadan" />
            </label>
            <label className="form-label">
              Prix vente (DH)
              <input className="form-input" value={prixVente} onChange={(e) => setPrixVente(e.target.value)} inputMode="decimal" placeholder="99" />
            </label>
          </div>

          <label className="form-label">
            Description
            <input className="form-input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optionnel" />
          </label>

          <label className="users-active-line">
            <input type="checkbox" checked={actif} onChange={(e) => setActif(e.target.checked)} />
            <span>Pack actif</span>
          </label>

          <div className="packs-items">
            <div className="packs-items-head">Produits du pack</div>

            <label className="form-label" style={{ marginBottom: '1rem' }}>
              Sélectionner un produit à ajouter
              <div className="select-wrap">
                <select
                  className="form-select"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      const a = selectable.find((x) => String(x.id) === String(e.target.value));
                      if (a) addItem(a);
                    }
                  }}
                >
                  <option value="" disabled>-- Choisir un produit --</option>
                  {selectable.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nom} ({a.code_article})
                    </option>
                  ))}
                </select>
                <div className="select-ico" style={{ pointerEvents: 'none' }}>▼</div>
              </div>
            </label>

            <div className="packs-items-list">
              {itemsView.length === 0 ? <div className="packs-empty">Ajoute au moins un produit.</div> : null}
              {itemsView.map((it) => (
                <div key={it.article_id} className="packs-item">
                  <div className="packs-item-main">
                    <div className="packs-item-title">{it.article?.nom || '—'}</div>
                    <div className="packs-item-sub">{it.article?.code_article || ''}</div>
                  </div>
                  <input
                    className="packs-qty"
                    value={it.quantite}
                    onChange={(e) => updateQty(it.article_id, e.target.value)}
                    inputMode="decimal"
                    placeholder="1"
                  />
                  <button className="icon-pill icon-pill-danger" type="button" onClick={() => removeItem(it.article_id)} aria-label="Supprimer">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="modal-foot">
            <button className="btn-ghost" type="button" onClick={onClose}>
              Annuler
            </button>
            <button className="btn-primary" type="submit" disabled={!canSubmit}>
              {mode === 'edit' ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
