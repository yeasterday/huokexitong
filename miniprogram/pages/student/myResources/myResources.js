const db = wx.cloud.database();

Page({
  data: {
    myList: [],
    isLoading: true
  },

  onShow() {
    this.loadMyBag();
  },

  loadMyBag() {
    // 兼容不同的名字，拿到当前登录的用户
    const user = wx.getStorageSync('currentUser') || wx.getStorageSync('userInfo');
    
    if (!user || !user._id) {
      this.setData({ isLoading: false });
      return;
    }

    // 🌟 核心修改：直接去咱们新建的 my_resources 表里查这个人买过的所有资料
    db.collection('resources').where({
      userId: user._id
    }).orderBy('buyTime', 'desc').get().then(res => {
      this.setData({
        myList: res.data,
        isLoading: false
      });
    }).catch(err => {
      console.error("翻找书包失败", err);
      this.setData({ isLoading: false });
      wx.showToast({ title: '网络异常', icon: 'none' });
    });
  },

  // 一键复制链接
  copyLink(e) {
    const link = e.currentTarget.dataset.link;
    wx.setClipboardData({
      data: link || '链接生成中，请稍后或联系老师',
      success: () => {
        wx.showToast({ title: '已复制链接，快去下载吧', icon: 'none' });
      }
    });
  }
});