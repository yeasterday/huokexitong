const db = wx.cloud.database();

Page({
  data: {
    itemList: []
  },

  // 每次进入这个页面，都会重新去云端拉取最新的商品列表
  onShow() {
    this.loadItems();
  },

  // 核心：拉取商城仓库数据，并做格式化处理
  loadItems() {
    wx.showLoading({ title: '加载仓库中...' });
    db.collection('shop_items').orderBy('createTime', 'desc').get().then(res => {
      this.setData({ itemList: res.data });
      wx.hideLoading();
    }).catch(err => {
      console.error("加载商品失败", err);
      wx.hideLoading();
      wx.showToast({ title: '加载失败，请重试', icon: 'none' });
    });
  },

  // 跳转到上架新商品的页面
  goToAdd() {
    wx.navigateTo({ url: '/pages/teacher/addShopItem/addShopItem' });
  },

  // 核心：下架（删除）商品
  deleteItem(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '下架确认',
      content: '确定要从商城移除该商品吗？用户将无法兑换。',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '下架中...' });
          db.collection('shop_items').doc(id).remove().then(() => {
            wx.hideLoading();
            wx.showToast({ title: '商品已下架', icon: 'success' });
            // 下架成功后，重新刷新一下列表
            this.loadItems(); 
          }).catch(err => {
            wx.hideLoading();
            wx.showToast({ title: '下架失败', icon: 'none' });
          });
        }
      }
    });
  }
});