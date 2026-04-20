import { Pencil, Trash2 } from 'lucide-react'

export function ViewClients({ filtered, openEdit, openDelete }) {
  function typeLabel(t) {
    return t === 'gros' ? 'Gros' : 'Détail'
  }

  return (
    <div className="orders-table-wrap">
      <table className="orders-table">
        <thead>
          <tr>
            <th>id</th>
            <th>Nom</th>
            <th>Téléphone</th>
            <th>Email</th>
            <th>Type</th>
            <th>Adresse</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((c) => (
            <tr key={c.id}>
              <td style={{ fontWeight: 'bolder' }}>{c.id}</td>
              <td className="fw-500">{c.nom}</td>
              <td>{c.telephone || '—'}</td>
              <td>{c.email || '—'}</td>
              <td>
                <span className="type-badge">{typeLabel((c?.type_client || 'detail').toString())}</span>
              </td>
              <td>{c.adresse || '—'}</td>
              <td>
                <span className={c.actif ? 'status-badge status-livre' : 'status-badge status-annule'}>
                  {c.actif ? 'Actif' : 'Inactif'}
                </span>
              </td>
              <td>
                <div className="orders-actions">
                  <button className="icon-pill" type="button" onClick={() => openEdit(c)} aria-label="Modifier">
                    <Pencil size={18} />
                  </button>
                  <button
                    className="icon-pill icon-pill-danger"
                    type="button"
                    onClick={() => openDelete(c)}
                    aria-label="Supprimer"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {filtered.length === 0 ? (
            <tr>
              <td colSpan="8" className="orders-empty-cell">
                Aucun client
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  )
}
