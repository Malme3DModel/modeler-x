/**
 * CascadeStudio URL状態管理システム
 * URLハッシュを使用してコードとGUI状態を保存・復元する
 */

import { GUIState } from '@/types/gui';

interface URLState {
  code?: string;
  guiState?: GUIState;
}

/**
 * URLStateManager - URLハッシュを使用して状態を管理するクラス
 */
export class URLStateManager {
  /**
   * URLハッシュから状態を取得
   */
  static getStateFromURL(): URLState {
    if (typeof window === 'undefined') return {};
    
    try {
      const hash = window.location.hash.replace(/^#/, '');
      if (!hash) return {};
      
      // Base64エンコードされたURLハッシュをデコード
      const decoded = this.decodeFromBase64(hash);
      const data = JSON.parse(decoded);
      
      return {
        code: data.code || undefined,
        guiState: data.guiState || undefined
      };
    } catch (error) {
      console.error('❌ URL状態の取得に失敗:', error);
      return {};
    }
  }
  
  /**
   * 状態をURLハッシュに保存
   */
  static saveStateToURL(state: URLState): void {
    if (typeof window === 'undefined') return;
    
    try {
      // 空の状態の場合はハッシュをクリア
      if (!state.code && !state.guiState) {
        window.location.hash = '';
        return;
      }
      
      // JSON文字列化してBase64エンコード
      const json = JSON.stringify(state);
      const encoded = this.encodeToBase64(json);
      
      // URLハッシュを更新（履歴に残さずに）
      window.location.hash = encoded;
    } catch (error) {
      console.error('❌ URL状態の保存に失敗:', error);
    }
  }
  
  /**
   * Base64エンコード（UTF-8対応）
   */
  private static encodeToBase64(str: string): string {
    if (typeof window === 'undefined') return '';
    
    try {
      // UTF-8エンコードしてからBase64エンコード
      return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, 
        (_, p1) => String.fromCharCode(parseInt(p1, 16))
      ));
    } catch (error) {
      console.error('❌ Base64エンコードに失敗:', error);
      return '';
    }
  }
  
  /**
   * Base64デコード（UTF-8対応）
   */
  private static decodeFromBase64(str: string): string {
    if (typeof window === 'undefined') return '';
    
    try {
      // Base64デコードしてからUTF-8デコード
      return decodeURIComponent(Array.prototype.map.call(atob(str), 
        c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''));
    } catch (error) {
      console.error('❌ Base64デコードに失敗:', error);
      return '';
    }
  }
} 