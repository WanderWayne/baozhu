const { ITEMS, RECIPES } = require('../../../data/items.js');
const { getItemMeta } = require('../../../utils/game-item-style');

const RECORDED_RECIPES = [
  { name: '奶酪', icon: '🧀', formula: '牛奶 + 发酵 → 酸奶；酸奶 + 滤布', note: '滤去乳清凝酪', category: 'ingredient' },
  { name: '甜牛奶', icon: '🥛', formula: '牛奶 + 冰糖碎', note: '甜蜜的开始', category: 'ingredient' },
  { name: '雪酪', icon: '🍨', formula: '甜牛奶 + 发酵 → 甜酸奶；甜酸奶 + 滤布', note: '轻盈滤酪', category: 'ingredient' },
  {
    name: '双酪',
    icon: '🍨',
    formula: '奶酪 + 雪酪',
    note: '厚与轻，一体两面',
    category: 'ingredient',
    lockedFormula: '失去了配方，好像跟它的名字有关系',
    skipWriteRecipe: true,
  },
  { name: '玫瑰酒酿', icon: '🌹', formula: '玫瑰 + 酒酿原浆', note: '花香融入酒酿', category: 'ingredient' },
  { name: '桂花酒酿', icon: '🌼', formula: '桂花 + 酒酿原浆', note: '秋天最温柔的香气', category: 'ingredient' },
  { name: '酒酿玫瑰酪', icon: '🌹', formula: '双酪 + 玫瑰酒酿', note: '双酪为底，玫瑰酒酿为魂', category: 'beverage' },
  { name: '酒酿桂花酪', icon: '🌼', formula: '双酪 + 桂花酒酿', note: '双酪与桂花酒酿的醇香融合', category: 'beverage' },
  { name: '冰酒酿桂花酪', icon: '🧊', formula: '酒酿桂花酪 + 冰块', note: '宝珠经典之作', category: 'beverage' },
];

function formulaDisplay(formula) {
  if (!formula || typeof formula !== 'string') return formula || '';
  const parts = formula.split(/[；;]/).map((s) => s.trim()).filter(Boolean);
  return parts.length > 1 ? parts[parts.length - 1] : formula.trim();
}

function buildRecipeBookList(query, discoveredItems) {
  const q = (query || '').trim().toLowerCase();
  const discovered = new Set(discoveredItems || []);
  const recordedNames = new Set(RECORDED_RECIPES.map((r) => r.name));

  let entries = RECORDED_RECIPES.map((r) => {
    const isLocked = !!(r.lockedFormula && !discovered.has(r.name));
    const formula = isLocked ? (r.lockedFormula || '') : r.formula;
    const meta = getItemMeta(r.name);
    return {
      icon: meta.icon || r.icon,
      name: r.name,
      formula: formulaDisplay(formula),
      dualCheeseHint: isLocked && r.name === '双酪',
    };
  });

  (discoveredItems || []).forEach((itemName) => {
    const itemData = ITEMS[itemName];
    if (!itemData) return;
    if (itemData.type === 'base' || itemData.type === 'tool' || itemData.type === 'process') return;
    if (itemData.isRecipeBook) return;
    if (recordedNames.has(itemName)) return;

    const recipe = RECIPES.find((r) => r.result === itemName);
    const formula = recipe ? recipe.ingredients.join(' + ') : '未知来源';
    const meta = getItemMeta(itemName);
    entries.push({
      icon: meta.icon || itemData.icon || '?',
      name: itemName,
      formula: formulaDisplay(formula),
      dualCheeseHint: false,
    });
  });

  if (q) {
    entries = entries.filter((e) => (
      e.name.toLowerCase().includes(q) || e.formula.toLowerCase().includes(q)
    ));
  }

  if (!entries.length) {
    return {
      emptyText: q ? '没有找到匹配的配方' : '暂无配方',
      sections: [],
    };
  }

  return { emptyText: '', sections: [{ label: '', entries }] };
}

function getRecipeBookPageData(query, discoveredItems) {
  const list = buildRecipeBookList(query, discoveredItems);
  return {
    recipeBookSearch: query || '',
    recipeBookSections: list.sections,
    recipeBookEmptyText: list.emptyText,
  };
}

module.exports = {
  RECORDED_RECIPES,
  formulaDisplay,
  buildRecipeBookList,
  getRecipeBookPageData,
};
