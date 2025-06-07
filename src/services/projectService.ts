/**
 * プロジェクト管理サービス
 * プロジェクトの保存・読み込み機能を提供
 */

export interface ProjectData {
  name: string;
  code: string;
  version?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectSaveOptions {
  filename?: string;
  includeMetadata?: boolean;
}

export interface ProjectLoadResult {
  success: boolean;
  data?: ProjectData;
  error?: string;
}

export class ProjectService {
  /**
   * プロジェクトをJSONファイルとしてダウンロード
   */
  static saveProject(
    projectName: string,
    code: string,
    options: ProjectSaveOptions = {}
  ): void {
    const projectData: ProjectData = {
      name: projectName,
      code: code,
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!options.includeMetadata) {
      delete projectData.version;
      delete projectData.createdAt;
      delete projectData.updatedAt;
    }

    const jsonString = JSON.stringify(projectData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = options.filename || `${projectName}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * ファイル選択ダイアログを表示してプロジェクトを読み込み
   */
  static async loadProject(): Promise<ProjectLoadResult> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          resolve({ success: false, error: 'No file selected' });
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const jsonString = event.target?.result as string;
            const projectData = this.parseProjectData(jsonString);
            
            if (this.validateProjectData(projectData)) {
              resolve({ success: true, data: projectData });
            } else {
              resolve({ 
                success: false, 
                error: 'Invalid project file format' 
              });
            }
          } catch (error) {
            resolve({ 
              success: false, 
              error: `Failed to parse project file: ${error instanceof Error ? error.message : 'Unknown error'}` 
            });
          }
        };

        reader.onerror = () => {
          resolve({ 
            success: false, 
            error: 'Failed to read file' 
          });
        };

        reader.readAsText(file);
      };

      input.click();
    });
  }

  /**
   * JSONStringをProjectDataにパース
   */
  private static parseProjectData(jsonString: string): ProjectData {
    const parsed = JSON.parse(jsonString);
    
    // 基本的な型チェックとデフォルト値の設定
    return {
      name: parsed.name || 'Untitled',
      code: parsed.code || '',
      version: parsed.version,
      createdAt: parsed.createdAt,
      updatedAt: parsed.updatedAt,
    };
  }

  /**
   * ProjectDataの妥当性をチェック
   */
  private static validateProjectData(data: any): data is ProjectData {
    return (
      typeof data === 'object' &&
      data !== null &&
      typeof data.name === 'string' &&
      typeof data.code === 'string'
    );
  }

  /**
   * プロジェクトデータのマイグレーション
   * 古いバージョンのプロジェクトファイルとの互換性を保つ
   */
  static migrateProjectData(data: any): ProjectData {
    // v0からの移行処理
    if (data.script && !data.code) {
      data.code = data.script;
      delete data.script;
    }

    // プロジェクト名の正規化
    if (!data.name || data.name.trim() === '') {
      data.name = 'Untitled';
    }

    return data;
  }
} 