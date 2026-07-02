// 主线任务定义（主菜单与关卡内共用）
// ================================================

const BAOZHU_TASKS = [
    {
        id: 'first_synthesis',
        name: '初次合成',
        description: '完成第一次物品合成',
        check: () => {
            const items = window.LevelManager.currentProgress.discoveredItems || [];
            return { current: Math.min(items.length, 1), total: 1 };
        },
        reward: '💎 30',
        gems: 30
    },
    {
        id: 'complete_first5',
        name: '崭露头角',
        description: '完成前五关',
        check: () => {
            const completed = window.LevelManager.currentProgress.completedLevels || [];
            const first5 = [101, 102, 103, 104, 105];
            const done = first5.filter(id => completed.includes(id)).length;
            return { current: done, total: 5 };
        },
        reward: '💎 150',
        gems: 150
    },
    {
        id: 'complete_boss',
        name: '经典之作',
        description: '酿出冰酒酿桂花酪',
        check: () => {
            const completed = window.LevelManager.currentProgress.completedLevels || [];
            const done = completed.includes(106) ? 1 : 0;
            return { current: done, total: 1 };
        },
        reward: '💎 300',
        gems: 300
    },
    {
        id: 'complete_chapter1',
        name: '酪之初启',
        description: '完成奶酪谷全部 6 关',
        check: () => {
            const completed = window.LevelManager.currentProgress.completedLevels || [];
            const chapter1 = [101, 102, 103, 104, 105, 106];
            const done = chapter1.filter(id => completed.includes(id)).length;
            return { current: done, total: 6 };
        },
        reward: '💎 200',
        gems: 200
    },
    {
        id: 'discover_10',
        name: '见多识广',
        description: '发现 10 种物品',
        check: () => {
            const items = window.LevelManager.currentProgress.discoveredItems || [];
            return { current: Math.min(items.length, 10), total: 10 };
        },
        reward: '💎 100',
        gems: 100
    },
    {
        id: 'discover_20',
        name: '酿造百科',
        description: '发现 20 种物品',
        check: () => {
            const items = window.LevelManager.currentProgress.discoveredItems || [];
            return { current: Math.min(items.length, 20), total: 20 };
        },
        reward: '💎 250',
        gems: 250
    }
];

/** @returns {Record<string, boolean>} */
function getBaozhuTaskDoneMap() {
    const map = {};
    if (!window.LevelManager || !BAOZHU_TASKS.length) return map;
    BAOZHU_TASKS.forEach(t => {
        const { current, total } = t.check();
        map[t.id] = current >= total;
    });
    return map;
}

window.BAOZHU_TASKS = BAOZHU_TASKS;
window.getBaozhuTaskDoneMap = getBaozhuTaskDoneMap;
