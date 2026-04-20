import { Bike, Car, LocateFixed, Trash2, UserRound } from 'lucide-react'

export function ViewLivreurs({ livreurs, statsByUserId, openEdit, askDelete, submitting, hasPermission }) {
  if (livreurs.length === 0) {
    return <div className="users-empty">Aucun livreur</div>
  }

  function openMap(loc) {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc || '')}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="livreurs-list">
      {livreurs.map((u) => {
        const full = `${u.nom || ''} ${u.prenom || ''}`.trim() || '—'
        const initials = full
          .split(' ')
          .filter(Boolean)
          .slice(0, 2)
          .map((x) => x[0]?.toUpperCase())
          .join('')

        const s = statsByUserId.get(String(u.id)) || { active: 0, deliveredToday: 0 }
        const VehicleIcon = u.vehicle === 'Moto' ? Bike : Car
        const statusClass = u.online ? 'livreurs-pill livreurs-pill-green' : 'livreurs-pill livreurs-pill-gray'
        const statusLabel = u.online ? 'En ligne' : 'Hors ligne'

        return (
          <div key={u.id} className="livreur-card">
            <div className="livreur-left">
              <div className="livreur-avatar">
                <div className="livreur-avatar-in">{initials || 'L'}</div>
                <span className={u.online ? 'livreur-dot livreur-dot-on' : 'livreur-dot'} />
              </div>

              <div className="livreur-info">
                <div className="livreur-topline">
                  <div className="livreur-name">{full}</div>
                  <span className={statusClass}>{statusLabel}</span>
                  <span className="livreurs-pill livreurs-pill-outline">
                    <VehicleIcon size={14} />
                    {u.vehicle}
                  </span>
                </div>

                <div className="livreur-grid">
                  <div className="livreur-line">
                    <UserRound size={16} />
                    <span>{u.email}</span>
                  </div>
                  <div className="livreur-line">
                    <span>☎</span>
                    <span>{u.phone}</span>
                  </div>
                  <div className="livreur-line">
                    <span>📍</span>
                    <span>{u.location}</span>
                  </div>
                  <div className="livreur-line">
                    <span>📦</span>
                    <span>{s.active} commandes actives</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="livreur-metrics">
              <div className="livreur-metric">
                <div className="livreur-metric-value">{s.deliveredToday}</div>
                <div className="livreur-metric-label">Livrées aujourd&apos;hui</div>
              </div>
              <div className="livreur-metric">
                <div className="livreur-metric-value livreur-metric-amber">{u.rating}</div>
                <div className="livreur-metric-label">Note</div>
              </div>
            </div>

            <div className="livreur-actions">
              <button
                className="livreur-btn"
                type="button"
                onClick={() => openEdit(u)}
                disabled={!hasPermission('utilisateurs.manage')}
              >
                Voir profil
              </button>
              <button className="livreur-btn livreur-btn-secondary" type="button" onClick={() => openMap(u.location)}>
                <LocateFixed size={16} />
                Localiser
              </button>
              <button
                className="livreur-icon-danger"
                type="button"
                aria-label="Supprimer"
                onClick={() => askDelete(u)}
                disabled={submitting || !hasPermission('utilisateurs.manage')}
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
