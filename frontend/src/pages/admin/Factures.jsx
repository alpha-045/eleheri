import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../lib/api';
import { toast } from '../../lib/toast';
import { 
  FileText, 
  Download, 
  Eye, 
  Search,
  Filter,
  Calendar,
  User,
  CheckCircle,
  Clock,
  AlertCircle,
  X
} from 'lucide-react';

import '../../styles/ventes.css';

export default function Factures() {
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('all');
  const [selectedFacture, setSelectedFacture] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchFactures();
  }, []);

  const openDetails = (facture) => {
    setSelectedFacture(facture);
    setIsModalOpen(true);
  };

  const fetchFactures = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/factures?per_page=1000');
      const data = response?.data?.data || response?.data || response || [];
      setFactures(data);
    } catch {
      toast({ type: 'error', message: 'Erreur lors du chargement des factures' });
    } finally {
      setLoading(false);
    }
  };

  const filteredFactures = factures.filter(f => {
    const num = f.numero_facture || '';
    const clientName = f.vente?.client?.nom || 'Client de passage';
    const matchSearch = num.toLowerCase().includes(searchTerm.toLowerCase()) || 
                       clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatut = filterStatut === 'all' || f.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  const getStatutBadge = (statut) => {
    switch (statut) {
      case 'payée':
        return <span className="badge badge-success"><CheckCircle size={12} /> Payée</span>;
      case 'en_attente':
        return <span className="badge badge-warning"><Clock size={12} /> En attente</span>;
      case 'annulée':
        return <span className="badge badge-danger"><AlertCircle size={12} /> Annulée</span>;
      default:
        return <span className="badge badge-secondary">{statut}</span>;
    }
  };

  return (
    <div className="content factures-page">
      <div className="page-head">
        <div>
          <h1 className="page-title">
            <FileText size={28} color="#ef4444" />
            Factures
          </h1>
          <p className="page-subtitle">Gérez et consultez vos factures de vente</p>
        </div>
      </div>

      <div className="filters-card">
        <div className="filters-grid">
          <div className="search-box">
            <Search className="search-icon" size={20} />
            <input 
              type="text" 
              placeholder="Rechercher une facture ou un client..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label><Filter size={16} /> Statut:</label>
            <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}>
              <option value="all">Tous les statuts</option>
              <option value="payée">Payée</option>
              <option value="en_attente">En attente</option>
              <option value="annulée">Annulée</option>
            </select>
          </div>
        </div>
      </div>

      <div className="factures-card">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            Chargement des factures...
          </div>
        ) : filteredFactures.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} strokeWidth={1} />
            <p>Aucune facture trouvée</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="factures-table">
              <thead>
                <tr>
                  <th>N° Facture</th>
                  <th>Date</th>
                  <th>Client</th>
                  <th>Montant TTC</th>
                  <th>Statut</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFactures.map(facture => (
                  <tr key={facture.id}>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>{facture.numero_facture}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} style={{ color: '#94a3b8' }} />
                        {new Date(facture.date_facture).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <User size={14} style={{ color: '#94a3b8' }} />
                        {facture.vente?.client?.nom || 'Client de passage'}
                      </div>
                    </td>
                    <td style={{ fontWeight: 700 }}>{Number(facture.montant_ttc).toFixed(2)} MAD</td>
                    <td>{getStatutBadge(facture.statut)}</td>
                    <td className="text-right">
                      <div className="actions-buttons">
                        <button 
                          className="btn-icon" 
                          title="Voir détails"
                          onClick={() => openDetails(facture)}
                        >
                          <Eye size={18} />
                        </button>
                        <button 
                          className="btn-icon btn-primary" 
                          title="Télécharger PDF" 
                          onClick={() => {
                            setSelectedFacture(facture);
                            setIsModalOpen(true);
                            setTimeout(() => window.print(), 100);
                          }}
                        >
                          <Download size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && selectedFacture && (
        <InvoiceModal 
          facture={selectedFacture} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
}

function InvoiceModal({ facture, onClose }) {
  const items = facture.vente?.items || [];
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal invoice-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">Détails de la Facture</div>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body invoice-body" id="printable-invoice">
          {/* Invoice Header */}
          <div className="invoice-header">
            <div className="company-info">
              <div className="company-logo">EH</div>
              <div>
                <h2 className="company-name">EL HERRI</h2>
                <p className="company-details">Management Portal</p>
              </div>
            </div>
            <div className="invoice-meta">
              <div className="invoice-number">FACT-{facture.numero_facture}</div>
              <div className="invoice-date">Date: {new Date(facture.date_facture).toLocaleDateString()}</div>
            </div>
          </div>

          <hr className="invoice-divider" />

          {/* Client Info */}
          <div className="invoice-client">
            <div className="info-label">Facturé à:</div>
            <div className="client-name">{facture.vente?.client?.nom || 'Client de passage'}</div>
            {facture.vente?.client?.telephone && (
              <div className="client-tel">Tél: {facture.vente.client.telephone}</div>
            )}
          </div>

          {/* Items Table */}
          <table className="invoice-table">
            <thead>
              <tr>
                <th>Article</th>
                <th className="text-center">Prix Unitaire</th>
                <th className="text-center">Qté</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td>
                    <div className="item-name">{item.article?.nom || 'Article inconnu'}</div>
                    <div className="item-sku">{item.article?.code_article}</div>
                  </td>
                  <td className="text-center">{Number(item.prix_unitaire).toFixed(2)} MAD</td>
                  <td className="text-center">{item.quantite}</td>
                  <td className="text-right">{(item.quantite * item.prix_unitaire).toFixed(2)} MAD</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="invoice-summary">
            <div className="summary-row total">
              <span>TOTAL TTC</span>
              <span>{Number(facture.montant_ttc).toFixed(2)} MAD</span>
            </div>
            {facture.vente && (
              <>
                <div className="summary-row">
                  <span>Montant Payé</span>
                  <span>{Number(facture.vente.montant_paye).toFixed(2)} MAD</span>
                </div>
                <div className="summary-row balance">
                  <span>{Number(facture.vente.montant_total) > Number(facture.vente.montant_paye) ? 'Reste à payer' : 'Rendu'}</span>
                  <span>{Math.abs(Number(facture.vente.montant_total) - Number(facture.vente.montant_paye)).toFixed(2)} MAD</span>
                </div>
              </>
            )}
          </div>

          <div className="invoice-footer">
            <p>Merci pour votre confiance!</p>
            <p className="footer-small">Logiciel de gestion stock v2.0</p>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn-ghost" onClick={onClose} style={{ padding: '0 20px' }}>Fermer</button>
          <button className="btn-primary" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 24px' }}>
            <Download size={18} /> Imprimer / PDF
          </button>
        </div>
      </div>
    </div>
  );
}
