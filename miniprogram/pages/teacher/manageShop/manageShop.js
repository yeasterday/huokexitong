const app = getApp();
const db = wx.cloud.database();
const { getOrgScope } = require('../../../utils/org');

Page({
  data: {
    itemList: [],
  },

  onShow() {
    this.loadItems();
  },

  async loadItems() {
    const user = await app.requireLogin({ redirect: false });
    if (!user || !user._id) return;
    const { orgId } = getOrgScope(user);

    wx.showLoading({ title: '加载商品...' });
    try {
      const res = await db.collection('shop_items').where({ orgId }).orderBy('createTime', 'desc').get();
      this.setData({ itemList: res.data || [] });
      wx.hideLoading();
    } catch (error) {
      console.error('load shop manage items error', error);
      wx.hideLoading();
      wx.showToast({ title: '加载商品失败', icon: 'none' });
    }
  },

  goToAdd() {
    wx.navigateTo({ url: '/pages/teacher/addShopItem/addShopItem' });
  },

  deleteItem(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '下架商品',
      content: '确认将这个商品从当前校区商城中移除吗？',
      success: async (res) => {
        if (!res.confirm) return;
        wx.showLoading({ title: '处理中...' });
        try {
          await db.collection('shop_items').doc(id).remove();
          wx.hideLoading();
          wx.showToast({ title: '已下架', icon: 'success' });
          this.loadItems();
        } catch (error) {
          wx.hideLoading();
          console.error('delete shop item error', error);
          wx.showToast({ title: '下架失败', icon: 'none' });
        }
      },
    });
  },
});
