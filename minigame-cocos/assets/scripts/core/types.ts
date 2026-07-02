export interface TaskRuleDiscoveredItems {
  kind: 'discoveredItemsAtLeast';
  threshold: number;
}

export interface TaskRuleCompleteAllLevels {
  kind: 'completeAllLevels';
  levelIds: number[];
}

export interface TaskRuleCustom {
  kind: 'custom';
}

export type TaskRule = TaskRuleDiscoveredItems | TaskRuleCompleteAllLevels | TaskRuleCustom;

export interface TaskConfig {
  id: string;
  name: string;
  description: string;
  rewardLabel: string;
  gems: number;
  rule: TaskRule;
}

export interface ProgressState {
  unlockedWorlds: number[];
  unlockedLevels: number[];
  completedLevels: number[];
  discoveredItems: string[];
  fragments: string[];
  achievements: string[];
  gems: number;
  discoveredRecipes: Record<string, string[]>;
  atlasPieces: string[];
  chapterPhaseSettlementSeen: boolean;
}

export interface SynthesizeResult {
  success: boolean;
  resultItem?: string;
  reason?: string;
}

export interface Recipe {
  ingredients: string[];
  result: string;
}

