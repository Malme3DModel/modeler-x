import { useState, useCallback } from 'react';

export interface ViewSettings {
  groundPlane: boolean;
  grid: boolean;
  axes: boolean;
  ambientLight: boolean;
  ambientLightIntensity: number;
  backgroundColor: string;
  wireframe: boolean;
  shadows: boolean;
}

export type ViewSettingName = keyof ViewSettings;

export const defaultViewSettings: ViewSettings = {
  groundPlane: true,
  grid: true,
  axes: true,
  ambientLight: true,
  ambientLightIntensity: 0.5,
  backgroundColor: '#2d3748',
  wireframe: false,
  shadows: true
};

interface UseViewSettingsReturn {
  viewSettings: ViewSettings;
  updateSetting: <K extends keyof ViewSettings>(name: K, value: ViewSettings[K]) => void;
  toggleSetting: (name: keyof Pick<ViewSettings, 'groundPlane' | 'grid' | 'axes' | 'wireframe' | 'shadows'>) => void;
  resetSettings: () => void;
}

/**
 * 3Dビューポートの表示設定を管理するためのカスタムフック
 */
export function useViewSettings(initialSettings?: Partial<ViewSettings>): UseViewSettingsReturn {
  // 初期設定値とマージ
  const [viewSettings, setViewSettings] = useState<ViewSettings>({
    ...defaultViewSettings,
    ...initialSettings
  });

  /**
   * 特定の設定値を更新
   */
  const updateSetting = useCallback(<K extends keyof ViewSettings>(name: K, value: ViewSettings[K]) => {
    setViewSettings(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  /**
   * ブール値設定をトグル
   */
  const toggleSetting = useCallback((name: keyof Pick<ViewSettings, 'groundPlane' | 'grid' | 'axes' | 'wireframe' | 'shadows'>) => {
    setViewSettings(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  }, []);

  /**
   * すべての設定をデフォルトにリセット
   */
  const resetSettings = useCallback(() => {
    setViewSettings(defaultViewSettings);
  }, []);

  return {
    viewSettings,
    updateSetting,
    toggleSetting,
    resetSettings
  };
} 