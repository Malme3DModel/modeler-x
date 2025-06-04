'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '../ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
  lastErrorTime: number | null;
  showDetails: boolean;
}

/**
 * エラーハンドリングを行うエラーバウンダリーコンポーネント
 * 
 * React コンポーネントツリー内でエラーが発生した場合に
 * エラー情報を表示し、リカバリーオプションを提供します。
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      lastErrorTime: null,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // エラー状態を更新
    return { 
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // エラー情報を更新
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
      lastErrorTime: Date.now()
    }));

    // エラーログ出力
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    // エラーコールバック実行
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  // エラー状態をリセット
  resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });

    // リセットコールバック実行
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  // エラー詳細を表示するトグル
  toggleErrorDetails = (): void => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails
    }));
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // カスタムフォールバックがある場合はそれを使用
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // デフォルトのエラー表示
      return (
        <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg shadow-lg max-w-3xl mx-auto my-8">
          <div className="flex items-center mb-4">
            <svg 
              className="w-8 h-8 text-red-500 mr-3" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
            <h2 className="text-xl font-semibold text-red-700 dark:text-red-400">
              エラーが発生しました
            </h2>
          </div>

          <div className="mb-4">
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              アプリケーションでエラーが発生しました。以下のオプションから選択してください：
            </p>
            <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400">
              <li>ページをリロードして再試行</li>
              <li>エラーをリセットして続行（データが失われる可能性があります）</li>
              <li>エラー詳細を確認して開発者に報告</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 p-3 rounded-md mb-4 text-sm font-mono overflow-x-auto">
            <p className="text-red-600 dark:text-red-400">
              {this.state.error?.name}: {this.state.error?.message}
            </p>
          </div>

          {this.state.showDetails && (
            <div className="bg-gray-100 dark:bg-gray-900 p-3 rounded-md mb-4 text-xs font-mono overflow-x-auto max-h-60">
              <pre className="whitespace-pre-wrap break-words text-gray-800 dark:text-gray-300">
                {this.state.error?.stack}
              </pre>
              <hr className="my-2 border-gray-300 dark:border-gray-700" />
              <pre className="whitespace-pre-wrap break-words text-gray-800 dark:text-gray-300">
                {this.state.errorInfo?.componentStack}
              </pre>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => window.location.reload()}
              className="bg-blue-500 hover:bg-blue-600"
            >
              ページをリロード
            </Button>
            
            <Button
              onClick={this.resetErrorBoundary}
              className="bg-green-500 hover:bg-green-600"
            >
              エラーをリセット
            </Button>
            
            <Button
              onClick={this.toggleErrorDetails}
              className="bg-gray-500 hover:bg-gray-600"
            >
              {this.state.showDetails ? 'エラー詳細を隠す' : 'エラー詳細を表示'}
            </Button>
          </div>

          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            <p>
              エラー発生回数: {this.state.errorCount} | 
              最終エラー時刻: {this.state.lastErrorTime ? new Date(this.state.lastErrorTime).toLocaleTimeString() : '-'}
            </p>
          </div>
        </div>
      );
    }

    // エラーがない場合は子コンポーネントをレンダリング
    return this.props.children;
  }
} 