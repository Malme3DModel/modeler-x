/**
 * コード実行サービス
 * ChatPanelからMonacoEditorにコードを送信して実行する
 */

export interface CodeExecutionResult {
  success: boolean;
  message?: string;
  error?: string;
}

export class CodeExecutionService {
  private static monacoEditorRef: any = null;

  /**
   * MonacoEditorの参照を設定
   */
  static setMonacoEditorRef(editorRef: any) {
    this.monacoEditorRef = editorRef;
  }

  /**
   * コードをMonacoEditorに設定して実行
   */
  static async executeCode(code: string): Promise<CodeExecutionResult> {
    try {
      if (!this.monacoEditorRef?.current) {
        return {
          success: false,
          error: 'MonacoEditorが初期化されていません'
        };
      }

      const editor = this.monacoEditorRef.current;

      // 現在のコードを取得
      const currentCode = editor.getValue();
      
      // 新しいコードを追加（既存のコードの下に追加）
      const newCode = currentCode ? `${currentCode}\n\n// AI生成コード\n${code}` : code;
      
      // エディターにコードを設定
      editor.setValue(newCode);

      // コードを実行（evaluateCode関数が存在する場合）
      if (typeof editor.evaluateCode === 'function') {
        await editor.evaluateCode();
        return {
          success: true,
          message: 'コードが正常に実行されました'
        };
      } else {
        return {
          success: true,
          message: 'コードがエディターに設定されました。手動で実行してください。'
        };
      }

    } catch (error) {
      console.error('コード実行エラー:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '不明なエラーが発生しました'
      };
    }
  }

  /**
   * コードをMonacoEditorに追加（実行はしない）
   */
  static addCodeToEditor(code: string): CodeExecutionResult {
    try {
      if (!this.monacoEditorRef?.current) {
        return {
          success: false,
          error: 'MonacoEditorが初期化されていません'
        };
      }

      const editor = this.monacoEditorRef.current;
      const currentCode = editor.getValue();
      
      // 新しいコードを追加
      const newCode = currentCode ? `${currentCode}\n\n// AI生成コード\n${code}` : code;
      editor.setValue(newCode);

      // エディターにフォーカス
      editor.focus();

      return {
        success: true,
        message: 'コードがエディターに追加されました'
      };

    } catch (error) {
      console.error('コード追加エラー:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '不明なエラーが発生しました'
      };
    }
  }

  /**
   * MonacoEditorの現在のコードを取得
   */
  static getCurrentCode(): string | null {
    try {
      if (!this.monacoEditorRef?.current) {
        return null;
      }
      return this.monacoEditorRef.current.getValue();
    } catch (error) {
      console.error('コード取得エラー:', error);
      return null;
    }
  }

  /**
   * MonacoEditorをクリア
   */
  static clearEditor(): CodeExecutionResult {
    try {
      if (!this.monacoEditorRef?.current) {
        return {
          success: false,
          error: 'MonacoEditorが初期化されていません'
        };
      }

      this.monacoEditorRef.current.setValue('');
      return {
        success: true,
        message: 'エディターがクリアされました'
      };

    } catch (error) {
      console.error('エディタークリアエラー:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '不明なエラーが発生しました'
      };
    }
  }
} 