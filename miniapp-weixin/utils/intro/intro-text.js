const { BAOZHU_TITLE_CONFIG } = require('../main-particles');

const STORY_SEQUENCE = [
  { text: '亲爱的酿造师，\n你对这个世界好像全然不知。', delay: 800, duration: 5500 },
  { text: '十三年前，\n一位酿造师在田子坊的小巷里\n点燃了第一盏灯，\n开始了酿造的旅程。', delay: 600, duration: 6500 },
  { text: '十三年后，\n这些配方被时间打碎成了记忆碎片，\n散落在酿造宇宙的各个角落。', delay: 600, duration: 6500 },
  { text: '你的任务：\n找回这些碎片，\n重建完整的"宝珠配方图谱"。', delay: 600, duration: 6500, isGoal: true },
  { text: '当最后一块碎片归位，\n传说中的"天赐宝珠酪"\n将再次被唤醒。', delay: 600, duration: 7000, isGoal: true },
];

module.exports = function attachIntroText(IntroSystem) {
  IntroSystem.prototype.loadTextDots = function loadTextDots() {
    const dotMatrices = {
      宝: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 2, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
        [0, 1, 0, 0, 0, 0, 0, 0, 1, 0],
        [0, 0, 2, 2, 2, 2, 2, 0, 0, 0],
        [0, 0, 0, 0, 2, 0, 0, 0, 0, 0],
        [0, 0, 2, 2, 2, 2, 2, 0, 0, 0],
        [0, 0, 0, 0, 2, 0, 0, 0, 0, 0],
        [0, 2, 2, 2, 2, 2, 2, 2, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ],
      珠: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 1, 0, 0],
        [4, 4, 4, 0, 1, 0, 1, 0, 0],
        [0, 4, 0, 0, 1, 1, 1, 1, 0],
        [4, 4, 4, 0, 0, 0, 1, 0, 0],
        [0, 4, 0, 0, 1, 1, 1, 1, 1],
        [4, 4, 4, 0, 0, 3, 1, 0, 0],
        [0, 0, 0, 4, 1, 0, 1, 1, 1],
        [0, 0, 0, 0, 0, 0, 1, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
      ],
      奶: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 3, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 3, 0, 3, 2, 2, 2, 2, 0, 0],
        [3, 3, 3, 3, 3, 2, 0, 2, 0, 0],
        [0, 3, 0, 3, 0, 2, 0, 2, 2, 0],
        [0, 3, 0, 3, 0, 2, 0, 0, 2, 0],
        [0, 3, 0, 3, 0, 2, 0, 0, 2, 0],
        [0, 3, 3, 3, 3, 2, 0, 0, 2, 0],
        [0, 0, 0, 3, 0, 0, 0, 2, 2, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ],
      酪: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 1, 1, 0, 2, 0, 0, 0],
        [0, 0, 1, 0, 1, 0, 0, 1, 1, 0, 0],
        [0, 1, 1, 1, 1, 1, 2, 3, 4, -2, 0],
        [0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 0],
        [0, 1, 1, 0, 1, 1, 2, 2, 0, 1, 1],
        [0, 1, 3, 3, 3, 1, 0, 3, 3, 3, 0],
        [0, 1, 0, 0, 0, 1, 0, 3, 0, 3, 0],
        [0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 0],
      ],
    };
    this.generateDotsFromMatrices(dotMatrices);
  };

  IntroSystem.prototype.generateDotsFromMatrices = function generateDotsFromMatrices(matrices) {
    const chars = ['宝', '珠', '奶', '酪'];
    const titleCfg = BAOZHU_TITLE_CONFIG;
    const dotSize = this.isSmallScreen ? titleCfg.dotSize.small : titleCfg.dotSize.normal;
    const charGap = this.isSmallScreen ? titleCfg.charGap.small : titleCfg.charGap.normal;
    const gridSize = 10;
    const charWidth = gridSize * dotSize;
    const charHeight = gridSize * dotSize;
    const totalWidth = 2 * charWidth + charGap;
    const totalHeight = 2 * charHeight + charGap;
    const startX = this.centerX - totalWidth / 2;
    const displayCenterY = this.logicalHeight * titleCfg.mainTitleCenterYRatio;
    const startY = displayCenterY - totalHeight / 2;

    this.textDotTargets = [];

    chars.forEach((char, index) => {
      const matrix = matrices[char];
      if (!matrix) return;
      const rowIdx = Math.floor(index / 2);
      const colIdx = index % 2;
      const charOffsetX = startX + colIdx * (charWidth + charGap);
      const charOffsetY = startY + rowIdx * (charHeight + charGap);

      for (let row = 0; row < matrix.length; row += 1) {
        for (let col = 0; col < matrix[row].length; col += 1) {
          const val = matrix[row][col];
          if (val === 0) continue;
          let x = charOffsetX + col * dotSize;
          let y = charOffsetY + row * dotSize;
          if (val === 2) x += dotSize / 2;
          else if (val === 3) y += dotSize / 2;
          else if (val === 4) { x += dotSize / 2; y += dotSize / 2; }
          this.textDotTargets.push({ x, y });
        }
      }
    });
  };

  IntroSystem.prototype.getStorySequence = function getStorySequence() {
    return STORY_SEQUENCE;
  };
};
