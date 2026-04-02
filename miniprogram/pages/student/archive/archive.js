const app = getApp();
const db = wx.cloud.database();
const { sumProgress } = require('../../../utils/date');

function getArchiveProgress(user = {}) {
  const profile = user.profile || {};
  const fields = [
    user.nickname || user.name,
    user.phone,
    user.orgName,
    profile.grade,
    profile.city,
    profile.targetSchool,
    profile.learningGoal,
    profile.bio,
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

Page({
  data: {
    loading: true,
    userInfo: {},
    profile: {
      grade: '',
      city: '',
      targetSchool: '',
      learningGoal: '',
      bio: '',
    },
    profilePercent: 0,
    stats: {
      totalLearned: 0,
      score: 0,
      streak: 0,
    },
  },

  onShow() {
    this.loadArchive();
  },

  async loadArchive() {
    const user = await app.requireLogin();
    if (!user || !user._id) {
      this.setData({ loading: false });
      return;
    }

    try {
      const latestUser = await app.refreshCurrentUser() || user;
      this.setData({
        loading: false,
        userInfo: latestUser,
        profile: {
          grade: (latestUser.profile || {}).grade || '',
          city: (latestUser.profile || {}).city || '',
          targetSchool: (latestUser.profile || {}).targetSchool || '',
          learningGoal: (latestUser.profile || {}).learningGoal || '',
          bio: (latestUser.profile || {}).bio || '',
        },
        profilePercent: getArchiveProgress(latestUser),
        stats: {
          totalLearned: sumProgress(latestUser.progress || {}),
          score: latestUser.score || 0,
          streak: latestUser.questStreak || 0,
        },
      });
    } catch (error) {
      console.error('load archive error', error);
      this.setData({ loading: false });
      wx.showToast({ title: '加载档案失败', icon: 'none' });
    }
  },

  handleInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`profile.${field}`]: e.detail.value,
    });
  },

  async saveArchive() {
    const user = app.getCurrentUser();
    if (!user || !user._id) return;

    wx.showLoading({ title: '保存中...' });
    try {
      await db.collection('users').doc(user._id).update({
        data: {
          profile: this.data.profile,
        },
      });

      wx.hideLoading();
      wx.showToast({ title: '学习档案已保存', icon: 'success' });
      this.loadArchive();
    } catch (error) {
      wx.hideLoading();
      console.error('save archive error', error);
      wx.showToast({ title: '保存失败，请稍后重试', icon: 'none' });
    }
  },
});
