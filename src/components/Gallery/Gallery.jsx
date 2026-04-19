import { useState, useCallback, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import * as exifr from 'exifr';
import styles from './Gallery.module.css';

// ─── Icons ───────────────────────────────────────────────────────────────────

function DownloadIcon({ size = 22 }) {
  return <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}><path d="M5 20h14v-2H5v2zm7-18L5.33 9h3.84v4h5.66V9h3.84L12 2z" /></svg>;
}
function DeleteIcon({ size = 22 }) {
  return <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" /></svg>;
}
function CloseIcon({ size = 24 }) {
  return <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>;
}
function BackIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" width={24} height={24}><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></svg>;
}
function CheckIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" width={16} height={16}><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" /></svg>;
}
function SelectIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" width={22} height={22}><path d="M3 5h2V3c-1.1 0-2 .9-2 2zm0 8h2v-2H3v2zm4 8h2v-2H7v2zM3 9h2V7H3v2zm10-6h-2v2h2V3zm6 0v2h2c0-1.1-.9-2-2-2zM5 21v-2H3c0 1.1.9 2 2 2zm-2-4h2v-2H3v2zM9 3H7v2h2V3zm2 18h2v-2h-2v2zm8-8h2v-2h-2v2zm0 8c1.1 0 2-.9 2-2h-2v2zm0-12h2V7h-2v2zm0 8h2v-2h-2v2zm-4 4h2v-2h-2v2zm0-16h2V3h-2v2zM7 17h10V7H7v10zm2-8h6v6H9V9z" /></svg>;
}
function ZipIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" width={22} height={22}><path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-2 8h-2v2h-2v-2h-2v-2h2v-2h2v2h2v2z" /></svg>;
}
function MoreIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" width={24} height={24}><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>;
}
function InfoIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" width={20} height={20}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>;
}
function StarIcon({ filled }) {
  return <svg viewBox="0 0 24 24" fill={filled ? '#ffd200' : 'none'} stroke={filled ? '#ffd200' : 'currentColor'} strokeWidth="1.5" width={22} height={22}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>;
}
function RotateLeftIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" width={22} height={22}><path d="M7.11 8.53L5.7 7.11C4.8 8.27 4.24 9.61 4.07 11h2.02c.14-.87.49-1.72 1.02-2.47zM6.09 13H4.07c.17 1.39.72 2.73 1.62 3.89l1.41-1.42c-.52-.75-.87-1.59-1.01-2.47zm1.01 5.32c1.16.9 2.51 1.44 3.9 1.61V17.9c-.87-.15-1.71-.49-2.46-1.03L7.1 18.32zM13 4.07V1L8.45 5.55 13 10V6.09c2.84.48 5 2.94 5 5.91s-2.16 5.43-5 5.91v2.02c3.95-.49 7-3.85 7-7.93s-3.05-7.44-7-7.93z" /></svg>;
}
function RotateRightIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" width={22} height={22}><path d="M15.55 5.55L11 1v3.07C7.06 4.56 4 7.92 4 12s3.05 7.44 7 7.93v-2.02c-2.84-.48-5-2.94-5-5.91s2.16-5.43 5-5.91V10l4.55-4.45zM19.93 11c-.17-1.39-.72-2.73-1.62-3.89l-1.42 1.42c.54.75.88 1.6 1.02 2.47h2.02zM13 17.9v2.02c1.39-.17 2.74-.71 3.9-1.61l-1.44-1.44c-.75.54-1.59.89-2.46 1.03zm3.89-2.42l1.42 1.41c.9-1.16 1.45-2.5 1.62-3.89h-2.02c-.14.87-.48 1.72-1.02 2.48z" /></svg>;
}
function CropIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" width={22} height={22}><path d="M17 15h2V7c0-1.1-.9-2-2-2H9v2h8v8zM7 17V1H5v4H1v2h4v10c0 1.1.9 2 2 2h10v4h2v-4h4v-2H7z" /></svg>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBytes(bytes) {
  if (!bytes) return null;
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

function formatDate(iso) {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).format(new Date(iso));
  } catch { return iso; }
}

