const db = wx.cloud.database();
Page({
  data: { list: [] },
  onShow() {
    const user = wx.getStorageSync('currentUser');
    if(!user) return;
    wx.showLoading({ title: '加载中' });
    db.collection('follows').where({ followerId: user._id }).orderBy('createTime', 'desc').get().then(res => {
      this.setData({ list: res.data });
      wx.hideLoading();
    });
  },
  goToUser(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/student/userMoments/userMoments?userId=${id}` });
  }
});