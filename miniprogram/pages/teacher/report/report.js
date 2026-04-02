const app = getApp();
const db = wx.cloud.database();
const { getOrgScope } = require('../../../utils/org');
const { sumProgress } = require('../../../utils/date');

Page({
  data: {
    monthText: '',
    summary: {
      students: 0,
      checkins: 0,
      quests: 0,
      learnedWords: 0,
    },
    reportData: [],
  },

  onShow() {
    this.loadReport();
  },

  async loadReport() {
    const user = await app.requireLogin({ redirect: false });
    if (!user || !user._id) return;

    const { orgId } = getOrgScope(user);
    const now = new Date();
    const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthText = `${now.getFullYear()} 年 ${now.getMonth() + 1} 月`;
    const monthReg = db.RegExp({
      regexp: `^${monthPrefix}`,
      options: 'i',
    });

    try {
      const [studentsRes, checkinsRes, questRes] = await Promise.all([
        db.collection('users').where({ orgId, role: 'student' }).get(),
        db.collection('daily_checkins').where({ orgId, dateKey: monthReg }).get().catch(() => ({ data: [] })),
        db.collection('quest_records').where({ orgId, dateKey: monthReg }).get().catch(() => ({ data: [] })),
      ]);

      const students = studentsRes.data || [];
      const checkins = checkinsRes.data || [];
      const quests = questRes.data || [];

      const reportData = students.map((item) => {
        const userCheckins = checkins.filter((row) => row.userId === item._id).length;
        const userQuests = quests.filter((row) => row.userId === item._id);
        const learnedWords = sumProgress(item.progress || {});
        return {
          _id: item._id,
          name: item.nickname || item.name || '未命名学员',
          checkins: userCheckins,
          levels: userQuests.length,
          points: item.score || 0,
          learnedWords,
        };
      }).sort((left, right) => right.learnedWords - left.learnedWords);

      this.setData({
        monthText,
        summary: {
          students: students.length,
          checkins: checkins.length,
          quests: quests.length,
          learnedWords: reportData.reduce((total, item) => total + (item.learnedWords || 0), 0),
        },
        reportData,
      });
    } catch (error) {
      console.error('load teacher report error', error);
      wx.showToast({ title: '加载报表失败', icon: 'none' });
    }
  },

  doExport() {
    const text = `${this.data.monthText} 学习报表\n学员数：${this.data.summary.students}\n签到次数：${this.data.summary.checkins}\n闯关次数：${this.data.summary.quests}\n累计学习词数：${this.data.summary.learnedWords}`;
    wx.setClipboardData({
      data: text,
      success: () => wx.showToast({ title: '报表摘要已复制', icon: 'success' }),
    });
  },
});
