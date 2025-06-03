'use client';

import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';

export type ConsoleMessageType = 'info' | 'error' | 'success' | 'debug';

export interface ConsoleMessage {
  message: string;
  type: ConsoleMessageType;
  timestamp: Date;
}

export interface CascadeConsoleProps {
  messages?: ConsoleMessage[];
  maxMessages?: number;
  className?: string;
  style?: React.CSSProperties;
}

export interface CascadeConsoleRef {
  appendMessage: (message: string, type?: ConsoleMessageType) => void;
  clear: () => void;
  getElement: () => HTMLDivElement | null;
}

export const CascadeConsole = forwardRef<CascadeConsoleRef, CascadeConsoleProps>(
  function CascadeConsole(
    { messages = [], maxMessages = 500, className = '', style = {} },
    ref
  ) {
    const consoleRef = useRef<HTMLDivElement>(null);
    const messagesRef = useRef<ConsoleMessage[]>([]);

    // 外部から参照できるメソッドを公開
    useImperativeHandle(ref, () => ({
      appendMessage: (message: string, type: ConsoleMessageType = 'info') => {
        const newMessage: ConsoleMessage = {
          message,
          type,
          timestamp: new Date()
        };
        
        // メッセージの追加
        messagesRef.current = [
          ...messagesRef.current, 
          newMessage
        ].slice(-maxMessages); // 最大数を超えた場合は古いものから削除
        
        // DOMに新しいメッセージを追加
        if (consoleRef.current) {
          const messageElement = document.createElement('div');
          messageElement.style.marginTop = '4px';
          
          // メッセージタイプに応じたスタイル
          switch (type) {
            case 'error':
              messageElement.style.color = '#f87171';
              break;
            case 'success':
              messageElement.style.color = '#4fd1c7';
              break;
            case 'debug':
              messageElement.style.color = '#f0db4f';
              break;
            default:
              messageElement.style.color = '#dcdcaa';
          }
          
          messageElement.textContent = `> ${message}`;
          consoleRef.current.appendChild(messageElement);
          
          // 自動スクロール
          consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
        }
      },
      clear: () => {
        messagesRef.current = [];
        if (consoleRef.current) {
          consoleRef.current.innerHTML = '';
        }
      },
      getElement: () => consoleRef.current
    }));

    // 初期メッセージの表示
    useEffect(() => {
      if (consoleRef.current && messages.length > 0) {
        consoleRef.current.innerHTML = '';
        messages.forEach(msg => {
          const messageElement = document.createElement('div');
          messageElement.style.marginTop = '4px';
          
          // メッセージタイプに応じたスタイル
          switch (msg.type) {
            case 'error':
              messageElement.style.color = '#f87171';
              break;
            case 'success':
              messageElement.style.color = '#4fd1c7';
              break;
            case 'debug':
              messageElement.style.color = '#f0db4f';
              break;
            default:
              messageElement.style.color = '#dcdcaa';
          }
          
          messageElement.textContent = `> ${msg.message}`;
          consoleRef.current.appendChild(messageElement);
        });
        
        // 自動スクロール
        consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
      }
    }, [messages]);

    // スタイル定義
    const defaultStyle: React.CSSProperties = {
      height: '100%',
      overflowY: 'auto',
      padding: '8px',
      fontFamily: 'monospace',
      fontSize: '12px',
      backgroundColor: '#1e1e1e',
      color: '#dcdcaa'
    };

    return (
      <div 
        ref={consoleRef}
        className={`cascade-console ${className}`}
        style={{ ...defaultStyle, ...style }}
      />
    );
  }
); 