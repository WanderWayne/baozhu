/** 等待一帧后再挂动画 class（对齐 H5 requestAnimationFrame） */
function frameDelay(ms = 32) {
  return new Promise((resolve) => {
    wx.nextTick(() => setTimeout(resolve, ms));
  });
}

module.exports = { frameDelay };
