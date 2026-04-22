import { useState, useEffect, useRef, useCallback } from 'react';
import {
  savePhoto as idbSavePhoto,
  loadPhotos as idbLoadPhotos,
  deletePhoto as idbDeletePhoto,
} from '../utils/photoDB';
import { FILTER_CSS } from '../utils/filterMap';

const QUALITY_MAP = { low: 0.6, medium: 0.78, high: 0.92, max: 1.0 };
const MIME_MAP    = { jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
const RES_MAP     = {
  '720p':  { width: { ideal: 1280 }, height: { ideal: 720  } },
  '1080p': { width: { ideal: 1920 }, height: { ideal: 1080 } },
  '4k':    { width: { ideal: 3840 }, height: { ideal: 2160 } },
};

/**
 * Parse a browser camera label to derive a display shortLabel and type.
 * Returns { shortLabel, type, isFront }
 */
function parseCameraLabel(label = '', index) {
  const l = label.toLowerCase();
  const isFront =
    l.includes('front') || l.includes('facing front') || l.includes('user');

  if (!label) {
    // Labels empty before permission — fallback to index
    return { shortLabel: index === 0 ? '1×' : `${index + 1}×`, type: 'unknown', isFront: false };
  }

  if (
    l.includes('ultra') ||
    l.includes('wide angle') ||
    l.includes('grand angle') ||
    /0\.5|0\.6/.test(l)
  ) {
    return { shortLabel: '0.5×', type: 'ultrawide', isFront };
  }

  if (
    l.includes('tele') ||
    l.includes('periscope') ||
    /\b3[x×]|\b3\./.test(l)
  ) {
    return { shortLabel: '3×', type: 'tele', isFront };
  }

  if (/\b2[x×]|\b2\./.test(l)) {
    return { shortLabel: '2×', type: 'tele2', isFront };
  }

  // Default — main/wide
  return { shortLabel: '1×', type: 'main', isFront };
}

/**
 * Returns the current device orientation angle (degrees).
 * 0/180 = portrait, 90/270 = landscape.
 */
function getOrientationAngle() {
  if (typeof screen !== 'undefined' && screen.orientation?.angle != null) {
    return screen.orientation.angle;
  }
  if (typeof window !== 'undefined' && window.orientation != null) {
    return ((window.orientation % 360) + 360) % 360;
  }
  return 0;
}

/**
 * Apply orientation-aware + front-camera-mirror transforms to a canvas context,
 * then draw the video frame. ctx must already have the correct canvas dimensions
 * (canvasW × canvasH) set.
 *
 * @param {CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D} ctx
 * @param {HTMLVideoElement|VideoFrame} video
 * @param {number} vw  - video natural width
 * @param {number} vh  - video natural height
 * @param {number} canvasW - output canvas width
 * @param {number} canvasH - output canvas height
 * @param {boolean} isFront - true for front-facing camera (apply horizontal mirror)
 * @param {number}  angle   - device orientation angle (0|90|180|270)
 * @param {boolean} needsRotation - should we rotate 90°?
 * @param {string}  cssFilter - CSS filter string, e.g. 'brightness(1.2)'
 */
function applyFrameToContext(ctx, video, vw, vh, canvasW, canvasH, isFront, angle, needsRotation, cssFilter) {
  if (needsRotation) {
    if (angle === 180) {
      // Upside-down portrait → rotate 90° CCW
      ctx.translate(0, canvasH); // canvasH = vw
      ctx.rotate(-Math.PI / 2);
    } else {
      // Natural portrait (0°) → rotate 90° CW
      // Left column of landscape sensor = top of phone = top of portrait
      ctx.translate(canvasW, 0); // canvasW = vh
      ctx.rotate(Math.PI / 2);
    }
  }
  if (isFront) { ctx.translate(vw, 0); ctx.scale(-1, 1); }
  if (cssFilter) ctx.filter = cssFilter;
  ctx.drawImage(video, 0, 0, vw, vh);
}

/**
 * Multi-frame stacking via GPU compositing — NO getImageData / putImageData.
 *
 * Algorithm: incremental running average using canvas globalAlpha + source-over.
 *   Frame i blended at alpha = 1/(i+1) over the accumulated result gives an
 *   exact equal-weight average for all frames. Everything stays on the GPU.
 *
 * ~10× faster than the getImageData/Float32Array approach for 1080p.
 */
async function stackFrames(video, vw, vh, canvasW, canvasH, cssFilter, isFront, angle, needsRotation, count, mime, quality) {
  const pause  = (ms) => new Promise((r) => setTimeout(r, ms));
  const useOC  = typeof OffscreenCanvas !== 'undefined';

  const out = useOC
    ? new OffscreenCanvas(canvasW, canvasH)
    : (() => { const c = document.createElement('canvas'); c.width = canvasW; c.height = canvasH; return c; })();
  const ctx = out.getContext('2d');

  // Opaque black base — required so source-over compositing works correctly
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvasW, canvasH);

  for (let i = 0; i < count; i++) {
    if (i > 0) await pause(60); // ~2 video frames at 30 fps
    ctx.save();
    ctx.globalAlpha = 1 / (i + 1); // weight for running average
    applyFrameToContext(ctx, video, vw, vh, canvasW, canvasH, isFront, angle, needsRotation, cssFilter);
    ctx.restore();
  }

  return useOC
    ? out.convertToBlob(mime === 'image/png' ? { type: mime } : { type: mime, quality })
    : new Promise((res) =>
        mime === 'image/png' ? out.toBlob(res, mime) : out.toBlob(res, mime, quality)
      );
}

