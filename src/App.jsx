import { useState, useCallback, useMemo, useEffect } from 'react';
import { useCamera } from './hooks/useCamera';
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
import ProControls from './components/ProControls/ProControls';
import LensSelector from './components/LensSelector/LensSelector';

import styles from './App.module.css';

export default function App() {
  const [activeMode, setActiveMode] = useState('foto');
  const [showGallery, setShowGallery] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // PRO mode manual controls
  const [proEV, setProEV] = useState(0);
  const [proWB, setProWB] = useState(5500);

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

  return (
    <div className={styles.app}>
      <Camera
        videoRef={videoRef}
        facingMode={facingMode}
        zoom={zoom}
        focusPoint={focusPoint}
        onFocusTap={handleFocusTap}
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
              onEvChange={setProEV}
              onWbChange={setProWB}
            />
          )}

          <ModeSelector activeMode={activeMode} onModeChange={setActiveMode} />
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
    </div>
  );
}
