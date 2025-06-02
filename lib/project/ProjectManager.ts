export interface CADProject {
  id: string;
  name: string;
  description?: string;
  code: string;
  guiValues?: Record<string, any>;
  shapes?: any[];
  createdAt: string;
  updatedAt: string;
  version: string;
  tags?: string[];
}

export interface ProjectHistory {
  projects: CADProject[];
  currentProjectId?: string;
  maxHistorySize: number;
}

export class ProjectManager {
  private static readonly STORAGE_KEY = 'cad-projects';
  private static readonly CURRENT_PROJECT_KEY = 'cad-current-project';
  private static readonly MAX_HISTORY_SIZE = 50;
  private static readonly PROJECT_VERSION = '1.0.0';

  // プロジェクト履歴の取得
  static getProjectHistory(): ProjectHistory {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const history = JSON.parse(stored) as ProjectHistory;
        return {
          ...history,
          maxHistorySize: this.MAX_HISTORY_SIZE
        };
      }
    } catch (error) {
      console.error('プロジェクト履歴の読み込みエラー:', error);
    }

    return {
      projects: [],
      maxHistorySize: this.MAX_HISTORY_SIZE
    };
  }

  // プロジェクト履歴の保存
  static saveProjectHistory(history: ProjectHistory): void {
    try {
      // 履歴サイズの制限
      if (history.projects.length > history.maxHistorySize) {
        history.projects = history.projects
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, history.maxHistorySize);
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('プロジェクト履歴の保存エラー:', error);
    }
  }

  // 新しいプロジェクトの作成
  static createProject(
    name: string,
    code: string,
    description?: string,
    guiValues?: Record<string, any>,
    shapes?: any[]
  ): CADProject {
    const now = new Date().toISOString();
    const project: CADProject = {
      id: this.generateProjectId(),
      name,
      description,
      code,
      guiValues,
      shapes,
      createdAt: now,
      updatedAt: now,
      version: this.PROJECT_VERSION,
      tags: []
    };

    return project;
  }

  // プロジェクトの保存
  static saveProject(project: CADProject): void {
    const history = this.getProjectHistory();
    
    // 既存プロジェクトの更新または新規追加
    const existingIndex = history.projects.findIndex(p => p.id === project.id);
    
    if (existingIndex >= 0) {
      // 既存プロジェクトの更新
      history.projects[existingIndex] = {
        ...project,
        updatedAt: new Date().toISOString()
      };
    } else {
      // 新規プロジェクトの追加
      history.projects.push(project);
    }

    // 現在のプロジェクトとして設定
    history.currentProjectId = project.id;

    this.saveProjectHistory(history);
    this.setCurrentProject(project.id);
  }

  // プロジェクトの読み込み
  static loadProject(projectId: string): CADProject | null {
    const history = this.getProjectHistory();
    const project = history.projects.find(p => p.id === projectId);
    
    if (project) {
      this.setCurrentProject(projectId);
      return project;
    }

    return null;
  }

  // プロジェクトの削除
  static deleteProject(projectId: string): void {
    const history = this.getProjectHistory();
    history.projects = history.projects.filter(p => p.id !== projectId);
    
    if (history.currentProjectId === projectId) {
      history.currentProjectId = undefined;
    }

    this.saveProjectHistory(history);
    
    if (history.currentProjectId === projectId) {
      localStorage.removeItem(this.CURRENT_PROJECT_KEY);
    }
  }

  // 現在のプロジェクトの設定
  static setCurrentProject(projectId: string): void {
    localStorage.setItem(this.CURRENT_PROJECT_KEY, projectId);
  }

  // 現在のプロジェクトの取得
  static getCurrentProject(): CADProject | null {
    try {
      const currentId = localStorage.getItem(this.CURRENT_PROJECT_KEY);
      if (currentId) {
        return this.loadProject(currentId);
      }
    } catch (error) {
      console.error('現在のプロジェクト取得エラー:', error);
    }
    return null;
  }

  // プロジェクト一覧の取得
  static getProjectList(): CADProject[] {
    const history = this.getProjectHistory();
    return history.projects.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  // プロジェクトの複製
  static duplicateProject(projectId: string, newName?: string): CADProject | null {
    const original = this.loadProject(projectId);
    if (!original) return null;

    const duplicate = this.createProject(
      newName || `${original.name} (コピー)`,
      original.code,
      original.description,
      original.guiValues,
      original.shapes
    );

    duplicate.tags = [...(original.tags || [])];
    this.saveProject(duplicate);

    return duplicate;
  }

  // プロジェクトのエクスポート
  static exportProject(projectId: string): string | null {
    const project = this.loadProject(projectId);
    if (!project) return null;

    return JSON.stringify(project, null, 2);
  }

  // プロジェクトのインポート
  static importProject(projectData: string): CADProject | null {
    try {
      const project = JSON.parse(projectData) as CADProject;
      
      // 新しいIDを生成（重複を避けるため）
      project.id = this.generateProjectId();
      project.updatedAt = new Date().toISOString();
      
      this.saveProject(project);
      return project;
    } catch (error) {
      console.error('プロジェクトインポートエラー:', error);
      return null;
    }
  }

  // URLパラメーターからプロジェクトの読み込み
  static loadFromURL(): CADProject | null {
    try {
      const params = new URLSearchParams(window.location.search);
      const projectData = params.get('project');
      
      if (projectData) {
        const decodedData = decodeURIComponent(projectData);
        const project = JSON.parse(decodedData) as CADProject;
        return project;
      }
    } catch (error) {
      console.error('URLからのプロジェクト読み込みエラー:', error);
    }
    return null;
  }

  // プロジェクトをURLパラメーターに保存
  static saveToURL(project: CADProject): string {
    try {
      const projectData = JSON.stringify({
        name: project.name,
        code: project.code,
        guiValues: project.guiValues,
        version: project.version
      });
      
      const encodedData = encodeURIComponent(projectData);
      const url = new URL(window.location.href);
      url.searchParams.set('project', encodedData);
      
      return url.toString();
    } catch (error) {
      console.error('URLへのプロジェクト保存エラー:', error);
      return window.location.href;
    }
  }

  // プロジェクトIDの生成
  private static generateProjectId(): string {
    return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ストレージのクリア
  static clearAllProjects(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.CURRENT_PROJECT_KEY);
  }

  // プロジェクトの検索
  static searchProjects(query: string): CADProject[] {
    const projects = this.getProjectList();
    const lowerQuery = query.toLowerCase();
    
    return projects.filter(project => 
      project.name.toLowerCase().includes(lowerQuery) ||
      (project.description && project.description.toLowerCase().includes(lowerQuery)) ||
      project.code.toLowerCase().includes(lowerQuery) ||
      (project.tags && project.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
    );
  }

  // プロジェクトにタグを追加
  static addTag(projectId: string, tag: string): void {
    const history = this.getProjectHistory();
    const project = history.projects.find(p => p.id === projectId);
    
    if (project) {
      if (!project.tags) project.tags = [];
      if (!project.tags.includes(tag)) {
        project.tags.push(tag);
        project.updatedAt = new Date().toISOString();
        this.saveProjectHistory(history);
      }
    }
  }

  // プロジェクトからタグを削除
  static removeTag(projectId: string, tag: string): void {
    const history = this.getProjectHistory();
    const project = history.projects.find(p => p.id === projectId);
    
    if (project && project.tags) {
      project.tags = project.tags.filter(t => t !== tag);
      project.updatedAt = new Date().toISOString();
      this.saveProjectHistory(history);
    }
  }
} 