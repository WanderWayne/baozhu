// ========================================
// 宝珠图谱 · 三层同心花瓣（参考莲花：外瓣→中瓣→内瓣→花心）
// viewBox 0 0 100 100；中方框衬底由 CSS 控制。
// 可交互碎片仅在中圈 ATLAS_PETAL_PATHS；内圈与外圈为舆图景深的装饰瓣。
// ========================================

const ATLAS_OUTER_SLOT_COUNT = 8;

const ATLAS_VISUAL = {
    frameStroke: '#9a8578',
    frameStrokeMuted: 'rgba(154, 133, 120, 0.55)',
    paperTint: 'rgba(255, 253, 247, 0.92)',
    outlineMuted: 'rgba(154, 133, 120, 0.35)',
    outlineStrong: 'rgba(154, 133, 120, 0.55)',
    fillUnlocked: 'rgba(232, 200, 115, 0.42)',
    fillUnlockedStroke: 'rgba(212, 180, 95, 0.85)',
    centerLetterFill: '#9a8578',
};

/** 内圈：6 瓣，贴近花心，营造叠瓣层次（无收集逻辑） */
const ATLAS_INNER_PETALS = [
    'M 58.32 37.76 Q 62.90 33.28 73.82 36.25 Q 70.93 47.19 64.76 48.92 A 14.8 14.8 0 0 0 58.32 37.76 Z',
    'M 64.76 51.08 Q 70.93 52.81 73.82 63.75 Q 62.90 66.72 58.32 62.24 A 14.8 14.8 0 0 0 64.76 51.08 Z',
    'M 56.44 63.32 Q 58.04 69.53 50.00 77.50 Q 41.96 69.53 43.56 63.32 A 14.8 14.8 0 0 0 56.44 63.32 Z',
    'M 41.68 62.24 Q 37.10 66.72 26.18 63.75 Q 29.07 52.81 35.24 51.08 A 14.8 14.8 0 0 0 41.68 62.24 Z',
    'M 35.24 48.92 Q 29.07 47.19 26.18 36.25 Q 37.10 33.28 41.68 37.76 A 14.8 14.8 0 0 0 35.24 48.92 Z',
    'M 43.56 36.68 Q 41.96 30.47 50.00 22.50 Q 58.04 30.47 56.44 36.68 A 14.8 14.8 0 0 0 43.56 36.68 Z',
];

/** 中圈：8 瓣 —— 与章节碎片一一对应（旋转半齿与内外瓣错开） */
const ATLAS_PETAL_PATHS = [
    'M 61.47 26.11 Q 66.68 20.01 80.76 19.24 Q 79.99 33.32 73.89 38.53 A 26.5 26.5 0 0 0 61.47 26.11 Z',
    'M 75.00 41.22 Q 83.00 40.59 93.50 50.00 Q 83.00 59.41 75.00 58.78 A 26.5 26.5 0 0 0 75.00 41.22 Z',
    'M 73.89 61.47 Q 79.99 66.68 80.76 80.76 Q 66.68 79.99 61.47 73.89 A 26.5 26.5 0 0 0 73.89 61.47 Z',
    'M 58.78 75.00 Q 59.41 83.00 50.00 93.50 Q 40.59 83.00 41.22 75.00 A 26.5 26.5 0 0 0 58.78 75.00 Z',
    'M 38.53 73.89 Q 33.32 79.99 19.24 80.76 Q 20.01 66.68 26.11 61.47 A 26.5 26.5 0 0 0 38.53 73.89 Z',
    'M 25.00 58.78 Q 17.00 59.41 6.50 50.00 Q 17.00 40.59 25.00 41.22 A 26.5 26.5 0 0 0 25.00 58.78 Z',
    'M 26.11 38.53 Q 20.01 33.32 19.24 19.24 Q 33.32 20.01 38.53 26.11 A 26.5 26.5 0 0 0 26.11 38.53 Z',
    'M 41.22 25.00 Q 40.59 17.00 50.00 6.50 Q 59.41 17.00 58.78 25.00 A 26.5 26.5 0 0 0 41.22 25.00 Z',
];

