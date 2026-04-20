export function PromoTabs({ tab, setTab }) {
  return (
    <div className="promo-tabs">
      <button
        className={tab === 'active' ? 'promo-tab promo-tab-active' : 'promo-tab'}
        type="button"
        onClick={() => setTab('active')}
      >
        Actives
      </button>
      <button
        className={tab === 'scheduled' ? 'promo-tab promo-tab-active' : 'promo-tab'}
        type="button"
        onClick={() => setTab('scheduled')}
      >
        Programmées
      </button>
      <button
        className={tab === 'expired' ? 'promo-tab promo-tab-active' : 'promo-tab'}
        type="button"
        onClick={() => setTab('expired')}
      >
        Expirées
      </button>
    </div>
  )
}
