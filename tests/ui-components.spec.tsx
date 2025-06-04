import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { HelpModal } from '@/components/ui/HelpModal';
import { ProgressIndicator } from '@/components/ui/ProgressIndicator';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';

describe('HelpModal', () => {
  test('モーダルが開いている時に内容が表示される', () => {
    const onClose = jest.fn();
    render(<HelpModal isOpen={true} onClose={onClose} />);
    
    // タイトルが表示されていることを確認
    expect(screen.getByText('ヘルプ')).toBeInTheDocument();
    
    // ショートカットタブがデフォルトで選択されていることを確認
    expect(screen.getByText('ショートカット')).toHaveClass('border-blue-500');
    
    // いくつかのショートカットが表示されていることを確認
    expect(screen.getByText('コードを実行')).toBeInTheDocument();
    expect(screen.getByText('プロジェクトを保存')).toBeInTheDocument();
  });
  
  test('モーダルが閉じている時に何も表示されない', () => {
    const onClose = jest.fn();
    const { container } = render(<HelpModal isOpen={false} onClose={onClose} />);
    
    // コンテンツが何も表示されていないことを確認
    expect(container).toBeEmptyDOMElement();
  });
  
  test('閉じるボタンをクリックするとonCloseが呼ばれる', () => {
    const onClose = jest.fn();
    render(<HelpModal isOpen={true} onClose={onClose} />);
    
    // 閉じるボタンをクリック
    fireEvent.click(screen.getByText('閉じる'));
    
    // onCloseが呼ばれたことを確認
    expect(onClose).toHaveBeenCalledTimes(1);
  });
  
  test('タブを切り替えると内容が変わる', () => {
    const onClose = jest.fn();
    render(<HelpModal isOpen={true} onClose={onClose} />);
    
    // 初期状態ではショートカットタブが選択されている
    expect(screen.getByText('ショートカット')).toHaveClass('border-blue-500');
    expect(screen.getByText('F5')).toBeInTheDocument();
    
    // Aboutタブをクリック
    fireEvent.click(screen.getByText('Modeler-Xについて'));
    
    // Aboutタブの内容が表示されることを確認
    expect(screen.getByText('Modeler-X')).toBeInTheDocument();
    expect(screen.getByText('TypeScriptベースのモデリング')).toBeInTheDocument();
  });
});

describe('ProgressIndicator', () => {
  test('表示状態の時にプログレスバーが表示される', () => {
    render(<ProgressIndicator isVisible={true} progress={50} message="テスト中..." />);
    
    // メッセージが表示されていることを確認
    expect(screen.getByText('テスト中...')).toBeInTheDocument();
    
    // 進行状況が表示されていることを確認
    expect(screen.getByText('50%')).toBeInTheDocument();
  });
  
  test('非表示状態の時に何も表示されない', () => {
    const { container } = render(<ProgressIndicator isVisible={false} progress={50} />);
    
    // コンテンツが何も表示されていないことを確認
    expect(container).toBeEmptyDOMElement();
  });
  
  test('詳細表示ボタンをクリックすると詳細が表示される', () => {
    render(<ProgressIndicator isVisible={true} progress={75} />);
    
    // 初期状態では詳細は表示されていない
    expect(screen.queryByText('メモリ使用量:')).not.toBeInTheDocument();
    
    // 詳細を表示ボタンをクリック
    fireEvent.click(screen.getByText('詳細を表示'));
    
    // 詳細が表示されることを確認
    expect(screen.getByText('メモリ使用量:')).toBeInTheDocument();
    expect(screen.getByText('処理ステップ:')).toBeInTheDocument();
    expect(screen.getByText('75% 完了')).toBeInTheDocument();
  });
  
  test('キャンセルボタンをクリックするとonCancelが呼ばれる', () => {
    const onCancel = jest.fn();
    render(<ProgressIndicator isVisible={true} onCancel={onCancel} />);
    
    // キャンセルボタンをクリック
    fireEvent.click(screen.getByText('キャンセル'));
    
    // onCancelが呼ばれたことを確認
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

// エラーを発生させるためのコンポーネント
const ErrorComponent = () => {
  throw new Error('テストエラー');
};

describe('ErrorBoundary', () => {
  // コンソールエラーを抑制
  const originalConsoleError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  
  afterAll(() => {
    console.error = originalConsoleError;
  });
  
  test('子コンポーネントでエラーが発生するとエラー表示に切り替わる', () => {
    // Actの警告を抑制するためにact内でレンダリング
    act(() => {
      render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      );
    });
    
    // エラーメッセージが表示されていることを確認
    expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
    expect(screen.getByText(/テストエラー/)).toBeInTheDocument();
    
    // リカバリーオプションが表示されていることを確認
    expect(screen.getByText('ページをリロード')).toBeInTheDocument();
    expect(screen.getByText('エラーをリセット')).toBeInTheDocument();
  });
  
  test('エラーがない場合は子コンポーネントが表示される', () => {
    render(
      <ErrorBoundary>
        <div data-testid="child-component">正常なコンポーネント</div>
      </ErrorBoundary>
    );
    
    // 子コンポーネントが表示されていることを確認
    expect(screen.getByTestId('child-component')).toBeInTheDocument();
    expect(screen.getByText('正常なコンポーネント')).toBeInTheDocument();
  });
  
  test('エラー詳細の表示/非表示が切り替えられる', () => {
    // Actの警告を抑制するためにact内でレンダリング
    act(() => {
      render(
        <ErrorBoundary>
          <ErrorComponent />
        </ErrorBoundary>
      );
    });
    
    // 初期状態では詳細は表示されていない
    expect(screen.queryByText(/componentStack/i)).not.toBeInTheDocument();
    
    // 詳細を表示ボタンをクリック
    fireEvent.click(screen.getByText('エラー詳細を表示'));
    
    // 詳細が表示されることを確認
    const detailsElement = screen.getByText(/componentStack/i) || screen.getByText(/at ErrorComponent/);
    expect(detailsElement).toBeInTheDocument();
  });
}); 