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
            'error': 'audio files/SFX11 error.mp3',
            'hum': 'audio files/SFX13 hum.mp3',
            'craft-target': 'audio files/SFX14 levelup final-craft.mp3',
            'craft-normal': 'audio files/SFX15 levelup.mp3',
            'drop': 'audio files/SFX17 pop-low.mp3',
            'pickup': 'audio files/SFX18 pop.mp3',
            'craft-fragment': 'audio files/SFX20 success craft.mp3',
            'text-appear': 'audio files/SFX21 text appear.mp3',
            'door-absorb': 'audio files/SFX22 transition-soft-long.mp3'
        };
        
        // 时长限制 (秒)
        this.durationLimits = {
            'click-dot': 6,
            'craft-target': 3
        };
        
        // 当前播放的计时器
        this.activeTimers = new Map();
        
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
        const savedBGM = localStorage.getItem('baozhu_bgm_volume');
        const savedSFX = localStorage.getItem('baozhu_sfx_volume');
        
        if (savedBGM !== null) {
            this.bgmVolume = parseInt(savedBGM) / 100;
        }
        if (savedSFX !== null) {
            this.sfxVolume = parseInt(savedSFX) / 100;
        }
    }
    
    // 预加载所有音频
    preloadAudio() {
        for (const [name, path] of Object.entries(this.audioFiles)) {
            const audio = new Audio(path);
            audio.preload = 'auto';
            
            if (name.startsWith('bgm-')) {
                audio.loop = true;
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
        
        // 播放新BGM
        this.currentBGM = this.bgm[name];
        this.currentBGMName = name;
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
    
    // 淡出BGM
    fadeOutBGM(duration = 1000) {
        if (!this.currentBGM) return;
        
        const bgm = this.currentBGM;
        const startVolume = bgm.volume;
        const fadeStep = startVolume / (duration / 50);
        
        const fadeInterval = setInterval(() => {
            bgm.volume = Math.max(0, bgm.volume - fadeStep);
            if (bgm.volume <= 0) {
                clearInterval(fadeInterval);
                bgm.pause();
                bgm.currentTime = 0;
                bgm.volume = this.bgmVolume; // 重置音量
                if (this.currentBGM === bgm) {
                    this.currentBGM = null;
                    this.currentBGMName = null;
                }
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
    
    // 播放点击进入音效
    playClickEnter() {
        this.playSFX('click-enter');
    }
    
    // 播放点击返回音效
    playClickBack() {
        this.playSFX('click-back');
    }
}

// 创建全局实例
window.AudioManager = new AudioManager();

