import type { MonacoEditorEvaluationParams, EvaluationOptions } from '../types';
import { DEFAULT_GUI_STATE } from '../config/cadConfig';

/**
 * エディター評価サービス
 * MonacoEditorから分離されたコード評価とCADワーカー連携ロジック
 */
export class EditorService {
  /**
   * エディターからコードを評価してCADワーカーで実行
   */
  static async evaluateCode(params: MonacoEditorEvaluationParams): Promise<void> {
    const { 
      editor, 
      monaco, 
      evaluateAndRender, 
      extraLibs = [], 
      saveToURL = false,
      onEvaluate 
    } = params;

    // 動的にワーカー状態をチェック
    const currentWorker = typeof window !== 'undefined' ? (window as any).cadWorker : null;
    const currentlyWorking = typeof window !== 'undefined' ? (window as any).workerWorking : false;
    
    // ワーカーが動作中の場合は実行しない
    if (currentlyWorking) { 
      console.log('CAD Worker is currently working. Please wait...');
      return; 
    }

    // CADワーカーが利用可能かチェック
    if (!currentWorker) {
      console.error('CAD Worker is not ready yet. Please wait for initialization.');
      return;
    }

    try {
      // 型定義を更新
      monaco.languages.typescript.typescriptDefaults.setExtraLibs(extraLibs);

      // エディターからコードを取得
      const newCode = editor.getValue();

      // エラーハイライトをクリア
      monaco.editor.setModelMarkers(editor.getModel(), 'test', []);

      // CADワーカーでコードを評価
      await evaluateAndRender({
        code: newCode,
        meshRes: DEFAULT_GUI_STATE["MeshRes"],
        sceneOptions: { 
          groundPlaneVisible: DEFAULT_GUI_STATE["GroundPlane?"], 
          gridVisible: DEFAULT_GUI_STATE["Grid?"] 
        },
        delay: 100
      });

      // コード評価コールバックを実行
      if (onEvaluate) {
        onEvaluate();
      }

      console.log("Generating Model with OpenCascade.js");

      // URLに保存（必要に応じて）
      if (saveToURL) {
        console.log("Saved to URL!");
        // URLエンコード処理は必要に応じて実装
      }
    } catch (error) {
      console.error('Error evaluating code:', error);
      throw error;
    }
  }

  /**
   * エディターの関数折りたたみ処理
   */
  static setupCodeFolding(editor: any, code: string): void {
    const codeLines = code.split(/\r\n|\r|\n/);
    const collapsed: any[] = [];
    let curCollapse: any = null;
    
    for (let li = 0; li < codeLines.length; li++) {
      if (codeLines[li].startsWith("function")) {
        curCollapse = { "startLineNumber": (li + 1) };
      } else if (codeLines[li].startsWith("}") && curCollapse !== null) {
        curCollapse["endLineNumber"] = (li + 1);
        collapsed.push(curCollapse);
        curCollapse = null;
      }
    }

    if (collapsed.length > 0) {
      const mergedViewState = Object.assign(editor.saveViewState(), {
        "contributionsState": {
          "editor.contrib.folding": {
            "collapsedRegions": collapsed, 
            "lineCount": codeLines.length,
            "provider": "indent" 
          },
          "editor.contrib.wordHighlighter": false 
        }
      });
      editor.restoreViewState(mergedViewState);
    }
  }
} 