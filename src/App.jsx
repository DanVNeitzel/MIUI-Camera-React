import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useCamera } from './hooks/useCamera';
import { useBackButton } from './hooks/useBackButton';
import { useSettings } from './hooks/useSettings';
import { FILTER_CSS } from './utils/filterMap';
import { MODE_PROFILES, computeProFilter } from './utils/modeProfiles';

import Camera from './components/Camera/Camera';
import TopBar from './components/TopBar/TopBar';
import ZoomControl from './components/ZoomControl/ZoomControl';
import ModeSelector from './components/ModeSelector/ModeSelector';
import Controls from './components/Controls/Controls';
import FlashOverlay from './components/FlashOverlay/FlashOverlay';
import Gallery from './components/Gallery/Gallery';
import Settings from './components/Settings/Settings';
import WhatsNew, { shouldShowWhatsNew } from './components/WhatsNew/WhatsNew';
import MoreModes, { MORE_MODES } from './components/MoreModes/MoreModes';
import ProControls from './components/ProControls/ProControls';
import VideoModeControls from './components/VideoModeControls/VideoModeControls';
import PanoramaOverlay from './components/PanoramaOverlay/PanoramaOverlay';
import DocumentOverlay from './components/DocumentOverlay/DocumentOverlay';
import LensSelector from './components/LensSelector/LensSelector';

import styles from './App.module.css';

