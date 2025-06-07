'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Copy, ThumbsUp, ThumbsDown } from 'lucide-react';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatPanelProps {
  className?: string;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ className = '' }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'こんにちは！CADモデリングについて何でもお聞きください。コードの改善提案や3Dモデリングのヘルプができます。',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

    // シミュレートされたAI応答（実際のAI統合時に置き換え）
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: generateMockResponse(userMessage.content),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000 + Math.random() * 2000);
  };

  const generateMockResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    // キーワードベースの応答
    if (input.includes('box') || input.includes('立方体') || input.includes('ボックス')) {
      return `立方体を作成するには、以下のようなコードを使用できます：

\`\`\`javascript
let box = new oc.BRepPrimAPI_MakeBox(10, 10, 10).Shape();
\`\`\`

このコードは10x10x10のサイズの立方体を作成します。サイズは必要に応じて調整してください。`;
    }
    
    if (input.includes('sphere') || input.includes('球') || input.includes('スフィア')) {
      return `球体を作成するには、以下のコードを使用します：

\`\`\`javascript
let sphere = new oc.BRepPrimAPI_MakeSphere(5).Shape();
\`\`\`

この例では半径5の球体を作成しています。`;
    }
    
    if (input.includes('cylinder') || input.includes('円柱') || input.includes('シリンダー')) {
      return `円柱を作成するには、以下のようにします：

\`\`\`javascript
let cylinder = new oc.BRepPrimAPI_MakeCylinder(5, 10).Shape();
\`\`\`

この例では半径5、高さ10の円柱を作成しています。`;
    }
    
    if (input.includes('error') || input.includes('エラー') || input.includes('問題')) {
      return 'エラーが発生している場合は、以下を確認してください：\n\n1. OpenCascadeライブラリが正しく読み込まれているか\n2. 変数名のスペルミスがないか\n3. 必要なモジュールがインポートされているか\n\n具体的なエラーメッセージを教えていただければ、より詳細なサポートができます。';
    }
    
    if (input.includes('help') || input.includes('ヘルプ') || input.includes('使い方')) {
      return 'CADモデリングの基本的な使い方：\n\n• 基本形状：Box、Sphere、Cylinder\n• ブール演算：Union、Intersection、Difference\n• 変換：Translation、Rotation、Scaling\n• エクスポート：STEP、STL、OBJ形式\n\n何か特定の機能について知りたいことがあれば、お気軽にお聞きください！';
    }
    
    // デフォルトの応答
    const responses = [
      'そのアイデアは素晴らしいですね！CADモデリングでは、まず基本的な形状から始めて、徐々に複雑な形状を作成することをお勧めします。',
      'コードを確認させていただきました。より効率的な実装方法をご提案できます。具体的にはどの部分を改善したいですか？',
      '3Dモデリングにおいて、その手法は非常に有効です。パフォーマンスを向上させるために、いくつかの最適化を提案させていただきます。',
      'OpenCascadeを使用したCADモデリングでは、その機能を活用できます。詳細な実装例をお見せしましょうか？',
      'より具体的な質問をしていただければ、詳細なサポートができます。例えば、「立方体を作りたい」「エラーが出ている」などです。'
    ];
    return responses[Math.floor(Math.random() * responses.length)];
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

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={`h-full flex flex-col bg-gray-50 ${className}`}>

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
          AI Assistant は開発中の機能です。実際のAI統合は今後実装予定です。
        </div>
      </div>
    </div>
  );
};

export default ChatPanel; 