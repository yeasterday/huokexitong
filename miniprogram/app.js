const { formatDateKey } = require('./utils/date');

App({
  onLaunch() {
    if (!wx.cloud) {
      console.error('当前基础库版本过低，无法使用云能力');
      return;
    }

    wx.cloud.init({
      env: 'cloud1-7gme08b5ec029278',
      traceUser: true,
    });

    this.globalData.sessionReady = this.bootstrapSession();
  },

  globalData: {
    currentUser: null,
    unreadCount: 0,
    sessionReady: Promise.resolve(),
  },

  getTodayKey() {
    return formatDateKey(new Date());
  },

  getCurrentUser() {
    return this.globalData.currentUser || wx.getStorageSync('currentUser') || null;
  },

  setCurrentUser(user, options = {}) {
    if (!user) {
      this.clearCurrentUser(options);
      return null;
    }

    const safeUser = { ...user };
    delete safeUser.password;
    delete safeUser.passwordHash;

    this.globalData.currentUser = safeUser;
    wx.setStorageSync('currentUser', safeUser);
    wx.setStorageSync('userInfo', safeUser);

    if (!options.silent) {
      this.updateUnreadBadge();
    }

    return safeUser;
  },

  clearCurrentUser(options = {}) {
    this.globalData.currentUser = null;
    this.globalData.unreadCount = 0;
    wx.removeStorageSync('currentUser');
    wx.removeStorageSync('userInfo');

    if (!options.silent) {
      this.updateUnreadBadge();
    }
  },

  async bootstrapSession() {
    const cachedUser = wx.getStorageSync('currentUser');
    if (cachedUser && cachedUser._id) {
      this.globalData.currentUser = cachedUser;
    }

    try {
      const res = await wx.cloud.callFunction({
        name: 'auth',
        data: { action: 'checkSession' },
      });
      const result = res.result || {};
      if (result.success && result.user) {
        this.setCurrentUser(result.user, { silent: true });
      }
    } catch (error) {
      console.warn('会话恢复失败，继续使用本地缓存', error);
    }

    await this.updateUnreadBadge();
    return this.getCurrentUser();
  },

  async refreshCurrentUser() {
    const user = this.getCurrentUser();
    if (!user || !user._id) return null;

    try {
      const db = wx.cloud.database();
      const res = await db.collection('users').doc(user._id).get();
      return this.setCurrentUser(res.data, { silent: true });
    } catch (error) {
      console.warn('刷新用户资料失败', error);
      return user;
    }
  },

  async updateUnreadBadge() {
    const user = this.getCurrentUser();
    if (!user || !user._id) {
      this.globalData.unreadCount = 0;
      wx.removeTabBarBadge({ index: 3, fail: () => {} });
      return 0;
    }

    try {
      const db = wx.cloud.database();
      const res = await db.collection('messages').where({
        receiverId: user._id,
        isRead: false,
      }).count();
      const unreadCount = res.total || 0;
      this.globalData.unreadCount = unreadCount;

      if (unreadCount > 0) {
        wx.setTabBarBadge({
          index: 3,
          text: unreadCount > 99 ? '99+' : String(unreadCount),
          fail: () => {},
        });
      } else {
        wx.removeTabBarBadge({ index: 3, fail: () => {} });
      }

      return unreadCount;
    } catch (error) {
      console.warn('更新未读角标失败', error);
      return 0;
    }
  },

  async requireLogin(options = {}) {
    await this.globalData.sessionReady;
    const user = this.getCurrentUser();
    if (user && user._id) return user;

    if (options.redirect !== false) {
      wx.navigateTo({
        url: '/pages/login/login',
        fail: () => {},
      });
    }

    return null;
  },

  isTeacher(user = this.getCurrentUser()) {
    return !!user && user.role === 'teacher';
  },
});
