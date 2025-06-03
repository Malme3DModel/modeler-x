/**
 * Tweakpane入力パラメータの型定義
 */
export interface TweakpaneInputParams {
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  options?: Record<string, any>;
  hidden?: boolean;
  readonly?: boolean;
}

/**
 * GUI状態の型定義
 */
export interface GUIState {
  [key: string]: any;
}

/**
 * GUI要素更新イベントのコールバック型
 */
export type GUIUpdateCallback = (state: GUIState) => void;

/**
 * CascadeStudio互換のGUI関数型定義
 */
export interface CascadeStudioGUIHandlers {
  Slider: (name: string, defaultValue: number, min: number, max: number, step?: number) => number;
  Checkbox: (name: string, defaultValue: boolean) => boolean;
  Button: (name: string, onClick?: () => void) => void;
  TextInput: (name: string, defaultValue?: string) => string;
  Dropdown: (name: string, options: string[], defaultIndex?: number) => string;
}

/**
 * Tweakpaneコンポーネントのプロパティ型定義
 */
export interface TweakpaneProps {
  onGUIUpdate?: GUIUpdateCallback;
  initialState?: GUIState;
  cadWorkerReady?: boolean;
} 