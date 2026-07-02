/** 对齐 H5 game-core.js createMilkFogParticles / initBgDecor（简化版） */

const GRASS_COLORS = [
  '#7A9A3A', '#8DAA45', '#6B8C30', '#A0AD50',
  '#B5A855', '#C4B060', '#A89840', '#8B7D30',
];

function rand(lo, hi) {
  return lo + Math.random() * (hi - lo);
}

function randi(lo, hi) {
  return Math.floor(rand(lo, hi));
}

function createMilkFogParticles() {
  const count = 2 + Math.floor(Math.random() * 4);
  const particles = [];
  for (let i = 0; i < count; i += 1) {
    const size = rand(50, 120);
    const side = Math.random() > 0.5;
    particles.push({
      id: `fog-${i}-${Date.now()}`,
      size: Math.round(size),
      left: side ? rand(2, 17) : rand(83, 98),
      top: rand(15, 85),
      duration: rand(8, 14),
      delay: rand(-14, 0),
    });
  }
  return particles;
}

function createGrassClumps() {
  const clumps = [];
  const cols = 3;
  const rows = 4;
  const cellW = 100 / cols;
  const cellH = 100 / rows;
  const jitter = 0.25;
  let id = 0;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (Math.random() < 0.35) continue;
      const centerX = (col + 0.5) * cellW;
      const centerY = (row + 0.5) * cellH;
      const blades = 3 + randi(0, 3);
      const bladeList = [];
      for (let b = 0; b < blades; b += 1) {
        bladeList.push({
          h: Math.round(rand(9, 17)),
          w: Math.round(rand(2, 3)),
          angle: Math.round(rand(-30, 30)),
          offset: Math.round(b * rand(2, 4) - (blades - 1) * 1.5),
          color: GRASS_COLORS[randi(0, GRASS_COLORS.length)],
          sway: Math.round(rand(4, 10)),
          duration: rand(3, 6),
          delay: rand(-6, 0),
        });
      }
      clumps.push({
        id: `grass-${id += 1}`,
        left: centerX + rand(-cellW * jitter, cellW * jitter),
        top: centerY + rand(-cellH * jitter, cellH * jitter),
        opacity: rand(0.35, 0.55),
        blades: bladeList,
      });
    }
  }
  return clumps;
}

function createDustParticle() {
  return {
    id: `dust-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    left: rand(0, 100),
    top: rand(5, 95),
    size: rand(2, 5),
    dx: Math.round(rand(50, 150)),
    dy: Math.round(rand(-60, -20)),
    duration: rand(4, 8),
  };
}

module.exports = {
  createMilkFogParticles,
  createGrassClumps,
  createDustParticle,
};
