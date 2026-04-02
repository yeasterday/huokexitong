const app = getApp();
const db = wx.cloud.database();
const { formatDateTime, formatDuration } = require('../../../utils/date');

Page({
  data: {
    loading: true,
    records: [],
    filter: 'all',
    summary: {
      sessions: 0,
      learned: 0,
      avgAccuracy: 0,
    },
  },

  onShow() {
    this.loadRecords();
  },

  async loadRecords() {
    const user = await app.requireLogin();
    if (!user || !user._id) {
      this.setData({ loading: false, records: [] });
      return;
    }

    this.setData({ loading: true });

    try {
      const where = { userId: user._id };
      if (this.data.filter !== 'all') {
        where.bankId = this.data.filter;
      }

      const res = await db.collection('quest_records')
        .where(where)
        .orderBy('createTime', 'desc')
        .limit(50)
        .get();

      const records = (res.data || []).map((item) => ({
        ...item,
        timeText: formatDateTime(item.createTime),
        durationText: formatDuration(item.durationSeconds || 0),
      }));

      const sessions = records.length;
      const learned = records.reduce((total, item) => total + (item.totalCount || 0), 0);
      const avgAccuracy = sessions
        ? Math.round(records.reduce((total, item) => total + (item.accuracy || 0), 0) / sessions)
        : 0;

      this.setData({
        loading: false,
        records,
        summary: {
          sessions,
          learned,
          avgAccuracy,
        },
      });
    } catch (error) {
      console.error('load quest records error', error);
      this.setData({ loading: false, records: [] });
      wx.showToast({ title: '加载记录失败', icon: 'none' });
    }
  },

  changeFilter(e) {
    const filter = e.currentTarget.dataset.filter;
    if (!filter || filter === this.data.filter) return;
    this.setData({ filter });
    this.loadRecords();
  },

  goQuest() {
    wx.switchTab({ url: '/pages/student/quest/quest' });
  },

  goWrongbook() {
    wx.navigateTo({ url: '/pages/student/questWrongbook/questWrongbook' });
  },
});
