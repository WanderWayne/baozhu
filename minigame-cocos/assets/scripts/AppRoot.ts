import { _decorator, Component } from 'cc';
import { runRecipeEngineSpec } from './tests/RecipeEngine.spec';
import { runProgressServiceSpec } from './tests/ProgressService.spec';

const { ccclass } = _decorator;

@ccclass('AppRoot')
export class AppRoot extends Component {
  start(): void {
    // Early-stage smoke checks for migrated core logic.
    runRecipeEngineSpec();
    runProgressServiceSpec();
    console.log('[AppRoot] core smoke specs passed');
  }
}

