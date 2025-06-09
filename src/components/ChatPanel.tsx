'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Copy, ThumbsUp, ThumbsDown, AlertCircle, Code } from 'lucide-react';
import { CodeExecutionService } from '@/services/codeExecutionService';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  extractedCode?: string; // 抽出されたコードを保存
}

interface ChatPanelProps {
  className?: string;
  onExecuteCode?: (code: string) => void; // コード実行のコールバック
}

const ChatPanel: React.FC<ChatPanelProps> = ({ className = '', onExecuteCode }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'こんにちは！CADモデリングについて何でもお聞きください。OpenCascade.jsを使用したコードの改善提案や3Dモデリングのヘルプができます。\n\n例えば「箱と球体を組み合わせた形状を作って」と言ってみてください。実行可能なコードを生成します！',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // メッセージが追加されたら自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // テキストエリアの高さを自動調整
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  // コードブロックを抽出する関数
  const extractCodeFromMessage = (content: string): string | null => {
    // ```typescript または ```ts で囲まれたコードブロックを抽出
    const codeBlockRegex = /```(?:typescript|ts)\n([\s\S]*?)```/g;
    const matches = content.match(codeBlockRegex);
    
    if (matches && matches.length > 0) {
      // 最初のコードブロックを取得し、```typescript と ``` を除去
      return matches[0].replace(/```(?:typescript|ts)\n/, '').replace(/```$/, '').trim();
    }
    
    return null;
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setError(null);

    try {
      // OpenAI APIを呼び出し
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage]
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // レスポンスからコードを抽出
      const extractedCode = extractCodeFromMessage(data.message);
      
      // 抽出したコードブロックを content から除去
      const contentWithoutCode = extractedCode
        ? data.message.replace(/```(?:typescript|ts)\n[\s\S]*?```/g, '').trim()
        : data.message;
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: contentWithoutCode,
        timestamp: new Date(),
        extractedCode: extractedCode || undefined
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      // 抽出したコードをエディターに置き換え
      if (extractedCode) {
        if (onExecuteCode) {
          // ペーストではなく置き換え＆実行
          onExecuteCode(extractedCode);
        } else {
          // 既存のコードをクリアしてから実行（変数再宣言エラー回避）
          CodeExecutionService.clearEditor();
          CodeExecutionService.executeCode(extractedCode);
        }
      }
    } catch (error) {
      console.error('チャットエラー:', error);
      const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
      setError(errorMessage);
      
      // エラーメッセージをチャットに表示
      const errorAssistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `申し訳ございません。エラーが発生しました: ${errorMessage}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorAssistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // コードを実行する関数
  const executeCode = async (code: string) => {
    if (onExecuteCode) {
      onExecuteCode(code);
    } else {
      // CodeExecutionServiceを使用してコードを実行
      try {
        const result = await CodeExecutionService.executeCode(code);
        if (result.success) {
          console.log('コード実行成功:', result.message);
          // 成功メッセージを表示（オプション）
          // alert(result.message);
        } else {
          console.error('コード実行エラー:', result.error);
          alert(`コード実行エラー: ${result.error}`);
        }
      } catch (error) {
        console.error('コード実行中にエラーが発生:', error);
        alert('コード実行中にエラーが発生しました。');
      }
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={`h-full flex flex-col bg-gray-50 ${className}`}>
      {/* エラー表示 */}
      {error && (
        <div className="flex-shrink-0 p-2 bg-red-50 border-b border-red-200">
          <div className="flex items-center space-x-2 text-red-700 text-xs">
            <AlertCircle size={14} />
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className="w-full"
          >
            <div
              className={`w-full rounded-lg p-2 text-xs ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white border border-gray-200 text-gray-800'
              }`}
            >
              <div className="flex items-start space-x-1">
                <div className="flex-shrink-0">
                  {message.type === 'user' ? (
                    <User size={12} className="mt-0.5" />
                  ) : (
                    <Bot size={12} className="mt-0.5 text-blue-500" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="whitespace-pre-wrap break-words">
                    {message.content}
                  </div>
                  
                  {/* コード実行ボタン（AIメッセージでコードが含まれている場合のみ表示） */}
                  {message.type === 'assistant' && message.extractedCode && (
                    <div className="mt-2 p-2 bg-gray-50 rounded border">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600 flex items-center">
                          <Code size={10} className="mr-1" />
                          実行可能なコード
                        </span>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => copyToClipboard(message.extractedCode!)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            title="コードをコピー"
                          >
                            <Copy size={10} className="text-gray-500" />
                          </button>
                        </div>
                      </div>
                      <pre className="text-xs text-gray-700 bg-white p-1 rounded border overflow-x-auto">
                        <code>{message.extractedCode}</code>
                      </pre>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-xs ${
                      message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatTimestamp(message.timestamp)}
                    </span>
                    {message.type === 'assistant' && (
                      <div className="flex space-x-0.5">
                        <button
                          onClick={() => copyToClipboard(message.content)}
                          className="p-0.5 hover:bg-gray-100 rounded transition-colors"
                          title="コピー"
                          aria-label="コピー"
                        >
                          <Copy size={10} className="text-gray-500" />
                        </button>
                        <button
                          className="p-0.5 hover:bg-gray-100 rounded transition-colors"
                          title="いいね"
                          aria-label="いいね"
                        >
                          <ThumbsUp size={10} className="text-gray-500" />
                        </button>
                        <button
                          className="p-0.5 hover:bg-gray-100 rounded transition-colors"
                          title="よくない"
                          aria-label="よくない"
                        >
                          <ThumbsDown size={10} className="text-gray-500" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="w-full">
            <div className="bg-white border border-gray-200 rounded-lg p-2 w-full text-xs">
              <div className="flex items-center space-x-1">
                <Bot size={12} className="text-blue-500" />
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 入力エリア */}
      <div className="flex-shrink-0 p-3 border-t border-gray-200 bg-white">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="メッセージを入力してください... (Enter で送信、Shift+Enter で改行)"
              className="w-full p-2 pr-8 border border-gray-300 rounded text-xs resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              rows={1}
              style={{ minHeight: '32px', maxHeight: '80px' }}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1 text-blue-500 hover:text-blue-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              aria-label="メッセージを送信"
              title="メッセージを送信"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
        <div className="mt-1 text-xs text-gray-500">
          ChatGPT (GPT-3.5-turbo) を使用しています。CADモデリングについてお気軽にご質問ください。
        </div>
      </div>
    </div>
  );
};

export default ChatPanel; 