function formatCoord(deg, ref) {
  if (deg == null) return null;
  const d = Math.floor(Math.abs(deg));
  const m = Math.floor((Math.abs(deg) - d) * 60);
  const s = ((Math.abs(deg) - d) * 3600 - m * 60).toFixed(2);
  return d + String.fromCharCode(176) + ' ' + m + "' " + s + '" ' + (ref || '');
}

function downloadBlob(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}

function photoFilename(photo, index) {
  const d = photo.createdAt
    ? new Date(photo.createdAt).toISOString().slice(0, 19).replace(/[:T]/g, '-')
    : new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  return 'foto_' + d + '_' + index + '.jpg';
}

async function downloadAsZip(photos) {
  const zip = new JSZip();
  const folder = zip.folder('fotos');
  const timestamp = new Date().toISOString().slice(0, 10);
  await Promise.all(
    photos.map(async (photo, i) => {
      const resp = await fetch(photo.url);
      const blob = await resp.blob();
      const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
      folder.file('foto_' + timestamp + '_' + String(i + 1).padStart(3, '0') + '.' + ext, blob);
    })
  );
  const content = await zip.generateAsync({ type: 'blob' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(content);
  a.download = 'fotos_' + timestamp + '.zip';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
}

async function downloadSequential(photos) {
  for (let i = 0; i < photos.length; i++) {
    downloadBlob(photos[i].url, photoFilename(photos[i], i + 1));
    await new Promise((r) => setTimeout(r, 300));
  }
}

async function readImageMeta(url) {
  try {
    const resp = await fetch(url);
    const blob = await resp.blob();
    const size = blob.size;
    const exifData = await exifr.parse(blob, {
      tiff: true, exif: true, gps: true, ifd0: true,
      pick: [
        'Make', 'Model', 'LensModel', 'Software',
        'DateTimeOriginal', 'CreateDate', 'ModifyDate',
        'ExposureTime', 'FNumber', 'ISOSpeedRatings', 'ISO',
        'FocalLength', 'Flash', 'WhiteBalance', 'ExposureBiasValue',
        'PixelXDimension', 'PixelYDimension', 'ImageWidth', 'ImageLength',
        'Orientation', 'ColorSpace',
        'GPSLatitude', 'GPSLongitude', 'GPSLatitudeRef', 'GPSLongitudeRef',
        'GPSAltitude', 'GPSAltitudeRef',
      ],
    }).catch(() => null);
    const imgEl = new Image();
    imgEl.src = url;
    const naturalDims = await new Promise((res) => {
      imgEl.onload = () => res({ w: imgEl.naturalWidth, h: imgEl.naturalHeight });
      imgEl.onerror = () => res({ w: null, h: null });
    });
    return { size, exif: exifData || {}, naturalDims };
  } catch {
    return { size: null, exif: {}, naturalDims: { w: null, h: null } };
  }
}

async function rotateImageBlob(url, degrees) {
  const img = new Image();
  img.src = url;
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
  const rad = (degrees * Math.PI) / 180;
  const swap = degrees === 90 || degrees === 270;
  const w = swap ? img.naturalHeight : img.naturalWidth;
  const h = swap ? img.naturalWidth  : img.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.translate(w / 2, h / 2);
  ctx.rotate(rad);
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
  return new Promise((res) => canvas.toBlob((b) => res(URL.createObjectURL(b)), 'image/jpeg', 0.92));
}

// ─── Properties Panel ────────────────────────────────────────────────────────
function PropertiesPanel({ photo, onClose }) {
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    readImageMeta(photo.url).then((m) => { setMeta(m); setLoading(false); });
  }, [photo.url]);

  const ex = meta ? meta.exif : {};
  const dims = meta ? meta.naturalDims : {};
  const w = ex.PixelXDimension || ex.ImageWidth  || dims.w;
  const h = ex.PixelYDimension || ex.ImageLength || dims.h;
  const lat = ex.GPSLatitude;
  const lon = ex.GPSLongitude;
  const alt = ex.GPSAltitude;

  const rows = [
    { label: 'Nome',           value: photoFilename(photo, photo.id) },
    { label: 'Tamanho',        value: meta ? formatBytes(meta.size) : null },
    { label: 'Resolução',      value: w && h ? w + ' \u00d7 ' + h + ' px' : null },
    { label: 'Criação',        value: formatDate(ex.DateTimeOriginal || ex.CreateDate || photo.createdAt) },
    { label: 'Modificação',    value: formatDate(ex.ModifyDate || photo.createdAt) },
    { label: 'Câmera',         value: ex.Make && ex.Model ? ex.Make + ' ' + ex.Model : (ex.Model || null) },
    { label: 'Lente',          value: ex.LensModel || null },
    { label: 'Software',       value: ex.Software || null },
    { label: 'Abertura',       value: ex.FNumber != null ? 'f/' + ex.FNumber : null },
    { label: 'Exposição',      value: ex.ExposureTime != null ? '1/' + Math.round(1 / ex.ExposureTime) + 's' : null },
    { label: 'ISO',            value: ex.ISOSpeedRatings || ex.ISO || null },
    { label: 'Focal',          value: ex.FocalLength != null ? ex.FocalLength + 'mm' : null },
    { label: 'Flash',          value: ex.Flash != null ? (ex.Flash === 0 ? 'Desligado' : 'Disparado') : null },
    { label: 'Bal. de branco', value: ex.WhiteBalance != null ? (ex.WhiteBalance === 0 ? 'Auto' : 'Manual') : null },
    { label: 'Comp. expos.',   value: ex.ExposureBiasValue != null ? (ex.ExposureBiasValue > 0 ? '+' : '') + ex.ExposureBiasValue + ' EV' : null },
    { label: 'GPS Latitude',   value: formatCoord(lat, ex.GPSLatitudeRef) },
    { label: 'GPS Longitude',  value: formatCoord(lon, ex.GPSLongitudeRef) },
    { label: 'GPS Altitude',   value: alt != null ? alt.toFixed(1) + ' m ' + (ex.GPSAltitudeRef === 1 ? 'abaixo' : 'acima') + ' do nível do mar' : null },
  ].filter((r) => r.value != null);

  const mapsUrl = lat != null && lon != null
    ? 'https://maps.google.com/?q=' + lat + ',' + lon
    : null;

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.propsPanel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.propsPanelHeader}>
          <span className={styles.modalTitle}>Propriedades</span>
          <button className={styles.iconBtn} onClick={onClose}><CloseIcon size={20} /></button>
        </div>
        <div className={styles.propsList}>
          {loading ? (
            <div className={styles.propsLoading}>Carregando metadados…</div>
          ) : rows.length === 0 ? (
            <div className={styles.propsLoading}>Sem metadados disponíveis</div>
          ) : (
            rows.map((r) => (
              <div key={r.label} className={styles.propsRow}>
                <span className={styles.propsLabel}>{r.label}</span>
                <span className={styles.propsValue}>{String(r.value)}</span>
              </div>
            ))
          )}
          {!loading && mapsUrl && (
            <a className={styles.propsMapLink} href={mapsUrl} target="_blank" rel="noopener noreferrer">
              Ver no Google Maps ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Edit Panel ───────────────────────────────────────────────────────────────
function EditPanel({ photo, onClose, onSaveEdit }) {
  const [rotation, setRotation] = useState(0);
  const [quality, setQuality] = useState(92);
  const [saving, setSaving] = useState(false);

  const handleRotateLeft  = () => setRotation((r) => (r - 90 + 360) % 360);
  const handleRotateRight = () => setRotation((r) => (r + 90) % 360);

  const handleSave = async () => {
    setSaving(true);
    try {
      let url = photo.url;
      if (rotation !== 0) url = await rotateImageBlob(photo.url, rotation);
      await onSaveEdit(photo.id, url);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.editPanel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.propsPanelHeader}>
          <span className={styles.modalTitle}>Editar foto</span>
          <button className={styles.iconBtn} onClick={onClose}><CloseIcon size={20} /></button>
        </div>
        <div className={styles.editPreviewWrap}>
          <img
            src={photo.url}
            alt="Preview"
            className={styles.editPreview}
            style={{ transform: 'rotate(' + rotation + 'deg)' }}
          />
        </div>
        <div className={styles.editSection}>
          <p className={styles.editSectionTitle}>Rotação</p>
          <div className={styles.editRotateRow}>
            <button className={styles.editActionBtn} onClick={handleRotateLeft}>
              <RotateLeftIcon /><span>−90°</span>
            </button>
            <span className={styles.editRotValue}>{rotation}°</span>
            <button className={styles.editActionBtn} onClick={handleRotateRight}>
              <RotateRightIcon /><span>+90°</span>
            </button>
          </div>
        </div>
        <div className={styles.editSection}>
          <p className={styles.editSectionTitle}>Qualidade ao salvar: {quality}%</p>
          <input
            type="range"
            min={50}
            max={100}
            value={quality}
            onChange={(e) => setQuality(Number(e.target.value))}
            className={styles.editQualitySlider}
          />
        </div>
        <div className={styles.editActions}>
          <button className={styles.modalCancelInline} onClick={onClose}>Cancelar</button>
          <button className={styles.modalSaveBtn} onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando…' : 'Salvar cópia'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Context Menu ─────────────────────────────────────────────────────────────
function ContextMenu({ photo, isFavorite, onClose, onDownload, onDelete, onProperties, onEdit, onToggleFavorite }) {
  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.contextMenu} onClick={(e) => e.stopPropagation()}>
        <button className={styles.ctxBtn} onClick={() => { onToggleFavorite(photo.id); onClose(); }}>
          <StarIcon filled={isFavorite} />
          <span>{isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}</span>
        </button>
        <div className={styles.ctxDivider} />
        <button className={styles.ctxBtn} onClick={() => { onDownload(); onClose(); }}>
          <DownloadIcon size={20} /><span>Baixar foto</span>
        </button>
        <button className={styles.ctxBtn} onClick={() => { onEdit(); onClose(); }}>
          <CropIcon /><span>Editar</span>
        </button>
        <button className={styles.ctxBtn} onClick={() => { onProperties(); onClose(); }}>
          <InfoIcon /><span>Propriedades</span>
        </button>
        <div className={styles.ctxDivider} />
        <button className={styles.ctxBtn + ' ' + styles.ctxBtnDelete} onClick={() => { onDelete(); onClose(); }}>
          <DeleteIcon size={20} /><span>Excluir foto</span>
        </button>
        <button className={styles.ctxCancel} onClick={onClose}>Cancelar</button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Gallery({ photos, onClose, onDelete }) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [favorites, setFavorites] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('gallery-favorites') || '[]')); }
    catch { return new Set(); }
  });

  const [showDownloadModal,    setShowDownloadModal]    = useState(false);
  const [showDeleteModal,      setShowDeleteModal]      = useState(false);
  const [showDeleteSingleModal,setShowDeleteSingleModal] = useState(false);
  const [showContextMenu,      setShowContextMenu]      = useState(false);
  const [showProperties,       setShowProperties]       = useState(false);
  const [showEdit,             setShowEdit]             = useState(false);
  const [isZipping,         setIsZipping]         = useState(false);
  const [contextPhoto,      setContextPhoto]      = useState(null);
  const [contextIndex,      setContextIndex]      = useState(null);
  const [editedUrls,        setEditedUrls]        = useState({});

  const selectedPhoto = selectedIndex !== null ? photos[selectedIndex] : null;
  const displayUrl = (photo) => (photo && editedUrls[photo.id]) || (photo && photo.url);

  const toggleFavorite = useCallback((id) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      try { localStorage.setItem('gallery-favorites', JSON.stringify([...next])); } catch {}
      return next;
    });
  }, []);

  const handleDelete = useCallback(
    async (id) => {
      await onDelete(id);
      if (selectedPhoto && selectedPhoto.id === id) setSelectedIndex(null);
    },
    [onDelete, selectedPhoto]
  );

  const handleSaveEdit = useCallback(async (id, newUrl) => {
    setEditedUrls((prev) => ({ ...prev, [id]: newUrl }));
    downloadBlob(newUrl, 'foto_editada_' + id + '.jpg');
  }, []);

  const toggleSelectMode = () => { setSelectMode((v) => !v); setSelectedIds(new Set()); };

  const toggleSelectId = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(selectedIds.size === photos.length ? new Set() : new Set(photos.map((p) => p.id)));
  };

  const handleGridItemClick = (photo, index) => {
    if (selectMode) toggleSelectId(photo.id);
    else setSelectedIndex(index);
  };

  const openContextMenu = (photo, index) => {
    setContextPhoto(photo);
    setContextIndex(index);
    setShowContextMenu(true);
  };

  const selectedPhotos = photos.filter((p) => selectedIds.has(p.id));
  const count = selectedIds.size;
  const allSelected = photos.length > 0 && count === photos.length;

  const handleDownloadZip = async () => {
    setShowDownloadModal(false);
    setIsZipping(true);
    try { await downloadAsZip(selectedPhotos); }
    finally { setIsZipping(false); }
  };

  const handleDownloadSequential = async () => {
    setShowDownloadModal(false);
    await downloadSequential(selectedPhotos);
  };

  const handleBatchDelete = async () => {
    setShowDeleteModal(false);
    for (const id of selectedIds) await onDelete(id);
    setSelectedIds(new Set());
    setSelectMode(false);
  };

  const navigatePrev = () => { if (selectedIndex > 0) setSelectedIndex((i) => i - 1); };
  const navigateNext = () => { if (selectedIndex < photos.length - 1) setSelectedIndex((i) => i + 1); };

  const longPressTimer = useRef(null);
  const makeLongPressHandlers = (photo, index) => ({
    onPointerDown: () => {
      longPressTimer.current = setTimeout(() => {
        longPressTimer.current = null;
        openContextMenu(photo, index);
      }, 500);
    },
    onPointerUp:    () => clearTimeout(longPressTimer.current),
    onPointerLeave: () => clearTimeout(longPressTimer.current),
    onContextMenu:  (e) => e.preventDefault(),
  });

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Galeria">

      {selectedPhoto ? (
        <div className={styles.viewer}>
          <div className={styles.viewerTop}>
            <button className={styles.iconBtn} onClick={() => setSelectedIndex(null)} aria-label="Voltar"><BackIcon /></button>
            <span className={styles.viewerCounter}>{selectedIndex + 1} / {photos.length}</span>
            <div className={styles.viewerActions}>
              <button className={styles.iconBtn} onClick={() => toggleFavorite(selectedPhoto.id)} aria-label="Favorito">
                <StarIcon filled={favorites.has(selectedPhoto.id)} />
              </button>
              <button className={styles.iconBtn} onClick={() => openContextMenu(selectedPhoto, selectedIndex)} aria-label="Mais opções">
                <MoreIcon />
              </button>
            </div>
          </div>
          <div className={styles.imageWrapper}>
            {selectedIndex > 0 && (
              <button className={styles.navBtn + ' ' + styles.navPrev} onClick={navigatePrev} aria-label="Anterior">‹</button>
            )}
            <img src={displayUrl(selectedPhoto)} alt="Foto" className={styles.fullImage} />
            {selectedIndex < photos.length - 1 && (
              <button className={styles.navBtn + ' ' + styles.navNext} onClick={navigateNext} aria-label="Próxima">›</button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className={styles.header}>
            {selectMode ? (
              <>
                <button className={styles.iconBtn} onClick={toggleSelectMode} aria-label="Cancelar"><CloseIcon /></button>
                <button className={styles.selectAllBtn} onClick={selectAll}>
                  {allSelected ? 'Desmarcar todos' : 'Selecionar todos'}
                </button>
                <span className={styles.selectionCount}>{count} selecionada{count !== 1 ? 's' : ''}</span>
              </>
            ) : (
              <>
                <button className={styles.iconBtn} onClick={onClose} aria-label="Fechar"><CloseIcon /></button>
                <span className={styles.title}>Galeria ({photos.length})</span>
                {photos.length > 0
                  ? <button className={styles.iconBtn} onClick={toggleSelectMode} aria-label="Selecionar"><SelectIcon /></button>
                  : <div style={{ width: 44 }} />}
              </>
            )}
          </div>

          {photos.length === 0 ? (
            <div className={styles.empty}>
              <svg viewBox="0 0 24 24" fill="currentColor" width={56} height={56} style={{ color: 'rgba(255,255,255,0.2)' }}>
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
              </svg>
              <p className={styles.emptyText}>Nenhuma foto ainda</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {photos.map((photo, index) => {
                const isSelected = selectedIds.has(photo.id);
                const isFav = favorites.has(photo.id);
                return (
                  <button
                    key={photo.id}
                    className={styles.gridItem + (isSelected ? ' ' + styles.gridItemSelected : '')}
                    onClick={() => handleGridItemClick(photo, index)}
                    {...makeLongPressHandlers(photo, index)}
                    aria-label={'Foto ' + (index + 1) + (isSelected ? ' (selecionada)' : '')}
                  >
                    <img src={photo.url} alt={'Foto ' + (index + 1)} className={styles.gridThumb} />
                    {isFav && !selectMode && <span className={styles.favBadge}>★</span>}
                    {selectMode && (
                      <div className={styles.checkCircle + (isSelected ? ' ' + styles.checkCircleActive : '')}>
                        {isSelected && <CheckIcon />}
                      </div>
                    )}
                    {!selectMode && (
                      <button
                        className={styles.gridMoreBtn}
                        onClick={(e) => { e.stopPropagation(); openContextMenu(photo, index); }}
                        aria-label="Opções"
                      >
                        <MoreIcon />
                      </button>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {selectMode && count > 0 && (
            <div className={styles.batchBar}>
              <button className={styles.batchBtnDownload} onClick={() => setShowDownloadModal(true)} disabled={isZipping}>
                <DownloadIcon /><span>{isZipping ? 'Comprimindo…' : 'Baixar ' + count}</span>
              </button>
              <button className={styles.batchBtnDelete} onClick={() => setShowDeleteModal(true)}>
                <DeleteIcon /><span>Excluir {count}</span>
              </button>
            </div>
          )}
        </>
      )}

      {showContextMenu && contextPhoto && (
        <ContextMenu
          photo={contextPhoto}
          isFavorite={favorites.has(contextPhoto.id)}
          onClose={() => setShowContextMenu(false)}
          onDownload={() => downloadBlob(displayUrl(contextPhoto), photoFilename(contextPhoto, (contextIndex || 0) + 1))}
          onDelete={() => setShowDeleteSingleModal(true)}
          onProperties={() => setShowProperties(true)}
          onEdit={() => setShowEdit(true)}
          onToggleFavorite={toggleFavorite}
        />
      )}

      {showProperties && contextPhoto && (
        <PropertiesPanel photo={contextPhoto} onClose={() => setShowProperties(false)} />
      )}

      {showEdit && contextPhoto && (
        <EditPanel
          photo={{ ...contextPhoto, url: displayUrl(contextPhoto) }}
          onClose={() => setShowEdit(false)}
          onSaveEdit={handleSaveEdit}
        />
      )}

      {showDownloadModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowDownloadModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <p className={styles.modalTitle}>Baixar {count} foto{count !== 1 ? 's' : ''}</p>
            <p className={styles.modalSubtitle}>Como deseja baixar as fotos selecionadas?</p>
            <div className={styles.modalActions}>
              <button className={styles.modalBtn} onClick={handleDownloadZip}>
                <ZipIcon /><span>Arquivo ZIP</span>
                <span className={styles.modalBtnSub}>1 arquivo compactado</span>
              </button>
              <button className={styles.modalBtn} onClick={handleDownloadSequential}>
                <DownloadIcon /><span>Uma por uma</span>
                <span className={styles.modalBtnSub}>{count} arquivo{count !== 1 ? 's' : ''} separado{count !== 1 ? 's' : ''}</span>
              </button>
            </div>
            <button className={styles.modalCancel} onClick={() => setShowDownloadModal(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowDeleteModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <p className={styles.modalTitle}>Excluir {count} foto{count !== 1 ? 's' : ''}?</p>
            <p className={styles.modalSubtitle}>Esta ação não pode ser desfeita.</p>
            <div className={styles.modalActionsRow}>
              <button className={styles.modalCancelInline} onClick={() => setShowDeleteModal(false)}>Cancelar</button>
              <button className={styles.modalDeleteConfirm} onClick={handleBatchDelete}>Excluir</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteSingleModal && contextPhoto && (
        <div className={styles.modalBackdrop} onClick={() => setShowDeleteSingleModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <p className={styles.modalTitle}>Excluir foto?</p>
            <p className={styles.modalSubtitle}>Esta ação não pode ser desfeita.</p>
            <div className={styles.modalActionsRow}>
              <button className={styles.modalCancelInline} onClick={() => setShowDeleteSingleModal(false)}>Cancelar</button>
              <button className={styles.modalDeleteConfirm} onClick={async () => { setShowDeleteSingleModal(false); await handleDelete(contextPhoto.id); }}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
