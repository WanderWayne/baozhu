import { Recipe, SynthesizeResult } from './types';

function keyOf(ingredients: string[]): string {
  return [...ingredients].sort().join('|');
}

export class RecipeEngine {
  private index: Map<string, Recipe> = new Map();

  constructor(recipes: Recipe[]) {
    recipes.forEach((recipe) => {
      this.index.set(keyOf(recipe.ingredients), recipe);
    });
  }

  synthesize(items: string[]): SynthesizeResult {
    if (!items.length) {
      return { success: false, reason: 'EMPTY_INPUT' };
    }
    const k = keyOf(items);
    const recipe = this.index.get(k);
    if (!recipe) {
      return { success: false, reason: 'NO_RECIPE' };
    }
    return { success: true, resultItem: recipe.result };
  }

  canSynthesize(items: string[]): boolean {
    return this.index.has(keyOf(items));
  }
}

