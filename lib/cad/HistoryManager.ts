interface HistoryEntry {
  id: string;
  type: 'geometry' | 'transform' | 'delete' | 'create';
  before: any;
  after: any;
  timestamp: Date;
}

export class HistoryManager {
  private history: HistoryEntry[] = [];
  private currentIndex = -1;
  private maxHistorySize = 100;

  addEntry(entry: Omit<HistoryEntry, 'id' | 'timestamp'>): void {
    const newEntry: HistoryEntry = {
      ...entry,
      id: this.generateId(),
      timestamp: new Date()
    };

    this.history = this.history.slice(0, this.currentIndex + 1);
    
    this.history.push(newEntry);
    this.currentIndex++;

    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.currentIndex--;
    }
  }

  undo(): boolean {
    if (!this.canUndo()) return false;

    const entry = this.history[this.currentIndex];
    this.applyHistoryEntry(entry, 'undo');
    this.currentIndex--;
    
    return true;
  }

  redo(): boolean {
    if (!this.canRedo()) return false;

    this.currentIndex++;
    const entry = this.history[this.currentIndex];
    this.applyHistoryEntry(entry, 'redo');
    
    return true;
  }

  canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  private applyHistoryEntry(entry: HistoryEntry, direction: 'undo' | 'redo'): void {
    const data = direction === 'undo' ? entry.before : entry.after;
    
    switch (entry.type) {
      case 'geometry':
        this.applyGeometryChange(data);
        break;
      case 'transform':
        this.applyTransformChange(data);
        break;
      case 'delete':
        this.applyDeleteChange(data, direction);
        break;
      case 'create':
        this.applyCreateChange(data, direction);
        break;
    }
  }

  private applyGeometryChange(data: any): void {
    document.dispatchEvent(new CustomEvent('cad-geometry-change', { detail: data }));
  }

  private applyTransformChange(data: any): void {
    document.dispatchEvent(new CustomEvent('cad-transform-change', { detail: data }));
  }

  private applyDeleteChange(data: any, direction: 'undo' | 'redo'): void {
    if (direction === 'undo') {
      document.dispatchEvent(new CustomEvent('cad-object-restore', { detail: data }));
    } else {
      document.dispatchEvent(new CustomEvent('cad-object-delete', { detail: data }));
    }
  }

  private applyCreateChange(data: any, direction: 'undo' | 'redo'): void {
    if (direction === 'undo') {
      document.dispatchEvent(new CustomEvent('cad-object-delete', { detail: data }));
    } else {
      document.dispatchEvent(new CustomEvent('cad-object-create', { detail: data }));
    }
  }

  private generateId(): string {
    return `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getHistory(): HistoryEntry[] {
    return [...this.history];
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }

  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }
}
