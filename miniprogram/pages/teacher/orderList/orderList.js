const db = wx.cloud.database();
Page({
  data: { orders: [] },
  onShow() { this.loadAllOrders(); },
  loadAllOrders() {
    db.collection('orders').where({ status: '待发货' }).orderBy('createTime', 'desc').get().then(res => {
      this.setData({ orders: res.data });
    });
  },
  finishOrder(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认发货',
      content: '是否已线下交付或寄出礼品？',
      success: (res) => {
        if (res.confirm) {
          db.collection('orders').doc(id).update({ data: { status: '已发货' } }).then(() => {
            wx.showToast({ title: '处理完成' });
            this.loadAllOrders();
          });
        }
      }
    });
  }
});