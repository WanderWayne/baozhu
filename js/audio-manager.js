// 音频管理器 - 统一管理BGM和音效
// ================================================

class AudioManager {
    constructor() {
        this.bgm = {};
        this.sfx = {};
        this.currentBGM = null;
        this.currentBGMName = null;
        
        // 音量设置 (0-1)
        this.bgmVolume = 0.8;
        this.sfxVolume = 0.8;
        
        // 用户交互状态（用于解锁音频播放）
        this.audioUnlocked = false;
        this.pendingBGM = null; // 等待播放的BGM
        
        // 加载保存的音量设置
        this.loadVolumeSettings();
        
        // 音频文件映射
        this.audioFiles = {
            // BGM
            'bgm-game': 'audio files/SFX1 BGM game.mp3',
            'bgm-intro': 'audio files/SFX2 BGM intro.mp3',
            'bgm-menu': 'audio files/SFX4 BGM-main-menu.mp3',
            
            // SFX
            'click-dot': 'audio files/SFX5 click first-white-dot.mp3',
            'click-enter': 'audio files/SFX6 click high-pitch.mp3',
            'click-back': 'audio files/SFX7 click low-pitch.mp3',
            'timer-tick': 'audio files/SFX8 clock-ticking-365218.mp3',
            'wave': 'audio files/SFX10 Wave.mp3',
            'error': 'audio files/SFX32 error.mp3',
            'hum': 'audio files/SFX13 hum.mp3',
            'craft-target': 'audio files/SFX41 success.mp3',
            'craft-normal': 'audio files/SFX15 levelup.mp3',
            'drop': 'audio files/SFX17 pop-low.mp3',
            'pickup': 'audio files/SFX18 pop.mp3',
            'craft-fragment': 'audio files/SFX20 success craft.mp3',
            'text-appear': 'audio files/SFX21 text appear.mp3',
            'door-absorb': 'audio files/SFX22 transition-soft-long.mp3',

            // SFX24–41 扩展（按需接线）
            'inventory-slot-pop': 'audio files/SFX37 bubblepoph.mp3',
            'click-open': 'audio files/SFX35 click_open.mp3',
            'click-ui': 'audio files/SFX36 click_close.mp3',
            'task-reward-gem': 'audio files/SFX39 moneyless.mp3',
            'task-milestone': 'audio files/SFX27 reminder.mp3',
            'gem-earn': 'audio files/SFX40 moneymuch.mp3',
            'settlement-phase-complete': 'audio files/SFX33 complete.mp3',
            'recipe-book': 'audio files/SFX30 page.mp3',
            'recipe-tab': 'audio files/SFX28 wooden_click.mp3',
            'trade': 'audio files/SFX26 trade.mp3'
        };
        
        // 时长限制 (秒)
        this.durationLimits = {
            'click-dot': 6
        };
        
        // 当前播放的计时器
        this.activeTimers = new Map();

        /** @type {ReturnType<typeof setInterval> | null} */
        this._bgmFadeInterval = null;
        
        // 循环播放的音效
        this.loopingSFX = new Map();
        
        // 预加载音频
        this.preloadAudio();
        
        // 设置用户交互解锁
        this.setupUserInteractionUnlock();
        
        // 页面可见性变化处理
        this.setupVisibilityHandler();
    }
    
    // 设置用户交互解锁音频
    setupUserInteractionUnlock() {
        const unlockAudio = () => {
            if (this.audioUnlocked) return;
            
            this.audioUnlocked = true;
            console.log('Audio unlocked by user interaction');
            
            // 如果有等待播放的BGM，现在播放它
            if (this.pendingBGM) {
                this.playBGM(this.pendingBGM);
                this.pendingBGM = null;
            }
            
            // 移除监听器
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('touchstart', unlockAudio);
            document.removeEventListener('keydown', unlockAudio);
        };
        
        // 监听用户交互事件
        document.addEventListener('click', unlockAudio);
        document.addEventListener('touchstart', unlockAudio);
        document.addEventListener('keydown', unlockAudio);
    }
    
