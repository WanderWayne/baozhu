import { RecipeEngine } from '../core/RecipeEngine';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

export function runRecipeEngineSpec(): void {
  const engine = new RecipeEngine([
    { ingredients: ['牛奶', '冰糖碎'], result: '甜牛奶' },
    { ingredients: ['发酵', '牛奶'], result: '酸奶' },
  ]);

  const r1 = engine.synthesize(['冰糖碎', '牛奶']);
  assert(r1.success && r1.resultItem === '甜牛奶', 'recipe order-insensitive match failed');

  const r2 = engine.synthesize(['牛奶', '滤布']);
  assert(!r2.success, 'invalid recipe should fail');
}

