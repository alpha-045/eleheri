import { useEffect, useMemo, useState } from "react";
import { Eye, Search, X } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { apiFetch } from "../../lib/api";
import { CSVLink } from "react-csv";
import Alert from "../../components/Alert";
import "../../styles/ventes.css";

export default function Ventes() {
  const outlet = useOutletContext() || {};
  const search = (outlet.search || "").toString();
  const setSearch =
    typeof outlet.setSearch === "function" ? outlet.setSearch : () => {};

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modeFilter, setModeFilter] = useState("all");

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/ventes?per_page=1000");
      const list = Array.isArray(res?.data) ? res.data : res?.data?.data || [];
      setItems(list);
    } catch (e) {
      setError(e?.message || "Erreur");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  function formatDate(dateString) {
    if (!dateString) return "—";
    const d = new Date(dateString);
    const pad = (n) => n.toString().padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((v) => {
      const mode = (v?.mode_paiement || "").toString();
      const okMode = modeFilter === "all" ? true : mode === modeFilter;
      if (!okMode) return false;
      if (!q) return true;
      const numero = (v?.commande?.numero || `#${v?.commande_vente_id || ""}`)
        .toString()
        .toLowerCase();
      const client = (v?.client?.nom || "").toString().toLowerCase();
      const user = (v?.utilisateur?.nom || "").toString().toLowerCase();
      return numero.includes(q) || client.includes(q) || user.includes(q);
    });
  }, [items, search, modeFilter]);

  function openView(v) {
    setSelected(v);
    setOpen(true);
  }

  return (
    <section className="content">
      <div className="page-head">
        <div>
          <div className="page-title">Ventes</div>
          <div className="page-subtitle">Historique des ventes</div>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <div className="tool-search">
            <Search size={16} color="#94a3b8" />
            <input
              className="tool-search-input"
              placeholder="Rechercher (commande, client, utilisateur)…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="tool-select"
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
          >
            <option value="all">Tous les paiements</option>
            <option value="espèces">Espèces</option>
            <option value="carte">Carte</option>
            <option value="virement">Virement</option>
            <option value="chèque">Chèque</option>
          </select>
        </div>
        <div className="toolbar-right">
          <button className="btn-ghost" type="button">

          <CSVLink
            data={filtered}
            filename="ventes.csv"
            style={{ color: "red", textDecoration: "none" }}
          >
            Exporter CSV
          </CSVLink>
          </button>
        </div>
      </div>

      <Alert type="error" message={error} />

      <div className="orders-card">
        <div className="orders-card-head">
          <div className="orders-card-title">
            Liste des ventes ({filtered.length})
          </div>
        </div>

        {loading ? (
          <div className="orders-empty">Loading…</div>
        ) : (
          <div className="orders-table-wrap">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>id</th>
                  <th>Commande</th>
                  <th>Client</th>
                  <th>Total</th>
                  <th>Remise</th>
                  <th>Payé</th>
                  <th>Mode</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => (
                  <tr key={v.id}>
                    <td className="fw-500">{v.id} </td>
                    <td className="fw-500">
                      {v?.commande?.numero || `#${v?.commande_vente_id || "—"}`}
                    </td>
                    <td>{v?.client?.nom || "—"}</td>
                    <td>{Number(v?.montant_total ?? 0)} MAD</td>
                    <td>{Number(v?.montant_remise ?? 0)} MAD</td>
                    <td>{Number(v?.montant_paye ?? 0)} MAD</td>
                    <td>
                      <span className="type-badge">
                        {v?.mode_paiement || "—"}
                      </span>
                    </td>
                    <td>{formatDate(v?.date_vente || v?.created_at)}</td>
                    <td>
                      <div className="orders-actions">
                        <button
                          className="icon-pill"
                          type="button"
                          onClick={() => openView(v)}
                          aria-label="Voir"
                        >
                          <Eye size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="orders-empty-cell">
                      Aucune vente
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {open && selected ? (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-title">Détails de la vente</div>
              <button
                className="modal-x"
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div>
                <div className="detail-label">Commande</div>
                <div className="detail-value detail-strong">
                  {selected?.commande?.numero ||
                    `Commande #${selected?.commande_vente_id}`}
                </div>
              </div>

              <div>
                <div className="detail-label">Client</div>
                <div className="detail-value detail-strong">
                  {selected?.client?.nom || "—"}
                </div>
              </div>

              <div className="form-grid">
                <div>
                  <div className="detail-label">Montant total</div>
                  <div className="detail-value detail-strong">
                    {Number(selected?.montant_total ?? 0)} MAD
                  </div>
                </div>
                <div>
                  <div className="detail-label">Montant payé</div>
                  <div className="detail-value detail-strong">
                    {Number(selected?.montant_paye ?? 0)} MAD
                  </div>
                </div>
              </div>

              <div className="form-grid">
                <div>
                  <div className="detail-label">Remise</div>
                  <div className="detail-value detail-strong">
                    {Number(selected?.montant_remise ?? 0)} MAD
                  </div>
                </div>
                <div>
                  <div className="detail-label">Mode de paiement</div>
                  <div className="detail-value detail-strong">
                    {selected?.mode_paiement || "—"}
                  </div>
                </div>
              </div>

              <div>
                <div className="detail-label">Date</div>
                <div className="detail-value detail-strong">
                  {formatDate(selected?.date_vente || selected?.created_at)}
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <button
                className="btn-ghost"
                type="button"
                onClick={() => setOpen(false)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
