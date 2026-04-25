// ─── Cloud DB (IndexedDB-based) ───────────────────────────────────────────────
// Simula armazenamento em nuvem usando IndexedDB — sem limite prático de tamanho.
// Sessão (usuário logado) continua em localStorage (dados mínimos, sem fotos).
// Para produção, substitua as funções por chamadas à sua API REST real.

const DB_NAME      = 'miui-cloud';
const DB_VERSION   = 1;
const STORE_USERS  = 'users';   // { id: username, password }
const STORE_PHOTOS = 'photos';  // { id, user, base64, mimeType, createdAt, uploadedAt }

const CLOUD_SESSION_KEY = 'miui-cloud-session';

// ── IndexedDB helpers ─────────────────────────────────────────────────────────

function _openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_USERS)) {
        db.createObjectStore(STORE_USERS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_PHOTOS)) {
        const ps = db.createObjectStore(STORE_PHOTOS, { keyPath: 'id' });
        ps.createIndex('user', 'user', { unique: false });
      }
    };
    req.onsuccess  = () => resolve(req.result);
    req.onerror    = () => reject(req.error);
  });
}

function _tx(db, stores, mode, fn) {
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(stores, mode);
    const abort = () => reject(tx.error);
    tx.onabort  = abort;
    tx.onerror  = abort;
    resolve(fn(tx));
  });
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
 * @returns {Promise<{ ok: boolean, isNew?: boolean, user?: string, error?: string }>}
 */
export async function cloudLogin(username, password) {
  if (!username || !password) return { ok: false, error: 'Preencha todos os campos' };
  const user = username.trim().toLowerCase();
  if (user.length < 3)    return { ok: false, error: 'Usuário deve ter ao menos 3 caracteres' };
  if (password.length < 4) return { ok: false, error: 'Senha deve ter ao menos 4 caracteres' };

  const db = await _openDB();
  return new Promise((resolve) => {
    const tx      = db.transaction(STORE_USERS, 'readwrite');
    const store   = tx.objectStore(STORE_USERS);
    const getReq  = store.get(user);

    getReq.onsuccess = () => {
      const existing = getReq.result;
      if (!existing) {
        store.put({ id: user, password });
        tx.oncomplete = () => {
          localStorage.setItem(CLOUD_SESSION_KEY, JSON.stringify({ user }));
          resolve({ ok: true, isNew: true, user });
        };
        tx.onerror = () => resolve({ ok: false, error: 'Erro ao criar conta' });
      } else if (existing.password !== password) {
        resolve({ ok: false, error: 'Senha incorreta' });
      } else {
        localStorage.setItem(CLOUD_SESSION_KEY, JSON.stringify({ user }));
        resolve({ ok: true, isNew: false, user });
      }
    };
    getReq.onerror = () => resolve({ ok: false, error: 'Erro ao acessar banco' });
  });
}

/** Encerra a sessão atual */
export function cloudLogout() {
  localStorage.removeItem(CLOUD_SESSION_KEY);
}

// ── Photos ────────────────────────────────────────────────────────────────────

/**
 * Faz upload de uma foto para a nuvem.
 * @param {string} base64   - Data URL (ex.: 'data:image/jpeg;base64,...')
 * @param {string} mimeType
 * @param {string} [createdAt] - ISO date string
 * @returns {Promise<number>} ID da foto salva
 */
export async function cloudUploadPhoto(base64, mimeType, createdAt) {
  const session = getCloudSession();
  if (!session) throw new Error('Não autenticado');

  const id     = Date.now() + Math.floor(Math.random() * 1000);
  const record = {
    id,
    user:       session.user,
    base64,
    mimeType:   mimeType  || 'image/jpeg',
    createdAt:  createdAt || new Date().toISOString(),
    uploadedAt: new Date().toISOString(),
  };

  const db = await _openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE_PHOTOS, 'readwrite');
    tx.objectStore(STORE_PHOTOS).put(record);
    tx.oncomplete = () => resolve(id);
    tx.onerror    = () => reject(tx.error);
    tx.onabort    = () => reject(tx.error);
  });
}

/**
 * Carrega todas as fotos da nuvem para o usuário logado.
 * @returns {Promise<Array<{ id, url, mimeType, createdAt, uploadedAt, isCloud }>>}
 */
export async function cloudLoadPhotos() {
  const session = getCloudSession();
  if (!session) return [];

  const db = await _openDB();
  return new Promise((resolve, reject) => {
    const tx      = db.transaction(STORE_PHOTOS, 'readonly');
    const index   = tx.objectStore(STORE_PHOTOS).index('user');
    const req     = index.getAll(session.user);
    req.onsuccess = () => {
      const photos = (req.result || [])
        .sort((a, b) => b.id - a.id)
        .map((p) => ({
          id:         p.id,
          url:        p.base64,
          mimeType:   p.mimeType,
          createdAt:  p.createdAt,
          uploadedAt: p.uploadedAt,
          isCloud:    true,
        }));
      resolve(photos);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Remove uma foto da nuvem.
 * @param {number} id
 */
export async function cloudDeletePhoto(id) {
  const session = getCloudSession();
  if (!session) throw new Error('Não autenticado');

  const db = await _openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE_PHOTOS, 'readwrite');
    tx.objectStore(STORE_PHOTOS).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
    tx.onabort    = () => reject(tx.error);
  });
}

// ── Stats ─────────────────────────────────────────────────────────────────────

/** Retorna estatísticas do armazenamento em nuvem do usuário atual. */
export async function getCloudStats() {
  const session = getCloudSession();
  if (!session) return { count: 0, sizeKb: 0, user: null };

  const db = await _openDB();
  return new Promise((resolve) => {
    const tx    = db.transaction(STORE_PHOTOS, 'readonly');
    const index = tx.objectStore(STORE_PHOTOS).index('user');
    const req   = index.getAll(session.user);
    req.onsuccess = () => {
      const photos = req.result || [];
      const sizeKb = Math.round(
        photos.reduce((acc, p) => acc + (p.base64 ? (p.base64.length * 0.75) / 1024 : 0), 0)
      );
      resolve({ count: photos.length, sizeKb, user: session.user });
    };
    req.onerror = () => resolve({ count: 0, sizeKb: 0, user: session.user });
  });
}
