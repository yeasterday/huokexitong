const app = getApp();

Page({
  data: {
    account: '',
    password: '',
    loading: false,
  },

  async onShow() {
    await app.globalData.sessionReady;
    const user = app.getCurrentUser();
    if (user && user._id) {
      this.redirectAfterLogin();
    }
  },

  handleInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [field]: e.detail.value,
    });
  },

  async handleLogin() {
    const { account, password } = this.data;
    if (!account || !password) {
      wx.showToast({ title: '账号和密码都要填写', icon: 'none' });
      return;
    }

    if (this.data.loading) return;

    this.setData({ loading: true });
    wx.showLoading({ title: '登录中...' });

    try {
      const res = await wx.cloud.callFunction({
        name: 'auth',
        data: {
          action: 'login',
          account: account.trim(),
          password,
        },
      });
      const result = res.result || {};
      if (!result.success || !result.user) {
        wx.hideLoading();
        this.setData({ loading: false });
        wx.showToast({ title: result.message || '登录失败', icon: 'none' });
        return;
      }

      app.setCurrentUser(result.user);
      await app.updateUnreadBadge();

      wx.hideLoading();
      this.setData({ loading: false });
      wx.showToast({ title: '登录成功', icon: 'success' });

      setTimeout(() => {
        this.redirectAfterLogin();
      }, 500);
    } catch (error) {
      wx.hideLoading();
      this.setData({ loading: false });
      console.error('login error', error);
      wx.showToast({ title: '网络异常，请稍后重试', icon: 'none' });
    }
  },

  redirectAfterLogin() {
    wx.navigateBack({
      fail: () => {
        wx.switchTab({ url: '/pages/student/index/index' });
      },
    });
  },

  goToRegister() {
    wx.navigateTo({ url: '/pages/login/register' });
  },
});
