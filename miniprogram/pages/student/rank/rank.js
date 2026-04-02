const app = getApp();
const db = wx.cloud.database();
const { sumProgress } = require('../../../utils/date');

Page({
  data: {
    mode: 'score',
    rankList: [],
    currentRank: 0,
  },

  onShow() {
    this.loadRankData();
  },

  async loadRankData() {
    wx.showLoading({ title: '加载榜单...' });

    try {
      const currentUser = app.getCurrentUser() || {};
      const res = await db.collection('users').limit(100).get();
      const list = (res.data || [])
        .filter((item) => item.role !== 'teacher')
        .map((item) => ({
          ...item,
          learnedWords: sumProgress(item.progress || {}),
          avatarText: String(item.nickname || item.name || '学').slice(0, 1),
        }));

      const sorted = list.sort((left, right) => {
        if (this.data.mode === 'learned') {
          return (right.learnedWords || 0) - (left.learnedWords || 0);
        }
        return (right.score || 0) - (left.score || 0);
      });

      const currentRank = sorted.findIndex((item) => item._id === currentUser._id) + 1;

      this.setData({
        rankList: sorted.slice(0, 20),
        currentRank: currentRank > 0 ? currentRank : 0,
      });
      wx.hideLoading();
    } catch (error) {
      console.error('load rank data error', error);
      wx.hideLoading();
      wx.showToast({ title: '获取榜单失败', icon: 'none' });
    }
  },

  changeMode(e) {
    const mode = e.currentTarget.dataset.mode;
    if (!mode || mode === this.data.mode) return;
    this.setData({ mode }, () => this.loadRankData());
  },
});
