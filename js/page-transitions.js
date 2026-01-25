// 页面过渡系统 - 慢而有生命力的界面切换
// ================================================

(function() {
    'use strict';
    
    // 过渡配置
    const config = {
        fadeOutDuration: 500,  // 淡出时长
        fadeInDuration: 800,   // 淡入时长
    };
    
    // 创建过渡遮罩
    function createOverlay() {
        let overlay = document.getElementById('page-transition-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'page-transition-overlay';
            overlay.className = 'page-transition-overlay';
            document.body.appendChild(overlay);
        }
        return overlay;
    }
    
    // 判断是否为浅色页面
    function isLightPage(url) {
        // 游戏页面、章节选择页面等是浅色背景
        return url.includes('game.html') || 
               url.includes('levels.html') ||
               url.includes('codex.html') ||
               url.includes('gallery.html');
    }
    
    // 页面跳转（带过渡动画）
    window.navigateTo = function(url, options = {}) {
        const overlay = createOverlay();
        const isDarkTarget = !isLightPage(url);
        const transitionClass = isDarkTarget ? 'fade-to-black' : 'fade-to-warm';
        
        // 添加页面离开动画
        document.body.classList.add('page-leaving');
        
        // 显示过渡遮罩
        setTimeout(() => {
            overlay.classList.add(transitionClass);
        }, 100);
        
        // 跳转到新页面
        setTimeout(() => {
            window.location.href = url;
        }, config.fadeOutDuration);
    };
    
    // 页面加载时的进入动画
    function initPageEnter() {
        // 检查是否有过渡标记
        const hasTransition = sessionStorage.getItem('page_transitioning');
        
        if (hasTransition) {
            sessionStorage.removeItem('page_transitioning');
            document.body.classList.add('page-entering');
            
            setTimeout(() => {
                document.body.classList.remove('page-entering');
            }, config.fadeInDuration);
        } else {
            // 首次加载也添加淡入效果
            document.body.style.opacity = '0';
            requestAnimationFrame(() => {
                document.body.style.transition = 'opacity 0.6s ease-out';
                document.body.style.opacity = '1';
            });
        }
        
        // 为stagger元素添加动画
        initStaggerAnimations();
    }
    
    // 初始化渐进式动画
    function initStaggerAnimations() {
        const staggerElements = document.querySelectorAll('[data-stagger]');
        staggerElements.forEach((el, index) => {
            el.classList.add('stagger-hidden');
            el.style.animationDelay = `${0.1 + index * 0.1}s`;
            
            setTimeout(() => {
                el.classList.remove('stagger-hidden');
                el.classList.add('animate-fade-in-up');
            }, 100);
        });
    }
    
    // 标记即将进行页面跳转
    const originalNavigateTo = window.navigateTo;
    window.navigateTo = function(url, options = {}) {
        sessionStorage.setItem('page_transitioning', 'true');
        originalNavigateTo(url, options);
    };
    
    // 页面加载完成时初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPageEnter);
    } else {
        initPageEnter();
    }
    
})();

