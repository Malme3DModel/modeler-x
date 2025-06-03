declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': {
        class?: string;
        src?: string;
        'camera-controls'?: boolean;
        style?: React.CSSProperties;
        // 他のプロパティ...
      };
    }
  }
}

declare module 'opencascade.js' {
  function initOpenCascade(): Promise<any>;
  export { initOpenCascade };
}

export {}; 