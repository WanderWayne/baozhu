// 合成引擎 V2
class SynthesisEngine {
    constructor() {
        this.recipes = window.RECIPES;
    }

    // 检查两个物品是否可以合成
    checkSynthesis(item1Name, item2Name) {
        // 尝试两种顺序
        let recipe = this.findRecipeForTwo(item1Name, item2Name);
        if (!recipe) {
            recipe = this.findRecipeForTwo(item2Name, item1Name);
        }
        return recipe;
    }

    // 查找两个原料的配方
    findRecipeForTwo(ing1, ing2) {
        return this.recipes.find(r => {
            if (r.ingredients.length !== 2) return false;
            return (r.ingredients[0] === ing1 && r.ingredients[1] === ing2) ||
                   (r.ingredients[0] === ing2 && r.ingredients[1] === ing1);
        });
    }

    // 查找三个原料的配方
    findRecipeForThree(ing1, ing2, ing3) {
        const ingredients = [ing1, ing2, ing3].sort();
        return this.recipes.find(r => {
            if (r.ingredients.length !== 3) return false;
            const sorted = [...r.ingredients].sort();
            return sorted[0] === ingredients[0] && 
                   sorted[1] === ingredients[1] && 
                   sorted[2] === ingredients[2];
        });
    }

    // 执行合成
    synthesize(item1, item2, callback) {
        const recipe = this.checkSynthesis(item1.name, item2.name);
        
        if (!recipe) {
            // 合成失败
            callback({
                type: 'failed',
                message: this.getFailureMessage(item1.name, item2.name)
            });
            return false;
        }

        if (recipe.time > 0) {
            // 需要倒计时
            callback({
                type: 'timer',
                duration: recipe.time,
                result: recipe.result,
                message: recipe.msg,
                recipe: recipe
            });
        } else {
            // 即时合成
            callback({
                type: 'instant',
                result: recipe.result,
                message: recipe.msg,
                recipe: recipe
            });
        }
        return true;
    }

    // 获取智能失败提示
    getFailureMessage(item1, item2) {
        const hints = window.HINT_SYSTEM;
        if (!hints) return window.TIPS.failedCombine;
        
        const item1Data = window.ITEMS[item1];
        const item2Data = window.ITEMS[item2];
        const type1 = item1Data?.type || 'unknown';
        const type2 = item2Data?.type || 'unknown';
        
        // 1. 检查是否是同一类型
        if (type1 === type2 && hints.sameType[type1]) {
            return hints.sameType[type1];
        }
        
        // 2. 检查特定物品提示
        if (hints.itemHints[item1]) {
            return hints.itemHints[item1];
        }
        if (hints.itemHints[item2]) {
            return hints.itemHints[item2];
        }
        
        // 3. 检查类型组合提示
        const typeKey1 = `${type1}+${type2}`;
        const typeKey2 = `${type2}+${type1}`;
        if (hints.typeHints[typeKey1]) {
            return hints.typeHints[typeKey1];
        }
        if (hints.typeHints[typeKey2]) {
            return hints.typeHints[typeKey2];
        }
        
        // 4. 检查是否接近成功（物品出现在某个配方中）
        const almostRecipe = this.findAlmostMatchingRecipe(item1, item2);
        if (almostRecipe) {
            const randomIndex = Math.floor(Math.random() * hints.almostThere.length);
            return hints.almostThere[randomIndex];
        }
        
        // 5. 返回通用提示
        const randomIndex = Math.floor(Math.random() * hints.general.length);
        return hints.general[randomIndex];
    }
    
    // 查找是否有接近匹配的配方
    findAlmostMatchingRecipe(item1, item2) {
        // 检查是否有配方包含这两个物品中的任意一个
        return this.recipes.find(r => {
            if (r.ingredients.length !== 2) return false;
            return r.ingredients.includes(item1) || r.ingredients.includes(item2);
        });
    }

    // 检查物品是否是某个关卡的目标
    isTargetItem(itemName, levelId) {
        const level = window.LEVELS.find(l => l.id === levelId);
        return level && level.target === itemName;
    }

    // 检查物品是否触发门状态升级
    checkDoorTrigger(itemName, levelId) {
        const level = window.LEVELS.find(l => l.id === levelId);
        if (!level || !level.doorTriggers) return null;
        
        for (const [stage, triggers] of Object.entries(level.doorTriggers)) {
            if (triggers.includes(itemName)) {
                return stage; // 'stage1', 'stage2', 'stage3'
            }
        }
        return null;
    }
}

window.SynthesisEngine = new SynthesisEngine();
