function navigateWithFade(url, method = 'navigateTo') {
  return new Promise((resolve) => {
    setTimeout(() => {
      wx[method]({
        url,
        complete: resolve,
      });
    }, 280);
  });
}

function navigateBackWithFade(fallbackUrl) {
  setTimeout(() => {
    wx.navigateBack({
      fail: () => {
        if (fallbackUrl) {
          wx.redirectTo({ url: fallbackUrl });
        }
      },
    });
  }, 280);
}

function navigateToWithFade(url) {
  return navigateWithFade(url, 'navigateTo');
}

function reLaunchWithFade(url) {
  return navigateWithFade(url, 'reLaunch');
}

function redirectToWithFade(url) {
  return navigateWithFade(url, 'redirectTo');
}

module.exports = {
  navigateWithFade,
  navigateBackWithFade,
  navigateToWithFade,
  reLaunchWithFade,
  redirectToWithFade,
};
