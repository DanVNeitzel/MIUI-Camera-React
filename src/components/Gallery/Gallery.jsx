import { useState, useCallback, useEffect, useRef } from 'react';
import JSZip from 'jszip';
import * as exifr from 'exifr';
import styles from './Gallery.module.css';
import { useBackButton } from '../../hooks/useBackButton';
import CloudModal from '../CloudModal/CloudModal';
import {
  getCloudSession,
  cloudLoadPhotos,
  cloudDeletePhoto,
  cloudUploadPhoto,
} from '../../utils/cloudDB';

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
function ShareIcon({ size = 22 }) {
  return <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" /></svg>;
}
function CloudIcon({ size = 22 }) {
  return <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}><path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" /></svg>;
}
function CloudUploadIcon({ size = 20 }) {
  return <svg viewBox="0 0 24 24" fill="currentColor" width={size} height={size}><path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" /></svg>;
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

/** Converte qualquer URL de foto (blob: ou data:) para Data URL base64 */
async function toBase64DataUrl(url) {
  if (url.startsWith('data:')) return url;
  const resp = await fetch(url);
  const blob = await resp.blob();
  return new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result);
    reader.onerror = rej;
    reader.readAsDataURL(blob);
  });
}

async function sharePhoto(url, filename) {
  try {
    if (navigator.share && navigator.canShare) {
      const resp = await fetch(url);
      const blob = await resp.blob();
      const ext = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
      const file = new File([blob], filename || ('foto.' + ext), { type: blob.type });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Foto' });
        return;
      }
    }
    if (navigator.share) {
      await navigator.share({ title: 'Foto', url });
      return;
    }
    // Fallback: download se a API não estiver disponível
    downloadBlob(url, filename || 'foto.jpg');
  } catch (err) {
    if (err.name !== 'AbortError') console.warn('Compartilhar falhou:', err);
  }
}

function mimeToExt(mimeType) {
  if (mimeType === 'image/png')  return 'png';
  if (mimeType === 'image/webp') return 'webp';
  return 'jpg';
}

