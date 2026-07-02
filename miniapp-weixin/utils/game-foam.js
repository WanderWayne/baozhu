/** 物品栏 bubble-pop 泡沫粒子 — 对齐 H5 createFoamParticles */

let foamUid = 0;

function createFoamBurst(centerX, centerY, count = 8) {
  const particles = [];
  const n = count || 8;
  for (let i = 0; i < n; i += 1) {
    const angle = (Math.PI * 2 * i) / n + (Math.random() - 0.5) * 0.6;
    const distance = 35 + Math.random() * 50;
    const isLarge = Math.random() > 0.7;
    particles.push({
      id: `foam_${++foamUid}_${Date.now()}_${i}`,
      left: centerX,
      top: centerY,
      fx: Math.cos(angle) * distance,
      fy: Math.sin(angle) * distance,
      size: isLarge ? 10 + Math.random() * 6 : 5 + Math.random() * 5,
      large: isLarge,
      delay: Math.random() * 0.12,
    });
  }
  return particles;
}

function appendFoam(page, particles) {
  if (!particles.length) return;
  const existing = page.data.foamParticles || [];
  page.setData({ foamParticles: existing.concat(particles) });
  const ids = new Set(particles.map((p) => p.id));
  setTimeout(() => {
    const next = (page.data.foamParticles || []).filter((p) => !ids.has(p.id));
    if (next.length !== (page.data.foamParticles || []).length) {
      page.setData({ foamParticles: next });
    }
  }, 2300);
}

module.exports = {
  createFoamBurst,
  appendFoam,
};
