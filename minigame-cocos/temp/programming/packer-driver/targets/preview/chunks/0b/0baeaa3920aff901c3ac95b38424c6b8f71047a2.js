System.register(["__unresolved_0", "cc", "__unresolved_1", "__unresolved_2", "__unresolved_3", "__unresolved_4", "__unresolved_5", "__unresolved_6", "__unresolved_7", "__unresolved_8", "__unresolved_9", "__unresolved_10"], function (_export, _context) {
  "use strict";

  var _reporterNs, _cclegacy, __checkObsolete__, __checkObsoleteInNamespace__, _decorator, Component, gameConfig, ConfigLoader, MemoryStorageAdapter, WechatStorageAdapter, ProgressService, RecipeEngine, TaskService, SceneRouter, AudioService, setGameContext, WechatAdapter, _dec, _class, _crd, ccclass, BootScene;

  function _reportPossibleCrUseOfgameConfig(extras) {
    _reporterNs.report("gameConfig", "../../resources/config/game-config.json", _context.meta, extras);
  }

  function _reportPossibleCrUseOfConfigLoader(extras) {
    _reporterNs.report("ConfigLoader", "../data/ConfigLoader", _context.meta, extras);
  }

  function _reportPossibleCrUseOfMemoryStorageAdapter(extras) {
    _reporterNs.report("MemoryStorageAdapter", "../runtime/StorageAdapter", _context.meta, extras);
  }

  function _reportPossibleCrUseOfWechatStorageAdapter(extras) {
    _reporterNs.report("WechatStorageAdapter", "../runtime/StorageAdapter", _context.meta, extras);
  }

  function _reportPossibleCrUseOfProgressService(extras) {
    _reporterNs.report("ProgressService", "../core/ProgressService", _context.meta, extras);
  }

  function _reportPossibleCrUseOfRecipeEngine(extras) {
    _reporterNs.report("RecipeEngine", "../core/RecipeEngine", _context.meta, extras);
  }

  function _reportPossibleCrUseOfTaskService(extras) {
    _reporterNs.report("TaskService", "../core/TaskService", _context.meta, extras);
  }

  function _reportPossibleCrUseOfSceneRouter(extras) {
    _reporterNs.report("SceneRouter", "../runtime/SceneRouter", _context.meta, extras);
  }

  function _reportPossibleCrUseOfAudioService(extras) {
    _reporterNs.report("AudioService", "../runtime/AudioService", _context.meta, extras);
  }

  function _reportPossibleCrUseOfsetGameContext(extras) {
    _reporterNs.report("setGameContext", "./GameContext", _context.meta, extras);
  }

  function _reportPossibleCrUseOfWechatAdapter(extras) {
    _reporterNs.report("WechatAdapter", "../wechat/WechatAdapter", _context.meta, extras);
  }

  return {
    setters: [function (_unresolved_) {
      _reporterNs = _unresolved_;
    }, function (_cc) {
      _cclegacy = _cc.cclegacy;
      __checkObsolete__ = _cc.__checkObsolete__;
      __checkObsoleteInNamespace__ = _cc.__checkObsoleteInNamespace__;
      _decorator = _cc._decorator;
      Component = _cc.Component;
    }, function (_unresolved_2) {
      gameConfig = _unresolved_2.default;
    }, function (_unresolved_3) {
      ConfigLoader = _unresolved_3.ConfigLoader;
    }, function (_unresolved_4) {
      MemoryStorageAdapter = _unresolved_4.MemoryStorageAdapter;
      WechatStorageAdapter = _unresolved_4.WechatStorageAdapter;
    }, function (_unresolved_5) {
      ProgressService = _unresolved_5.ProgressService;
    }, function (_unresolved_6) {
      RecipeEngine = _unresolved_6.RecipeEngine;
    }, function (_unresolved_7) {
      TaskService = _unresolved_7.TaskService;
    }, function (_unresolved_8) {
      SceneRouter = _unresolved_8.SceneRouter;
    }, function (_unresolved_9) {
      AudioService = _unresolved_9.AudioService;
    }, function (_unresolved_10) {
      setGameContext = _unresolved_10.setGameContext;
    }, function (_unresolved_11) {
      WechatAdapter = _unresolved_11.WechatAdapter;
    }],
    execute: function () {
      _crd = true;

      _cclegacy._RF.push({}, "f5a10PPY59CpZlQg4+sS/BZ", "BootScene", undefined);

      __checkObsolete__(['_decorator', 'Component']);

      ({
        ccclass
      } = _decorator);

      _export("BootScene", BootScene = (_dec = ccclass('BootScene'), _dec(_class = class BootScene extends Component {
        start() {
          var configRepo = (_crd && ConfigLoader === void 0 ? (_reportPossibleCrUseOfConfigLoader({
            error: Error()
          }), ConfigLoader) : ConfigLoader).loadFromObject(_crd && gameConfig === void 0 ? (_reportPossibleCrUseOfgameConfig({
            error: Error()
          }), gameConfig) : gameConfig);
          var storage = typeof wx !== 'undefined' ? new (_crd && WechatStorageAdapter === void 0 ? (_reportPossibleCrUseOfWechatStorageAdapter({
            error: Error()
          }), WechatStorageAdapter) : WechatStorageAdapter)() : new (_crd && MemoryStorageAdapter === void 0 ? (_reportPossibleCrUseOfMemoryStorageAdapter({
            error: Error()
          }), MemoryStorageAdapter) : MemoryStorageAdapter)();
          var progress = new (_crd && ProgressService === void 0 ? (_reportPossibleCrUseOfProgressService({
            error: Error()
          }), ProgressService) : ProgressService)(storage, configRepo.getAtlasCountableSlotIds());
          var recipes = new (_crd && RecipeEngine === void 0 ? (_reportPossibleCrUseOfRecipeEngine({
            error: Error()
          }), RecipeEngine) : RecipeEngine)(configRepo.getRecipes());
          var tasks = new (_crd && TaskService === void 0 ? (_reportPossibleCrUseOfTaskService({
            error: Error()
          }), TaskService) : TaskService)(configRepo.getTasks());
          var router = new (_crd && SceneRouter === void 0 ? (_reportPossibleCrUseOfSceneRouter({
            error: Error()
          }), SceneRouter) : SceneRouter)();
          var audio = new (_crd && AudioService === void 0 ? (_reportPossibleCrUseOfAudioService({
            error: Error()
          }), AudioService) : AudioService)({
            bgm_menu: 'audio/bgm_menu.mp3',
            ui_click: 'audio/ui_click.mp3',
            synth_success: 'audio/synth_success.mp3'
          });
          (_crd && setGameContext === void 0 ? (_reportPossibleCrUseOfsetGameContext({
            error: Error()
          }), setGameContext) : setGameContext)({
            config: configRepo,
            progress,
            recipes,
            tasks,
            router,
            audio
          });
          var wechat = new (_crd && WechatAdapter === void 0 ? (_reportPossibleCrUseOfWechatAdapter({
            error: Error()
          }), WechatAdapter) : WechatAdapter)();
          wechat.initLifecycleHooks();
          wechat.setShare('宝珠酿造');
          router.navigate('Intro');
          console.log('[BootScene] initialized');
        }

      }) || _class));

      _cclegacy._RF.pop();

      _crd = false;
    }
  };
});
//# sourceMappingURL=0baeaa3920aff901c3ac95b38424c6b8f71047a2.js.map