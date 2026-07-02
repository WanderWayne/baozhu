export type SceneName =
  | 'Boot'
  | 'Intro'
  | 'Menu'
  | 'Levels'
  | 'Game'
  | 'Codex'
  | 'Gallery';

export interface SceneRouteState {
  levelId?: number;
  worldId?: number;
  freeMode?: boolean;
}

export class SceneRouter {
  private current: SceneName = 'Boot';
  private routeState: SceneRouteState = {};
  private listeners: Array<(scene: SceneName, state: SceneRouteState) => void> = [];

  onChange(listener: (scene: SceneName, state: SceneRouteState) => void): void {
    this.listeners.push(listener);
  }

  navigate(scene: SceneName, state: SceneRouteState = {}): void {
    this.current = scene;
    this.routeState = { ...state };
    this.listeners.forEach((listener) => listener(scene, this.routeState));
  }

  getCurrentScene(): SceneName {
    return this.current;
  }

  getState(): SceneRouteState {
    return { ...this.routeState };
  }
}

