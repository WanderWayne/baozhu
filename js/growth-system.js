// 主界面成长系统
// 基于玩家进度，让主界面"发酵成长"
// ================================================

class GrowthSystem {
    constructor() {
        // V2 风格指南色彩
        this.colors = {
            // 晨曦系
            dawnPink: { r: 245, g: 230, b: 224 },      // #F5E6E0
            sunriseOrange: { r: 232, g: 168, b: 124 }, // #E8A87C
            duskPurple: { r: 184, g: 165, b: 199 },    // #B8A5C7
            dawnGold: { r: 240, g: 217, b: 160 },      // #F0D9A0
            
            // 酿造系
            riceWineGold: { r: 232, g: 200, b: 115 },  // #E8C873
            caramelBrown: { r: 166, g: 124, b: 82 },   // #A67C52
            oldWood: { r: 107, g: 83, b: 68 },         // #6B5344
            milkFoam: { r: 255, g: 253, b: 247 },      // #FFFDF7
            yeastBeige: { r: 245, g: 240, b: 230 },    // #F5F0E6
            
            // 生机系
            mossGreen: { r: 123, g: 163, b: 123 },     // #7BA37B
            honeyAmber: { r: 212, g: 160, b: 58 },     // #D4A03A
        };
        
        // 成长阶段定义
        this.stages = [
            { name: '播种', minProgress: 0, maxProgress: 10 },
            { name: '萌芽', minProgress: 10, maxProgress: 25 },
            { name: '生长', minProgress: 25, maxProgress: 50 },
            { name: '繁茂', minProgress: 50, maxProgress: 75 },
            { name: '丰收', minProgress: 75, maxProgress: 100 }
        ];
    }
    
    // 计算总体成长进度 (0-100)
    calculateGrowthProgress() {
        if (!window.LevelManager) return 0;
        
        const progress = window.LevelManager.currentProgress;
        
        // 权重分配
        const weights = {
            levels: 0.4,      // 关卡完成 40%
            items: 0.3,       // 物品发现 30%
            fragments: 0.3    // 碎片收集 30%
        };
        
        // 关卡进度
        const totalLevels = window.LEVELS?.length || 20;
        const completedLevels = progress.completedLevels?.length || 0;
        const levelProgress = Math.min(completedLevels / totalLevels, 1);
        
        // 物品发现进度
        const totalItems = Object.keys(window.ITEMS || {}).length || 50;
        const discoveredItems = progress.discoveredItems?.length || 0;
        const itemProgress = Math.min(discoveredItems / totalItems, 1);
        
        // 碎片收集进度
        const totalFragments = window.FRAGMENTS?.length || 16;
        const collectedFragments = progress.fragments?.length || 0;
        const fragmentProgress = Math.min(collectedFragments / totalFragments, 1);
        
        // 综合计算
        const totalProgress = (
            levelProgress * weights.levels +
            itemProgress * weights.items +
            fragmentProgress * weights.fragments
        ) * 100;
        
        return Math.round(totalProgress);
    }
    
    // 获取当前成长阶段
    getCurrentStage() {
        const progress = this.calculateGrowthProgress();
        for (let i = this.stages.length - 1; i >= 0; i--) {
            if (progress >= this.stages[i].minProgress) {
                return { ...this.stages[i], progress };
            }
        }
        return { ...this.stages[0], progress: 0 };
    }
    
    // 获取成长因子 (0-1)
    getGrowthFactor() {
        return this.calculateGrowthProgress() / 100;
    }
    
    // 颜色插值
    lerpColor(color1, color2, t) {
        return {
            r: Math.round(color1.r + (color2.r - color1.r) * t),
            g: Math.round(color1.g + (color2.g - color1.g) * t),
            b: Math.round(color1.b + (color2.b - color1.b) * t)
        };
    }
    
