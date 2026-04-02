const app = getApp();
const db = wx.cloud.database();
const { buildMonthCalendar, formatDateKey } = require('../../../utils/date');

Page({
  data: {
    loading: true,
    currentMonth: formatDateKey(new Date()).slice(0, 7),
    calendar: {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      cells: [],
    },
    monthSummary: {
      questDays: 0,
      checkInDays: 0,
      totalSessions: 0,
    },
  },

  onShow() {
    this.loadCalendar();
  },

  async loadCalendar() {
    const user = await app.requireLogin();
    if (!user || !user._id) {
      this.setData({ loading: false });
      return;
    }

    this.setData({ loading: true });

    try {
      const [checkinsRes, recordsRes] = await Promise.all([
        db.collection('daily_checkins')
          .where({ userId: user._id })
          .orderBy('dateKey', 'desc')
          .limit(365)
          .get()
          .catch(() => ({ data: [] })),
        db.collection('quest_records')
          .where({ userId: user._id })
          .orderBy('dateKey', 'desc')
          .limit(365)
          .get()
          .catch(() => ({ data: [] })),
      ]);

      this.checkins = checkinsRes.data || [];
      this.records = recordsRes.data || [];
      this.renderCalendar();
    } catch (error) {
      console.error('load quest calendar error', error);
      this.setData({ loading: false });
      wx.showToast({ title: '加载日历失败', icon: 'none' });
    }
  },

  renderCalendar() {
    const [year, month] = this.data.currentMonth.split('-').map((item) => Number(item));
    const baseDate = new Date(year, month - 1, 1);
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
    const marks = {};

    (this.checkins || []).forEach((item) => {
      if (!item.dateKey || !item.dateKey.startsWith(monthPrefix)) return;
      marks[item.dateKey] = {
        ...(marks[item.dateKey] || {}),
        checkIn: true,
      };
    });

    (this.records || []).forEach((item) => {
      if (!item.dateKey || !item.dateKey.startsWith(monthPrefix)) return;
      const current = marks[item.dateKey] || {};
      marks[item.dateKey] = {
        ...current,
        quest: true,
        count: (current.count || 0) + 1,
      };
    });

    const questDays = Object.values(marks).filter((item) => item.quest).length;
    const checkInDays = Object.values(marks).filter((item) => item.checkIn).length;
    const totalSessions = Object.values(marks).reduce((total, item) => total + (item.count || 0), 0);

    this.setData({
      loading: false,
      calendar: buildMonthCalendar(baseDate, marks),
      monthSummary: {
        questDays,
        checkInDays,
        totalSessions,
      },
    });
  },

  changeMonth(e) {
    const direction = e.currentTarget.dataset.direction;
    const [year, month] = this.data.currentMonth.split('-').map((item) => Number(item));
    const baseDate = new Date(year, month - 1, 1);
    baseDate.setMonth(baseDate.getMonth() + (direction === 'prev' ? -1 : 1));
    this.setData({
      currentMonth: `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, '0')}`,
    });
    this.renderCalendar();
  },
});
