export const KEYBOARD_SHORTCUTS = {
  TRANSFORM: {
    TRANSLATE: ['g', 'G'],
    ROTATE: ['r', 'R'],
    SCALE: ['s', 'S'],
    CYCLE_MODE: ['Tab']
  },
  CAMERA: {
    FRONT: '1',
    BACK: '2',
    TOP: '3',
    BOTTOM: '4',
    LEFT: '5',
    RIGHT: '6',
    ISO: '7',
    FIT_TO_OBJECT: ['f', 'F']
  },
  SELECTION: {
    CLEAR: ['Escape'],
    MULTI_SELECT: ['Ctrl', 'Meta']
  },
  PROJECT: {
    SAVE: ['Ctrl+s', 'Meta+s'],
    REFRESH: ['F5']
  }
};

export const CAMERA_VIEW_NAMES = ['front', 'back', 'top', 'bottom', 'left', 'right', 'iso'];

export function getCameraViewName(keyNumber: number): string | null {
  const index = keyNumber - 1;
  return CAMERA_VIEW_NAMES[index] || null;
}

export function isTransformKey(key: string): 'translate' | 'rotate' | 'scale' | null {
  if (KEYBOARD_SHORTCUTS.TRANSFORM.TRANSLATE.includes(key)) return 'translate';
  if (KEYBOARD_SHORTCUTS.TRANSFORM.ROTATE.includes(key)) return 'rotate';
  if (KEYBOARD_SHORTCUTS.TRANSFORM.SCALE.includes(key)) return 'scale';
  return null;
}

export function isCameraViewKey(key: string): number | null {
  const num = parseInt(key);
  return (num >= 1 && num <= 7) ? num : null;
}

export function isFitToObjectKey(key: string): boolean {
  return KEYBOARD_SHORTCUTS.CAMERA.FIT_TO_OBJECT.includes(key);
}
