// 配方图鉴逻辑
class Codex {
    constructor() {
        this.discoveredItems = window.LevelManager.currentProgress.discoveredItems || [];
        this.initUI();
        this.bindEvents();
    }

    initUI() {
        this.updateProgress();
        this.renderRecipes();
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

        // 关闭弹窗
        document.getElementById('close-modal').addEventListener('click', () => {
            this.hideModal();
        });

        document.getElementById('recipe-modal').addEventListener('click', (e) => {
            if (e.target.id === 'recipe-modal') {
                this.hideModal();
            }
        });
    }

    // 获取配方分类
    categorizeRecipes() {
        const core = []; // 核心配方（目标物品）
        const branch = []; // 支线配方（中间产物）
        const hidden = []; // 隐藏配方

        // 核心配方：所有关卡的目标物品
        const targetItems = window.LEVELS.map(l => l.target);
        
        // 遍历所有物品
        for (const [name, data] of Object.entries(window.ITEMS)) {
            const item = { name, ...data };
            
            if (data.type === 'ultimate' || targetItems.includes(name)) {
                core.push(item);
            } else if (data.hidden) {
                hidden.push(item);
            } else if (data.type === 'mid' || data.type === 'final') {
                branch.push(item);
            }
        }

        return { core, branch, hidden };
    }

    updateProgress() {
        const categories = this.categorizeRecipes();
        
        const coreDiscovered = categories.core.filter(r => this.discoveredItems.includes(r.name)).length;
        const branchDiscovered = categories.branch.filter(r => this.discoveredItems.includes(r.name)).length;
        const hiddenDiscovered = categories.hidden.filter(r => this.discoveredItems.includes(r.name)).length;

        const total = categories.core.length + categories.branch.length + categories.hidden.length;
        const discovered = coreDiscovered + branchDiscovered + hiddenDiscovered;

        // 更新总进度
        document.getElementById('total-progress').textContent = `${discovered}/${total}`;
        document.getElementById('main-progress-fill').style.width = `${(discovered / total) * 100}%`;

        // 更新统计
        document.getElementById('core-count').textContent = coreDiscovered;
        document.getElementById('branch-count').textContent = branchDiscovered;
        document.getElementById('hidden-count').textContent = hiddenDiscovered;

        // 更新分区计数
        document.getElementById('core-section-count').textContent = `${coreDiscovered}/${categories.core.length}`;
        document.getElementById('branch-section-count').textContent = `${branchDiscovered}/${categories.branch.length}`;
        document.getElementById('hidden-section-count').textContent = `${hiddenDiscovered}/${categories.hidden.length}`;
    }

    renderRecipes() {
        const categories = this.categorizeRecipes();

        this.renderRecipeGrid('core-recipes', categories.core, false);
        this.renderRecipeGrid('branch-recipes', categories.branch, false);
        this.renderRecipeGrid('hidden-recipes', categories.hidden, true);
    }

    renderRecipeGrid(containerId, recipes, isHidden) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';

        recipes.forEach(recipe => {
            const isDiscovered = this.discoveredItems.includes(recipe.name);
            const item = document.createElement('div');
            item.className = `recipe-item ${isDiscovered ? 'discovered' : 'undiscovered'} ${isHidden ? 'hidden-recipe' : ''}`;
            
            item.innerHTML = `
                <div class="icon">${isDiscovered ? recipe.icon : '❓'}</div>
                <div class="name">${isDiscovered ? recipe.name : '???'}</div>
            `;

            if (isDiscovered) {
                item.addEventListener('click', () => {
                    this.showRecipeDetail(recipe);
                });
            }

            container.appendChild(item);
        });
    }

    showRecipeDetail(recipe) {
        const modal = document.getElementById('recipe-modal');
        
        document.getElementById('detail-icon').textContent = recipe.icon;
        document.getElementById('detail-name').textContent = recipe.name;
        document.getElementById('detail-desc').textContent = recipe.desc || '';

        // 查找合成配方
        const recipeData = window.RECIPES.find(r => r.result === recipe.name);
        const formulaContainer = document.getElementById('detail-formula');
        
        if (recipeData) {
            let formulaHTML = '';
            recipeData.ingredients.forEach((ing, index) => {
                const ingData = window.ITEMS[ing] || { icon: '❓' };
                formulaHTML += `
                    <div class="formula-item">
                        <div class="icon">${ingData.icon}</div>
                        <div class="name">${ing}</div>
                    </div>
                `;
                if (index < recipeData.ingredients.length - 1) {
                    formulaHTML += '<span class="formula-arrow">+</span>';
                }
            });
            formulaHTML += '<span class="formula-arrow">→</span>';
            formulaHTML += `
                <div class="formula-item">
                    <div class="icon">${recipe.icon}</div>
                    <div class="name">${recipe.name}</div>
                </div>
            `;
            formulaContainer.innerHTML = formulaHTML;
        } else {
            formulaContainer.innerHTML = '<span style="color: #999;">配方来源未知</span>';
        }

        // 显示故事碎片（如果有）
        const storyContainer = document.getElementById('detail-story');
        const fragment = this.getFragmentForRecipe(recipe.name);
        if (fragment) {
            storyContainer.textContent = `"${fragment.text}"`;
        } else {
            storyContainer.textContent = '';
        }

        modal.classList.add('visible');
    }

    hideModal() {
        document.getElementById('recipe-modal').classList.remove('visible');
    }

    getFragmentForRecipe(recipeName) {
        // 从碎片数据中查找对应的故事
        if (window.FRAGMENTS) {
            return window.FRAGMENTS.find(f => f.trigger === recipeName);
        }
        return null;
    }
}

// 启动
document.addEventListener('DOMContentLoaded', () => {
    // 播放主界面BGM
    if (window.AudioManager) {
        window.AudioManager.playBGM('bgm-menu');
    }
    new Codex();
});

