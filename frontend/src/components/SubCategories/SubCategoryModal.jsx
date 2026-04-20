import { useState } from 'react'
import { X } from 'lucide-react'

export function SubCategoryModal({ open, onClose, onSubmit }) {
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
