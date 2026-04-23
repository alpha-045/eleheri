import { Trash2 } from 'lucide-react'

export function ViewSubCategories({ subCategories, deleteSub, totals }) {
  return (
    <>
      <div className="cat-grid">
        {subCategories.map((s) => (
          <div key={s.id} className="cat-card">
            <div className="cat-top">
              <div className="cat-ico">
                {s.image ? <img className="cat-img" src={s.image} alt={s.nom} /> : <div className="cat-img-fallback">{(s.nom || '?')[0]}</div>}
              </div>
              <div>
                <div className="cat-name">{s.nom}</div>
                <div className="cat-count">{s.produits} produits</div>
              </div>
            </div>
            <div className="cat-actions">
              <button
                className="cat-icon-btn cat-icon-btn-danger"
                type="button"
                onClick={() => deleteSub(s)}
                aria-label="Supprimer"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="cat-stats">
        <div>
          <div className="cat-stats-label">Total Sous-catégories</div>
          <div className="cat-stats-value">{totals.totalSous}</div>
        </div>
        <div className="cat-stats-right">
          <div className="cat-stats-label">Total Produits</div>
          <div className="cat-stats-value">{totals.totalProduits}</div>
        </div>
      </div>
    </>
  )
}
