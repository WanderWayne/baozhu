import { IStorageAdapter } from '../core/ProgressService';

declare const wx: any;

export class MemoryStorageAdapter implements IStorageAdapter {
  private store = new Map<string, string>();

  getString(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setString(key: string, value: string): void {
    this.store.set(key, value);
  }

  remove(key: string): void {
    this.store.delete(key);
  }
}

export class WechatStorageAdapter implements IStorageAdapter {
  getString(key: string): string | null {
    try {
      const value = wx.getStorageSync(key);
      if (value === undefined || value === null || value === '') return null;
      return String(value);
    } catch (e) {
      return null;
    }
  }

  setString(key: string, value: string): void {
    try {
      wx.setStorageSync(key, value);
    } catch (e) {
      // noop in early scaffold stage
    }
  }

  remove(key: string): void {
    try {
      wx.removeStorageSync(key);
    } catch (e) {
      // noop in early scaffold stage
    }
  }
}