/** 外圈：12 瓣大块轮廓，舆图最外缘（无收集逻辑，收于 viewBox 内） */
const ATLAS_OUTER_PETALS = [
    'M 62.32 10.69 Q 64.28 11.33 73.90 8.60 Q 76.35 18.30 77.89 19.67 A 41.2 41.2 0 0 0 62.32 10.69 Z',
    'M 80.33 22.11 Q 81.70 23.65 91.40 26.10 Q 88.67 35.72 89.31 37.68 A 41.2 41.2 0 0 0 80.33 22.11 Z',
    'M 90.21 41.01 Q 90.63 43.03 97.80 50.00 Q 90.63 56.97 90.21 58.99 A 41.2 41.2 0 0 0 90.21 41.01 Z',
    'M 89.31 62.32 Q 88.67 64.28 91.40 73.90 Q 81.70 76.35 80.33 77.89 A 41.2 41.2 0 0 0 89.31 62.32 Z',
    'M 77.89 80.33 Q 76.35 81.70 73.90 91.40 Q 64.28 88.67 62.32 89.31 A 41.2 41.2 0 0 0 77.89 80.33 Z',
    'M 58.99 90.21 Q 56.97 90.63 50.00 97.80 Q 43.03 90.63 41.01 90.21 A 41.2 41.2 0 0 0 58.99 90.21 Z',
    'M 37.68 89.31 Q 35.72 88.67 26.10 91.40 Q 23.65 81.70 22.11 80.33 A 41.2 41.2 0 0 0 37.68 89.31 Z',
    'M 19.67 77.89 Q 18.30 76.35 8.60 73.90 Q 11.33 64.28 10.69 62.32 A 41.2 41.2 0 0 0 19.67 77.89 Z',
    'M 9.79 58.99 Q 9.37 56.97 2.20 50.00 Q 9.37 43.03 9.79 41.01 A 41.2 41.2 0 0 0 9.79 58.99 Z',
    'M 10.69 37.68 Q 11.33 35.72 8.60 26.10 Q 18.30 23.65 19.67 22.11 A 41.2 41.2 0 0 0 10.69 37.68 Z',
    'M 22.11 19.67 Q 23.65 18.30 26.10 8.60 Q 35.72 11.33 37.68 10.69 A 41.2 41.2 0 0 0 22.11 19.67 Z',
    'M 41.01 9.79 Q 43.03 9.37 50.00 2.20 Q 56.97 9.37 58.99 9.79 A 41.2 41.2 0 0 0 41.01 9.79 Z',
];

const ATLAS_WEDGE_PATHS = ATLAS_PETAL_PATHS;

const ATLAS_SLOTS = [
    { id: 'ch1_main', kind: 'main', chapterId: 1, label: '酪之初启', wedgeIndex: 0, pathD: ATLAS_PETAL_PATHS[0] },
    { id: 'ch1_secret', kind: 'secret', chapterId: 1, label: '手札之隙', wedgeIndex: 1, pathD: ATLAS_PETAL_PATHS[1] },
    { id: 'reserved_slot_2', kind: 'reserved', chapterId: null, label: '未启程', wedgeIndex: 2, pathD: ATLAS_PETAL_PATHS[2] },
    { id: 'reserved_slot_3', kind: 'reserved', chapterId: null, label: '未启程', wedgeIndex: 3, pathD: ATLAS_PETAL_PATHS[3] },
    { id: 'reserved_slot_4', kind: 'reserved', chapterId: null, label: '未启程', wedgeIndex: 4, pathD: ATLAS_PETAL_PATHS[4] },
    { id: 'reserved_slot_5', kind: 'reserved', chapterId: null, label: '未启程', wedgeIndex: 5, pathD: ATLAS_PETAL_PATHS[5] },
    { id: 'reserved_slot_6', kind: 'reserved', chapterId: null, label: '未启程', wedgeIndex: 6, pathD: ATLAS_PETAL_PATHS[6] },
    { id: 'reserved_slot_7', kind: 'reserved', chapterId: null, label: '未启程', wedgeIndex: 7, pathD: ATLAS_PETAL_PATHS[7] },
];

const ATLAS_CENTER_SLOT = {
    id: 'center',
    kind: 'center',
    chapterId: null,
    label: '宝珠图谱',
    cx: 50,
    cy: 50,
    r: 13.5,
};

function getAtlasCountableSlots() {
    return [...ATLAS_SLOTS.filter(s => s.kind !== 'reserved'), ATLAS_CENTER_SLOT];
}

function getAtlasProgressCounts(unlockedIds) {
    const ids = new Set(unlockedIds || []);
    const countable = getAtlasCountableSlots();
    const total = countable.length;
    let unlocked = 0;
    countable.forEach(s => {
        if (ids.has(s.id)) unlocked++;
    });
    return { unlocked, total };
}

function getAtlasSlotById(slotId) {
    if (slotId === ATLAS_CENTER_SLOT.id) return ATLAS_CENTER_SLOT;
    return ATLAS_SLOTS.find(s => s.id === slotId) || null;
}

window.ATLAS_OUTER_SLOT_COUNT = ATLAS_OUTER_SLOT_COUNT;
window.ATLAS_VISUAL = ATLAS_VISUAL;
window.ATLAS_INNER_PETALS = ATLAS_INNER_PETALS;
window.ATLAS_OUTER_PETALS = ATLAS_OUTER_PETALS;
window.ATLAS_PETAL_PATHS = ATLAS_PETAL_PATHS;
window.ATLAS_WEDGE_PATHS = ATLAS_WEDGE_PATHS;
window.ATLAS_SLOTS = ATLAS_SLOTS;
window.ATLAS_CENTER_SLOT = ATLAS_CENTER_SLOT;
window.getAtlasCountableSlots = getAtlasCountableSlots;
window.getAtlasProgressCounts = getAtlasProgressCounts;
window.getAtlasSlotById = getAtlasSlotById;
