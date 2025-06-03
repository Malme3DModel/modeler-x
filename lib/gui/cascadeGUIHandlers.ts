import { TweakpaneInputParams, GUIState } from '@/types/gui';

/**
 * CascadeStudio互換のGUIハンドラークラス
 * 動的GUI要素の作成と管理を担当
 */
export class CascadeGUIHandlers {
  private pane: any;
  private guiState: GUIState = {};
  private dynamicFolder: any;
  private onUpdateCallback?: (state: GUIState) => void;
  
  constructor(pane: any, initialState: GUIState = {}, onUpdate?: (state: GUIState) => void) {
    this.pane = pane;
    this.guiState = { ...initialState };
    this.onUpdateCallback = onUpdate;
    
    // 動的コントロール用フォルダを取得
    this.dynamicFolder = this.pane?.children?.find((child: any) => child.title === 'Dynamic Controls');
    
    if (!this.dynamicFolder) {
      console.warn('🚨 [CascadeGUIHandlers] Dynamic Controls folder not found');
    }
  }
  
  /**
   * CascadeStudio互換のSlider追加
   */
  addSlider(name: string, defaultValue: number, min: number, max: number, step: number = 0.1): number {
    if (!this.pane || !this.dynamicFolder) {
      console.warn(`🚨 [CascadeGUIHandlers] Cannot add slider '${name}': Pane not initialized`);
      return defaultValue;
    }
    
    // 既存のGUI状態を更新
    this.guiState[name] = defaultValue;
    
    try {
      // Tweakpane入力コントロール追加
      this.dynamicFolder.addInput(this.guiState, name, {
        min,
        max,
        step
      }).on('change', (ev: any) => {
        this.updateGUIState(name, ev.value);
      });
      
      console.log(`✅ [CascadeGUIHandlers] Added slider: ${name} (${defaultValue}, ${min}-${max})`);
    } catch (error) {
      console.error(`❌ [CascadeGUIHandlers] Failed to add slider '${name}':`, error);
    }
    
    return defaultValue;
  }
  
  /**
   * CascadeStudio互換のCheckbox追加
   */
  addCheckbox(name: string, defaultValue: boolean = false): boolean {
    if (!this.pane || !this.dynamicFolder) {
      console.warn(`🚨 [CascadeGUIHandlers] Cannot add checkbox '${name}': Pane not initialized`);
      return defaultValue;
    }
    
    // 既存のGUI状態を更新
    this.guiState[name] = defaultValue;
    
    try {
      // Tweakpaneチェックボックス追加
      this.dynamicFolder.addInput(this.guiState, name).on('change', (ev: any) => {
        this.updateGUIState(name, ev.value);
      });
      
      console.log(`✅ [CascadeGUIHandlers] Added checkbox: ${name} (${defaultValue})`);
    } catch (error) {
      console.error(`❌ [CascadeGUIHandlers] Failed to add checkbox '${name}':`, error);
    }
    
    return defaultValue;
  }
  
  /**
   * CascadeStudio互換のButton追加
   */
  addButton(name: string, onClick?: () => void): void {
    if (!this.pane || !this.dynamicFolder) {
      console.warn(`🚨 [CascadeGUIHandlers] Cannot add button '${name}': Pane not initialized`);
      return;
    }
    
    try {
      // Tweakpaneボタン追加
      this.dynamicFolder.addButton({
        title: name,
        label: name
      }).on('click', () => {
        console.log(`🎯 [CascadeGUIHandlers] Button clicked: ${name}`);
        onClick?.();
      });
      
      console.log(`✅ [CascadeGUIHandlers] Added button: ${name}`);
    } catch (error) {
      console.error(`❌ [CascadeGUIHandlers] Failed to add button '${name}':`, error);
    }
  }
  
  /**
   * CascadeStudio互換のTextInput追加
   */
  addTextInput(name: string, defaultValue: string = ''): string {
    if (!this.pane || !this.dynamicFolder) {
      console.warn(`🚨 [CascadeGUIHandlers] Cannot add text input '${name}': Pane not initialized`);
      return defaultValue;
    }
    
    // 既存のGUI状態を更新
    this.guiState[name] = defaultValue;
    
    try {
      // Tweakpaneテキスト入力追加
      this.dynamicFolder.addInput(this.guiState, name).on('change', (ev: any) => {
        this.updateGUIState(name, ev.value);
      });
      
      console.log(`✅ [CascadeGUIHandlers] Added text input: ${name} (${defaultValue})`);
    } catch (error) {
      console.error(`❌ [CascadeGUIHandlers] Failed to add text input '${name}':`, error);
    }
    
    return defaultValue;
  }
  
  /**
   * CascadeStudio互換のDropdown追加
   */
  addDropdown(name: string, options: string[], defaultIndex: number = 0): string {
    if (!this.pane || !this.dynamicFolder) {
      console.warn(`🚨 [CascadeGUIHandlers] Cannot add dropdown '${name}': Pane not initialized`);
      return options[defaultIndex] || '';
    }
    
    // 既存のGUI状態を更新
    this.guiState[name] = options[defaultIndex] || options[0] || '';
    
    try {
      // Tweakpaneドロップダウン追加
      this.dynamicFolder.addInput(this.guiState, name, {
        options: options.reduce((acc, option) => {
          acc[option] = option;
          return acc;
        }, {} as Record<string, string>)
      }).on('change', (ev: any) => {
        this.updateGUIState(name, ev.value);
      });
      
      console.log(`✅ [CascadeGUIHandlers] Added dropdown: ${name} (${options.join(', ')})`);
    } catch (error) {
      console.error(`❌ [CascadeGUIHandlers] Failed to add dropdown '${name}':`, error);
    }
    
    return this.guiState[name];
  }
  
  /**
   * 現在のGUI状態を取得
   */
  getGUIState(): GUIState {
    return { ...this.guiState };
  }
  
  /**
   * GUI状態を一括更新
   */
  setGUIState(newState: GUIState): void {
    this.guiState = { ...this.guiState, ...newState };
    this.onUpdateCallback?.(this.guiState);
  }
  
  /**
   * 特定のGUI要素の状態を更新
   */
  private updateGUIState(key: string, value: any): void {
    this.guiState[key] = value;
    this.onUpdateCallback?.(this.guiState);
  }
  
  /**
   * CascadeStudio互換グローバルハンドラーを登録
   * window.Slider, window.Checkbox等のグローバル関数を定義
   */
  registerGlobalHandlers(): void {
    if (typeof window !== 'undefined') {
      // CascadeStudio互換のグローバル関数
      (window as any).Slider = this.addSlider.bind(this);
      (window as any).Checkbox = this.addCheckbox.bind(this);
      (window as any).Button = this.addButton.bind(this);
      (window as any).TextInput = this.addTextInput.bind(this);
      (window as any).Dropdown = this.addDropdown.bind(this);
      
      console.log('✅ [CascadeGUIHandlers] Registered global GUI handlers');
    }
  }
  
  /**
   * グローバルハンドラーの登録解除
   */
  unregisterGlobalHandlers(): void {
    if (typeof window !== 'undefined') {
      delete (window as any).Slider;
      delete (window as any).Checkbox;
      delete (window as any).Button;
      delete (window as any).TextInput;
      delete (window as any).Dropdown;
      
      console.log('✅ [CascadeGUIHandlers] Unregistered global GUI handlers');
    }
  }
} 