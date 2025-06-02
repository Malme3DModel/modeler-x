'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useCADWorker } from '../../hooks/useCADWorker';
import { ProjectManager, CADProject } from '../../lib/project/ProjectManager';

interface ProjectPanelProps {
  cadWorkerState: ReturnType<typeof useCADWorker>;
  currentCode?: string;
  guiValues?: Record<string, any>;
}

export default function ProjectPanel({ 
  cadWorkerState, 
  currentCode = '', 
  guiValues = {} 
}: ProjectPanelProps) {
  const [projects, setProjects] = useState<CADProject[]>([]);
  const [currentProject, setCurrentProject] = useState<CADProject | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');

  // プロジェクト一覧の読み込み
  const loadProjects = useCallback(() => {
    const projectList = ProjectManager.getProjectList();
    setProjects(projectList);
    
    const current = ProjectManager.getCurrentProject();
    setCurrentProject(current);
  }, []);

  // 初期化
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // 検索結果のフィルタリング
  const filteredProjects = searchQuery
    ? ProjectManager.searchProjects(searchQuery)
    : projects;

  // プロジェクトの保存
  const handleSaveProject = useCallback(async () => {
    if (!newProjectName.trim()) return;

    setIsLoading(true);
    try {
      const project = ProjectManager.createProject(
        newProjectName.trim(),
        currentCode,
        newProjectDescription.trim() || undefined,
        guiValues,
        cadWorkerState.shapes
      );

      ProjectManager.saveProject(project);
      setCurrentProject(project);
      loadProjects();
      
      setShowSaveDialog(false);
      setNewProjectName('');
      setNewProjectDescription('');
    } catch (error) {
      console.error('プロジェクト保存エラー:', error);
    } finally {
      setIsLoading(false);
    }
  }, [newProjectName, newProjectDescription, currentCode, guiValues, cadWorkerState.shapes, loadProjects]);

  // プロジェクトの読み込み
  const handleLoadProject = useCallback((project: CADProject) => {
    setIsLoading(true);
    try {
      // コードエディターにコードを設定
      if (project.code) {
        cadWorkerState.executeCADCode(project.code);
      }

      // 現在のプロジェクトとして設定
      ProjectManager.setCurrentProject(project.id);
      setCurrentProject(project);
    } catch (error) {
      console.error('プロジェクト読み込みエラー:', error);
    } finally {
      setIsLoading(false);
    }
  }, [cadWorkerState]);

  // プロジェクトの削除
  const handleDeleteProject = useCallback((projectId: string) => {
    if (confirm('このプロジェクトを削除しますか？')) {
      ProjectManager.deleteProject(projectId);
      
      if (currentProject?.id === projectId) {
        setCurrentProject(null);
      }
      
      loadProjects();
    }
  }, [currentProject, loadProjects]);

  // プロジェクトの複製
  const handleDuplicateProject = useCallback((projectId: string) => {
    const duplicate = ProjectManager.duplicateProject(projectId);
    if (duplicate) {
      loadProjects();
    }
  }, [loadProjects]);

  // プロジェクトのエクスポート
  const handleExportProject = useCallback((projectId: string) => {
    const projectData = ProjectManager.exportProject(projectId);
    if (projectData) {
      const blob = new Blob([projectData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cad-project-${projectId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, []);

  // プロジェクトのインポート
  const handleImportProject = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const projectData = e.target?.result as string;
        const project = ProjectManager.importProject(projectData);
        if (project) {
          loadProjects();
        }
      } catch (error) {
        console.error('プロジェクトインポートエラー:', error);
        alert('プロジェクトファイルの読み込みに失敗しました。');
      }
    };
    reader.readAsText(file);
    
    // ファイル入力をリセット
    event.target.value = '';
  }, [loadProjects]);

  // URLでの共有
  const handleShareProject = useCallback((project: CADProject) => {
    const shareUrl = ProjectManager.saveToURL(project);
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('共有URLがクリップボードにコピーされました！');
    }).catch(() => {
      prompt('共有URL:', shareUrl);
    });
  }, []);

  // 日時のフォーマット
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('ja-JP');
  };

  return (
    <div className="bg-base-100 rounded-lg shadow-lg border border-base-300 p-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">💾 プロジェクト管理</h3>
          <div className="badge badge-info">履歴</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-base-content/70">
            {projects.length} プロジェクト
          </span>
        </div>
      </div>

      {/* 現在のプロジェクト */}
      {currentProject && (
        <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-primary">{currentProject.name}</div>
              <div className="text-xs text-base-content/70">
                更新: {formatDate(currentProject.updatedAt)}
              </div>
            </div>
            <div className="badge badge-primary badge-sm">現在</div>
          </div>
        </div>
      )}

      {/* アクションボタン */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowSaveDialog(true)}
          disabled={isLoading}
        >
          💾 保存
        </button>
        <label className="btn btn-outline btn-sm">
          📁 インポート
          <input
            type="file"
            accept=".json"
            onChange={handleImportProject}
            className="hidden"
          />
        </label>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => ProjectManager.clearAllProjects()}
          disabled={isLoading}
        >
          🗑️ 全削除
        </button>
      </div>

      {/* 検索 */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="プロジェクトを検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input input-bordered input-sm w-full"
        />
      </div>

      {/* プロジェクト一覧 */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {filteredProjects.length === 0 ? (
          <div className="text-center text-base-content/50 py-8">
            {searchQuery ? '検索結果がありません' : 'プロジェクトがありません'}
          </div>
        ) : (
          filteredProjects.map((project) => (
            <div
              key={project.id}
              className={`p-3 border rounded cursor-pointer transition-colors ${
                currentProject?.id === project.id
                  ? 'border-primary bg-primary/5'
                  : 'border-base-300 hover:border-primary/50 hover:bg-base-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0" onClick={() => handleLoadProject(project)}>
                  <div className="font-medium truncate">{project.name}</div>
                  {project.description && (
                    <div className="text-sm text-base-content/70 truncate">
                      {project.description}
                    </div>
                  )}
                  <div className="text-xs text-base-content/50 mt-1">
                    {formatDate(project.updatedAt)}
                  </div>
                  {project.tags && project.tags.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {project.tags.slice(0, 3).map((tag, index) => (
                        <div key={index} className="badge badge-xs badge-outline">
                          {tag}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="dropdown dropdown-end">
                  <div tabIndex={0} role="button" className="btn btn-ghost btn-xs">
                    ⋮
                  </div>
                  <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                    <li>
                      <button onClick={() => handleLoadProject(project)}>
                        📂 読み込み
                      </button>
                    </li>
                    <li>
                      <button onClick={() => handleDuplicateProject(project.id)}>
                        📋 複製
                      </button>
                    </li>
                    <li>
                      <button onClick={() => handleShareProject(project)}>
                        🔗 共有
                      </button>
                    </li>
                    <li>
                      <button onClick={() => handleExportProject(project.id)}>
                        📤 エクスポート
                      </button>
                    </li>
                    <li>
                      <button 
                        onClick={() => handleDeleteProject(project.id)}
                        className="text-error"
                      >
                        🗑️ 削除
                      </button>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 保存ダイアログ */}
      {showSaveDialog && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">プロジェクトを保存</h3>
            
            <div className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">プロジェクト名 *</span>
                </label>
                <input
                  type="text"
                  placeholder="プロジェクト名を入力"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="input input-bordered w-full"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="label">
                  <span className="label-text">説明</span>
                </label>
                <textarea
                  placeholder="プロジェクトの説明（任意）"
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  className="textarea textarea-bordered w-full"
                  rows={3}
                />
              </div>
            </div>

            <div className="modal-action">
              <button
                className="btn btn-ghost"
                onClick={() => setShowSaveDialog(false)}
                disabled={isLoading}
              >
                キャンセル
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveProject}
                disabled={!newProjectName.trim() || isLoading}
              >
                {isLoading && <span className="loading loading-spinner loading-xs"></span>}
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 