import { apiFetch } from '../../lib/api'

export async function fetchArticles(perPage = 100) {
  const data = await apiFetch(`/api/articles?per_page=${perPage}`)
  return Array.isArray(data?.data) ? data.data : data?.data?.data || []
}

export async function fetchSousCategories(perPage = 200) {
  const data = await apiFetch(`/api/sous_categories?per_page=${perPage}`)
  return Array.isArray(data?.data) ? data.data : data?.data?.data || []
}

export async function fetchCategories(perPage = 200) {
  const data = await apiFetch(`/api/categories?per_page=${perPage}`)
  return Array.isArray(data?.data) ? data.data : data?.data?.data || []
}

export async function createArticleWithImage({ sous_categorie_id, code_article, nom, unite, file }) {
  const form = new FormData()
  form.append('sous_categorie_id', String(sous_categorie_id))
  form.append('code_article', String(code_article))
  form.append('nom', String(nom))
  form.append('unite', String(unite || 'pièce'))
  form.append('actif', '1')
  form.append('image', file)

  return apiFetch('/api/articles', {
    method: 'POST',
    body: form,
  })
}

export async function updateArticle(id, payload) {
  return apiFetch(`/api/articles/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function updateArticleWithImage(id, { sous_categorie_id, code_article, nom, unite, file }) {
  const form = new FormData()
  form.append('_method', 'PUT')
  form.append('sous_categorie_id', String(sous_categorie_id))
  form.append('code_article', String(code_article))
  form.append('nom', String(nom))
  form.append('unite', String(unite || 'pièce'))
  form.append('image', file)

  return apiFetch(`/api/articles/${id}`, {
    method: 'POST',
    body: form,
  })
}

export async function deleteArticle(id) {
  return apiFetch(`/api/articles/${id}`, { method: 'DELETE' })
}

export async function createPrixArticle(payload) {
  return apiFetch('/api/prix_articles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function updatePrixArticle(id, payload) {
  return apiFetch(`/api/prix_articles/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function createStock(payload) {
  return apiFetch('/api/stock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function updateStock(id, payload) {
  return apiFetch(`/api/stock/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

