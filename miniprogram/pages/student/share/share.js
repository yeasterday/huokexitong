Page({
  data: {
    userInfo: {},
    days: 15,
    level: 24
  },
  onLoad: function (options) {
    const info = wx.getStorageSync('userInfo');
    this.setData({ 
      userInfo: info,
      title: options.title || '自律挑战'
    });
  },
  savePoster() {
    wx.showActionSheet({
      itemList: ['保存到相册', '直接分享给好友'],
      success: (res) => {
        if (res.tapIndex === 0) {
          wx.showToast({ title: '已保存至相册', icon: 'success' });
        }
      }
    });
  }
});