import { useEffect, useState } from 'react'

export function LivreurModal({ open, roleId, initialValues, onClose, onSubmit }) {
  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [actif, setActif] = useState(true)

  useEffect(() => {
    if (!open) return
    setNom(initialValues?.nom ?? '')
    setPrenom(initialValues?.prenom ?? '')
    setEmail(initialValues?.email ?? '')
    setPassword('')
    setActif(initialValues?.actif != null ? !!initialValues.actif : true)
  }, [open, initialValues])

  if (!open) return null
  const isEdit = !!initialValues?.id
  const canSubmit = nom.trim() && email.trim() && (isEdit ? true : password.trim().length >= 6)

  function submit(e) {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit?.({
      role_id: Number(roleId),
      nom: nom.trim(),
      prenom: prenom.trim() ? prenom.trim() : null,
      email: email.trim(),
      mot_de_passe: isEdit ? (password.trim() ? password.trim() : null) : password.trim(),
      actif,
    })
  }

  return (
    <div className="users-modal-overlay" onMouseDown={onClose}>
      <div className="users-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="users-modal-head">
          <div className="users-modal-title">{isEdit ? 'Modifier le livreur' : 'Ajouter un livreur'}</div>
          <button className="users-modal-x" type="button" onClick={onClose} aria-label="Fermer">
            ×
          </button>
        </div>

        <form className="users-modal-body" onSubmit={submit}>
          <label className="users-field">
            Adresse email
            <input className="users-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="exemple@email.com" />
          </label>

          <div className="users-row">
            <label className="users-field">
              Nom
              <input className="users-input" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom" />
            </label>
            <label className="users-field">
              Prénom
              <input className="users-input" value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Prénom" />
            </label>
          </div>

          <label className="users-field">
            Mot de passe{isEdit ? ' (optionnel)' : ''}
            <input
              className="users-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isEdit ? 'Laisser vide pour ne pas changer' : 'Min 6 caractères'}
              type="password"
            />
          </label>

          <label className="users-active-line">
            <input type="checkbox" checked={actif} onChange={(e) => setActif(e.target.checked)} />
            <span>Livreur actif</span>
          </label>

          <div className="users-modal-actions">
            <button className="users-btn users-btn-ghost" type="button" onClick={onClose}>
              Annuler
            </button>
            <button className="users-btn users-btn-danger" type="submit" disabled={!canSubmit}>
              {isEdit ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