function photoFilename(photo, index) {
  const d = photo.createdAt
    ? new Date(photo.createdAt).toISOString().slice(0, 19).replace(/[:T]/g, '-')
    : new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const ext = mimeToExt(photo.mimeType);
  return 'foto_' + d + '_' + index + '.' + ext;
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
function ContextMenu({ photo, isFavorite, isCloud, cloudLoggedIn, onClose, onDownload, onShare, onDelete, onProperties, onEdit, onToggleFavorite, onUploadToCloud }) {
  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.contextMenu} onClick={(e) => e.stopPropagation()}>
        {!isCloud && (
          <button className={styles.ctxBtn} onClick={() => { onToggleFavorite(photo.id); onClose(); }}>
            <StarIcon filled={isFavorite} />
            <span>{isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}</span>
          </button>
        )}
        <div className={styles.ctxDivider} />
        <button className={styles.ctxBtn} onClick={() => { onShare(); onClose(); }}>
          <ShareIcon size={20} /><span>Compartilhar</span>
        </button>
        <button className={styles.ctxBtn} onClick={() => { onDownload(); onClose(); }}>
          <DownloadIcon size={20} /><span>Baixar foto</span>
        </button>
        {!isCloud && (
          <button className={styles.ctxBtn} onClick={() => { onEdit(); onClose(); }}>
            <CropIcon /><span>Editar</span>
          </button>
        )}
        <button className={styles.ctxBtn} onClick={() => { onProperties(); onClose(); }}>
          <InfoIcon /><span>Propriedades</span>
        </button>
        {!isCloud && cloudLoggedIn && (
          <>
            <div className={styles.ctxDivider} />
            <button className={styles.ctxBtn} onClick={() => { onUploadToCloud(); onClose(); }}>
              <CloudUploadIcon size={20} /><span>Copiar para nuvem</span>
            </button>
          </>
        )}
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
export default function Gallery({ photos, onClose, onDelete, onLoadFull }) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  // Swipe-down-to-close
  const swipeStartY = useRef(null);
  const [swipeDelta, setSwipeDelta] = useState(0);
  const [favorites, setFavorites] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem('gallery-favorites') || '[]')); }
    catch { return new Set(); }
  });

  // ── Cloud state ──────────────────────────────────────────────────────────────
  const [cloudSession,    setCloudSession]    = useState(() => getCloudSession());
  const [cloudSource,     setCloudSource]     = useState('local');  // 'local' | 'cloud'
  const [cloudPhotos,     setCloudPhotos]     = useState([]);
  const [cloudLoading,    setCloudLoading]    = useState(false);
  const [cloudError,      setCloudError]      = useState(null);
  const [uploadingToCloud, setUploadingToCloud] = useState(false);
  const [showCloudModal,  setShowCloudModal]  = useState(false);
  const [uploadSuccess,   setUploadSuccess]   = useState(false);
  const [uploadingBatch,  setUploadingBatch]  = useState(false);
  const [batchUploadDone, setBatchUploadDone] = useState(0);   // quantas foram enviadas
  const [batchUploadTotal,setBatchUploadTotal]= useState(0);

  const activePhotos = cloudSource === 'cloud' ? cloudPhotos : photos;

  const refreshCloudPhotos = useCallback(async () => {
    if (!getCloudSession()) return;
    setCloudLoading(true);
    try {
      const p = await cloudLoadPhotos();
      setCloudPhotos(p);
    } catch (err) {
      setCloudError(err.message || 'Erro ao carregar nuvem');
    } finally {
      setCloudLoading(false);
    }
  }, []);

  useEffect(() => {
    if (cloudSource === 'cloud' && cloudSession) refreshCloudPhotos();
  }, [cloudSource, cloudSession, refreshCloudPhotos]);

  const handleCloudLogin = useCallback((result) => {
    const session = getCloudSession();
    setCloudSession(session);
    setShowCloudModal(false);
    setCloudSource('cloud');
    refreshCloudPhotos();
  }, [refreshCloudPhotos]);

  const handleCloudLogout = useCallback(() => {
    setCloudSession(null);
    setCloudSource('local');
    setCloudPhotos([]);
    setShowCloudModal(false);
  }, []);

  // fullUrls precisa ser declarado antes dos callbacks que o referenciam
  const [fullUrls,      setFullUrls]      = useState({});  // id → full-res URL (lazy-loaded from IDB)
  const fullBlobUrlsRef = useRef([]);                       // rastrear blob: URLs para revoke no unmount

  // Limpar URLs de blobs carregadas pelo viewer ao desmontar
  useEffect(() => {
    return () => fullBlobUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const handleUploadToCloud = useCallback(async (photo) => {
    if (!cloudSession) return;
    setUploadingToCloud(true);
    setCloudError(null);
    try {
      // Se for thumbnail, carregar imagem completa antes de enviar
      let sourceUrl = fullUrls[photo.id] || photo.url;
      if (photo.isThumb && !fullUrls[photo.id] && onLoadFull) {
        const full = await onLoadFull(photo.id);
        if (full) {
          if (full.url.startsWith('blob:')) fullBlobUrlsRef.current.push(full.url);
          setFullUrls((prev) => ({ ...prev, [photo.id]: full.url }));
          sourceUrl = full.url;
        }
      }
      const dataUrl = await toBase64DataUrl(sourceUrl);
      await cloudUploadPhoto(dataUrl, photo.mimeType, photo.createdAt);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 2500);
      if (cloudSource === 'cloud') await refreshCloudPhotos();
    } catch (err) {
      setCloudError(err.message || 'Erro ao enviar para nuvem');
      setTimeout(() => setCloudError(null), 3000);
    } finally {
      setUploadingToCloud(false);
    }
  }, [cloudSession, cloudSource, refreshCloudPhotos, fullUrls, onLoadFull]);

  const handleBatchUploadToCloud = useCallback(async () => {
    if (!cloudSession) return;
    const photosToUpload = activePhotos.filter((p) => selectedIds.has(p.id));
    if (photosToUpload.length === 0) return;
    setUploadingBatch(true);
    setBatchUploadDone(0);
    setBatchUploadTotal(photosToUpload.length);
    setCloudError(null);
    let done = 0;
    for (const photo of photosToUpload) {
      try {
        // Se for thumbnail, carregar imagem completa antes de enviar
        let sourceUrl = fullUrls[photo.id] || photo.url;
        if (photo.isThumb && !fullUrls[photo.id] && onLoadFull) {
          const full = await onLoadFull(photo.id);
          if (full) {
            if (full.url.startsWith('blob:')) fullBlobUrlsRef.current.push(full.url);
            setFullUrls((prev) => ({ ...prev, [photo.id]: full.url }));
            sourceUrl = full.url;
          }
        }
        const dataUrl = await toBase64DataUrl(sourceUrl);
        await cloudUploadPhoto(dataUrl, photo.mimeType, photo.createdAt);
        done++;
        setBatchUploadDone(done);
      } catch {
        // continua nos próximos mesmo se um falhar
      }
    }
    setUploadingBatch(false);
    setUploadSuccess(true);
    setTimeout(() => setUploadSuccess(false), 3000);
    setSelectMode(false);
    setSelectedIds(new Set());
    if (cloudSource === 'cloud') await refreshCloudPhotos();
  }, [cloudSession, activePhotos, selectedIds, cloudSource, refreshCloudPhotos, fullUrls, onLoadFull]);

  const handleCloudDelete = useCallback(async (id) => {
    try {
      await cloudDeletePhoto(id);
      setCloudPhotos((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setCloudError(err.message || 'Erro ao excluir da nuvem');
      setTimeout(() => setCloudError(null), 3000);
    }
  }, []);

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

  // ── Viewer zoom / pan / rotation ────────────────────────────────────────────────
  const [viewerZoom,     setViewerZoom]     = useState(1);
  const [viewerPan,      setViewerPan]      = useState({ x: 0, y: 0 });
  const [viewerRotation, setViewerRotation] = useState(0);
  const viewerZoomRef  = useRef(1);
  const viewerPanRef   = useRef({ x: 0, y: 0 });
  const pinchRef       = useRef(null);   // { dist, zoom } — active pinch gesture
  const singlePanRef   = useRef(null);   // { startX, startY, panX, panY } — pan gesture
  const lastTapRef     = useRef(0);      // timestamp of last tap (double-tap detection)

  const selectedPhoto = selectedIndex !== null ? activePhotos[selectedIndex] : null;
  const displayUrl = (photo) => (photo && editedUrls[photo.id]) || (photo && fullUrls[photo.id]) || (photo && photo.url);

  // Quando o viewer abre para um thumbnail, carregar imagem em resolução completa
  useEffect(() => {
    if (!selectedPhoto || !selectedPhoto.isThumb || fullUrls[selectedPhoto.id] || !onLoadFull) return;
    let cancelled = false;
    onLoadFull(selectedPhoto.id).then((full) => {
      if (!cancelled && full) {
        if (full.url && full.url.startsWith('blob:')) fullBlobUrlsRef.current.push(full.url);
        setFullUrls((prev) => ({ ...prev, [selectedPhoto.id]: full.url }));
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [selectedPhoto?.id]); // eslint-disable-line

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
      if (cloudSource === 'cloud') {
        await handleCloudDelete(id);
        if (selectedPhoto && selectedPhoto.id === id) setSelectedIndex(null);
        return;
      }
      if (favorites.has(id)) return;
      await onDelete(id);
      if (selectedPhoto && selectedPhoto.id === id) setSelectedIndex(null);
    },
    [onDelete, selectedPhoto, favorites, cloudSource, handleCloudDelete]
  );

  const handleSaveEdit = useCallback(async (id, newUrl) => {
    setEditedUrls((prev) => ({ ...prev, [id]: newUrl }));
    // Detect actual format from the edited blob URL
    const resp = await fetch(newUrl).catch(() => null);
    const ext = resp ? mimeToExt((await resp.blob()).type) : 'jpg';
    downloadBlob(newUrl, 'foto_editada_' + id + '.' + ext);
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
    setSelectedIds(selectedIds.size === activePhotos.length ? new Set() : new Set(activePhotos.map((p) => p.id)));
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

  const selectedPhotos = activePhotos.filter((p) => selectedIds.has(p.id));
  const count = selectedIds.size;
  const allSelected = activePhotos.length > 0 && count === activePhotos.length;

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
    if (cloudSource === 'cloud') {
      for (const id of selectedIds) {
        await handleCloudDelete(id);
      }
    } else {
      for (const id of selectedIds) {
        if (!favorites.has(id)) await onDelete(id);
      }
    }
    setSelectedIds(new Set());
    setSelectMode(false);
  };

  const navigatePrev = () => { if (selectedIndex > 0) setSelectedIndex((i) => i - 1); };
  const navigateNext = () => { if (selectedIndex < activePhotos.length - 1) setSelectedIndex((i) => i + 1); };

  const longPressTimer = useRef(null);
  const makeLongPressHandlers = (photo, index) => ({
    // isPrimary check: if a second finger touches down, cancel the long-press
    onPointerDown: (e) => {
      if (!e.isPrimary) { clearTimeout(longPressTimer.current); return; }
      longPressTimer.current = setTimeout(() => {
        longPressTimer.current = null;
        openContextMenu(photo, index);
      }, 500);
    },
    onPointerUp:    () => clearTimeout(longPressTimer.current),
    onPointerLeave: () => clearTimeout(longPressTimer.current),
    onContextMenu:  (e) => e.preventDefault(),
  });

  // ── Viewer touch: pinch-zoom, pan, double-tap ────────────────────────────────
  const handleViewerTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = { dist: Math.hypot(dx, dy), zoom: viewerZoomRef.current };
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    } else if (e.touches.length === 1) {
      // Double-tap: toggle zoom
      const now = Date.now();
      if (now - lastTapRef.current < 280) {
        if (viewerZoomRef.current > 1) {
          setViewerZoom(1); setViewerPan({ x: 0, y: 0 });
          viewerZoomRef.current = 1; viewerPanRef.current = { x: 0, y: 0 };
        } else {
          setViewerZoom(2.5);
          viewerZoomRef.current = 2.5;
        }
        lastTapRef.current = 0;
        return;
      }
      lastTapRef.current = now;
      singlePanRef.current = {
        startX: e.touches[0].clientX, startY: e.touches[0].clientY,
        panX: viewerPanRef.current.x,  panY: viewerPanRef.current.y,
      };
    }
  }, []);

  const handleViewerTouchMove = useCallback((e) => {
    if (pinchRef.current && e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newZoom = Math.max(1, Math.min(6, pinchRef.current.zoom * (Math.hypot(dx, dy) / pinchRef.current.dist)));
      setViewerZoom(newZoom);
      viewerZoomRef.current = newZoom;
    } else if (singlePanRef.current && e.touches.length === 1 && viewerZoomRef.current > 1) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
      const dx = e.touches[0].clientX - singlePanRef.current.startX;
      const dy = e.touches[0].clientY - singlePanRef.current.startY;
      const newPan = { x: singlePanRef.current.panX + dx, y: singlePanRef.current.panY + dy };
      setViewerPan(newPan);
      viewerPanRef.current = newPan;
    }
  }, []);

  const handleViewerTouchEnd = useCallback((e) => {
    if (e.touches.length < 2) pinchRef.current = null;
    if (e.touches.length === 0) {
      singlePanRef.current = null;
      if (viewerZoomRef.current <= 1) {
        setViewerZoom(1); setViewerPan({ x: 0, y: 0 });
        viewerZoomRef.current = 1; viewerPanRef.current = { x: 0, y: 0 };
      }
    }
  }, []);

  const rotateViewer = useCallback(() => {
    setViewerRotation((r) => (r + 90) % 360);
    setViewerZoom(1); setViewerPan({ x: 0, y: 0 });
    viewerZoomRef.current = 1; viewerPanRef.current = { x: 0, y: 0 };
  }, []);

  // ── Android back-button integration ─────────────────────────────────────────
  useBackButton(selectMode,            () => { setSelectMode(false); setSelectedIds(new Set()); });
  useBackButton(!!selectedPhoto,       () => setSelectedIndex(null));
  useBackButton(showContextMenu,       () => setShowContextMenu(false));
  useBackButton(showProperties,        () => setShowProperties(false));
  useBackButton(showEdit,              () => setShowEdit(false));
  useBackButton(showDownloadModal,     () => setShowDownloadModal(false));
  useBackButton(showDeleteModal,       () => setShowDeleteModal(false));
  useBackButton(showDeleteSingleModal, () => setShowDeleteSingleModal(false));
  useBackButton(showCloudModal,        () => setShowCloudModal(false));

  // Reset zoom / pan / rotation when navigating between photos
  useEffect(() => {
    setViewerZoom(1); setViewerPan({ x: 0, y: 0 }); setViewerRotation(0);
    viewerZoomRef.current = 1; viewerPanRef.current = { x: 0, y: 0 };
  }, [selectedIndex]);

  // Swipe-down handlers (arraste para fechar — apenas na view de grade)
  const handleSwipeStart = useCallback((e) => {
    if (selectedPhoto || selectMode) return;
    swipeStartY.current = e.touches[0].clientY;
  }, [selectedPhoto, selectMode]);

  const handleSwipeMove = useCallback((e) => {
    if (swipeStartY.current === null) return;
    const delta = Math.max(0, e.touches[0].clientY - swipeStartY.current);
    setSwipeDelta(delta);
  }, []);

  const handleSwipeEnd = useCallback(() => {
    if (swipeDelta > 80) {
      onClose();
    } else {
      setSwipeDelta(0);
    }
    swipeStartY.current = null;
  }, [swipeDelta, onClose]);

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Galeria"
      style={swipeDelta > 0 ? {
        transform: `translateY(${swipeDelta * 0.5}px)`,
        opacity: Math.max(0.25, 1 - swipeDelta / 260),
        transition: 'none',
      } : { transition: 'transform 0.3s ease, opacity 0.3s ease' }}
    >

      {selectedPhoto ? (
        <div className={styles.viewer}>
          <div className={styles.viewerTop}>
            <button className={styles.iconBtn} onClick={() => setSelectedIndex(null)} aria-label="Voltar"><BackIcon /></button>
            <span className={styles.viewerCounter}>{selectedIndex + 1} / {activePhotos.length}</span>
            <div className={styles.viewerActions}>
              <button className={styles.iconBtn} onClick={rotateViewer} aria-label="Girar foto 90°">
                <RotateRightIcon />
              </button>
              <button className={styles.iconBtn} onClick={() => toggleFavorite(selectedPhoto.id)} aria-label="Favorito">
                <StarIcon filled={favorites.has(selectedPhoto.id)} />
              </button>
              <button className={styles.iconBtn} onClick={() => openContextMenu(selectedPhoto, selectedIndex)} aria-label="Mais opções">
                <MoreIcon />
              </button>
            </div>
          </div>
          <div
            className={styles.imageWrapper}
            style={{ touchAction: 'none', userSelect: 'none' }}
            onTouchStart={handleViewerTouchStart}
            onTouchMove={handleViewerTouchMove}
            onTouchEnd={handleViewerTouchEnd}
          >
            {selectedIndex > 0 && (
              <button className={styles.navBtn + ' ' + styles.navPrev} onClick={navigatePrev} aria-label="Anterior">‹</button>
            )}
            <img
              src={displayUrl(selectedPhoto)}
              alt="Foto"
              className={styles.fullImage}
              style={{
                transform: `translate(${viewerPan.x}px, ${viewerPan.y}px) rotate(${viewerRotation}deg) scale(${viewerZoom})`,
                willChange: viewerZoom !== 1 || viewerRotation !== 0 ? 'transform' : 'auto',
                transition: viewerZoom === 1 && viewerPan.x === 0 && viewerPan.y === 0 && viewerRotation === 0
                  ? 'transform 0.3s ease'
                  : 'none',
              }}
              {...makeLongPressHandlers(selectedPhoto, selectedIndex)}
            />
            {selectedIndex < activePhotos.length - 1 && (
              <button className={styles.navBtn + ' ' + styles.navNext} onClick={navigateNext} aria-label="Próxima">›</button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Drag handle — arraste para baixo para fechar */}
          <div
            className={styles.dragHandle}
            onTouchStart={handleSwipeStart}
            onTouchMove={handleSwipeMove}
            onTouchEnd={handleSwipeEnd}
            aria-hidden="true"
          >
            <div className={styles.dragHandleBar} />
          </div>
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
                <span className={styles.title}>
                  {cloudSource === 'cloud' ? `Nuvem (${activePhotos.length})` : `Galeria (${photos.length})`}
                </span>
                <div className={styles.headerActions}>
                  <button
                    className={styles.iconBtn + (cloudSession ? ' ' + styles.cloudBtnActive : '')}
                    onClick={() => setShowCloudModal(true)}
                    aria-label="Conta na nuvem"
                    title={cloudSession ? `Nuvem: ${cloudSession.user}` : 'Entrar na nuvem'}
                  >
                    <CloudIcon size={22} />
                  </button>
                  {photos.length > 0 || cloudSource === 'cloud'
                    ? <button className={styles.iconBtn} onClick={toggleSelectMode} aria-label="Selecionar"><SelectIcon /></button>
                    : <div style={{ width: 44 }} />}
                </div>
              </>
            )}
          </div>

          {/* ── Seletor local / nuvem ── */}
          {cloudSession && !selectMode && (
            <div className={styles.sourceSelector}>
              <select
                className={styles.sourceSelectorInput}
                value={cloudSource}
                onChange={(e) => {
                  setCloudSource(e.target.value);
                  setSelectedIndex(null);
                }}
                aria-label="Origem das fotos"
              >
                <option value="local">📱 Local</option>
                <option value="cloud">☁️ Nuvem — {cloudSession.user}</option>
              </select>
            </div>
          )}

          {/* ── Feedback cloud ── */}
          {uploadingToCloud && (
            <div className={styles.cloudToast}>Enviando para nuvem…</div>
          )}
          {uploadSuccess && (
            <div className={styles.cloudToastSuccess}>✓ Foto enviada para a nuvem!</div>
          )}
          {cloudError && (
            <div className={styles.cloudToastError}>{cloudError}</div>
          )}

          {cloudSource === 'cloud' && cloudLoading ? (
            <div className={styles.empty}>
              <div className={styles.cloudLoadingSpinner} />
              <p className={styles.emptyText}>Carregando da nuvem…</p>
            </div>
          ) : activePhotos.length === 0 ? (
            <div className={styles.empty}>
              <svg viewBox="0 0 24 24" fill="currentColor" width={56} height={56} style={{ color: 'rgba(255,255,255,0.2)' }}>
                {cloudSource === 'cloud'
                  ? <path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
                  : <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />}
              </svg>
              <p className={styles.emptyText}>
                {cloudSource === 'cloud' ? 'Nenhuma foto na nuvem' : 'Nenhuma foto ainda'}
              </p>
            </div>
          ) : (
            <div className={styles.grid}>
              {activePhotos.map((photo, index) => {
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
                    <img src={photo.url} alt={'Foto ' + (index + 1)} className={styles.gridThumb} loading="lazy" decoding="async" />
                    {isFav && !selectMode && !photo.isCloud && <span className={styles.favBadge}>★</span>}
                    {photo.isCloud && !selectMode && <span className={styles.cloudBadge}><CloudIcon size={12} /></span>}
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
              <div className={styles.batchActions}>
                <button className={styles.batchBtnDownload} onClick={() => setShowDownloadModal(true)} disabled={isZipping || uploadingBatch}>
                  <DownloadIcon />
                  <span>{isZipping ? 'Comprimindo…' : 'Baixar'}</span>
                  <span className={styles.batchBtnCount}>{count}</span>
                </button>

                {cloudSession && cloudSource === 'local' && (
                  <button
                    className={styles.batchBtnCloud}
                    onClick={handleBatchUploadToCloud}
                    disabled={uploadingBatch || isZipping}
                  >
                    <CloudIcon size={20} />
                    <span>
                      {uploadingBatch
                        ? `${batchUploadDone}/${batchUploadTotal}`
                        : 'Nuvem'}
                    </span>
                    <span className={styles.batchBtnCount}>{count}</span>
                  </button>
                )}

                <button className={styles.batchBtnDelete} onClick={() => setShowDeleteModal(true)} disabled={uploadingBatch}>
                  <DeleteIcon />
                  <span>Excluir</span>
                  <span className={styles.batchBtnCount}>{count}</span>
                </button>
              </div>

              <button className={styles.batchBtnCancel} onClick={toggleSelectMode} disabled={uploadingBatch}>
                Cancelar seleção
              </button>
            </div>
          )}
        </>
      )}

      {showContextMenu && contextPhoto && (
        <ContextMenu
          photo={contextPhoto}
          isFavorite={favorites.has(contextPhoto.id)}
          isCloud={contextPhoto.isCloud}
          cloudLoggedIn={!!cloudSession}
          onClose={() => setShowContextMenu(false)}
          onShare={() => sharePhoto(displayUrl(contextPhoto), photoFilename(contextPhoto, (contextIndex || 0) + 1))}
          onDownload={() => downloadBlob(displayUrl(contextPhoto), photoFilename(contextPhoto, (contextIndex || 0) + 1))}
          onDelete={() => setShowDeleteSingleModal(true)}
          onProperties={() => setShowProperties(true)}
          onEdit={() => setShowEdit(true)}
          onToggleFavorite={toggleFavorite}
          onUploadToCloud={() => handleUploadToCloud(contextPhoto)}
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

      {showDeleteModal && (() => {
        const favCount = [...selectedIds].filter((id) => favorites.has(id)).length;
        const deletable = count - favCount;
        return (
          <div className={styles.modalBackdrop} onClick={() => setShowDeleteModal(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <p className={styles.modalTitle}>Excluir {deletable} foto{deletable !== 1 ? 's' : ''}?</p>
              <p className={styles.modalSubtitle}>
                {favCount > 0
                  ? `${favCount} foto${favCount !== 1 ? 's favoritadas serão ignoradas' : ' favoritada será ignorada'}. Esta ação não pode ser desfeita.`
                  : 'Esta ação não pode ser desfeita.'}
              </p>
              <div className={styles.modalActionsRow}>
                <button className={styles.modalCancelInline} onClick={() => setShowDeleteModal(false)}>Cancelar</button>
                <button className={styles.modalDeleteConfirm} disabled={deletable === 0} onClick={handleBatchDelete}>Excluir</button>
              </div>
            </div>
          </div>
        );
      })()}

      {showDeleteSingleModal && contextPhoto && (() => {
        const isFav = favorites.has(contextPhoto.id);
        return (
          <div className={styles.modalBackdrop} onClick={() => setShowDeleteSingleModal(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <p className={styles.modalTitle}>{isFav ? 'Foto favoritada' : 'Excluir foto?'}</p>
              <p className={styles.modalSubtitle}>
                {isFav
                  ? 'Remova dos favoritos antes de excluir esta foto.'
                  : 'Esta ação não pode ser desfeita.'}
              </p>
              <div className={styles.modalActionsRow}>
                <button className={styles.modalCancelInline} onClick={() => setShowDeleteSingleModal(false)}>{isFav ? 'Ok' : 'Cancelar'}</button>
                {!isFav && (
                  <button className={styles.modalDeleteConfirm} onClick={async () => { setShowDeleteSingleModal(false); await handleDelete(contextPhoto.id); }}>Excluir</button>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {showCloudModal && (
        <CloudModal
          session={cloudSession}
          onLogin={handleCloudLogin}
          onLogout={handleCloudLogout}
          onClose={() => setShowCloudModal(false)}
        />
      )}
    </div>
  );
}
