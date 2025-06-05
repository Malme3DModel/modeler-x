export class KeyboardShortcutManager {
  private shortcuts = new Map<string, () => void>();
  private isEnabled = true;
  private excludedElements = ['INPUT', 'TEXTAREA'];

  constructor() {
    this.setupEventListeners();
  }

  register(key: string, callback: () => void): void {
    this.shortcuts.set(key, callback);
  }

  unregister(key: string): void {
    this.shortcuts.delete(key);
  }

  enable(): void {
    this.isEnabled = true;
  }

  disable(): void {
    this.isEnabled = false;
  }

  isShortcutEnabled(): boolean {
    return this.isEnabled;
  }

  private setupEventListeners(): void {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isEnabled || this.isExcludedElement(event.target)) {
      return;
    }

    const shortcutKey = this.getShortcutKey(event);
    const callback = this.shortcuts.get(shortcutKey);

    if (callback) {
      event.preventDefault();
      event.stopPropagation();
      callback();
    }
  }

  private isExcludedElement(target: EventTarget | null): boolean {
    if (!(target instanceof Element)) return false;
    
    return this.excludedElements.includes(target.tagName) ||
           target.closest('.monaco-editor') !== null;
  }

  private getShortcutKey(event: KeyboardEvent): string {
    const parts: string[] = [];
    
    if (event.ctrlKey) parts.push('Ctrl');
    if (event.shiftKey) parts.push('Shift');
    if (event.altKey) parts.push('Alt');
    if (event.metaKey) parts.push('Meta');
    
    parts.push(event.key);
    
    return parts.join('+');
  }

  destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    this.shortcuts.clear();
  }
}
