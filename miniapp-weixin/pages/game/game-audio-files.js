/** 游戏分包专用音效 — 仅 game 页 require，避免主包引用分包音频 */
const GAME_AUDIO_BASE = '/pages/game/audio/';

module.exports = {
  'bgm-game': `${GAME_AUDIO_BASE}SFX1 BGM game.mp3`,

  'click-dot': `${GAME_AUDIO_BASE}SFX5 click first-white-dot.mp3`,

  'wave': `${GAME_AUDIO_BASE}SFX10 Wave.mp3`,
  'hum': `${GAME_AUDIO_BASE}SFX13 hum.mp3`,

  'craft-target': `${GAME_AUDIO_BASE}SFX41 success.mp3`,
  'craft-normal': `${GAME_AUDIO_BASE}SFX15 levelup.mp3`,
  'craft-fragment': `${GAME_AUDIO_BASE}SFX20 success craft.mp3`,
  'drop': `${GAME_AUDIO_BASE}SFX17 pop-low.mp3`,
  'pickup': `${GAME_AUDIO_BASE}SFX18 pop.mp3`,
  'text-appear': `${GAME_AUDIO_BASE}SFX21 text appear.mp3`,
  'door-absorb': `${GAME_AUDIO_BASE}SFX22 transition-soft-long.mp3`,

  'inventory-slot-pop': `${GAME_AUDIO_BASE}SFX37 bubblepoph.mp3`,
  'task-milestone': `${GAME_AUDIO_BASE}SFX27 reminder.mp3`,
  'gem-earn': `${GAME_AUDIO_BASE}SFX40 moneymuch.mp3`,
  'settlement-phase-complete': `${GAME_AUDIO_BASE}SFX33 complete.mp3`,
  'recipe-book': `${GAME_AUDIO_BASE}SFX30 page.mp3`,
  'recipe-tab': `${GAME_AUDIO_BASE}SFX28 wooden_click.mp3`,
  'trade': `${GAME_AUDIO_BASE}SFX26 trade.mp3`,
  'timer-tick': `${GAME_AUDIO_BASE}SFX8 clock-ticking-365218.mp3`,
};
