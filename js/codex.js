// 宝珠图谱页：SVG 图谱 + 折叠「配方一览」

class AtlasCodexPage {
    constructor() {
        this.discoveredItems = window.LevelManager.currentProgress.discoveredItems || [];
        if (window.LevelManager.refreshAtlasUnlocks()) window.LevelManager.saveProgress();
        this.initAtlasBoard();
        this.updateAtlasHeader();
        this.updateRecipeProgressBars();
        this.renderRecipeSections();
        this.bindEvents();
    }

    initAtlasBoard() {
        const board = document.getElementById('atlas-board');
        if (!board || !window.ATLAS_SLOTS || !window.ATLAS_CENTER_SLOT) return;

        const unlocked = new Set(window.LevelManager.currentProgress.atlasPieces || []);
        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('viewBox', '0 0 100 100');
        svg.classList.add('atlas-svg');

        const appendDecorRing = (paths, className) => {
            if (!paths || !paths.length) return;
            const g = document.createElementNS(svgNS, 'g');
            g.classList.add(className);
            paths.forEach(d => {
                const p = document.createElementNS(svgNS, 'path');
                p.setAttribute('d', d);
                p.classList.add('atlas-decor-petal');
                g.appendChild(p);
            });
            svg.appendChild(g);
        };

        appendDecorRing(window.ATLAS_OUTER_PETALS, 'atlas-ring-outer');

        window.ATLAS_SLOTS.forEach(slot => {
            const g = document.createElementNS(svgNS, 'g');
            g.classList.add('atlas-slot');
            g.classList.add('kind-' + slot.kind);
            if (slot.kind === 'reserved') g.classList.add('kind-reserved');
            g.dataset.slotId = slot.id;

            const outline = document.createElementNS(svgNS, 'path');
            outline.setAttribute('d', slot.pathD);
            outline.classList.add('atlas-wedge-outline');

            const fill = document.createElementNS(svgNS, 'path');
            fill.setAttribute('d', slot.pathD);
            fill.classList.add('atlas-wedge-fill');

            if (unlocked.has(slot.id)) g.classList.add('unlocked');

            g.appendChild(outline);
            g.appendChild(fill);

            const tip = document.createElementNS(svgNS, 'title');
            let tipText = slot.label || slot.id;
            if (slot.kind === 'reserved') tipText += '（章节未启程）';
            tipText += unlocked.has(slot.id) ? ' · 已点亮' : '';
            tip.textContent = tipText;
            g.appendChild(tip);

            svg.appendChild(g);
        });

        appendDecorRing(window.ATLAS_INNER_PETALS, 'atlas-ring-inner');

        const iris = document.createElementNS(svgNS, 'circle');
        iris.setAttribute('cx', '50');
        iris.setAttribute('cy', '50');
        iris.setAttribute('r', '14.9');
        iris.classList.add('atlas-map-iris');
        svg.appendChild(iris);

        const c = window.ATLAS_CENTER_SLOT;
        const cg = document.createElementNS(svgNS, 'g');
        cg.classList.add('atlas-center-slot');
        if (unlocked.has(c.id)) cg.classList.add('unlocked');

        const circle = document.createElementNS(svgNS, 'circle');
        circle.setAttribute('cx', String(c.cx));
        circle.setAttribute('cy', String(c.cy));
        circle.setAttribute('r', String(c.r));
        circle.classList.add('atlas-center-fill-back');
        cg.appendChild(circle);

        const text = document.createElementNS(svgNS, 'text');
        text.setAttribute('x', '50');
        text.setAttribute('y', '53');
        text.setAttribute('text-anchor', 'middle');
        text.classList.add('atlas-center-letter');
        text.textContent = '谱';
        cg.appendChild(text);

        const ct = document.createElementNS(svgNS, 'title');
        ct.textContent = unlocked.has(c.id)
            ? '图谱之心 · 已归位'
            : '中央留白 — 待诸章圆满后归位';
        cg.appendChild(ct);

        svg.appendChild(cg);

        board.innerHTML = '';
        board.appendChild(svg);
    }

    updateAtlasHeader() {
        const ids = window.LevelManager.currentProgress.atlasPieces || [];
        const { unlocked, total } = window.getAtlasProgressCounts(ids);
        const countEl = document.getElementById('atlas-progress-count');
        const metaEl = document.getElementById('atlas-progress-meta');
        if (countEl) countEl.textContent = `${unlocked}/${total}`;
        if (metaEl) {
            metaEl.textContent =
                total > 0
                    ? `外圈与内圈为叠瓣形制（尚无玩法）；中圈八瓣对应章节碎片。舆图之心在中央。`
                    : '';
        }
    }

