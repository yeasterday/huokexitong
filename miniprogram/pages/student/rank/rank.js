const db = wx.cloud.database();

Page({
  data: {
    rankList: []
  },

  onShow() {
    this.loadRankData();
  },

  loadRankData() {
    wx.showLoading({ title: '巅峰排榜中...' });
    
    // 核心大招：去 users 集合里，按 score 字段降序（desc）排列，并只取前 20 名！
    db.collection('users').orderBy('score', 'desc').limit(20).get().then(res => {
      this.setData({ rankList: res.data });
      wx.hideLoading();
    }).catch(err => {
      console.error("排榜失败", err);
      wx.hideLoading();
      wx.showToast({ title: '获取榜单失败', icon: 'none' });
    });
  }
});