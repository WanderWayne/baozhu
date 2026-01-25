// 开场序列系统 - 点阵文字模块
// ================================================

// 手动定义点阵数据 - "宝珠奶酪" 四个字
IntroSystem.prototype.loadTextDots = function() {
    // 每个字 10x10 点阵，0=无点，1=有点
    // 值的含义：
    // 0 = 空
    // 1 = 标准点
    // 2 = 向右偏移半格
    // 3 = 向下偏移半格
    // 4 = 向右下偏移半格
    const dotMatrices = {
        '宝': [
            [0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,2,0,0,0,0,0],
            [0,1,1,1,1,1,1,1,1,0],
            [0,1,0,0,0,0,0,0,1,0],
            [0,0,2,2,2,2,2,0,0,0],
            [0,0,0,0,2,0,0,0,0,0],
            [0,0,2,2,2,2,2,0,0,0],
            [0,0,0,0,2,0,0,0,0,0],
            [0,2,2,2,2,2,2,2,0,0],
            [0,0,0,0,0,0,0,0,0,0],
            
        ],
        '珠': [
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,1,0,0],
            [4,4,4,0,1,0,1,0,0],
            [0,4,0,0,1,1,1,1,0],
            [4,4,4,0,0,0,1,0,0],
            [0,4,0,0,1,1,1,1,1],
            [4,4,4,0,0,3,1,0,0],
            [0,0,0,4,1,0,1,1,1],
            [0,0,0,0,0,0,1,0,0],
            [0,0,0,0,0,0,0,0,0],
            
        ],
        '奶': [
            [0,0,0,0,0,0,0,0,0,0],
            [0,3,0,0,0,0,0,0,0,0],
            [0,3,0,3,2,2,2,2,0,0],
            [3,3,3,3,3,2,0,2,0,0],
            [0,3,0,3,0,2,0,2,2,0],
            [0,3,0,3,0,2,0,0,2,0],
            [0,3,0,3,0,2,0,0,2,0],
            [0,3,3,3,3,2,0,0,2,0],
            [0,0,0,3,0,0,0,2,2,0],
            [0,0,0,0,0,0,0,0,0,0],
            
        ],
        '酪': [
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0,0,0],
            [0,1,1,1,1,1,0,2,0,0,0],
            [0,0,1,0,1,0,0,1,1,0,0],
            [0,1,1,1,1,1,2,3,4,-2,0],
            [0,1,0,1,0,1,0,0,1,0,0],
            [0,1,1,0,1,1,2,2,0,1,1],
            [0,1,3,3,3,1,0,3,3,3,0],
            [0,1,0,0,0,1,0,3,0,3,0],
            [0,0,0,0,0,0,0,3,3,3,0],
            
        ],
    };
    
    this.generateDotsFromMatrices(dotMatrices);
};

IntroSystem.prototype.generateDotsFromMatrices = function(matrices) {
    const chars = ['宝', '珠', '奶', '酪'];
    const dotSize = this.isSmallScreen ? 8 : 12;      // 每个点的间距（小屏更小）
    const charGap = this.isSmallScreen ? 15 : 30;     // 字之间的间隔
    const gridSize = 10;     // 点阵网格大小
    
    const charWidth = gridSize * dotSize;
    const charHeight = gridSize * dotSize;
    
    // 2x2 排列的起始位置
    const totalWidth = 2 * charWidth + charGap;
    const totalHeight = 2 * charHeight + charGap;
    const startX = this.centerX - totalWidth / 2;
    // 注意：startY 已经是考虑了 displayCenterY 的偏移，这里先计算相对中心
    const startY = this.centerY - totalHeight / 2;
    
    this.textDotTargets = [];
    
    chars.forEach((char, index) => {
        const matrix = matrices[char];
        if (!matrix) return;
        
        // 计算 2x2 的行列
        const rowIdx = Math.floor(index / 2);
        const colIdx = index % 2;
        
        const charOffsetX = startX + colIdx * (charWidth + charGap);
        const charOffsetY = startY + rowIdx * (charHeight + charGap);
        
        for (let row = 0; row < matrix.length; row++) {
            for (let col = 0; col < matrix[row].length; col++) {
                const val = matrix[row][col];
                if (val === 0) continue;
                
                let x = charOffsetX + col * dotSize;
                let y = charOffsetY + row * dotSize;
                
                // 特殊偏移值处理（可选，用于微调）
                if (val === 2) x += dotSize / 2;       // 向右偏移半格
                else if (val === 3) y += dotSize / 2;  // 向下偏移半格
                else if (val === 4) { x += dotSize / 2; y += dotSize / 2; } // 向右下偏移
                
                this.textDotTargets.push({ x, y });
            }
        }
    });
    
    console.log(`点阵生成了 ${this.textDotTargets.length} 个目标点`);
};
