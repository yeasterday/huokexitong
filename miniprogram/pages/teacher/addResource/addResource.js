const app = getApp();
const db = wx.cloud.database();
const { getOrgScope } = require('../../../utils/org');

Page({
  data: {
    title: '',
    points: '',
    content: '',
    link: '',
    typeList: ['政策解读', '精品视频', '备考真题', '学习笔记', '招生素材'],
    typeIndex: 0,
  },

  onTypeChange(e) {
    this.setData({ typeIndex: Number(e.detail.value) });
  },

  async submitResource() {
    const { title, points, content, link, typeList, typeIndex } = this.data;
    if (!title.trim() || !content.trim()) {
      wx.showToast({ title: '请先填写资源标题和介绍', icon: 'none' });
      return;
    }

    const user = await app.requireLogin({ redirect: false });
    if (!user || !user._id) {
      wx.showToast({ title: '请先登录教师账号', icon: 'none' });
      return;
    }

    const { orgId, orgName } = getOrgScope(user);

    wx.showLoading({ title: '发布中...' });
    try {
      await db.collection('resources').add({
        data: {
          title: title.trim(),
          points: Number(points) || 0,
          content: content.trim(),
          link: link.trim(),
          type: typeList[typeIndex],
          downloads: 0,
          status: 'published',
          orgId,
          orgName,
          authorId: user._id,
          authorName: user.name || user.nickname || '教师',
          createTime: db.serverDate(),
        },
      });

      wx.hideLoading();
      wx.showToast({ title: '资源已发布', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 500);
    } catch (error) {
      wx.hideLoading();
      console.error('submit resource error', error);
      wx.showToast({ title: '发布失败，请稍后重试', icon: 'none' });
    }
  },
});