    // 加载保存的音量设置
    loadVolumeSettings() {
        // 曾有一版在每次启动时强制静音并写入 0，一次性恢复为默认 80%
        if (!localStorage.getItem('baozhu_volume_mute_bug_fixed')) {
            localStorage.setItem('baozhu_bgm_volume', '80');
            localStorage.setItem('baozhu_sfx_volume', '80');
            localStorage.setItem('baozhu_volume_mute_bug_fixed', '1');
        }

        const savedBGM = localStorage.getItem('baozhu_bgm_volume');
        const savedSFX = localStorage.getItem('baozhu_sfx_volume');

        if (savedBGM !== null && savedBGM !== '') {
            this.bgmVolume = parseInt(savedBGM, 10) / 100;
        }
        if (savedSFX !== null && savedSFX !== '') {
            this.sfxVolume = parseInt(savedSFX, 10) / 100;
        }
    }
    
    // 预加载所有音频
    preloadAudio() {
        for (const [name, path] of Object.entries(this.audioFiles)) {
            const audio = new Audio(path);
            audio.preload = 'auto';
            
            if (name.startsWith('bgm-')) {
                // 开场曲播一遍即止；其余 BGM 循环
                const loop = name !== 'bgm-intro';
                audio.loop = loop;
                if (name === 'bgm-intro') {
                    audio.addEventListener('ended', () => {
                        if (this.currentBGM === audio && this.currentBGMName === 'bgm-intro') {
                            this.currentBGM = null;
                            this.currentBGMName = null;
                        }
                    });
                }
                this.bgm[name] = audio;
            } else {
                this.sfx[name] = audio;
            }
        }
    }
    
