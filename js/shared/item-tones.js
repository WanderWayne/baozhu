/** @feature items-icons @see docs/features/items-icons.md */
(function (root) {
  const CHEESE_TONE = new Set([
    '奶酪', '雪酪', '双酪', '浓酪底', '双酪底', '酸奶', '甜酸奶', '霜酪',
    '桂香奶酪', '桂花雪酪', '桂花酪底', '玫瑰酪底', '双酪玫瑰',
    '果味酪底', '草莓芭乐底', '柚子酪底', '清爽柚子底',
    '芝士奶底', '芝士茶底', '酒焖奶酪', '酒酿奶酪', '酒酿雪酪',
    '塌雪酪', '冰奶酪', '冰霜雪酪',
  ]);
  const WINE_TONE = new Set([
    '酒酿', '米酒', '黑米露', '小米黄酒',
    '桂花酒酿', '玫瑰酒酿', '菊花酒酿', '茉莉酒酿',
    '酿香奶底', '冰酿奶', '奶酒', '高度奶酒', '酵奶酒', '滥酵奶酒',
    '酒酿酸奶', '酒酿桂花酪',
    '桂花浊酿', '玫瑰浊酿', '菊花浊酿', '茉莉浊酿',
    '冰酒酿', '冰米酒',
  ]);
  root.getGameItemCardTone = function getGameItemCardTone(itemName) {
    if (CHEESE_TONE.has(itemName)) return 'cheese';
    if (WINE_TONE.has(itemName)) return 'wine';
    return '';
  };
}(typeof window !== 'undefined' ? window : globalThis));
