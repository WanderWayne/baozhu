// 开场序列系统 - 入口文件
// ================================================
// 此文件汇总所有 intro 模块，由 HTML 最后加载

// 检查是否需要播放开场
document.addEventListener('DOMContentLoaded', () => {
    const hasPlayed = sessionStorage.getItem('hasPlayedIntro_v5');
    const urlParams = new URLSearchParams(window.location.search);
    const forceIntro = urlParams.get('intro') === 'reset';
    
    if (forceIntro) {
        sessionStorage.removeItem('hasPlayedIntro_v5');
    }
    
    const introScreen = document.getElementById('intro-screen');
    const mainScreen = document.getElementById('main-screen');
    
    if (!hasPlayed || forceIntro) {
        // 播放开场
        if (introScreen) introScreen.style.display = 'flex';
        if (mainScreen) mainScreen.style.display = 'none';
        window.introSystem = new IntroSystem();
    } else {
        // 跳过开场 - 显示主界面
        if (introScreen) introScreen.style.display = 'none';
        if (mainScreen) {
            mainScreen.style.display = 'flex';
            // 初始化主界面粒子系统
            if (window.MainParticleSystem) {
                window.mainParticles = new window.MainParticleSystem();
            }
            // 播放主界面BGM
            if (window.AudioManager) {
                window.AudioManager.playBGM('bgm-menu');
            }
        }
    }
});
