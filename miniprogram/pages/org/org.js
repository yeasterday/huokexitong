Page({
  data: {
    // ⚠️ 必做：把这个链接换成你自己的微信二维码云存储链接！
    qrUrl: 'https://636c-cloud1-7gme08b5ec029278-1355079803.tcb.qcloud.la/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20260401221438_244_97.jpg?sign=39ce187b2538329a8e9db30f24256803&t=1775052911', 
    wechatId: 'd2471523118' // ⚠️ 换成你的真实微信号
  },

  // 点击放大二维码，方便长按识别加好友
  previewQR() {
    wx.previewImage({
      current: this.data.qrUrl,
      urls: [this.data.qrUrl]
    });
  },

  // 一键复制微信号
  copyWechat() {
    wx.setClipboardData({
      data: this.data.wechatId,
      success: () => {
        wx.showToast({
          title: '微信号已复制，请去微信添加',
          icon: 'none',
          duration: 2000
        });
      }
    });
  }
});