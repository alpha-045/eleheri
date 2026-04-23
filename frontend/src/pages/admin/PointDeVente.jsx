import React, { useState, useEffect, useRef } from 'react';
import { Search, Trash2, Plus, Minus, User, Monitor, X, Check } from 'lucide-react';
import { usePOS } from '../../features/pos/usePOS';
import '../../styles/pos.css';

export default function PointDeVente() {
  const {
    articles,
    categories,
    clients,
    loading,
    search,
    setSearch,
    selectedCategory,
    setSelectedCategory,
    cart,
    addToCart,
    removeFromCart,
    updateQty,
    clearCart,
    totals,
    selectedClient,
    setSelectedClient,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    saleResult,
    setSaleResult,
    confirmSale,
    submitting
  } = usePOS();

  const searchInputRef = useRef(null);

  // Focus search on F2
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading && articles.length === 0) {
    return <div className="page">Chargement du POS...</div>;
  }

  return (
    <div className="pos-container">
      {/* MAIN SECTION: PRODUCTS */}
      <div className="pos-main">
        <div className="pos-header">
          <div className="pos-search-wrapper">
            <Search className="pos-search-icon" size={20} />
            <input
              ref={searchInputRef}
              className="pos-search-input"
              placeholder="Rechercher article / Scanner code-barres... [F2]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  // Try to find exact match by code_article (barcode)
                  const exactMatch = articles.find(a => 
                    a.code_article.toLowerCase() === search.toLowerCase().trim()
                  );
                  if (exactMatch) {
                    addToCart(exactMatch);
                    setSearch(''); // Clear search after adding
                    e.preventDefault();
                  }
                }
              }}
            />
          </div>
        </div>

        <div className="pos-categories">
          <button
            className={`pos-category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            Tous
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`pos-category-btn ${String(selectedCategory) === String(cat.id) ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.nom}
            </button>
          ))}
        </div>

        <div className="pos-grid">
          {articles.map((article) => {
            const stock = Number(article.stock || 0)
            const stockTone = stock <= 0 ? 'out' : stock <= 5 ? 'low' : 'ok'
            const price = selectedClient?.type_client === 'gros' ? article.prix_gros : article.prix
            return (
            <div
              key={article.id}
              className="pos-product-card"
              onClick={() => addToCart(article)}
            >
              <div className="pos-product-media">
                {article.img && article.img !== '/imagelogin.png' ? (
                  <img className="pos-product-img" src={article.img} alt={article.nom} loading="lazy" />
                ) : (
                  <div className="pos-product-img-fallback" aria-hidden="true">
                    <Monitor size={40} />
                  </div>
                )}
                <div className={`pos-stock-badge pos-stock-${stockTone}`}>
                  {stock <= 0 ? 'Rupture' : `Stock: ${stock}`}
                </div>
                <div className="pos-price-pill">{price} MAD</div>
              </div>
              <div className="pos-product-info">
                <div className="pos-product-name">{article.nom}</div>
                <div className="pos-product-meta">
                  <span className="pos-product-meta-code">{article.code_article}</span>
                </div>
              </div>
            </div>
            )
          })}
          {articles.length === 0 && (
            <div className="pos-cart-empty" style={{ gridColumn: '1 / -1' }}>
              <Search size={48} />
              <p>Aucun produit trouvé</p>
            </div>
          )}
        </div>
      </div>

      {/* SIDEBAR: CART */}
      <div className="pos-sidebar">
        <div className="pos-client-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <User size={18} color="#64748b" />
            <span style={{ fontWeight: 700, fontSize: '14px', color: '#64748b' }}>Client</span>
          </div>
          <select
            className="pos-client-selector"
            value={selectedClient?.id || ''}
            onChange={(e) => {
              const client = clients.find(c => String(c.id) === e.target.value);
              setSelectedClient(client || null);
            }}
          >
            <option value="">Client de passage</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.nom} {client.type_client === 'gros' ? '(Gros)' : ''}
              </option>
            ))}
          </select>
          {selectedClient && selectedClient.solde > 0 && (
            <div style={{ marginTop: '8px', color: '#ef4444', fontSize: '12px', fontWeight: 700 }}>
              ⚠️ Solde impayé: {selectedClient.solde} MAD
            </div>
          )}
        </div>

        <div className="pos-cart">
          {cart.length === 0 ? (
            <div className="pos-cart-empty">
              <Trash2 size={48} />
              <p>Le panier est vide</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="pos-cart-item">
                <div className="pos-item-header">
                  <div className="pos-item-name">{item.nom}</div>
                  <Trash2
                    className="pos-item-remove"
                    size={16}
                    onClick={() => removeFromCart(item.id)}
                  />
                </div>
                <div className="pos-item-controls">
                  <div className="pos-qty-btns">
                    <button className="pos-qty-btn" onClick={() => updateQty(item.id, -1)}><Minus size={14} /></button>
                    <span className="pos-qty-value">{item.qty}</span>
                    <button className="pos-qty-btn" onClick={() => updateQty(item.id, 1)}><Plus size={14} /></button>
                  </div>
                  <div className="pos-item-total">
                    {(selectedClient?.type_client === 'gros' ? item.prix_gros : item.prix) * item.qty} MAD
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pos-totals">
          <div className="pos-total-final">
            <span>TOTAL</span>
            <span>{totals.total.toFixed(2)} MAD</span>
          </div>
        </div>

        <div className="pos-actions">
          <button className="pos-btn-clear" onClick={clearCart}>Vider</button>
          <button
            className="pos-btn-confirm"
            disabled={cart.length === 0}
            onClick={() => setIsPaymentModalOpen(true)}
          >
            Confirmer
          </button>
        </div>
      </div>

      {/* PAYMENT MODAL */}
      {isPaymentModalOpen && (
        <PaymentModal
          total={totals.total}
          onClose={() => setIsPaymentModalOpen(false)}
          onConfirm={confirmSale}
          submitting={submitting}
        />
      )}
      {/* SUCCESS MODAL */}
      {saleResult && (
        <SuccessModal 
          result={saleResult} 
          onClose={() => setSaleResult(null)} 
        />
      )}
    </div>
  );
}

