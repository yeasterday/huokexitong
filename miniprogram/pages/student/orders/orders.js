const db = wx.cloud.database();
Page({
  data: { orders: [] },
  onShow() { this.loadOrders(); },
  loadOrders() {
    wx.showLoading({ title: '加载订单中...' });
    const user = wx.getStorageSync('currentUser');
    db.collection('orders').where({ userId: user._id }).orderBy('createTime', 'desc').get().then(res => {
      // 格式化时间
      const formatted = res.data.map(o => {
        const d = new Date(o.createTime);
        o.createTimeStr = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}`;
        return o;
      });
      this.setData({ orders: formatted });
      wx.hideLoading();
    });
  }
});