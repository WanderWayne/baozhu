// 记忆长廊逻辑
class Gallery {
    constructor() {
        this.currentCategory = 'all';
        this.collectedFragments = window.LevelManager.currentProgress.fragments || [];
        this.initUI();
        this.bindEvents();
    }

    initUI() {
        this.updateProgress();
        this.renderFragments();
        this.updateUltimatePreview();
    }

    bindEvents() {
        // 返回按钮
        document.getElementById('back-btn').addEventListener('click', () => {
            if (window.AudioManager) {
                window.AudioManager.playClickBack();
            }
            if (window.navigateTo) window.navigateTo('index.html');
            else window.location.href = 'index.html';
        });

        // 分类按钮
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectCategory(btn.dataset.category);
            });
        });

        // 关闭弹窗
        document.getElementById('close-modal').addEventListener('click', () => {
            this.hideModal();
        });

        document.getElementById('fragment-modal').addEventListener('click', (e) => {
            if (e.target.id === 'fragment-modal') {
                this.hideModal();
            }
        });
    }

    selectCategory(category) {
        this.currentCategory = category;
        
        // 更新按钮状态
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });

        // 重新渲染
        this.renderFragments();
    }

    updateProgress() {
        const total = window.FRAGMENTS?.length || 0;
        const collected = this.collectedFragments.length;
        
        document.getElementById('total-progress').textContent = `${collected}/${total}`;
        
        const progressFill = document.getElementById('progress-fill');
        if (progressFill) {
            progressFill.style.width = total > 0 ? `${(collected / total) * 100}%` : '0%';
        }
    }

    getCategoryLabel(category) {
        const labels = {
            'founder': '创始故事',
            'craft': '传统工艺',
            'ingredient': '食材来源',
            'philosophy': '品牌哲学',
            'history': '历史传承',
            'season': '季节故事'
        };
        return labels[category] || category;
    }

    renderFragments() {
        const grid = document.getElementById('fragment-grid');
        if (!grid || !window.FRAGMENTS) return;

        grid.innerHTML = '';

        // 过滤碎片
        let fragments = window.FRAGMENTS;
        if (this.currentCategory !== 'all') {
            fragments = fragments.filter(f => f.category === this.currentCategory);
        }

        fragments.forEach(fragment => {
            const isCollected = this.collectedFragments.includes(fragment.id);
            const card = this.createFragmentCard(fragment, isCollected);
            grid.appendChild(card);
        });
    }

    createFragmentCard(fragment, isCollected) {
        const card = document.createElement('div');
        card.className = `fragment-card ${isCollected ? 'collected' : 'locked'}`;
        
        card.innerHTML = `
            <div class="image">${isCollected ? fragment.image : '❓'}</div>
            <div class="category-label">${this.getCategoryLabel(fragment.category)}</div>
        `;

        if (isCollected) {
            card.addEventListener('click', () => {
                this.showFragmentDetail(fragment);
            });
        }

        return card;
    }

    showFragmentDetail(fragment) {
        const modal = document.getElementById('fragment-modal');
        
        document.getElementById('detail-image').textContent = fragment.image;
        document.getElementById('detail-category').textContent = this.getCategoryLabel(fragment.category);
        document.getElementById('detail-story').textContent = `"${fragment.text}"`;
        document.getElementById('detail-trigger').textContent = `合成${fragment.trigger}`;

        modal.classList.add('visible');
    }

    hideModal() {
        document.getElementById('fragment-modal').classList.remove('visible');
    }

    updateUltimatePreview() {
        const preview = document.getElementById('ultimate-preview');
        const total = window.FRAGMENTS?.length || 0;
        const collected = this.collectedFragments.length;
        
        // 根据收集进度更新终极目标的显示状态
        const silhouette = document.getElementById('ultimate-silhouette');
        const icon = silhouette?.querySelector('.ultimate-icon');
        
        if (collected >= total && total > 0) {
            // 全部收集完成
            preview.classList.add('unlocked');
            if (icon) {
                icon.style.filter = 'none';
                icon.style.opacity = '1';
            }
            const hint = preview.querySelector('.ultimate-hint');
            if (hint) {
                hint.textContent = '传说已被唤醒！';
                hint.style.color = 'var(--brand-color)';
            }
        } else {
            // 根据进度调整模糊度
            const progress = total > 0 ? collected / total : 0;
            const blur = 4 - (progress * 3); // 从4px到1px
            const opacity = 0.3 + (progress * 0.5); // 从0.3到0.8
            
            if (icon) {
                icon.style.filter = `blur(${blur}px) brightness(0.6)`;
                icon.style.opacity = opacity.toString();
            }
        }
    }
}

// 启动
document.addEventListener('DOMContentLoaded', () => {
    // 播放主界面BGM
    if (window.AudioManager) {
        window.AudioManager.playBGM('bgm-menu');
    }
    new Gallery();
});

