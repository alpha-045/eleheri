import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, X } from 'lucide-react'

export default function ProductModal({ open, mode = 'create', initialValues, sousCategories, onClose, onSubmit }) {
  const [nom, setNom] = useState('')
  const [prix, setPrix] = useState('')
  const [stock, setStock] = useState('')
  const [sousCategorieId, setSousCategorieId] = useState('')
  const [unite, setUnite] = useState('pièce')
  const [file, setFile] = useState(null)

  const canSubmit = useMemo(() => {
    return nom.trim() && prix !== '' && stock !== '' && sousCategorieId && unite
  }, [nom, prix, stock, sousCategorieId, unite])

  useEffect(() => {
    if (!open) return
    setNom(initialValues?.nom ?? '')
    setPrix(initialValues?.prix != null ? String(initialValues.prix) : '')
    setStock(initialValues?.stock != null ? String(initialValues.stock) : '')
    setSousCategorieId(initialValues?.sous_categorie_id != null ? String(initialValues.sous_categorie_id) : '')
    setUnite(initialValues?.unite ?? 'pièce')
    setFile(null)
  }, [open, initialValues])

  useEffect(() => {
    if (!open) return

    function onKeyDown(e) {
      if (e.key === 'Escape') onClose?.()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  function submit(e) {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit?.({
      nom: nom.trim(),
      prix: Number(prix),
      stock: Number(stock),
      sous_categorie_id: Number(sousCategorieId),
      unite,
      file,
    })
  }

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">{mode === 'edit' ? 'Modifier le produit' : 'Ajouter un nouveau produit'}</div>
          <button className="modal-x" type="button" onClick={onClose} aria-label="Fermer">
            <X size={18} />
          </button>
        </div>

        <form className="modal-body" onSubmit={submit}>
          <label className="form-label">
            Nom du produit
            <input className="form-input" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex: Tomates" />
          </label>

          <div className="form-grid">
            <label className="form-label">
              Prix (DH)
              <input
                className="form-input form-input-muted"
                inputMode="decimal"
                value={prix}
                onChange={(e) => setPrix(e.target.value)}
                placeholder="30"
              />
            </label>
            <label className="form-label">
              Stock
              <input
                className="form-input form-input-muted"
                inputMode="numeric"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="100"
              />
            </label>
          </div>

          <label className="form-label">
            Unité
            <div className="select-wrap">
              <select className="form-select" value={unite} onChange={(e) => setUnite(e.target.value)}>
                <option value="pièce">pièce</option>
                <option value="kg">kg</option>
                <option value="L">L</option>
                <option value="m">m</option>
              </select>
              <ChevronDown className="select-ico" size={16} />
            </div>
          </label>

          <label className="form-label">
            Catégorie
            <div className="select-wrap">
              <select className="form-select" value={sousCategorieId} onChange={(e) => setSousCategorieId(e.target.value)}>
                <option value="" disabled>
                  Sélectionner
                </option>
                {sousCategories.map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    {(sc?.categorie?.nom ? `${sc.categorie.nom} / ` : '') + sc.nom}
                  </option>
                ))}
              </select>
              <ChevronDown className="select-ico" size={16} />
            </div>
          </label>

          <div className="form-label">
            Image du produit
            <div className="file-row">
              <label className="file-btn">
                Choisir un fichier
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  style={{ display: 'none' }}
                />
              </label>
              <div className="file-name">{file ? file.name : 'Aucun fichier choisi'}</div>
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
