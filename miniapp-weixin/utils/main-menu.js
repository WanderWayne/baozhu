/** @feature main-menu @see docs/features/main-menu.md */
const INTRO_KEY = 'hasPlayedIntro_v5';

const TUTORIAL_KEYS = [
  'baozhu_tutorial_seen',
  'tut_tradeStation',
  'tut_recipeBook',
  'tut_longPress',
  'tut_recipeBookBtn',
  'tut_level2_complete',
  'tut_guide_to_tasks',
  'tut_guide_to_tasks_main',
  'tut_guide_to_tasks_on_main',
  'tut_first_exit_game',
  'tut_main_guide_done',
  'tut_guide_tasks_on_main',
  'tut_guide_claim_reward',
  'baozhu_claimed_tasks',
  'baozhu_basic_completed',
];

function resetTutorialStorage() {
  TUTORIAL_KEYS.forEach((key) => {
    try { wx.removeStorageSync(key); } catch (err) { /* ignore */ }
  });
  try { wx.removeStorageSync(INTRO_KEY); } catch (err) { /* ignore */ }
}

module.exports = {
  INTRO_KEY,
  TUTORIAL_KEYS,
  resetTutorialStorage,
};
