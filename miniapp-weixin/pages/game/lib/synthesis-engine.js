// 合成引擎（对齐 H5 js/synthesis.js）
const { RECIPES, ITEMS, HINT_SYSTEM, TIPS } = require('../../../data/items.js');

class SynthesisEngine {
  constructor() {
    this.recipes = RECIPES;
  }

  checkSynthesis(item1Name, item2Name) {
    let recipe = this.findRecipeForTwo(item1Name, item2Name);
    if (!recipe) recipe = this.findRecipeForTwo(item2Name, item1Name);
    return recipe;
  }

  findRecipeForTwo(ing1, ing2) {
    return this.recipes.find((r) => {
      if (r.ingredients.length !== 2) return false;
      return (r.ingredients[0] === ing1 && r.ingredients[1] === ing2)
        || (r.ingredients[0] === ing2 && r.ingredients[1] === ing1);
    });
  }

  synthesize(item1, item2, callback) {
    const recipe = this.checkSynthesis(item1.name, item2.name);
    if (!recipe) {
      callback({
        type: 'failed',
        message: this.getFailureMessage(item1.name, item2.name),
      });
      return false;
    }

    if (recipe.time > 0) {
      callback({
        type: 'timer',
        duration: recipe.time,
        result: recipe.result,
        message: recipe.msg,
        recipe,
      });
    } else {
      callback({
        type: 'instant',
        result: recipe.result,
        message: recipe.msg,
        recipe,
      });
    }
    return true;
  }

  getFailureMessage(item1, item2) {
    const hints = HINT_SYSTEM;
    if (!hints) return TIPS.failedCombine || '它们合不到一起…';

    const type1 = ITEMS[item1]?.type || 'unknown';
    const type2 = ITEMS[item2]?.type || 'unknown';

    if (type1 === type2 && hints.sameType?.[type1]) return hints.sameType[type1];
    if (hints.itemHints?.[item1]) return hints.itemHints[item1];
    if (hints.itemHints?.[item2]) return hints.itemHints[item2];

    const typeKey1 = `${type1}+${type2}`;
    const typeKey2 = `${type2}+${type1}`;
    if (hints.typeHints?.[typeKey1]) return hints.typeHints[typeKey1];
    if (hints.typeHints?.[typeKey2]) return hints.typeHints[typeKey2];

    const almostRecipe = this.findAlmostMatchingRecipe(item1, item2);
    if (almostRecipe && hints.almostThere?.length) {
      return hints.almostThere[Math.floor(Math.random() * hints.almostThere.length)];
    }

    if (hints.general?.length) {
      return hints.general[Math.floor(Math.random() * hints.general.length)];
    }
    return TIPS.failedCombine || '它们合不到一起…';
  }

  findAlmostMatchingRecipe(item1, item2) {
    return this.recipes.find((r) => {
      if (r.ingredients.length !== 2) return false;
      return r.ingredients.includes(item1) || r.ingredients.includes(item2);
    });
  }

  checkDoorTrigger(itemName, levelData) {
    if (!levelData?.doorTriggers) return null;
    for (const [stage, triggers] of Object.entries(levelData.doorTriggers)) {
      if (triggers.includes(itemName)) return stage;
    }
    return null;
  }
}

module.exports = new SynthesisEngine();
