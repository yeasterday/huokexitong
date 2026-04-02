const app = getApp();
const db = wx.cloud.database();
const { getOrgScope } = require('../../../utils/org');
const { sumProgress } = require('../../../utils/date');

Page({
  data: {
    loading: true,
    students: [],
    allStudents: [],
    keyword: '',
  },

  onShow() {
    this.fetchStudents();
  },

  async fetchStudents() {
    const user = await app.requireLogin({ redirect: false });
    if (!user || !user._id) {
      this.setData({ loading: false, students: [], allStudents: [] });
      return;
    }

    const { orgId } = getOrgScope(user);
    const todayKey = app.getTodayKey();

    try {
      const res = await db.collection('users').where({
        orgId,
        role: 'student',
      }).get();

      const allStudents = (res.data || []).map((item) => ({
        ...item,
        learnedWords: sumProgress(item.progress || {}),
        active: item.lastCheckInDate === todayKey,
      }));

      this.setData({
        loading: false,
        students: allStudents,
        allStudents,
      });
    } catch (error) {
      console.error('fetch students error', error);
      this.setData({ loading: false, students: [], allStudents: [] });
      wx.showToast({ title: '加载学员失败', icon: 'none' });
    }
  },

  onSearch(e) {
    const keyword = e.detail.value.trim().toLowerCase();
    this.setData({ keyword });
    if (!keyword) {
      this.setData({ students: this.data.allStudents });
      return;
    }

    const students = this.data.allStudents.filter((item) => {
      const source = `${item.name || ''}${item.nickname || ''}${item.phone || ''}`.toLowerCase();
      return source.includes(keyword);
    });
    this.setData({ students });
  },
});
