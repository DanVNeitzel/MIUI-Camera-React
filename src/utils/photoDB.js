const DB_NAME = 'miui-camera';
const STORE_NAME = 'photos';
const STORE_THUMBS = 'thumbnails';
const DB_VERSION = 2;

// Cache da conexão — evita abrir nova conexo a cada operação
let _dbPromise = null;

function openDB() {
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_THUMBS)) {
        const ts = db.createObjectStore(STORE_THUMBS, { keyPath: 'id' });
        ts.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => { _dbPromise = null; reject(req.error); };
  });
  return _dbPromise;
}

/** Salva uma foto como Blob no IndexedDB. */
export async function savePhoto(blob) {
  const db = await openDB();
  const id = Date.now();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).add({
      id,
      blob,
      storageType: 'blob',
      mimeType: blob.type || 'image/jpeg',
      createdAt: new Date().toISOString(),
    });
    tx.oncomplete = () => resolve(id);
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Salva uma foto como Data URL (base64) no IndexedDB.
 * Não cria arquivos físicos nem URLs de objeto — ideal para upload na nuvem.
 */
export async function savePhotoBase64(dataUrl, mimeType) {
  const db = await openDB();
  const id = Date.now();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).add({
      id,
      base64: dataUrl,
      storageType: 'base64',
      mimeType: mimeType || 'image/jpeg',
      createdAt: new Date().toISOString(),
    });
    tx.oncomplete = () => resolve(id);
    tx.onerror = () => reject(tx.error);
  });
}

/** Carrega todas as fotos. Retorna objetos brutos (sem criar URLs). */
export async function loadPhotos() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).index('createdAt').getAll();
    req.onsuccess = () => resolve([...req.result].reverse()); // newest first
    req.onerror = () => reject(req.error);
  });
}

export async function deletePhoto(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ── Thumbnails ──────────────────────────────────────────────────────────────

/** Salva um thumbnail (pequena imagem base64) para uma foto. */
export async function saveThumb(id, dataUrl, mimeType, createdAt) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_THUMBS, 'readwrite');
    tx.objectStore(STORE_THUMBS).put({ id, dataUrl, mimeType, createdAt });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Carrega todos os thumbnails (ordenados do mais novo ao mais antigo). */
export async function loadAllThumbs() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_THUMBS, 'readonly');
    const req = tx.objectStore(STORE_THUMBS).index('createdAt').getAll();
    req.onsuccess = () =>
      resolve(
        [...req.result].reverse().map((r) => ({
          id: r.id,
          url: r.dataUrl,
          mimeType: r.mimeType,
          createdAt: r.createdAt,
          isThumb: true,
        }))
      );
    req.onerror = () => reject(req.error);
  });
}

/** Carrega o registro completo de uma foto (blob ou base64) pelo ID. */
export async function loadPhotoFull(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

/** Remove o thumbnail de uma foto (chamado junto com deletePhoto). */
export async function deleteThumb(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_THUMBS, 'readwrite');
    tx.objectStore(STORE_THUMBS).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
