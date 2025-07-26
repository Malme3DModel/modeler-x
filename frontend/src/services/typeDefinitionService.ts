import { TYPE_DEFINITION_PATHS } from '@/config/cadConfig';
import type { MonacoInstance, MonacoExtraLib } from '@/types';

/**
 * 型定義読み込みサービス
 * Monaco EditorのTypeScript型定義ファイル読み込みを管理
 */
export class TypeDefinitionService {
  private static extraLibs: MonacoExtraLib[] = [];

  /**
   * すべての型定義ファイルを読み込み
   */
  static async loadTypeDefinitions(monaco: MonacoInstance): Promise<MonacoExtraLib[]> {
    this.extraLibs = [];
    const prefix = "";

    try {
      // CascadeStudio型定義の読み込み
      await this.loadCascadeStudioTypes(prefix, monaco);
      
      // StandardLibrary型定義の読み込み
      await this.loadStandardLibraryTypes(prefix, monaco);

      // Monaco Editorに型定義を設定
      monaco.languages.typescript.typescriptDefaults.setExtraLibs(this.extraLibs);
      
      return this.extraLibs;
    } catch (error) {
      console.error('Error loading type definitions:', error);
      throw error;
    }
  }

  /**
   * CascadeStudio型定義を読み込み
   */
  private static async loadCascadeStudioTypes(prefix: string, monaco: MonacoInstance): Promise<void> {
    try {
      const response = await fetch(prefix + TYPE_DEFINITION_PATHS.cascadeStudio);
      const text = await response.text();
      
      this.extraLibs.push({ 
        content: text, 
        filePath: 'file://' + TYPE_DEFINITION_PATHS.cascadeStudio
      });
      
      console.log('CascadeStudio type definitions loaded successfully');
    } catch (error) {
      console.warn('Could not load CascadeStudio type definitions:', error);
      throw error;
    }
  }

  /**
   * StandardLibrary型定義を読み込み
   */
  private static async loadStandardLibraryTypes(prefix: string, monaco: MonacoInstance): Promise<void> {
    try {
      const response = await fetch(prefix + TYPE_DEFINITION_PATHS.standardLibrary);
      const text = await response.text();
      
      this.extraLibs.push({ 
        content: text, 
        filePath: 'file://' + TYPE_DEFINITION_PATHS.standardLibrary.replace('.js', '.d.ts')
      });
      
      // エディターモデルを作成
      monaco.editor.createModel("", "typescript");
      
      console.log('StandardLibrary type definitions loaded successfully');
    } catch (error) {
      console.warn('Could not load StandardLibrary type definitions:', error);
      throw error;
    }
  }

  /**
   * 現在読み込まれている型定義を取得
   */
  static getExtraLibs(): MonacoExtraLib[] {
    return [...this.extraLibs];
  }

  /**
   * 型定義をクリア
   */
  static clearTypeDefinitions(): void {
    this.extraLibs = [];
  }
} 