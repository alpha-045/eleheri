import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Check, Pencil, Plus, X } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import {
  BarcodeFormat,
  BrowserMultiFormatReader,
  DecodeHintType,
} from "@zxing/library";
import { apiFetch } from "../../lib/api";
import Alert from "../../components/Alert";
import ProductModal from "../../components/products/ProductModal";
import "../../styles/mouvements-stock.css";
import "../../styles/produits.css";

export default function SortieStock() {
  const outlet = useOutletContext() || {};
  const search = (outlet.search || outlet.searchQuery || "").toString();

  const [articles, setArticles] = useState([]);
  const [sousCategories, setSousCategories] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [mouvements, setMouvements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("scan");

  const [toast, setToast] = useState(null);
  const [missingCode, setMissingCode] = useState("");
  const [askAddOpen, setAskAddOpen] = useState(false);
  const [addProductOpen, setAddProductOpen] = useState(false);

  const [barcode, setBarcode] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const videoId = "ms-sortie-video";

  const [articleQuery, setArticleQuery] = useState("");

  const [items, setItems] = useState([]);
  const [batchMotif, setBatchMotif] = useState("vente");
  const [batchNote, setBatchNote] = useState("");

  const [form, setForm] = useState({
    article_id: "",
    motif: "perte",
    quantite: "",
    note: "",
  });

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [articlesRes, stockRes, mouvRes, scRes] = await Promise.all([
        apiFetch("/api/articles?per_page=100"),
        apiFetch("/api/stock?per_page=100"),
        apiFetch("/api/mouvements_stock?per_page=100"),
        apiFetch("/api/sous_categories?per_page=200"),
      ]);

      const a = Array.isArray(articlesRes?.data)
        ? articlesRes.data
        : articlesRes?.data?.data || [];
      const s = Array.isArray(stockRes?.data)
        ? stockRes.data
        : stockRes?.data?.data || [];
      const m = Array.isArray(mouvRes?.data)
        ? mouvRes.data
        : mouvRes?.data?.data || [];
      const sc = Array.isArray(scRes?.data) ? scRes.data : scRes?.data?.data || [];

      setArticles(a);
      setStocks(s);
      setMouvements(m);
      setSousCategories(sc);
    } catch (e) {
      setError(e?.message || "Erreur");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const articleById = useMemo(
    () => new Map(articles.map((a) => [String(a.id), a])),
    [articles],
  );
  const stockByArticleId = useMemo(
    () => new Map(stocks.map((s) => [String(s.article_id), s])),
    [stocks],
  );
  const articleByCode = useMemo(() => {
    const map = new Map();
    for (const a of articles) {
      const code = (a?.code_article || "").toString().trim();
      if (code) map.set(code, a);
    }
    return map;
  }, [articles]);

  const filteredMouvements = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = mouvements.filter(
      (m) => (m?.type_mouvement || "").toString() === "sortie",
    );
    if (!q) return list;
    return list.filter((m) => {
      const numero = (m?.id || "").toString().toLowerCase();
      const articleNom = (
        m?.article?.nom ||
        articleById.get(String(m?.article_id || ""))?.nom ||
        ""
      )
        .toString()
        .toLowerCase();
      const motif = (m?.motif || "").toString().toLowerCase();
      return numero.includes(q) || articleNom.includes(q) || motif.includes(q);
    });
  }, [mouvements, search, articleById]);

  function formatDate(dateString) {
    if (!dateString) return "";
    const d = new Date(dateString);
    const pad = (n) => n.toString().padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const article_id = String(form.article_id || "");
    const quantite = Number(form.quantite);
    if (!article_id) {
      setError("Sélectionne un article");
      return;
    }
    if (!Number.isFinite(quantite) || quantite <= 0) {
      setError("Quantité invalide");
      return;
    }

    setSubmitting(true);
    try {
      if (form.motif === "vente") {
        let stock = stockByArticleId.get(article_id);
        if (!stock) {
          stock = await apiFetch("/api/stock", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              article_id: Number(article_id),
              quantite: 0,
              seuil_min: 0,
            }),
          });
        }

        const currentQty = Number(stock?.quantite ?? 0);
        if (currentQty < quantite) {
          throw new Error("Stock insuffisant");
        }

        await apiFetch(`/api/stock/${stock.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantite: currentQty - quantite }),
        });

        await apiFetch("/api/mouvements_stock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            article_id: Number(article_id),
            type_mouvement: "sortie",
            motif: "vente",
            quantite,
            note: form.note || null,
            reference_type: "sortie",
            reference_id: null,
          }),
        });
      } else {
        const motifMap = {
          perte: "perte",
          don: "don",
          ajustement: "ajustement",
        };
        await apiFetch("/api/sorties", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            article_id: Number(article_id),
            motif: motifMap[form.motif] || "perte",
            quantite,
            note: form.note || null,
          }),
        });
      }

      setForm({ article_id: "", motif: "perte", quantite: "", note: "" });
      setSuccess("Sortie enregistrée");
      await loadAll();
    } catch (e2) {
      setError(e2?.message || "Erreur");
    } finally {
      setSubmitting(false);
    }
  }

  function showToast(next) {
    setToast(next);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 2600);
  }

  function stopScanner() {
    try {
      readerRef.current?.reset?.();
    } catch {
      // ignore
    }
    readerRef.current = null;
    setScanning(false);
  }

  function startScanner() {
    setCameraError("");
    setScanning(true);

    if (!videoRef.current) {
      setCameraError("La caméra n'est pas prête.");
      setScanning(false);
      return;
    }

    stopScanner();

    try {
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.CODE_128,
        BarcodeFormat.QR_CODE,
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);

      const reader = new BrowserMultiFormatReader(hints, 500);
      readerRef.current = reader;

      const constraints = {
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const maybePromise = reader.decodeFromConstraints(
        constraints,
        videoId,
        (result, err) => {
          if (result) {
            const text = result.getText?.()
              ? result.getText()
              : String(result);
            const value = (text || "").toString();
            if (!value) return;
            setBarcode(value);
            stopScanner();
            onBarcode(value);
            return;
          }

          if (
            err &&
            err.name &&
            err.name !== "NotFoundException" &&
            err.name !== "ChecksumException" &&
            err.name !== "FormatException"
          ) {
            setCameraError("Erreur scanner: " + err.name);
          }
        },
      );

      if (maybePromise?.catch) {
        maybePromise.catch(() => {
          setCameraError("Accès caméra refusé ou indisponible.");
          setScanning(false);
        });
      }
    } catch {
      setCameraError(
        "Impossible d'accéder à la caméra. Vérifie les permissions.",
      );
      setScanning(false);
    }
  }

  function onBarcode(value) {
    const code = (value || "").toString().trim();
    if (!code) return;

    const a = articleByCode.get(code);
    if (!a) {
      stopScanner();
      setMissingCode(code);
      setAskAddOpen(true);
      showToast({
        type: "error",
        title: "Code-barres introuvable",
        message: `Aucun article avec le code ${code}.`,
      });
      return;
    }

    setItems((prev) => {
      const idx = prev.findIndex(
        (it) => String(it.article_id) === String(a.id),
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          quantite: Number(next[idx].quantite || 0) + 1,
        };
        return next;
      }
      return [
        ...prev,
        {
          article_id: a.id,
          code_article: a.code_article,
          nom: a.nom,
          quantite: 1,
        },
      ];
    });

    showToast({
      type: "success",
      title: "Article ajouté",
      message: `${a.nom}`,
    });

    window.clearTimeout(onBarcode._t);
    onBarcode._t = window.setTimeout(() => {
      if (open && mode === "scan") startScanner();
    }, 650);
  }

  async function createProduct(values) {
    setSubmitting(true);
    setError("");
    try {
      const form = new FormData();
      form.append("sous_categorie_id", String(values.sous_categorie_id));
      form.append("code_article", String(values.code_article || ""));
      form.append("nom", String(values.nom || ""));
      form.append("unite", String(values.unite || "pièce"));
      form.append("actif", "1");
      if (values?.file) form.append("image", values.file);

      const article = await apiFetch("/api/articles", {
        method: "POST",
        body: form,
      });

      await apiFetch("/api/prix_articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          article_id: article.id,
          prix_achat: 0,
          prix_vente: Number(values.prix || 0),
          prix_gros: null,
          prix_promo: null,
        }),
      });

      await apiFetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          article_id: article.id,
          quantite: 0,
          seuil_min: Number(values.seuil_min || 0),
        }),
      });

      setAddProductOpen(false);
      setAskAddOpen(false);
      setMissingCode("");
      showToast({
        type: "success",
        title: "Produit créé",
        message: `${article.nom}`,
      });
      await loadAll();
      setBarcode(String(article.code_article || ""));
      onBarcode(String(article.code_article || ""));
    } catch (e) {
      setError(e?.message || "Erreur");
      showToast({
        type: "error",
        title: "Création impossible",
        message: e?.message || "Erreur",
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function validateBatch() {
    setError("");
    setSuccess("");
    if (items.length === 0) {
      showToast({
        type: "error",
        title: "Aucun article",
        message: "Scanne au moins un article.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const motifMap = {
        vente: "vente",
        perte: "perte",
        don: "don",
        ajustement_sortie: "ajustement",
      };
      const motif = motifMap[batchMotif] || "vente";

      for (const it of items) {
        const article_id = Number(it.article_id);
        const quantite = Number(it.quantite);
        if (
          !Number.isFinite(article_id) ||
          !Number.isFinite(quantite) ||
          quantite <= 0
        )
          continue;

        let stock = stockByArticleId.get(String(article_id));
        if (!stock) {
          stock = await apiFetch("/api/stock", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ article_id, quantite: 0, seuil_min: 0 }),
          });
        }

        const currentQty = Number(stock?.quantite ?? 0);
        if (currentQty < quantite) {
          const a = articleById.get(String(article_id));
          throw new Error(`Stock insuffisant pour ${a?.nom || "cet article"}`);
        }

        if (motif === "vente") {
          await apiFetch(`/api/stock/${stock.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quantite: currentQty - quantite }),
          });

          await apiFetch("/api/mouvements_stock", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              article_id,
              type_mouvement: "sortie",
              motif: "vente",
              quantite,
              note: batchNote || null,
              reference_type: "sortie",
              reference_id: null,
            }),
          });
        } else {
          await apiFetch("/api/sorties", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              article_id,
              motif,
              quantite,
              note: batchNote || null,
            }),
          });
        }
      }

      setItems([]);
      setBarcode("");
      setBatchMotif("vente");
      setBatchNote("");
      setSuccess("Mouvement enregistré");
      showToast({
        type: "success",
        title: "Succès",
        message: "Mouvement enregistré.",
      });
      setOpen(false);
      await loadAll();
    } catch (e) {
      setError(e?.message || "Erreur");
      showToast({
        type: "error",
        title: "Erreur",
        message: e?.message || "Erreur",
      });
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (!open) {
      stopScanner();
      setCameraError("");
      return;
    }
    if (mode === "scan") startScanner();
    return () => stopScanner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode]);

  const selectedArticle = form.article_id
    ? articleById.get(String(form.article_id))
    : null;
  const selectedStock = form.article_id
    ? stockByArticleId.get(String(form.article_id))
    : null;
  const scannedArticle =
    barcode.trim() && articleByCode.get(barcode.trim())
      ? articleByCode.get(barcode.trim())
      : null;
  const scannedStock = scannedArticle
    ? stockByArticleId.get(String(scannedArticle.id))
    : null;
  const scannedPrix = scannedArticle
    ? Number(scannedArticle?.prix?.prix_vente ?? 0)
    : 0;

  const manualCandidates = useMemo(() => {
    const q = articleQuery.trim().toLowerCase();
    if (!q) return articles;
    return articles.filter((a) => {
      const n = (a?.nom || "").toString().toLowerCase();
      const c = (a?.code_article || "").toString().toLowerCase();
      return n.includes(q) || c.includes(q);
    });
  }, [articles, articleQuery]);

  return (
    <section className="content">
      <div className="page-head">
        <div>
          <div className="page-title">Sortie de Stock</div>
          <div className="page-subtitle">Enregistrer une sortie de stock</div>
        </div>
        <button
          className="primary primary-pill"
          type="button"
          onClick={() => setOpen(true)}
        >
          <Plus size={16} />
          Nouveau Mouvement
        </button>
      </div>

      <Alert type="error" message={error} />
      <Alert type="success" message={success} />

      {open ? (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modals" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-title">Nouveau Mouvement (Sortie)</div>
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
              <div className="ms-seg">
                <button
                  className={
                    mode === "manual"
                      ? "ms-seg-btn ms-seg-btn-active"
                      : "ms-seg-btn"
                  }
                  type="button"
                  onClick={() => setMode("manual")}
                >
                  <Pencil size={16} /> Saisie Manuelle
                </button>
                <button
                  className={
                    mode === "scan"
                      ? "ms-seg-btn ms-seg-btn-active"
                      : "ms-seg-btn"
                  }
                  type="button"
                  onClick={() => setMode("scan")}
                >
                  <Camera size={16} /> Scanner Code-Barre
                </button>
              </div>

              {mode === "manual" ? (
                <form className="ms-scanner" onSubmit={submit}>
                  <label className="form-label">
                    Rechercher un article (nom ou code)
                    <input
                      className="form-input"
                      value={articleQuery}
                      onChange={(e) => setArticleQuery(e.target.value)}
                      placeholder="Ex: ART-123 ou Farine"
                      disabled={loading || submitting}
                    />
                  </label>

                  <label className="form-label">
                    Article
                    <select
                      className="form-select"
                      value={form.article_id}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, article_id: e.target.value }))
                      }
                      disabled={loading || submitting}
                    >
                      <option value="">Sélectionner un article</option>
                      {manualCandidates.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.code_article ? `${a.code_article} — ` : ""}
                          {a.nom}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="form-grid">
                    <label className="form-label">
                      Motif
                      <select
                        className="form-select"
                        value={form.motif}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, motif: e.target.value }))
                        }
                        disabled={loading || submitting}
                      >
                        <option value="vente">Vente</option>
                        <option value="perte">Perte</option>
                        <option value="don">Don</option>
                        <option value="ajustement">Ajustement sortie</option>
                      </select>
                    </label>

                    <label className="form-label">
                      Quantité
                      <input
                        className="form-input"
                        type="number"
                        step="0.01"
                        value={form.quantite}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, quantite: e.target.value }))
                        }
                        disabled={loading || submitting}
                      />
                    </label>
                  </div>

                  <label className="form-label">
                    Note (optionnel)
                    <textarea
                      className="form-input ms-textarea"
                      value={form.note}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, note: e.target.value }))
                      }
                      disabled={loading || submitting}
                    />
                  </label>

                  {selectedArticle ? (
                    <div className="movement-hint">
                      <div className="movement-hint-title">
                        {selectedArticle.nom}
                      </div>
                      <div className="movement-hint-sub">
                        Stock actuel:{" "}
                        <span className="movement-hint-strong">
                          {Number(selectedStock?.quantite ?? 0)}
                        </span>
                      </div>
                    </div>
                  ) : null}

                  <div className="modal-foot">
                    <button
                      className="btn-ghost"
                      type="button"
                      onClick={() => setOpen(false)}
                      disabled={submitting}
                    >
                      Annuler
                    </button>
                    <button
                      className="btn-primary"
                      type="submit"
                      disabled={loading || submitting}
                    >
                      {submitting
                        ? "Enregistrement…"
                        : "Enregistrer le mouvement"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="ms-scanner">
                  {/* === البلوك الكبير لي فيه الفليكس === */}
                  <div className="ms-scanner-layout">
                    {/* ── اليسار: الكاميرا + السيرش ── */}
                    <div className="ms-scanner-left">
                      <div className="ms-viewfinder">
                        <div className="ms-viewfinder-corners" />
                        <video
                          id={videoId}
                          className="ms-video"
                          ref={videoRef}
                          muted
                          playsInline
                        />
                        {scanning ? <div className="ms-scanline" /> : null}
                      </div>

                      {cameraError ? (
                        <div className="ms-banner ms-banner-err">
                          {cameraError}
                        </div>
                      ) : null}

                      <div className="ms-scan-hint">
                        Place le code-barres dans le cadre. Tu peux aussi saisir
                        le code manuellement.
                      </div>

                      <div className="ms-barcode-row">
                        <div className="ms-barcode-input">
                          <input
                            className="ms-form-input"
                            value={barcode}
                            onChange={(e) => {
                              const val = e.target.value;
                              setBarcode(val);
                           
                            }}
                            placeholder="Code-barres (EAN, Code128, QR…)"
                          />
                          <button
                            className="ms-btn-primary"
                            type="button"
                            onClick={() => onBarcode(barcode)}
                            disabled={submitting || loading || !barcode.trim()}
                          >
                            <Check size={16} /> Valider
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* ── اليمين: الجدول + الفورم ── */}
                    <div className="ms-scanner-right">
                      {scannedArticle ? (
                        <div className="ms-article-card">
                          <div>
                            <div className="ms-article-name">
                              {scannedArticle.nom}
                            </div>
                            <div className="ms-article-meta">
                              <span>Code: {scannedArticle.code_article}</span>
                              <span>
                                Stock: {Number(scannedStock?.quantite ?? 0)}
                              </span>
                              <span>Prix vente: {scannedPrix} MAD</span>
                            </div>
                          </div>
                        </div>
                      ) : null}

                      <div className="ms-items">
                        <div className="ms-items-head">
                          <div className="ms-items-title">
                            Articles scannés ({items.length})
                          </div>
                          <button
                            className="ms-btn-ghost"
                            type="button"
                            onClick={() => {
                              setBarcode("");
                              startScanner();
                            }}
                            disabled={submitting}
                          >
                            Scanner un autre article
                          </button>
                        </div>

                        <div className="ms-items-table-wrap">
                          <table className="ms-items-table">
                            <thead>
                              <tr>
                                <th>Article</th>
                                <th>Stock</th>
                                <th>Prix vente</th>
                                <th>Quantité</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {items.map((it) => {
                                const a = articleById.get(
                                  String(it.article_id),
                                );
                                const st = stockByArticleId.get(
                                  String(it.article_id),
                                );
                                const q = Number(st?.quantite ?? 0);
                                const seuil = Number(st?.seuil_min ?? 0);
                                const low = q <= seuil;
                                const prix = Number(a?.prix?.prix_vente ?? 0);
                                return (
                                  <tr key={it.article_id}>
                                    <td>
                                      {a?.nom || it.nom}{" "}
                                      <span className="ms-badge">
                                        {a?.code_article || it.code_article}
                                      </span>
                                    </td>
                                    <td>
                                      <span
                                        className={
                                          low
                                            ? "ms-badge ms-badge-low"
                                            : "ms-badge ms-badge-ok"
                                        }
                                      >
                                        {q}
                                      </span>
                                    </td>
                                    <td>{prix} MAD</td>
                                    <td className="ms-qty">
                                      <input
                                        className="ms-form-input"
                                        type="number"
                                        step="0.01"
                                        value={it.quantite}
                                        onChange={(e) => {
                                          const v = e.target.value;
                                          setItems((prev) =>
                                            prev.map((x) =>
                                              x.article_id === it.article_id
                                                ? { ...x, quantite: v }
                                                : x,
                                            ),
                                          );
                                        }}
                                      />
                                    </td>
                                    <td>
                                      <div className="ms-row-actions">
                                        <button
                                          className="ms-btn-danger"
                                          type="button"
                                          onClick={() =>
                                            setItems((prev) =>
                                              prev.filter(
                                                (x) =>
                                                  x.article_id !==
                                                  it.article_id,
                                              ),
                                            )
                                          }
                                          disabled={submitting}
                                        >
                                          Supprimer
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                              {items.length === 0 ? (
                                <tr>
                                  <td colSpan="5" className="ms-empty-cell">
                                    Aucun article scanné
                                  </td>
                                </tr>
                              ) : null}
                            </tbody>
                          </table>
                        </div>
                      </div>

                 
                      {/* <div className="ms-form-grid">
                        <label className="ms-form-label">
                          Motif
                          <select
                            className="ms-form-select"
                            value={batchMotif}
                            onChange={(e) => setBatchMotif(e.target.value)}
                            disabled={submitting}
                          >
                            <option value="vente">Vente</option>
                            <option value="perte">Perte</option>
                            <option value="don">Don</option>
                            <option value="ajustement_sortie">
                              Ajustement sortie
                            </option>
                          </select>
                        </label> */}

                        {/* <label className="ms-form-label">
                          Note (optionnel)
                          <textarea
                            className="ms-form-input ms-textarea"
                            value={batchNote}
                            onChange={(e) => setBatchNote(e.target.value)}
                            disabled={submitting}
                          />
                        </label> */}
                      {/* </div> */}

                      <div className="ms-modal-foot">
                        <button
                          className="ms-btn-ghost"
                          type="button"
                          onClick={() => setOpen(false)}
                          disabled={submitting}
                        >
                          Annuler
                        </button>
                        <button
                          className="ms-btn-primary"
                          type="button"
                          onClick={validateBatch}
                          disabled={submitting}
                        >
                          {submitting ? "Validation…" : "Valider"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <div className="orders-card">
        <div className="orders-card-head">
          <div className="orders-card-title">Historique des sorties</div>
        </div>

        {loading ? (
          <div className="orders-empty">Loading…</div>
        ) : (
          <div className="orders-table-wrap">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>id</th>
                  <th>Type</th>
                  <th>Article</th>
                  <th>Motif</th>
                  <th>Quantité</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredMouvements.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <span className="movement-badge movement-badge-sortie">
                        {m.id}
                      </span>
                    </td>
                    <td>
                      <span className="movement-badge movement-badge-sortie">
                        Sortie
                      </span>
                    </td>
                    <td>
                      {m?.article?.nom ||
                        articleById.get(String(m?.article_id || ""))?.nom ||
                        "—"}
                    </td>
                    <td>{m.motif}</td>
                    <td>{m.quantite}</td>
                    <td>{formatDate(m.created_at)}</td>
                  </tr>
                ))}
                {filteredMouvements.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="orders-empty-cell">
                      Aucun mouvement
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {askAddOpen ? (
        <div className="modal-overlay" onClick={() => setAskAddOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div className="modal-title">Code-barres introuvable</div>
              <button className="modal-x" type="button" onClick={() => setAskAddOpen(false)} aria-label="Fermer">
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-label">{`Le code ${missingCode} n'existe pas dans la base.`}</div>
              <div className="modal-foot">
                <button
                  className="btn-ghost"
                  type="button"
                  onClick={() => {
                    setAskAddOpen(false);
                    setMissingCode("");
                    if (open && mode === "scan") startScanner();
                  }}
                  disabled={submitting}
                >
                  Non
                </button>
                <button
                  className="btn-primary"
                  type="button"
                  onClick={() => {
                    setAskAddOpen(false);
                    setAddProductOpen(true);
                  }}
                  disabled={submitting}
                >
                  Ajouter produit
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <ProductModal
        open={addProductOpen}
        mode="create"
        initialValues={missingCode ? { code_article: missingCode } : null}
        sousCategories={sousCategories}
        onClose={() => {
          setAddProductOpen(false);
          setMissingCode("");
          if (open && mode === "scan") startScanner();
        }}
        onSubmit={createProduct}
      />

      {toast ? (
        <div className="ms-toast-wrap">
          <div
            className={
              toast.type === "error"
                ? "ms-toast ms-toast-error"
                : "ms-toast ms-toast-success"
            }
          >
            <div>
              <div className="ms-toast-title">{toast.title}</div>
              <div className="ms-toast-msg">{toast.message}</div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