    // 设置页面可见性处理
    setupVisibilityHandler() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // 页面隐藏时暂停BGM
                if (this.currentBGM && !this.currentBGM.paused) {
                    this.currentBGM.pause();
                    this._bgmWasPaused = true;
                }
            } else {
                // 页面可见时恢复BGM
                if (this._bgmWasPaused && this.currentBGM) {
                    this.currentBGM.play().catch(() => {});
                    this._bgmWasPaused = false;
                }
            }
        });
    }
    
    // ==================== BGM 控制 ====================
    
    // 播放BGM
    playBGM(name) {
        if (!this.bgm[name]) {
            console.warn(`BGM not found: ${name}`);
            return;
        }
        
        // 如果已经在播放同一个BGM，不重复播放
        if (this.currentBGMName === name && this.currentBGM && !this.currentBGM.paused) {
            return;
        }
        
        // 停止当前BGM
        this.stopBGM();
        
        // 播放新BGM（除开场曲外均循环；每次播放时显式写入，避免被其它逻辑改掉）
        this.currentBGM = this.bgm[name];
        this.currentBGMName = name;
        this.currentBGM.loop = name !== 'bgm-intro';
        this.currentBGM.volume = this.bgmVolume;
        this.currentBGM.currentTime = 0;
        this.currentBGM.play().catch(e => {
            console.log('BGM autoplay blocked, waiting for user interaction');
            // 保存待播放的BGM，等用户交互后播放
            this.pendingBGM = name;
        });
    }
    
    // 停止BGM
    stopBGM() {
        if (this.currentBGM) {
            this.currentBGM.pause();
            this.currentBGM.currentTime = 0;
            this.currentBGM = null;
            this.currentBGMName = null;
        }
    }
    
    /**
     * 淡出当前 BGM 至静音并停止；结束后可选回调。
     * @param {number} [duration]
     * @param {() => void} [onComplete]
     */
    fadeOutBGM(duration = 1000, onComplete) {
        if (this._bgmFadeInterval) {
            clearInterval(this._bgmFadeInterval);
            this._bgmFadeInterval = null;
        }

        if (!this.currentBGM) {
            if (typeof onComplete === 'function') onComplete();
            return;
        }

        const bgm = this.currentBGM;
        const startVolume = bgm.volume;
        const steps = Math.max(1, Math.ceil(duration / 50));
        const fadeStep = startVolume / steps;

        this._bgmFadeInterval = setInterval(() => {
            bgm.volume = Math.max(0, bgm.volume - fadeStep);
            if (bgm.volume <= 0) {
                clearInterval(this._bgmFadeInterval);
                this._bgmFadeInterval = null;
                bgm.pause();
                bgm.currentTime = 0;
                bgm.volume = this.bgmVolume;
                if (this.currentBGM === bgm) {
                    this.currentBGM = null;
                    this.currentBGMName = null;
                }
                if (typeof onComplete === 'function') onComplete();
            }
        }, 50);
    }
    
    // 设置BGM音量
    setBGMVolume(volume) {
        this.bgmVolume = Math.max(0, Math.min(1, volume));
        localStorage.setItem('baozhu_bgm_volume', Math.round(this.bgmVolume * 100));
        
        if (this.currentBGM) {
            this.currentBGM.volume = this.bgmVolume;
        }
    }
    
    // ==================== SFX 控制 ====================
    
    // 播放音效
    playSFX(name, maxDuration = null) {
        if (!this.sfx[name]) {
            console.warn(`SFX not found: ${name}`);
            return;
        }
        
        const audio = this.sfx[name];
        
        // 清除之前的计时器
        if (this.activeTimers.has(name)) {
            clearTimeout(this.activeTimers.get(name));
            this.activeTimers.delete(name);
        }
        
        // 设置音量并播放
        audio.volume = this.sfxVolume;
        audio.currentTime = 0;
        audio.play().catch(e => {
            console.log(`SFX play blocked: ${name}`);
        });
        
        // 使用预设或传入的时长限制
        const limit = maxDuration || this.durationLimits[name];
        if (limit) {
            const timer = setTimeout(() => {
                audio.pause();
                audio.currentTime = 0;
                this.activeTimers.delete(name);
            }, limit * 1000);
            this.activeTimers.set(name, timer);
        }
    }
    
    // 停止音效
    stopSFX(name) {
        if (!this.sfx[name]) return;
        
        const audio = this.sfx[name];
        audio.pause();
        audio.currentTime = 0;
        
        // 清除计时器
        if (this.activeTimers.has(name)) {
            clearTimeout(this.activeTimers.get(name));
            this.activeTimers.delete(name);
        }
        
        // 如果是循环音效，也停止
        if (this.loopingSFX.has(name)) {
            this.loopingSFX.delete(name);
        }
    }
    
    // 循环播放音效
    playSFXLoop(name) {
        if (!this.sfx[name]) {
            console.warn(`SFX not found: ${name}`);
            return;
        }
        
        const audio = this.sfx[name];
        audio.volume = this.sfxVolume;
        audio.loop = true;
        audio.currentTime = 0;
        audio.play().catch(e => {
            console.log(`SFX loop play blocked: ${name}`);
        });
        
        this.loopingSFX.set(name, audio);
    }
    
    // 停止循环音效
    stopSFXLoop(name) {
        if (!this.sfx[name]) return;
        
        const audio = this.sfx[name];
        audio.loop = false;
        audio.pause();
        audio.currentTime = 0;
        
        this.loopingSFX.delete(name);
    }
    
    // 设置SFX音量
    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        localStorage.setItem('baozhu_sfx_volume', Math.round(this.sfxVolume * 100));
    }
    
    // ==================== 便捷方法 ====================
    
    // 进入 / 通用按钮 / 「点击任意处继续」（SFX35）
    playClickOpen() {
        this.playSFX('click-open');
    }

    // 退出 / 关闭 / 取消（SFX36）
    playClickExit() {
        this.playSFX('click-ui');
    }

    // 播放点击进入音效（关卡列表「进入关卡」保留）
    playClickEnter() {
        this.playSFX('click-enter');
    }

    // 历史兼容：返回类交互 → 退出音
    playClickBack() {
        this.playClickExit();
    }

    /**
     * 关卡转场时物品栏单项消失/出现（SFX37）。消失时略降调；出现为原速。
     * 使用独立 Audio 实例以支持短时间内重叠播放。
     * @param {boolean} isDisappear
     * @param {{ volumeMul?: number }} [opts] volumeMul：相对全局 SFX 音量的倍率（默认压低，避免重叠过响）
     */
    playInventoryTransitionSlot(isDisappear, opts = {}) {
        const path = this.audioFiles['inventory-slot-pop'];
        if (!path) return;
        const volumeMul = typeof opts.volumeMul === 'number' ? opts.volumeMul : 0.42;
        const audio = new Audio(path);
        audio.volume = Math.min(1, this.sfxVolume * volumeMul);
        audio.playbackRate = isDisappear ? 0.88 : 1;
        audio.play().catch(() => {});
    }
}

// 创建全局实例
window.AudioManager = new AudioManager();