export function useCamera({
  photoQuality       = 'high',
  saveFormat         = 'jpeg',
  videoResolution    = '1080p',
  filter             = 'none',
  filterOverrideCSS  = '',   // raw CSS string — overrides ID-based filter (used by modes)
  multiFrameCount    = 1,    // >1 = frame-stacking (night mode noise reduction)
  defaultCamera      = 'environment', // 'environment' | 'user'
} = {}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const canvasRef = useRef(null);       // internal fallback canvas (not rendered)
  const blobUrlsRef = useRef([]);       // track all created object URLs for cleanup

  // Pinch-to-zoom refs
  const pinchStartDistRef = useRef(null);
  const pinchStartZoomRef = useRef(null);

  // MediaRecorder refs
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  // Timer refs
  const timerIntervalRef = useRef(null);
  const timerRunningRef = useRef(false);
  const timerDelayRef = useRef(0);

  // Focus/exposure timer ref
  const focusTimerRef = useRef(null);

  // Focus-lock long-press refs
  const longPressTimerRef  = useRef(null);
  const longPressDidFireRef = useRef(false);

  // Device orientation angle ref — updated on every orientationchange event
  const orientationAngleRef = useRef(getOrientationAngle());

  // Ref mirrors — allow callbacks to read latest value without stale closures
  const isCapturingRef = useRef(false);
  const isRecordingRef = useRef(false);
  const facingModeRef = useRef(defaultCamera);
  const flashModeRef = useRef('off');
  const zoomRef = useRef(1);

  // Settings refs (updated via useEffect — no stale closure in callbacks)
  const filterRef              = useRef(filter);
  const photoQualityRef        = useRef(photoQuality);
  const saveFormatRef          = useRef(saveFormat);
  const videoResolutionRef     = useRef(videoResolution);
  const filterOverrideCSSRef   = useRef(filterOverrideCSS);
  const multiFrameCountRef     = useRef(multiFrameCount);

  // State
  const [facingMode, setFacingMode] = useState(defaultCamera);
  const [photos, setPhotos] = useState([]); // [{ id: number, url: string }]
  const [zoom, setZoom] = useState(1);
  const [isFlashing, setIsFlashing] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [cameraList, setCameraList] = useState([]); // [{ deviceId, label, shortLabel, type, isFront }]
  const [selectedDeviceId, setSelectedDeviceId] = useState(null); // null = use facingMode
  const [error, setError] = useState(null);
  const [flashMode, setFlashMode] = useState('off'); // 'off' | 'on' | 'auto'
  const [focusPoint, setFocusPoint] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const [timerDelay, setTimerDelay] = useState(0); // 0 | 3 | 5 | 10
  const [timerCount, setTimerCount] = useState(null);
  const [exposureCompensation, setExposureCompensationState] = useState(0);
  const [exposureRange, setExposureRange] = useState(null); // { min, max, step } | null
  const [focusLocked, setFocusLocked] = useState(false);
  const focusLockedRef = useRef(false);

  // Derived: most recent photo URL for thumbnail
  const capturedPhoto = photos[0]?.url ?? null;

  // Keep ref mirrors in sync with state
  useEffect(() => { facingModeRef.current = facingMode; }, [facingMode]);
  useEffect(() => { focusLockedRef.current = focusLocked; }, [focusLocked]);
  useEffect(() => { flashModeRef.current = flashMode; }, [flashMode]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { timerDelayRef.current = timerDelay; }, [timerDelay]);

  // Keep settings refs in sync with incoming props
  useEffect(() => { filterRef.current            = filter;            }, [filter]);
  useEffect(() => { photoQualityRef.current       = photoQuality;      }, [photoQuality]);
  useEffect(() => { saveFormatRef.current         = saveFormat;        }, [saveFormat]);
  useEffect(() => { videoResolutionRef.current    = videoResolution;   }, [videoResolution]);
  useEffect(() => { filterOverrideCSSRef.current  = filterOverrideCSS; }, [filterOverrideCSS]);
  useEffect(() => { multiFrameCountRef.current    = multiFrameCount;   }, [multiFrameCount]);

  // Track device orientation changes so doCapture can rotate the canvas correctly
  useEffect(() => {
    const update = () => { orientationAngleRef.current = getOrientationAngle(); };
    if (typeof screen !== 'undefined' && screen.orientation) {
      screen.orientation.addEventListener('change', update);
      return () => screen.orientation.removeEventListener('change', update);
    }
    window.addEventListener('orientationchange', update);
    return () => window.removeEventListener('orientationchange', update);
  }, []);

  // Initialize internal fallback canvas once
  useEffect(() => {
    canvasRef.current = document.createElement('canvas');
  }, []);

  // Load persisted photos from IndexedDB on mount
  useEffect(() => {
    idbLoadPhotos()
      .then((records) => {
        const loaded = records.map((r) => {
          const url = URL.createObjectURL(r.blob);
          blobUrlsRef.current.push(url);
          return { id: r.id, url, mimeType: r.blob.type || 'image/jpeg' };
        });
        setPhotos(loaded);
      })
      .catch(() => {});
  }, []);

  // Cleanup all blob URLs and resources on unmount
  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
    };
  }, []);

  // Detect cameras — called initially and again after permission is granted
  const detectCameras = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    const devices = await navigator.mediaDevices.enumerateDevices().catch(() => []);
    const videos = devices.filter((d) => d.kind === 'videoinput');
    setHasMultipleCameras(videos.length > 1);

    // Only update cameraList when labels are available (post-permission)
    if (videos.some((d) => d.label)) {
      const list = videos.map((d, i) => ({
        deviceId: d.deviceId,
        label:    d.label,
        ...parseCameraLabel(d.label, i),
      }));
      setCameraList(list);
    }
  }, []);

  useEffect(() => { detectCameras(); }, [detectCameras]);

  // Start or restart the camera stream
  const startCamera = useCallback(async () => {
    setIsLoading(true);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('API de câmera não suportada neste navegador.');
      }

      const res = RES_MAP[videoResolutionRef.current] || RES_MAP['1080p'];
      // Use specific deviceId when the user picked a lens; otherwise use facingMode
      const videoConstraints = selectedDeviceId
        ? { deviceId: { exact: selectedDeviceId }, ...res }
        : { facingMode, ...res };
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      // Re-detect cameras now that permission is granted (labels are available)
      await detectCameras();

      setError(null);
    } catch (err) {
      const messages = {
        NotAllowedError: 'Permissão para câmera negada. Permita o acesso nas configurações do navegador.',
        NotFoundError: 'Nenhuma câmera encontrada neste dispositivo.',
        NotReadableError: 'A câmera está em uso por outro aplicativo.',
        OverconstrainedError: 'Configuração de câmera não suportada.',
      };
      setError(messages[err.name] || err.message || 'Erro ao acessar a câmera.');
    } finally {
      setIsLoading(false);
      setIsSwitching(false); // end switch animation
    }
  }, [facingMode, selectedDeviceId, detectCameras]);

  useEffect(() => {
    startCamera();
  }, [startCamera]);

  // ── Torch (hardware LED flash) ──────────────────────────────────────────────
  const applyTorch = useCallback(async (on) => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      const caps = track.getCapabilities?.();
      if (caps?.torch) await track.applyConstraints({ advanced: [{ torch: on }] });
    } catch (_) {}
  }, []);

  // ── Native zoom ─────────────────────────────────────────────────────────────
  const applyNativeZoom = useCallback((zoomValue) => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      const caps = track.getCapabilities?.();
      if (caps?.zoom) {
        const { min, max } = caps.zoom;
        const mapped = min + ((zoomValue - 1) / 4) * (max - min);
        track.applyConstraints({ advanced: [{ zoom: Math.max(min, Math.min(max, mapped)) }] });
      }
    } catch (_) {}
  }, []);

  const handleZoomChange = useCallback(
    (newZoom) => {
      const clamped = Math.max(0.5, Math.min(8, newZoom));
      setZoom(clamped);
      zoomRef.current = clamped;
      applyNativeZoom(clamped);
    },
    [applyNativeZoom]
  );

  // ── Photo capture ────────────────────────────────────────────────────────────
  // Inner async function — reads state via refs to avoid stale closures
  const doCapture = useCallback(async () => {
    if (!videoRef.current) return;
    isCapturingRef.current = true;
    setIsCapturing(true);

    if (flashModeRef.current === 'on') await applyTorch(true);

    try {
      const video = videoRef.current;
      const vw = video.videoWidth || 1280;
      const vh = video.videoHeight || 720;
      let blob;

      const mime       = MIME_MAP[saveFormatRef.current]      || 'image/jpeg';
      const quality    = QUALITY_MAP[photoQualityRef.current]  ?? 0.92;
      // Mode filter overrides settings filter
      const cssFilter  = filterOverrideCSSRef.current || FILTER_CSS[filterRef.current] || '';
      const frames     = multiFrameCountRef.current;
      const isFront    = facingModeRef.current === 'user';

      // Determine if the photo needs a 90° rotation to match device orientation.
      // The camera sensor always streams in landscape; if the device is in portrait
      // (angle 0° or 180°) AND the video is wider than tall, we rotate the canvas.
      const angle          = orientationAngleRef.current;
      const needsRotation  = vw > vh && (angle === 0 || angle === 180);
      const canvasW        = needsRotation ? vh : vw;
      const canvasH        = needsRotation ? vw : vh;

      if (frames > 1) {
        // ── Night mode: multi-frame pixel-averaging (noise reduction) ──
        blob = await stackFrames(
          video, vw, vh, canvasW, canvasH, cssFilter, isFront, angle, needsRotation, frames, mime, quality
        );
      } else if (typeof OffscreenCanvas !== 'undefined' && typeof createImageBitmap === 'function') {
        // Off-thread rendering — doesn't block main thread for large frames
        const bitmap = await createImageBitmap(video);
        const offscreen = new OffscreenCanvas(canvasW, canvasH);
        const ctx = offscreen.getContext('2d');
        ctx.save();
        applyFrameToContext(ctx, bitmap, vw, vh, canvasW, canvasH, isFront, angle, needsRotation, cssFilter);
        ctx.restore();
        bitmap.close();
        blob = await offscreen.convertToBlob(
          mime === 'image/png' ? { type: mime } : { type: mime, quality }
        );
      } else {
        // Fallback: synchronous canvas on main thread
        const canvas = canvasRef.current;
        canvas.width  = canvasW;
        canvas.height = canvasH;
        const ctx = canvas.getContext('2d');
        ctx.save();
        applyFrameToContext(ctx, video, vw, vh, canvasW, canvasH, isFront, angle, needsRotation, cssFilter);
        ctx.restore();
        blob = await new Promise((res) =>
          mime === 'image/png' ? canvas.toBlob(res, mime) : canvas.toBlob(res, mime, quality)
        );
      }

      // Add photo to UI immediately with a provisional ID — don't block on IDB
      const url = URL.createObjectURL(blob);
      blobUrlsRef.current.push(url);
      const provisionalId = Date.now();
      setPhotos((prev) => [{ id: provisionalId, url, mimeType: blob.type || 'image/jpeg' }, ...prev]);

      // Persist to IndexedDB in the background (doesn't block capture unlock)
      idbSavePhoto(blob)
        .then((savedId) => {
          // Swap provisional ID for the real DB ID (needed for correct delete later)
          setPhotos((prev) =>
            prev.map((p) => (p.id === provisionalId ? { ...p, id: savedId } : p))
          );
        })
        .catch(() => {}); // keep provisional ID on failure
    } catch (err) {
      console.error('Erro ao capturar foto:', err);
    } finally {
      if (flashModeRef.current === 'on') await applyTorch(false);
      setIsFlashing(true);
      setTimeout(() => {
        setIsFlashing(false);
        isCapturingRef.current = false;
        setIsCapturing(false);
      }, 350);
    }
  }, [applyTorch]);

  // Cancel active timer countdown
  const cancelTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    timerRunningRef.current = false;
    setTimerCount(null);
  }, []);

  // Public capture — handles timer delay then calls doCapture
  const capturePhoto = useCallback(() => {
    if (isCapturingRef.current || timerRunningRef.current) return;
    const delay = timerDelayRef.current;
    if (delay > 0) {
      timerRunningRef.current = true;
      let remaining = delay;
      setTimerCount(remaining);
      timerIntervalRef.current = setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
          timerRunningRef.current = false;
          setTimerCount(null);
          doCapture();
        } else {
          setTimerCount(remaining);
        }
      }, 1000);
    } else {
      doCapture();
    }
  }, [doCapture]);

  // ── Camera switch ────────────────────────────────────────────────────────────
  const switchCamera = useCallback(() => {
    setIsSwitching(true);
    setSelectedDeviceId(null); // reset to facingMode default
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
    setZoom(1);
    zoomRef.current = 1;
    setFocusLocked(false);
    focusLockedRef.current = false;
    setFocusPoint(null);
  }, []);

  // ── Lens selection (pick a specific physical camera) ──────────────────────────
  const selectCamera = useCallback((deviceId) => {
    setIsSwitching(true);
    setSelectedDeviceId(deviceId);
    setZoom(1);
    zoomRef.current = 1;
    setFocusLocked(false);
    focusLockedRef.current = false;
    setFocusPoint(null);
  }, []);

  // ── Flash toggle ─────────────────────────────────────────────────────────────
  const toggleFlashMode = useCallback(() => {
    const cycle = ['off', 'on', 'auto'];
    setFlashMode((prev) => {
      const next = cycle[(cycle.indexOf(prev) + 1) % cycle.length];
      flashModeRef.current = next;
      return next;
    });
  }, []);

  // ── Timer toggle ─────────────────────────────────────────────────────────────
  const toggleTimerDelay = useCallback(() => {
    setTimerDelay((prev) => {
      const next = prev === 0 ? 3 : prev === 3 ? 5 : prev === 5 ? 10 : 0;
      timerDelayRef.current = next;
      return next;
    });
  }, []);

  // ── Delete photo ─────────────────────────────────────────────────────────────
  const deletePhoto = useCallback(async (id) => {
    setPhotos((prev) => {
      const photo = prev.find((p) => p.id === id);
      if (photo) {
        URL.revokeObjectURL(photo.url);
        blobUrlsRef.current = blobUrlsRef.current.filter((u) => u !== photo.url);
      }
      return prev.filter((p) => p.id !== id);
    });
    await idbDeletePhoto(id).catch(() => {});
  }, []);

  // ── Video recording ──────────────────────────────────────────────────────────
  const startRecording = useCallback(() => {
    if (!streamRef.current || isRecordingRef.current || typeof MediaRecorder === 'undefined') return;

    const mimeType =
      ['video/webm;codecs=vp9', 'video/webm', 'video/mp4'].find((t) =>
        MediaRecorder.isTypeSupported(t)
      ) || '';

    let recorder;
    try {
      recorder = mimeType ? new MediaRecorder(streamRef.current, { mimeType }) : new MediaRecorder(streamRef.current);
    } catch (_) {
      recorder = new MediaRecorder(streamRef.current);
    }

    mediaRecorderRef.current = recorder;
    recordedChunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data?.size > 0) recordedChunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const chunks = recordedChunksRef.current;
      if (chunks.length > 0) {
        const finalMime = recorder.mimeType || 'video/webm';
        const blob = new Blob(chunks, { type: finalMime });
        const url = URL.createObjectURL(blob);
        const ext = finalMime.includes('mp4') ? 'mp4' : 'webm';
        const a = document.createElement('a');
        a.href = url;
        a.download = `video_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.${ext}`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      }
      recordedChunksRef.current = [];
      isRecordingRef.current = false;
      setIsRecording(false);
      setRecordingTime(0);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    };

    recorder.start(100);
    isRecordingRef.current = true;
    setIsRecording(true);

    let elapsed = 0;
    recordingTimerRef.current = setInterval(() => {
      elapsed += 1;
      setRecordingTime(elapsed);
    }, 1000);
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecordingRef.current) {
      mediaRecorderRef.current.stop();
    }
  }, []);

  // ── Focus lock (long-press) ──────────────────────────────────────────────────
  const lockFocusAt = useCallback(async (x, y) => {
    longPressDidFireRef.current = true;
    if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
    setFocusPoint({ x, y, id: Date.now() });
    setFocusLocked(true);
    focusLockedRef.current = true;
    setExposureCompensationState(0);

    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      const caps = track.getCapabilities();
      const adv = {};
      if (caps.pointOfInterest) adv.pointOfInterest = { x: x / 100, y: y / 100 };
      // Lock focus: prefer manual, fallback to single-shot
      if (caps.focusMode?.includes('manual')) adv.focusMode = 'manual';
      else if (caps.focusMode?.includes('single-shot')) adv.focusMode = 'single-shot';
      if (caps.exposureMode?.includes('continuous')) adv.exposureMode = 'continuous';
      if (caps.exposureCompensation) adv.exposureCompensation = 0;
      if (Object.keys(adv).length > 0) await track.applyConstraints({ advanced: [adv] });
      if (caps.exposureCompensation) setExposureRange(caps.exposureCompensation);
    } catch (_) {}
  }, []);

  const unlockFocus = useCallback(async () => {
    if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
    setFocusPoint(null);
    setFocusLocked(false);
    focusLockedRef.current = false;

    // Restore continuous autofocus
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      const caps = track.getCapabilities();
      const adv = {};
      if (caps.focusMode?.includes('continuous')) adv.focusMode = 'continuous';
      if (caps.exposureMode?.includes('continuous')) adv.exposureMode = 'continuous';
      if (Object.keys(adv).length > 0) await track.applyConstraints({ advanced: [adv] });
    } catch (_) {}
  }, []);

  // ── Tap-to-focus ─────────────────────────────────────────────────────────────
  const handleFocusTap = useCallback(async (e) => {
    // Suppress the synthetic click that fires right after a long-press touchend
    if (longPressDidFireRef.current) {
      longPressDidFireRef.current = false;
      return;
    }

    // If focus is locked, tap anywhere to unlock
    if (focusLockedRef.current) {
      unlockFocus();
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;

    if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
    setFocusPoint({ x, y, id: Date.now() });
    focusTimerRef.current = setTimeout(() => setFocusPoint(null), 4500);

    setExposureCompensationState(0);

    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      const caps = track.getCapabilities();
      const adv = {};
      if (caps.pointOfInterest) {
        adv.pointOfInterest = { x: x / 100, y: y / 100 };
      }
      if (caps.focusMode?.includes('single-shot')) {
        adv.focusMode = 'single-shot';
      } else if (caps.focusMode?.includes('manual')) {
        adv.focusMode = 'manual';
      }
      // Always keep exposure in continuous during tap-to-focus;
      // manual exposure without exposureTime causes black frame.
      if (caps.exposureMode?.includes('continuous')) {
        adv.exposureMode = 'continuous';
      }
      if (caps.exposureCompensation) {
        adv.exposureCompensation = 0;
      }
      if (Object.keys(adv).length > 0) {
        await track.applyConstraints({ advanced: [adv] });
      }
      if (caps.exposureCompensation) {
        setExposureRange(caps.exposureCompensation);
      }
    } catch (_) {
      // Focus/exposure constraints not supported on this device
    }
  }, [unlockFocus]);

  // ── Exposure compensation ─────────────────────────────────────────────────────
  const setExposure = useCallback(async (value) => {
    setExposureCompensationState(value);
    if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
    focusTimerRef.current = setTimeout(() => setFocusPoint(null), 3500);
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      const caps = track.getCapabilities();
      const adv = { exposureCompensation: value };
      if (caps.exposureMode?.includes('continuous')) adv.exposureMode = 'continuous';
      await track.applyConstraints({ advanced: [adv] });
    } catch (_) {}
  }, []);

  // ── Pro mode: ISO + shutter speed ───────────────────────────────────────────
  const applyProSettings = useCallback(async (iso, exposureTime) => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      const adv = {};
      const isManual = iso > 0 || exposureTime > 0;
      adv.exposureMode = isManual ? 'manual' : 'continuous';
      if (iso > 0) adv.iso = iso;
      if (exposureTime > 0) adv.exposureTime = exposureTime;
      await track.applyConstraints({ advanced: [adv] });
    } catch (_) {}
  }, []);

  // ── Pinch-to-zoom ─────────────────────────────────────────────────────────────
  // Uses zoomRef instead of zoom state → no stale closure, no recreating on every zoom change
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      // Multi-touch: cancel any pending long-press
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStartDistRef.current = Math.hypot(dx, dy);
      pinchStartZoomRef.current = zoomRef.current;
    } else if (e.touches.length === 1 && !focusLockedRef.current) {
      // Single touch: start long-press timer for focus lock
      const rect = e.currentTarget.getBoundingClientRect();
      const t = e.touches[0];
      const x = ((t.clientX - rect.left) / rect.width) * 100;
      const y = ((t.clientY - rect.top) / rect.height) * 100;
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = setTimeout(() => {
        longPressTimerRef.current = null;
        lockFocusAt(x, y);
      }, 650);
    }
  }, [lockFocusAt]);

  const handleTouchMove = useCallback(
    (e) => {
      // Cancel long-press if finger moved significantly
      if (longPressTimerRef.current && e.touches.length === 1) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      if (e.touches.length === 2 && pinchStartDistRef.current) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const newZoom = Math.max(
          0.5,
          Math.min(8, (pinchStartZoomRef.current || 1) * (Math.hypot(dx, dy) / pinchStartDistRef.current))
        );
        setZoom(newZoom);
        zoomRef.current = newZoom;
        applyNativeZoom(newZoom);
      }
    },
    [applyNativeZoom]
  );

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    pinchStartDistRef.current = null;
    pinchStartZoomRef.current = null;
  }, []);

  return {
    videoRef,
    facingMode,
    capturedPhoto,
    photos,
    zoom,
    isFlashing,
    isCapturing,
    isRecording,
    recordingTime,
    hasMultipleCameras,
    error,
    flashMode,
    focusPoint,
    isLoading,
    isSwitching,
    timerDelay,
    timerCount,
    exposureCompensation,
    exposureRange,
    setExposure,
    applyProSettings,
    focusLocked,
    switchCamera,
    selectCamera,
    cameraList,
    selectedDeviceId,
    capturePhoto,
    cancelTimer,
    startRecording,
    stopRecording,
    toggleFlashMode,
    toggleTimerDelay,
    deletePhoto,
    handleZoomChange,
    handleFocusTap,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