export default function App() {
  const [activeMode, setActiveMode] = useState('foto');
  const [showGallery, setShowGallery] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(() => shouldShowWhatsNew());
  const [showMoreModes, setShowMoreModes] = useState(false);

  // Derived: is the active mode one of the "extra" modes from the More sheet?
  const isExtraMode = MORE_MODES.some((m) => m.id === activeMode);

  const handleModeChange = useCallback((id) => {
    if (id === 'mais') { setShowMoreModes(true); return; }
    setActiveMode(id);
  }, []);

  // PRO mode manual controls
  const [proEV, setProEV] = useState(0);
  const [proWB, setProWB] = useState(5500);
  const [proISO, setProISO] = useState(0);
  const [proShutter, setProShutter] = useState(0);

  // Slow-motion / time-lapse mode controls
  const [slowMotionFps, setSlowMotionFps] = useState(0);     // 0 = auto
  const [timelapseMs, setTimelapseMs]     = useState(1000);  // ms between frames

  // Panorama mode state
  const [isPanoCapturing, setIsPanoCapturing] = useState(false);
  const [panoFrameCount, setPanoFrameCount]   = useState(0);
  const panoFramesRef   = useRef([]);  // array of ImageBitmap
  const panoIntervalRef = useRef(null);

  const { settings, updateSetting, resetSettings } = useSettings();

  const toggleGridType = useCallback(() => {
    const cycle = { none: 'thirds', thirds: 'square', square: 'both', both: 'none' };
    updateSetting('gridType', cycle[settings.gridType] ?? 'thirds');
  }, [updateSetting, settings.gridType]);

  // Request fullscreen on first user interaction
  useEffect(() => {
    const requestFullscreen = () => {
      const el = document.documentElement;
      if (!document.fullscreenElement) {
        (el.requestFullscreen?.() ||
          el.webkitRequestFullscreen?.() ||
          el.mozRequestFullScreen?.() ||
          el.msRequestFullscreen?.());
      }
    };
    document.addEventListener('click', requestFullscreen, { once: true });
    document.addEventListener('touchstart', requestFullscreen, { once: true });
    return () => {
      document.removeEventListener('click', requestFullscreen);
      document.removeEventListener('touchstart', requestFullscreen);
    };
  }, []);

  // Offline indicator
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline  = () => setIsOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online',  goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online',  goOnline);
    };
  }, []);

  // Derive mode characteristics
  const modeProfile = useMemo(
    () => MODE_PROFILES[activeMode] || MODE_PROFILES.foto,
    [activeMode]
  );

  // Effective CSS filter: mode > settings filter
  const modeFilterCSS = useMemo(() => {
    if (activeMode === 'pro') return computeProFilter(proEV, proWB);
    return modeProfile.previewFilter || '';
  }, [activeMode, modeProfile, proEV, proWB]);

  const effectiveFilterCSS = modeFilterCSS || FILTER_CSS[settings.filter] || '';

  const {
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
    loadPhotoFull,
    handleZoomChange,
    focusLocked,
    handleFocusTap,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    exposureCompensation,
    exposureRange,
    setExposure,
    applyProSettings,
    isPinching,
    storageError,
  } = useCamera({
    ...settings,
    filterOverrideCSS: modeFilterCSS,
    multiFrameCount:   modeProfile.multiFrame,
    slowMotion:        modeProfile.slowMotion  ?? false,
    slowMotionFps:     modeProfile.slowMotion  ? slowMotionFps : 0,
    timelapse:         modeProfile.timelapse   ?? false,
    timelapseMs:       modeProfile.timelapse   ? timelapseMs   : 1000,
    ...(modeProfile.captureQuality ? { photoQuality: modeProfile.captureQuality } : {}),
  });

  // In video mode: toggle recording. Otherwise: capture photo (or cancel timer)
  // Panorama: toggle sweep capture
  const handleCapture = useCallback(() => {
    if (activeMode === 'panorama') {
      if (isPanoCapturing) {
        // Stop sweep and stitch
        clearInterval(panoIntervalRef.current);
        panoIntervalRef.current = null;
        setIsPanoCapturing(false);
        const frames = panoFramesRef.current;
        panoFramesRef.current = [];
        setPanoFrameCount(0);
        if (frames.length < 2) { frames.forEach((bm) => bm.close?.()); return; }
        // Stitch horizontally
        const fw = frames[0].width;
        const fh = frames[0].height;
        const stride = Math.round(fw * 0.65); // 35% overlap
        const outW = fw + (frames.length - 1) * stride;
        const useOC = typeof OffscreenCanvas !== 'undefined';
        const canvas = useOC
          ? new OffscreenCanvas(outW, fh)
          : (() => { const c = document.createElement('canvas'); c.width = outW; c.height = fh; return c; })();
        const ctx = canvas.getContext('2d');
        frames.forEach((bm, i) => {
          ctx.drawImage(bm, i * stride, 0);
          bm.close?.();
        });
        const finalize = (blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `panorama_${Date.now()}.jpg`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 5000);
        };
        if (useOC) {
          canvas.convertToBlob({ type: 'image/jpeg', quality: 0.92 }).then(finalize);
        } else {
          canvas.toBlob(finalize, 'image/jpeg', 0.92);
        }
      } else {
        // Start sweep
        panoFramesRef.current = [];
        setPanoFrameCount(0);
        setIsPanoCapturing(true);
        const captureFrame = async () => {
          const video = videoRef.current;
          if (!video || video.readyState < 2) return;
          const vw = video.videoWidth  || 1280;
          const vh = video.videoHeight || 720;
          try {
            const bm = await createImageBitmap(video, 0, 0, vw, vh);
            panoFramesRef.current.push(bm);
            const count = panoFramesRef.current.length;
            setPanoFrameCount(count);
            if (count >= 8) {
              // Auto-stop at max
              clearInterval(panoIntervalRef.current);
              panoIntervalRef.current = null;
              // re-trigger stop via state — schedule for next tick
              setIsPanoCapturing(false);
              const frames = panoFramesRef.current;
              panoFramesRef.current = [];
              setPanoFrameCount(0);
              const fw2 = frames[0].width;
              const fh2 = frames[0].height;
              const stride2 = Math.round(fw2 * 0.65);
              const outW2 = fw2 + (frames.length - 1) * stride2;
              const useOC2 = typeof OffscreenCanvas !== 'undefined';
              const c2 = useOC2
                ? new OffscreenCanvas(outW2, fh2)
                : (() => { const cc = document.createElement('canvas'); cc.width = outW2; cc.height = fh2; return cc; })();
              const ctx2 = c2.getContext('2d');
              frames.forEach((bm2, i) => { ctx2.drawImage(bm2, i * stride2, 0); bm2.close?.(); });
              const done = (blob) => {
                if (!blob) return;
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url;
                a.download = `panorama_${Date.now()}.jpg`; a.click();
                setTimeout(() => URL.revokeObjectURL(url), 5000);
              };
              if (useOC2) c2.convertToBlob({ type: 'image/jpeg', quality: 0.92 }).then(done);
              else c2.toBlob(done, 'image/jpeg', 0.92);
            }
          } catch (_) {}
        };
        captureFrame(); // capture first frame immediately
        panoIntervalRef.current = setInterval(captureFrame, 400);
      }
      return;
    }
    if (modeProfile.isVideo) {
      if (isRecording) stopRecording();
      else startRecording();
    } else if (timerCount !== null) {
      cancelTimer();
    } else {
      capturePhoto();
    }
  }, [activeMode, isPanoCapturing, modeProfile.isVideo, isRecording, timerCount,
      videoRef, stopRecording, startRecording, cancelTimer, capturePhoto]);

  // Android hardware back button — close top-level overlays
  useBackButton(showMoreModes,  () => setShowMoreModes(false));
  useBackButton(showSettings,   () => setShowSettings(false));
  useBackButton(showGallery,    () => setShowGallery(false));

  // ─── Capture shortcut (volume / keyboard) ──────────────────────────────────
  // Android Chrome intercepts volume keys at the OS level in most contexts.
  // Workarounds applied here:
  //   1. Listen on `document` with capture phase (fires before browser default)
  //   2. passive: false  — allows e.preventDefault() to suppress system volume change
  //   3. Listen to both `keydown` and `keyup` (some Android builds only fire one)
  //   4. Include every known key-name variant across browsers/Android versions
  const CAPTURE_KEY_MAP = {
    VolumeUp:   ['AudioVolumeUp',   'VolumeUp',   'MediaVolumeUp'],
    VolumeDown: ['AudioVolumeDown', 'VolumeDown', 'MediaVolumeDown'],
    Space:      [' '],
    Enter:      ['Enter'],
  };

  useEffect(() => {
    if (!(settings.captureKeyEnabled ?? true)) return;
    const keys = CAPTURE_KEY_MAP[settings.captureKey] ?? [];
    if (!keys.length) return;

    const handler = (e) => {
      if (!keys.includes(e.key)) return;
      if (showGallery || showSettings || showWhatsNew || showMoreModes) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      e.preventDefault(); // must be non-passive to work
      e.stopPropagation();

      // Deduplicate: only act on keydown, or keyup when keydown was not fired
      if (e.type === 'keyup' && e._captureHandled) return;
      if (e.type === 'keydown') e._captureHandled = true;

      handleCapture();
    };

    const opts = { capture: true, passive: false };
    document.addEventListener('keydown', handler, opts);
    document.addEventListener('keyup',   handler, opts);
    return () => {
      document.removeEventListener('keydown', handler, opts);
      document.removeEventListener('keyup',   handler, opts);
    };
  }, [settings.captureKeyEnabled, settings.captureKey, showGallery, showSettings, showWhatsNew, showMoreModes, handleCapture]);

  return (
    <div className={styles.app}>
      {isOffline && (
        <div className={styles.offlineBanner} role="status" aria-live="polite">
          Sem conexão — modo offline
        </div>
      )}
      {storageError && (
        <div className={styles.storageErrorToast} role="alert" aria-live="assertive">
          {storageError}
        </div>
      )}
      <Camera
        videoRef={videoRef}
        facingMode={facingMode}
        zoom={zoom}
        focusPoint={focusPoint}
        focusLocked={focusLocked}
        onFocusTap={handleFocusTap}
        exposureCompensation={exposureCompensation}
        exposureRange={exposureRange}
        onExposureChange={setExposure}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        error={error}
        isLoading={isLoading}
        isSwitching={isSwitching}
        timerCount={timerCount}
        filterCSS={effectiveFilterCSS}
        gridType={settings.gridType}
        vignette={modeProfile.vignette}
        modeBadge={modeProfile.badge}
        modeBadgeIcon={modeProfile.badgeIcon}
        isPinching={isPinching}
        extraOverlay={
          activeMode === 'documento' ? <DocumentOverlay /> :
          activeMode === 'panorama'  ? <PanoramaOverlay isCapturing={isPanoCapturing} frameCount={panoFrameCount} /> :
          null
        }
      />

      <FlashOverlay isFlashing={isFlashing} />

      <div className={styles.uiOverlay}>
        <div className={styles.gradientTop} />

        <TopBar
          flashMode={flashMode}
          onFlashToggle={toggleFlashMode}
          timerDelay={timerDelay}
          onTimerToggle={toggleTimerDelay}
          gridType={settings.gridType}
          onGridToggle={toggleGridType}
          isRecording={isRecording}
          recordingTime={recordingTime}
          onSettingsOpen={() => setShowSettings(true)}
        />

        <div className={styles.spacer} />

        <div className={styles.bottomArea}>
          <div className={styles.gradientBottom} />
          <ZoomControl zoom={zoom} onZoomChange={handleZoomChange} />

          {/* Lens selector — shown when device has 2+ rear cameras */}
          <LensSelector
            cameraList={cameraList}
            selectedDeviceId={selectedDeviceId}
            facingMode={facingMode}
            onSelect={selectCamera}
          />

          {/* Slow-motion / Time-lapse + PRO controls — animated on mode change */}
          <div key={activeMode} className={styles.modeControls}>
            {(activeMode === 'lento' || activeMode === 'timelapse') && (
              <VideoModeControls
                mode={activeMode}
                slowMotionFps={slowMotionFps}
                timelapseMs={timelapseMs}
                onFpsChange={setSlowMotionFps}
                onIntervalChange={setTimelapseMs}
                isRecording={isRecording}
              />
            )}

            {/* PRO mode manual controls */}
            {activeMode === 'pro' && (
              <ProControls
                ev={proEV}
                wb={proWB}
                iso={proISO}
                shutter={proShutter}
                onEvChange={setProEV}
                onWbChange={setProWB}
                onIsoChange={(v) => { setProISO(v); applyProSettings(v, proShutter); }}
                onShutterChange={(v) => { setProShutter(v); applyProSettings(proISO, v); }}
            />
          )}
          </div>{/* end modeControls */}

          <ModeSelector activeMode={isExtraMode ? 'mais' : activeMode} onModeChange={handleModeChange} extraModeActive={isExtraMode} />
          <Controls
            onCapture={handleCapture}
            onSwitchCamera={switchCamera}
            hasMultipleCameras={hasMultipleCameras}
            capturedPhoto={capturedPhoto}
            photosCount={photos.length}
            onThumbnailClick={() => setShowGallery(true)}
            isCapturing={isCapturing}
            isRecording={isRecording}
            recordingTime={recordingTime}
            timerCount={timerCount}
            isVideoMode={modeProfile.isVideo}
          />
        </div>
      </div>

      {showMoreModes && (
        <MoreModes
          activeMode={activeMode}
          onSelect={setActiveMode}
          onClose={() => setShowMoreModes(false)}
        />
      )}

      {showGallery && (
        <Gallery
          photos={photos}
          onClose={() => setShowGallery(false)}
          onDelete={deletePhoto}
          onLoadFull={loadPhotoFull}
        />
      )}

      {showSettings && (
        <Settings
          settings={settings}
          onUpdate={updateSetting}
          onReset={resetSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showWhatsNew && (
        <WhatsNew onClose={() => setShowWhatsNew(false)} />
      )}
    </div>
  );
}