function SuccessModal({ result, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal" style={{ width: '400px', textAlign: 'center' }}>
        <div className="modal-body" style={{ padding: '30px' }}>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              background: '#dcfce7', 
              color: '#16a34a', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 15px'
            }}>
              <Check size={32} />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1e293b' }}>Vente confirmée!</h2>
          </div>

          <div id="printable-invoice" style={{ 
            background: '#f8fafc', 
            borderRadius: '12px', 
            padding: '20px', 
            marginBottom: '20px',
            textAlign: 'left',
            border: '1px dashed #cbd5e1'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '15px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 900, margin: 0, color: '#0f172a' }}>EL HERRI</h2>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 10px' }}>Reçu de Vente</p>
              <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '10px 0' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#64748b' }}>N° Facture:</span>
              <span style={{ fontWeight: 700 }}>{result.numero_facture}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#64748b' }}>Client:</span>
              <span style={{ fontWeight: 700 }}>{result.client?.nom || 'Client de passage'}</span>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '10px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#64748b' }}>Total:</span>
              <span style={{ fontWeight: 700 }}>{result.total.toFixed(2)} MAD</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ color: '#64748b' }}>Payé:</span>
              <span style={{ fontWeight: 700 }}>{result.paid.toFixed(2)} MAD</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
              <span style={{ fontWeight: 700 }}>{result.paid < result.total ? 'Reste (Crédit):' : 'Rendu:'}</span>
              <span style={{ fontWeight: 800 }}>{Math.abs(result.change).toFixed(2)} MAD</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="btn-primary" 
              style={{ flex: 1, background: '#1e293b' }}
              onClick={() => window.print()}
            >
              Imprimer
            </button>
            <button 
              className="btn-ghost" 
              style={{ flex: 1, border: '1px solid #e2e8f0' }}
              onClick={onClose}
            >
              Nouvelle vente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentModal({ total, onClose, onConfirm, submitting }) {
  const [method, setMethod] = useState('espèces');
  const [amountPaid, setAmountPaid] = useState(total);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: '500px' }}>
        <div className="modal-head">
          <div className="modal-title">Finaliser la vente</div>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div className="pos-payment-grid">
            <div className="payment-input-group">
              <label className="form-label">Montant à payer</label>
              <div className="payment-input" style={{ background: '#f8fafc' }}>
                {total.toFixed(2)} MAD
              </div>
            </div>
            <div className="payment-input-group">
              <label className="form-label">Montant reçu</label>
              <input
                type="number"
                className="payment-input"
                value={amountPaid}
                onChange={e => setAmountPaid(Number(e.target.value))}
                autoFocus
              />
            </div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <label className="form-label">Mode de paiement</label>
            <div className="payment-methods">
              {['espèces', 'carte', 'virement', 'credit'].map(m => (
                <button
                  key={m}
                  className={`method-btn ${method === m ? 'active' : ''}`}
                  onClick={() => setMethod(m)}
                >
                  <span style={{ textTransform: 'capitalize' }}>{m}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="change-display">
            <span className="change-label">{amountPaid < total ? 'Reste à payer (Dette)' : 'Rendu'}</span>
            <span className={`change-amount ${amountPaid < total ? 'text-danger' : ''}`}>
              {Math.abs(amountPaid - total).toFixed(2)} MAD
            </span>
          </div>

          <div className="modal-foot" style={{ marginTop: '20px' }}>
            <button className="btn-ghost" onClick={onClose} disabled={submitting}>Annuler</button>
            <button
              className="btn-primary"
              style={{ background: '#ef4444' }}
              onClick={() => onConfirm({ method, amountPaid })}
              disabled={submitting}
            >
              {submitting ? 'Traitement...' : 'Valider la vente'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
