const app = getApp();
const db = wx.cloud.database();
const { getOrgScope } = require('../../../utils/org');

Page({
  data: {
    resourceList: [],
  },

  onShow() {
    this.loadAllResources();
  },

  async loadAllResources() {
    const user = await app.requireLogin({ redirect: false });
    if (!user || !user._id) return;
    const { orgId } = getOrgScope(user);

    wx.showLoading({ title: '加载资源...' });
    try {
      const res = await db.collection('resources').where({ orgId }).orderBy('createTime', 'desc').get();
      this.setData({ resourceList: res.data || [] });
      wx.hideLoading();
    } catch (error) {
      wx.hideLoading();
      console.error('load audit resources error', error);
      wx.showToast({ title: '加载资源失败', icon: 'none' });
    }
  },

  deleteResource(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '下架资源',
      content: '确认把这份资源从当前校区下架吗？',
      confirmColor: '#c62828',
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await db.collection('resources').doc(id).remove();
          wx.showToast({ title: '已下架', icon: 'success' });
          this.loadAllResources();
        } catch (error) {
          console.error('delete resource error', error);
          wx.showToast({ title: '下架失败', icon: 'none' });
        }
      },
    });
  },
});
