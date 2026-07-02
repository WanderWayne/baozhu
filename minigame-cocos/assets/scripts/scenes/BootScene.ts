import { _decorator, Component } from 'cc';
import gameConfig from '../../resources/config/game-config.json';
import { ConfigLoader } from '../data/ConfigLoader';
import { MemoryStorageAdapter, WechatStorageAdapter } from '../runtime/StorageAdapter';
import { ProgressService } from '../core/ProgressService';
import { RecipeEngine } from '../core/RecipeEngine';
import { TaskService } from '../core/TaskService';
import { SceneRouter } from '../runtime/SceneRouter';
import { AudioService } from '../runtime/AudioService';
import { setGameContext } from './GameContext';
import { WechatAdapter } from '../wechat/WechatAdapter';

const { ccclass } = _decorator;

declare const wx: any;

@ccclass('BootScene')
export class BootScene extends Component {
  start(): void {
    const configRepo = ConfigLoader.loadFromObject(gameConfig);
    const storage = typeof wx !== 'undefined' ? new WechatStorageAdapter() : new MemoryStorageAdapter();
    const progress = new ProgressService(storage, configRepo.getAtlasCountableSlotIds());
    const recipes = new RecipeEngine(configRepo.getRecipes());
    const tasks = new TaskService(configRepo.getTasks());
    const router = new SceneRouter();
    const audio = new AudioService({
      bgm_menu: 'audio/bgm_menu.mp3',
      ui_click: 'audio/ui_click.mp3',
      synth_success: 'audio/synth_success.mp3',
    });
    setGameContext({
      config: configRepo,
      progress,
      recipes,
      tasks,
      router,
      audio,
    });

    const wechat = new WechatAdapter();
    wechat.initLifecycleHooks();
    wechat.setShare('宝珠酿造');

    router.navigate('Intro');
    console.log('[BootScene] initialized');
  }
}