    // 获取当前背景色（基于成长进度）
    getBackgroundColor() {
        const factor = this.getGrowthFactor();
        
        // 背景色渐变：破晓粉 → 酵母米 → 带金色的米色
        if (factor < 0.5) {
            // 0-50%: 破晓粉 → 酵母米
            const t = factor / 0.5;
            return this.lerpColor(this.colors.dawnPink, this.colors.yeastBeige, t);
        } else {
            // 50-100%: 酵母米 → 带暖金色的米色
            const t = (factor - 0.5) / 0.5;
            const warmBeige = this.lerpColor(this.colors.yeastBeige, this.colors.dawnGold, 0.2);
            return this.lerpColor(this.colors.yeastBeige, warmBeige, t);
        }
    }
    
    // 获取文字颜色（始终是老木褐）
    getTextColor() {
        return this.colors.oldWood;
    }
    
    // 获取文字光晕强度 (0-1)
    getTextGlowIntensity() {
        const factor = this.getGrowthFactor();
        // 光晕从几乎不可见到明显
        // 初始：0.05（极淡，暗示成长潜力）
        // 最终：0.6（明显的金色光晕）
        return 0.05 + factor * 0.55;
    }
    
    // 获取光晕颜色（米酒金）
    getGlowColor() {
        return this.colors.riceWineGold;
    }
    
    // 获取蔓延纹理覆盖率 (0-1)
    getTextureSpread() {
        const factor = this.getGrowthFactor();
        // 初始 5%（让玩家感知到"这里会长满"）
        // 最终 95%（几乎全屏）
        return 0.05 + factor * 0.9;
    }
    
    // 获取气泡系统参数
    getBubbleParams() {
        const factor = this.getGrowthFactor();
        
        return {
            // 气泡数量随成长增加
            count: Math.round(8 + factor * 22),
            
            // 气泡颜色：从白色为主 → 金色为主
            goldRatio: 0.1 + factor * 0.5,
            
            // 气泡大小范围
            minSize: 2 + factor * 1,
            maxSize: 8 + factor * 4,
            
            // 气泡透明度
            minAlpha: 0.1 + factor * 0.1,
            maxAlpha: 0.3 + factor * 0.2,
            
            // 速度
            minSpeed: 0.2,
            maxSpeed: 0.5 + factor * 0.3
        };
    }
    
    // 获取微尘系统参数
    getDustParams() {
        const factor = this.getGrowthFactor();
        
        return {
            count: Math.round(20 + factor * 40),
            // 从几乎看不见到微微可见
            minAlpha: 0.01 + factor * 0.02,
            maxAlpha: 0.04 + factor * 0.06
        };
    }
    
    // 获取光斑系统参数
    getGlowParams() {
        const factor = this.getGrowthFactor();
        
        return {
            count: Math.round(2 + factor * 4),
            minAlpha: 0.01 + factor * 0.02,
            maxAlpha: 0.02 + factor * 0.03
        };
    }
    
    // 检查是否显示成长提示（初始状态下的暗示元素）
    shouldShowGrowthHint() {
        // 当进度 < 20% 时，显示暗示元素
        return this.calculateGrowthProgress() < 20;
    }
    
    // 获取 CSS 变量字符串（用于更新 CSS）
    getCSSVariables() {
        const bg = this.getBackgroundColor();
        const text = this.getTextColor();
        const glow = this.getGlowColor();
        const glowIntensity = this.getTextGlowIntensity();
        
        return {
            '--growth-bg': `rgb(${bg.r}, ${bg.g}, ${bg.b})`,
            '--growth-text': `rgb(${text.r}, ${text.g}, ${text.b})`,
            '--growth-glow': `rgba(${glow.r}, ${glow.g}, ${glow.b}, ${glowIntensity})`,
            '--growth-glow-strong': `rgba(${glow.r}, ${glow.g}, ${glow.b}, ${glowIntensity * 1.5})`,
            '--growth-factor': this.getGrowthFactor().toString(),
            '--growth-spread': this.getTextureSpread().toString()
        };
    }
    
    // 应用 CSS 变量到文档
    applyCSSVariables() {
        const vars = this.getCSSVariables();
        const root = document.documentElement;
        
        for (const [key, value] of Object.entries(vars)) {
            root.style.setProperty(key, value);
        }
    }
}

// 全局实例
window.GrowthSystem = new GrowthSystem();
