import { ConfigRepository } from '../data/ConfigRepository';
import { ProgressService } from '../core/ProgressService';
import { RecipeEngine } from '../core/RecipeEngine';
import { TaskService } from '../core/TaskService';
import { SceneRouter } from '../runtime/SceneRouter';
import { AudioService } from '../runtime/AudioService';

export interface GameContext {
  config: ConfigRepository;
  progress: ProgressService;
  recipes: RecipeEngine;
  tasks: TaskService;
  router: SceneRouter;
  audio: AudioService;
}

let currentCtx: GameContext | null = null;

export function setGameContext(ctx: GameContext): void {
  currentCtx = ctx;
}

export function getGameContext(): GameContext {
  if (!currentCtx) throw new Error('GameContext not initialized');
  return currentCtx;
}

