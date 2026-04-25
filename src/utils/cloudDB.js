// ─── Cloud DB (localStorage-based demo) ──────────────────────────────────────
// Simula armazenamento em nuvem usando localStorage com fotos em base64.
// Para produção, substitua as funções por chamadas à sua API REST real.

const CLOUD_DB_KEY      = 'miui-cloud-db';
const CLOUD_SESSION_KEY = 'miui-cloud-session';

function _loadDB() {
  try { return JSON.parse(localStorage.getItem(CLOUD_DB_KEY) || '{}'); }
  catch { return {}; }
}

function _saveDB(db) {
  try {
    localStorage.setItem(CLOUD_DB_KEY, JSON.stringify(db));
  } catch (e) {
    throw new Error('Armazenamento insuficiente: ' + (e.message || 'localStorage cheio'));
  }
}

// ── Session ───────────────────────────────────────────────────────────────────

/** Retorna a sessão atual ou null */
export function getCloudSession() {
  try { return JSON.parse(localStorage.getItem(CLOUD_SESSION_KEY) || 'null'); }
  catch { return null; }
}

// ── Auth ──────────────────────────────────────────────────────────────────────

/**
 * Faz login ou cria conta.
 * @returns {{ ok: boolean, isNew?: boolean, user?: string, error?: string }}
 */
export function cloudLogin(username, password) {
  if (!username || !password) return { ok: false, error: 'Preencha todos os campos' };
  const user = username.trim().toLowerCase();
  if (user.length < 3)   return { ok: false, error: 'Usuário deve ter ao menos 3 caracteres' };
  if (password.length < 4) return { ok: false, error: 'Senha deve ter ao menos 4 caracteres' };

  const db = _loadDB();

  if (!db[user]) {
    db[user] = { password, photos: [] };
    _saveDB(db);
    localStorage.setItem(CLOUD_SESSION_KEY, JSON.stringify({ user }));
    return { ok: true, isNew: true, user };
  }

  if (db[user].password !== password) {
    return { ok: false, error: 'Senha incorreta' };
  }

  localStorage.setItem(CLOUD_SESSION_KEY, JSON.stringify({ user }));
  return { ok: true, isNew: false, user };
}

/** Encerra a sessão atual */
export function cloudLogout() {
  localStorage.removeItem(CLOUD_SESSION_KEY);
}

// ── Photos ────────────────────────────────────────────────────────────────────

/**
 * Faz upload de uma foto para a nuvem.
 * @param {string} base64  - Data URL (ex.: 'data:image/jpeg;base64,...')
 * @param {string} mimeType
 * @param {string} [createdAt] - ISO date string
 * @returns {Promise<number>} ID da foto salva
 */
export async function cloudUploadPhoto(base64, mimeType, createdAt) {
  const session = getCloudSession();
  if (!session) throw new Error('Não autenticado');

  const db   = _loadDB();
  const user = session.user;
  if (!db[user]) throw new Error('Usuário não encontrado');

  const id = Date.now() + Math.floor(Math.random() * 1000);
  db[user].photos.unshift({
    id,
    base64,
    mimeType:   mimeType   || 'image/jpeg',
    createdAt:  createdAt  || new Date().toISOString(),
    uploadedAt: new Date().toISOString(),
  });
  _saveDB(db);
  return id;
}

/**
 * Carrega todas as fotos da nuvem para o usuário logado.
 * @returns {Promise<Array<{ id, url, mimeType, createdAt, uploadedAt, isCloud }>>}
 */
export async function cloudLoadPhotos() {
  const session = getCloudSession();
  if (!session) return [];

  const db   = _loadDB();
  const user = session.user;
  if (!db[user]) return [];

  return (db[user].photos || []).map((p) => ({
    id:         p.id,
    url:        p.base64,
    mimeType:   p.mimeType,
    createdAt:  p.createdAt,
    uploadedAt: p.uploadedAt,
    isCloud:    true,
  }));
}

/**
 * Remove uma foto da nuvem.
 * @param {number} id
 */
export async function cloudDeletePhoto(id) {
  const session = getCloudSession();
  if (!session) throw new Error('Não autenticado');

  const db   = _loadDB();
  const user = session.user;
  if (!db[user]) throw new Error('Usuário não encontrado');

  db[user].photos = db[user].photos.filter((p) => p.id !== id);
  _saveDB(db);
}

// ── Stats ─────────────────────────────────────────────────────────────────────

/** Retorna estatísticas do armazenamento em nuvem do usuário atual. */
export function getCloudStats() {
  const session = getCloudSession();
  if (!session) return { count: 0, sizeKb: 0, user: null };

  const db   = _loadDB();
  const user = session.user;
  if (!db[user]) return { count: 0, sizeKb: 0, user };

  const photos = db[user].photos || [];
  // Base64 ≈ 75% do tamanho original em bytes; cada char ≈ 1 byte
  const sizeKb = Math.round(
    photos.reduce((acc, p) => acc + (p.base64 ? (p.base64.length * 0.75) / 1024 : 0), 0)
  );

  return { count: photos.length, sizeKb, user };
}