    updateRecipeProgressBars() {
        const categories = this.categorizeRecipes();
        const coreDiscovered = categories.core.filter(r => this.discoveredItems.includes(r.name)).length;
        const branchDiscovered = categories.branch.filter(r => this.discoveredItems.includes(r.name)).length;
        const hiddenDiscovered = categories.hidden.filter(r => this.discoveredItems.includes(r.name)).length;

        const sum =
            categories.core.length + categories.branch.length + categories.hidden.length;
        const discovered = coreDiscovered + branchDiscovered + hiddenDiscovered;

        const fill = document.getElementById('recipe-progress-fill');
        if (fill && sum > 0) fill.style.width = `${(discovered / sum) * 100}%`;

        const setText = (id, v) => {
            const el = document.getElementById(id);
            if (el) el.textContent = String(v);
        };
        setText('core-count', coreDiscovered);
        setText('branch-count', branchDiscovered);
        setText('hidden-count', hiddenDiscovered);
        setText('core-section-count', `${coreDiscovered}/${categories.core.length}`);
        setText('branch-section-count', `${branchDiscovered}/${categories.branch.length}`);
        setText('hidden-section-count', `${hiddenDiscovered}/${categories.hidden.length}`);
    }

    categorizeRecipes() {
        const core = [];
        const branch = [];
        const hidden = [];
        const targetItems = window.LEVELS.map(l => l.target);

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

    renderRecipeSections() {
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
            item.className =
                `recipe-item ${isDiscovered ? 'discovered' : 'undiscovered'} ${isHidden ? 'hidden-recipe' : ''}`;

            item.innerHTML =
                '<div class="icon">' + (isDiscovered ? recipe.icon : '❓') + '</div>' +
                '<div class="name">' + (isDiscovered ? recipe.name : '???') + '</div>';

            if (isDiscovered) {
                item.addEventListener('click', () => {
                    if (window.AudioManager) window.AudioManager.playClickOpen();
                    this.showRecipeDetail(recipe);
                });
            }

            container.appendChild(item);
        });
    }

    bindEvents() {
        document.getElementById('back-btn').addEventListener('click', () => {
            if (window.AudioManager) window.AudioManager.playClickBack();
            if (window.navigateTo) window.navigateTo('index.html');
            else window.location.href = 'index.html';
        });

        document.getElementById('close-modal').addEventListener('click', () => this.hideModal());
        document.getElementById('recipe-modal').addEventListener('click', e => {
            if (e.target.id === 'recipe-modal') this.hideModal();
        });

        const toggle = document.getElementById('recipes-drawer-toggle');
        const panel = document.getElementById('recipes-drawer-panel');
        if (toggle && panel) {
            toggle.addEventListener('click', () => {
                const open = !panel.classList.contains('open');
                panel.classList.toggle('open', open);
                toggle.classList.toggle('open', open);
                toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
                if (window.AudioManager) window.AudioManager.playClickOpen();
            });
        }
    }

    showRecipeDetail(recipe) {
        const modal = document.getElementById('recipe-modal');

        document.getElementById('detail-icon').textContent = recipe.icon;
        document.getElementById('detail-name').textContent = recipe.name;
        document.getElementById('detail-desc').textContent = recipe.desc || '';

        const recipeData = window.RECIPES.find(r => r.result === recipe.name);
        const formulaContainer = document.getElementById('detail-formula');

        if (recipeData) {
            let formulaHTML = '';
            recipeData.ingredients.forEach((ing, index) => {
                const ingData = window.ITEMS[ing] || { icon: '❓' };
                formulaHTML +=
                    '<div class="formula-item">' +
                    '<div class="icon">' + ingData.icon + '</div>' +
                    '<div class="name">' + ing + '</div>' +
                    '</div>';
                if (index < recipeData.ingredients.length - 1) {
                    formulaHTML += '<span class="formula-arrow">+</span>';
                }
            });
            formulaHTML += '<span class="formula-arrow">→</span>';
            formulaHTML +=
                '<div class="formula-item">' +
                '<div class="icon">' + recipe.icon + '</div>' +
                '<div class="name">' + recipe.name + '</div>' +
                '</div>';
            formulaContainer.innerHTML = formulaHTML;
        } else {
            formulaContainer.innerHTML = '<span style="color: #999;">配方来源未知</span>';
        }

        const storyContainer = document.getElementById('detail-story');
        const fragment = this.getFragmentForRecipe(recipe.name);
        storyContainer.textContent = fragment ? '"' + fragment.text + '"' : '';

        modal.classList.add('visible');
    }

    hideModal() {
        if (window.AudioManager) window.AudioManager.playClickExit();
        document.getElementById('recipe-modal').classList.remove('visible');
    }

    getFragmentForRecipe(recipeName) {
        if (window.FRAGMENTS) {
            return window.FRAGMENTS.find(f => f.trigger === recipeName);
        }
        return null;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.AudioManager) window.AudioManager.playBGM('bgm-menu');
    new AtlasCodexPage();
});
