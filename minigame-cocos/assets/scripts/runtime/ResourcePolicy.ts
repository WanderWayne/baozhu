export interface BundlePolicy {
  critical: string[];
  chapter1: string[];
  codex: string[];
  gallery: string[];
  audio: string[];
}

export const resourcePolicy: BundlePolicy = {
  critical: [
    'config/game-config',
    'ui/common/button',
    'ui/common/panel',
  ],
  chapter1: [
    'chapter1/scene',
    'chapter1/items',
    'chapter1/effects',
  ],
  codex: [
    'codex/scene',
    'codex/icons',
  ],
  gallery: [
    'gallery/scene',
    'gallery/fragments',
  ],
  audio: [
    'audio/bgm_menu',
    'audio/sfx_click',
    'audio/sfx_success',
  ],
};

