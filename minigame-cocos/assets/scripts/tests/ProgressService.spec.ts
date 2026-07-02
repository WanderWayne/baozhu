import { ProgressService } from '../core/ProgressService';
import { MemoryStorageAdapter } from '../runtime/StorageAdapter';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

export function runProgressServiceSpec(): void {
  const storage = new MemoryStorageAdapter();
  const svc = new ProgressService(storage, ['ch1_main', 'ch1_secret', 'center']);
  assert(svc.markLevelComplete(101), 'complete level should return true first time');
  assert(!svc.markLevelComplete(101), 'complete level should dedupe');

  svc.discoverItem('甜牛奶');
  svc.unlockAtlasPiece('ch1_main');
  svc.unlockAtlasPiece('center');
  const atlas = svc.getAtlasProgress();
  assert(atlas.unlocked === 2 && atlas.total === 3, 'atlas progress mismatch');
}

