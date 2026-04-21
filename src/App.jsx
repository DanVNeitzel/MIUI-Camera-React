import { useState, useCallback, useMemo, useEffect } from 'react';
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
    handleZoomChange,
    handleFocusTap,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    exposureCompensation,
    exposureRange,
    setExposure,
    applyProSettings,
  } = useCamera({
    ...settings,
    filterOverrideCSS: modeFilterCSS,
    multiFrameCount:   modeProfile.multiFrame,
    ...(modeProfile.captureQuality ? { photoQuality: modeProfile.captureQuality } : {}),
  });

  // In video mode: toggle recording. Otherwise: capture photo (or cancel timer)
  const handleCapture = useCallback(() => {
    if (activeMode === 'video') {
      if (isRecording) stopRecording();
      else startRecording();
    } else if (timerCount !== null) {
      cancelTimer();
    } else {
      capturePhoto();
    }
  }, [activeMode, isRecording, timerCount, stopRecording, startRecording, cancelTimer, capturePhoto]);

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
      <Camera
        videoRef={videoRef}
        facingMode={facingMode}
        zoom={zoom}
        focusPoint={focusPoint}
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
            activeMode={activeMode}
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
