import { useEffect, useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Calendar, Search, X } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { apiFetch } from "../../lib/api";
import "../../styles/mouvements-stock.css";

export default function MouvementsStock() {
  const outlet = useOutletContext() || {};
  const search = (outlet.search || "").toString();
  const setSearch =
    typeof outlet.setSearch === "function" ? outlet.setSearch : () => {};

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filterType, setFilterType] = useState('all');
  const [filterMotif, setFilterMotif] = useState('all');

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/mouvements_stock?per_page=1000");
      const data = Array.isArray(res?.data) ? res.data : res?.data?.data || [];
      setItems(data);
    } catch (e) {
      setError(e?.message || "Erreur lors du chargement des mouvements");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((m) => {
      const articleNom = (m?.article?.nom || "").toLowerCase();
      const code = (m?.article?.code_article || "").toLowerCase();
      const motif = (m?.motif || "").toLowerCase();
      
      const matchSearch = articleNom.includes(q) || code.includes(q) || motif.includes(q);
      const matchType = filterType === 'all' || m.type_mouvement === filterType;
      const matchMotif = filterMotif === 'all' || m.motif === filterMotif;
      
      return matchSearch && matchType && matchMotif;
    });
  }, [items, search, filterType, filterMotif]);

  const stats = useMemo(() => {
    let entree = 0;
    let sortie = 0;
    for (const m of filtered) {
      if (m?.type_mouvement === "entree") entree += 1;
      if (m?.type_mouvement === "sortie") sortie += 1;
    }
    return { total: filtered.length, entree, sortie };
  }, [filtered]);

  return (
    <div className="content movements-page">
      <div className="movements-shell">
        <div className="movements-head">
          <div>
            <div className="movements-title">
              Historique des Mouvements — سجل التحركات
            </div>
            <div className="movements-subtitle">
              Historique complet des entrées et sorties de stock
            </div>
          </div>

          <div className="movements-head-actions">
            <button
              className="primary"
              type="button"
              onClick={loadAll}
              disabled={loading}
            >
              Actualiser
            </button>
          </div>
        </div>

        <div className="movements-toolbar">
          <div className="movements-toolbar-left">
            <div className="movements-search">
              <Search size={16} color="#94a3b8" />
              <input
                className="movements-search-input"
                placeholder="Rechercher (article, code, motif)…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search ? (
                <button
                  className="movements-search-clear"
                  type="button"
                  aria-label="Effacer"
                  onClick={() => setSearch("")}
                >
                  <X size={16} />
                </button>
              ) : null}
            </div>

            <select
              className="movements-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">Tous les types</option>
              <option value="entree">Entrées (+)</option>
              <option value="sortie">Sorties (-)</option>
            </select>

            <select
              className="movements-select"
              value={filterMotif}
              onChange={(e) => setFilterMotif(e.target.value)}
            >
              <option value="all">Tous les motifs</option>
              <option value="achat">Achat</option>
              <option value="vente">Vente</option>
              <option value="retour">Retour</option>
              <option value="ajustement">Ajustement</option>
              <option value="perte">Perte</option>
              <option value="don">Don</option>
            </select>
          </div>

          <div className="movements-toolbar-right">
            <div className="movements-chip">
              <span className="movements-chip-label">Total</span>
              <span className="movements-chip-value">{stats.total}</span>
            </div>
            <div className="movements-chip movements-chip-in">
              <span className="movements-chip-label">Entrées</span>
              <span className="movements-chip-value">{stats.entree}</span>
            </div>
            <div className="movements-chip movements-chip-out">
              <span className="movements-chip-label">Sorties</span>
              <span className="movements-chip-value">{stats.sortie}</span>
            </div>
          </div>
        </div>

        {error ? <div className="movements-error">{error}</div> : null}

        {loading ? (
          <div className="movements-loading">
            <div className="movements-loading-spinner" />
            Chargement…
          </div>
        ) : (
          <div className="movements-body">
            <div className="movements-table-card">
              <div className="movements-table-wrap">
                <table className="movements-table">
                  <thead>
                    <tr>
                      <th>Date & Heure</th>
                      <th>Article</th>
                      <th>Type</th>
                      <th>Motif</th>
                      <th>Quantité</th>
                      <th>Utilisateur</th>
                      <th>Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="empty-cell">
                          <div className="movements-empty">
                            <Search size={40} />
                            <p>Aucun mouvement trouvé</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filtered.map((m) => (
                        <tr
                          key={m.id}
                          className={
                            m.type_mouvement === "entree"
                              ? "row-entree"
                              : "row-sortie"
                          }
                        >
                          <td>
                            <div className="date-cell">
                              <Calendar size={14} />
                              <div>
                                <div className="date-main">
                                  {new Date(m.created_at).toLocaleDateString()}
                                </div>
                                <div className="date-sub">
                                  {new Date(m.created_at).toLocaleTimeString(
                                    [],
                                    { hour: "2-digit", minute: "2-digit" },
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="article-cell">
                              <div className="article-nom">
                                {m?.article?.nom}
                              </div>
                              <div className="article-code">
                                {m?.article?.code_article}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span
                              className={`badge-mouv ${
                                m.type_mouvement === "entree"
                                  ? "mouv-in"
                                  : "mouv-out"
                              }`}
                            >
                              {m.type_mouvement === "entree" ? (
                                <ArrowDownLeft size={14} />
                              ) : (
                                <ArrowUpRight size={14} />
                              )}
                              {m.type_mouvement === "entree"
                                ? "Entrée"
                                : "Sortie"}
                            </span>
                          </td>
                          <td>
                            <span className="motif-tag">{m.motif}</span>
                          </td>
                          <td className="qty-cell">
                            <span
                              className={
                                m.type_mouvement === "entree"
                                  ? "text-success"
                                  : "text-danger"
                              }
                            >
                              {m.type_mouvement === "entree" ? "+" : "-"}
                              {m.quantite}
                            </span>
                          </td>
                          <td>
                            <div className="user-cell">
                              {m.utilisateur?.nom || "Système"}
                            </div>
                          </td>
                          <td className="note-cell">
                            {m.note ? (
                              <div className="note-text" title={m.note}>
                                {m.note}
                              </div>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
