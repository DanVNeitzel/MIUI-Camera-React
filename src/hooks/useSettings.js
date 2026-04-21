import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'miui-camera-settings';

export const SETTINGS_DEFAULTS = {
  photoQuality:    'high',        // 'low' | 'medium' | 'high' | 'max'
  saveFormat:      'jpeg',        // 'jpeg' | 'png' | 'webp'
  videoResolution: '1080p',       // '720p' | '1080p' | '4k'
  gridType:        'none',        // 'none' | 'thirds' | 'square' | 'both'
  filter:          'none',        // see filterMap.js
  defaultCamera:   'environment', // 'environment' | 'user'
  captureKey:      'VolumeUp',    // 'VolumeUp' | 'VolumeDown' | 'Space' | 'Enter' | 'none'
};

export function useSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...SETTINGS_DEFAULTS, ...JSON.parse(raw) } : { ...SETTINGS_DEFAULTS };
    } catch {
      return { ...SETTINGS_DEFAULTS };
    }
  });

  // Persist on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (_) {}
  }, [settings]);

  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings({ ...SETTINGS_DEFAULTS });
  }, []);

  return { settings, updateSetting, resetSettings };
}
