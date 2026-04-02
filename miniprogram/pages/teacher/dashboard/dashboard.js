const app = getApp();
const db = wx.cloud.database();
const { getOrgScope } = require('../../../utils/org');

Page({
  data: {
    orgName: '',
    inviteCode: '',
    todayCheckins: 0,
    todayQuests: 0,
    totalStudents: 0,
    pendingOrders: 0,
    resourceCount: 0,
    shopCount: 0,
  },

  async onShow() {
    await app.globalData.sessionReady;
    wx.setNavigationBarTitle({ title: '教师工作台' });
    this.loadDashboardData();
  },

  async loadDashboardData() {
    const user = await app.requireLogin({ redirect: false });
    if (!user || !user._id) {
      wx.showToast({ title: '请先登录教师账号', icon: 'none' });
      return;
    }

    const { orgId, orgName } = getOrgScope(user);
    const todayKey = app.getTodayKey();

    wx.showLoading({ title: '加载看板...' });

    try {
      const [studentRes, checkinRes, questRes, orderRes, resourceRes, shopRes] = await Promise.all([
        db.collection('users').where({ orgId, role: 'student' }).count().catch(() => ({ total: 0 })),
        db.collection('daily_checkins').where({ orgId, dateKey: todayKey }).count().catch(() => ({ total: 0 })),
        db.collection('quest_records').where({ orgId, dateKey: todayKey }).count().catch(() => ({ total: 0 })),
        db.collection('orders').where({ orgId }).limit(100).get().catch(() => ({ data: [] })),
        db.collection('resources').where({ orgId }).count().catch(() => ({ total: 0 })),
        db.collection('shop_items').where({ orgId }).count().catch(() => ({ total: 0 })),
      ]);

      const pendingOrders = (orderRes.data || []).filter((item) => {
        const status = String(item.status || '');
        return status === 'pending' || status.includes('待');
      }).length;

      this.setData({
        orgName,
        inviteCode: user.inviteCode || '',
        todayCheckins: checkinRes.total || 0,
        todayQuests: questRes.total || 0,
        totalStudents: studentRes.total || 0,
        pendingOrders,
        resourceCount: resourceRes.total || 0,
        shopCount: shopRes.total || 0,
      });
      wx.hideLoading();
    } catch (error) {
      console.error('load teacher dashboard error', error);
      wx.hideLoading();
      wx.showToast({ title: '加载看板失败', icon: 'none' });
    }
  },

  copyInviteCode() {
    if (!this.data.inviteCode) {
      wx.showToast({ title: '当前账号未配置邀请码', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: this.data.inviteCode,
      success: () => wx.showToast({ title: '邀请码已复制', icon: 'success' }),
    });
  },

  goToStudents() {
    wx.navigateTo({ url: '/pages/teacher/students/students' });
  },

  goToReport() {
    wx.navigateTo({ url: '/pages/teacher/report/report' });
  },

  goToPromote() {
    wx.navigateTo({ url: '/pages/teacher/promote/promote' });
  },

  goToAddResource() {
    wx.navigateTo({ url: '/pages/teacher/addResource/addResource' });
  },

  goToManageShop() {
    wx.navigateTo({ url: '/pages/teacher/manageShop/manageShop' });
  },

  goToOrderList() {
    wx.navigateTo({ url: '/pages/teacher/orderList/orderList' });
  },

  goToAudit() {
    wx.navigateTo({ url: '/pages/teacher/audit/audit' });
  },
});
