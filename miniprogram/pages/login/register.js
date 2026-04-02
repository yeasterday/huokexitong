const app = getApp();

Page({
  data: {
    account: '',
    nickname: '',
    password: '',
    inviteCode: '',
    loading: false,
  },

  async onShow() {
    await app.globalData.sessionReady;
    const user = app.getCurrentUser();
    if (user && user._id) {
      wx.switchTab({ url: '/pages/student/index/index' });
    }
  },

  handleInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [field]: e.detail.value,
    });
  },

  async handleRegister() {
    const {
      account,
      nickname,
      password,
      inviteCode,
    } = this.data;

    if (!account || !nickname || !password) {
      wx.showToast({ title: '请先填写完整信息', icon: 'none' });
      return;
    }

    if (this.data.loading) return;

    this.setData({ loading: true });
    wx.showLoading({ title: '注册中...' });

    try {
      const res = await wx.cloud.callFunction({
        name: 'auth',
        data: {
          action: 'register',
          account: account.trim(),
          nickname: nickname.trim(),
          password,
          inviteCode: inviteCode.trim(),
        },
      });
      const result = res.result || {};
      if (!result.success || !result.user) {
        wx.hideLoading();
        this.setData({ loading: false });
        wx.showToast({ title: result.message || '注册失败', icon: 'none' });
        return;
      }

      app.setCurrentUser(result.user);
      await app.updateUnreadBadge();

      wx.hideLoading();
      this.setData({ loading: false });
      wx.showToast({ title: '注册成功', icon: 'success' });

      setTimeout(() => {
        wx.switchTab({ url: '/pages/student/index/index' });
      }, 500);
    } catch (error) {
      wx.hideLoading();
      this.setData({ loading: false });
      console.error('register error', error);
      wx.showToast({ title: '网络异常，请稍后重试', icon: 'none' });
    }
  },
});
