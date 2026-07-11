/** @feature tutorial @see docs/features/tutorial.md */

Game.prototype.hasSeenTutorial = function() {
        // 支持 URL 参数 ?tutorial=reset 强制重置教学
        const params = new URLSearchParams(window.location.search);
        if (params.get('tutorial') === 'reset') {
            localStorage.removeItem('baozhu_tutorial_seen');
            return false;
        }
        return localStorage.getItem('baozhu_tutorial_seen') === 'true';
    }

Game.prototype.markTutorialSeen = function() {
        localStorage.setItem('baozhu_tutorial_seen', 'true');
    }

Game.prototype.showTutorial = function() {
        const overlay = document.getElementById('tutorial-overlay');
        const tutorialIcon = document.getElementById('tutorial-door-icon');
        const tutorialTarget = document.getElementById('tutorial-target-name');
        const skipBtn = document.getElementById('tutorial-skip-btn');
        
        // 设置教学动画中的目标物品
        const targetItem = window.ITEMS[this.levelData.target];
        if (tutorialIcon) tutorialIcon.textContent = targetItem?.icon || '🍨';
        if (tutorialTarget) tutorialTarget.textContent = this.levelData.target;
        
        // 显示教学覆盖层
        overlay.classList.remove('hidden');
        
        // 绑定跳过/继续按钮
        skipBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (window.AudioManager) window.AudioManager.playClickOpen();
            this.dismissTutorial();
        });
        
        // 也允许点击任意位置跳过（延迟绑定，避免误触）
        setTimeout(() => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay || e.target.closest('.tutorial-content')) {
                    if (window.AudioManager) window.AudioManager.playClickOpen();
                    this.dismissTutorial();
                }
            }, { once: true });
        }, 2500);
    }

Game.prototype.dismissTutorial = function() {
        const overlay = document.getElementById('tutorial-overlay');
        
        // 标记已看过
        this.markTutorialSeen();
        
        // 播放缩小动画
        overlay.classList.add('zoom-out');
        
        // 动画结束后隐藏并开始游戏
        setTimeout(() => {
            overlay.classList.add('fade-out');
            setTimeout(() => {
                overlay.classList.add('hidden');
                this.startGame();
            }, 300);
        }, 800);
    }

Game.prototype.hideTutorialImmediately = function() {
        const overlay = document.getElementById('tutorial-overlay');
        if (overlay) overlay.classList.add('hidden');
    }

Game.prototype.showTutorialHint = function() {
        const focus = this.levelData.tutorialFocus;
        let hintText = '';
        
        switch (focus) {
            case 'approach_and_offer':
                setTimeout(() => {
                    this.showToast('💡 提示：合成后，把物品拖到门上', 5000);
                }, 5000);
                break;
            case 'pause_wait':
                setTimeout(() => {
                    this.showToast('💡 提示：有些合成需要等待', 5000);
                }, 5000);
                break;
            case 'extract_longpress':
                setTimeout(() => {
                    this.showToast('💡 提示：长按物品可以查看信息或提取', 5000);
                }, 3000);
                break;
        }
    }
