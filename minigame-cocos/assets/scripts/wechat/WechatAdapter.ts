declare const wx: any;

export class WechatAdapter {
  initLifecycleHooks(): void {
    if (!wx) return;
    wx.onShow?.((payload: unknown) => {
      console.log('[WechatAdapter] onShow', payload);
    });
    wx.onHide?.(() => {
      console.log('[WechatAdapter] onHide');
    });
  }

  setShare(title: string, imageUrl?: string): void {
    if (!wx?.showShareMenu) return;
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline'],
    });
    wx.onShareAppMessage?.(() => ({
      title,
      imageUrl,
    }));
  }
}

