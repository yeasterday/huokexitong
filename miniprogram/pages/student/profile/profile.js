const app = getApp();
const db = wx.cloud.database();

function getProfilePercent(user = {}) {
  const profile = user.profile || {};
  const fields = [
    user.nickname || user.name,
    user.avatar || user.avatarUrl,
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

function getAvatarText(value, fallback) {
  const text = String(value || fallback || '');
  return text ? text.slice(0, 1) : '';
}

Page({
  data: {
    guestMode: true,
    userInfo: {},
    score: 0,
    hasCheckedIn: false,
    profilePercent: 0,
    unreadCount: 0,
    resourceCount: 0,
    pendingOrders: 0,
    streak: 0,
    avatarText: '登',
    showPhoneModal: false,
    phoneNumber: '',
    showNameModal: false,
    newNickname: '',
  },

  async onShow() {
    await app.globalData.sessionReady;
    this.loadPage();
  },

  async loadPage() {
    const user = app.getCurrentUser();
    if (!user || !user._id) {
      this.setData({
        guestMode: true,
        userInfo: {},
        score: 0,
        hasCheckedIn: false,
        profilePercent: 0,
        unreadCount: 0,
        resourceCount: 0,
        pendingOrders: 0,
        streak: 0,
        avatarText: '登',
      });
      return;
    }

    try {
      const latestUser = await app.refreshCurrentUser() || user;
      const todayKey = app.getTodayKey();
      const [unreadRes, resourceRes, orderRes] = await Promise.all([
        db.collection('messages').where({ receiverId: latestUser._id, isRead: false }).count().catch(() => ({ total: 0 })),
        db.collection('my_resources').where({ userId: latestUser._id }).count().catch(async () => (
          db.collection('resources').where({ userId: latestUser._id }).count()
        )),
        db.collection('orders').where({ userId: latestUser._id }).limit(100).get().catch(() => ({ data: [] })),
      ]);

      const pendingOrders = (orderRes.data || []).filter((item) => {
        const status = String(item.status || '');
        return status === 'pending' || status.includes('待');
      }).length;

      this.setData({
        guestMode: false,
        userInfo: latestUser,
        score: latestUser.score || 0,
        hasCheckedIn: latestUser.lastCheckInDate === todayKey,
        profilePercent: getProfilePercent(latestUser),
        unreadCount: unreadRes.total || 0,
        resourceCount: resourceRes.total || 0,
        pendingOrders,
        streak: latestUser.questStreak || 0,
        avatarText: getAvatarText(latestUser.nickname || latestUser.name, '我'),
      });

      app.updateUnreadBadge();
    } catch (error) {
      console.error('load profile page error', error);
    }
  },

  goToLogin() {
    wx.navigateTo({ url: '/pages/login/login' });
  },

  handleInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: e.detail.value });
  },

  openNameModal() {
    if (this.data.guestMode) {
      this.goToLogin();
      return;
    }

    this.setData({
      showNameModal: true,
      newNickname: this.data.userInfo.nickname || this.data.userInfo.name || '',
    });
  },

  handleNameTap() {
    if (this.data.guestMode) {
      this.goToLogin();
      return;
    }
    this.openNameModal();
  },

  closeNameModal() {
    this.setData({ showNameModal: false });
  },

  async saveNickname() {
    const name = this.data.newNickname.trim();
    if (!name) {
      wx.showToast({ title: '昵称不能为空', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中...' });
    try {
      await db.collection('users').doc(this.data.userInfo._id).update({
        data: { name, nickname: name },
      });

      await db.collection('moments').where({ userId: this.data.userInfo._id }).update({
        data: { name },
      }).catch(() => {});

      wx.hideLoading();
      this.setData({ showNameModal: false });
      wx.showToast({ title: '昵称已更新', icon: 'success' });
      this.loadPage();
    } catch (error) {
      wx.hideLoading();
      console.error('save nickname error', error);
      wx.showToast({ title: '保存失败，请稍后重试', icon: 'none' });
    }
  },

  changeAvatar() {
    if (this.data.guestMode) {
      this.goToLogin();
      return;
    }

    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const filePath = res.tempFiles[0].tempFilePath;
        this.uploadAvatar(filePath);
      },
    });
  },

  async uploadAvatar(filePath) {
    wx.showLoading({ title: '上传头像...' });
    const fileMatch = filePath.match(/\.[^.]+?$/);
    const suffix = (fileMatch && fileMatch[0]) || '.png';
    const cloudPath = `avatars/${this.data.userInfo._id}_${Date.now()}${suffix}`;

    try {
      const uploadRes = await wx.cloud.uploadFile({ cloudPath, filePath });
      const avatar = uploadRes.fileID;

      await db.collection('users').doc(this.data.userInfo._id).update({
        data: { avatar, avatarUrl: avatar },
      });

      await db.collection('moments').where({ userId: this.data.userInfo._id }).update({
        data: { avatar },
      }).catch(() => {});

      wx.hideLoading();
      wx.showToast({ title: '头像已更新', icon: 'success' });
      this.loadPage();
    } catch (error) {
      wx.hideLoading();
      console.error('upload avatar error', error);
      wx.showToast({ title: '上传失败，请稍后重试', icon: 'none' });
    }
  },

  openPhoneModal() {
    if (this.data.guestMode) {
      this.goToLogin();
      return;
    }
    this.setData({ showPhoneModal: true, phoneNumber: this.data.userInfo.phone || '' });
  },

  closePhoneModal() {
    this.setData({ showPhoneModal: false });
  },

  async savePhone() {
    const phone = this.data.phoneNumber.trim();
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({ title: '手机号格式不正确', icon: 'none' });
      return;
    }

    const shouldReward = !this.data.userInfo.phone;

    try {
      await db.collection('users').doc(this.data.userInfo._id).update({
        data: {
          phone,
          ...(shouldReward ? { score: db.command.inc(50) } : {}),
        },
      });
      wx.showToast({ title: shouldReward ? '绑定成功，积分 +50' : '手机号已更新', icon: 'success' });
      this.setData({ showPhoneModal: false });
      this.loadPage();
    } catch (error) {
      console.error('save phone error', error);
      wx.showToast({ title: '保存失败，请稍后重试', icon: 'none' });
    }
  },

  async doCheckIn() {
    const user = await app.requireLogin();
    if (!user || !user._id) return;
    if (this.data.hasCheckedIn) {
      wx.showToast({ title: '今天已经签到了', icon: 'none' });
      return;
    }

    const todayKey = app.getTodayKey();

    try {
      await db.collection('users').doc(user._id).update({
        data: {
          score: db.command.inc(5),
          lastCheckInDate: todayKey,
        },
      });

      const checkInRes = await db.collection('daily_checkins').where({
        userId: user._id,
        dateKey: todayKey,
      }).limit(1).get().catch(() => ({ data: [] }));

      if (checkInRes.data.length) {
        await db.collection('daily_checkins').doc(checkInRes.data[0]._id).update({
          data: {
            updateTime: db.serverDate(),
          },
        });
      } else {
        await db.collection('daily_checkins').add({
          data: {
            userId: user._id,
            orgId: user.orgId || '',
            orgName: user.orgName || '',
            dateKey: todayKey,
            createTime: db.serverDate(),
          },
        });
      }

      wx.showToast({ title: '签到成功，积分 +5', icon: 'success' });
      this.loadPage();
    } catch (error) {
      console.error('check in error', error);
      wx.showToast({ title: '签到失败，请稍后重试', icon: 'none' });
    }
  },

  goToMessages() {
    wx.navigateTo({ url: '/pages/student/messages/messages' });
  },

  openMessages() {
    if (this.data.guestMode) {
      this.goToLogin();
      return;
    }
    this.goToMessages();
  },

  goToOrders() {
    wx.navigateTo({ url: '/pages/student/orders/orders' });
  },

  openOrders() {
    if (this.data.guestMode) {
      this.goToLogin();
      return;
    }
    this.goToOrders();
  },

  goToResources() {
    wx.navigateTo({ url: '/pages/student/myResources/myResources' });
  },

  openResources() {
    if (this.data.guestMode) {
      this.goToLogin();
      return;
    }
    this.goToResources();
  },

  goToMoments() {
    const { userInfo } = this.data;
    if (!userInfo._id) {
      this.goToLogin();
      return;
    }
    wx.navigateTo({ url: `/pages/student/userMoments/userMoments?userId=${userInfo._id}` });
  },

  openMoments() {
    if (this.data.guestMode) {
      this.goToLogin();
      return;
    }
    this.goToMoments();
  },

  goToGrowth() {
    wx.navigateTo({ url: '/pages/student/growth/growth' });
  },

  openGrowth() {
    if (this.data.guestMode) {
      this.goToLogin();
      return;
    }
    this.goToGrowth();
  },

  goToArchive() {
    wx.navigateTo({ url: '/pages/student/archive/archive' });
  },

  openArchive() {
    if (this.data.guestMode) {
      this.goToLogin();
      return;
    }
    this.goToArchive();
  },

  goToRank() {
    wx.navigateTo({ url: '/pages/student/rank/rank' });
  },

  openRank() {
    if (this.data.guestMode) {
      this.goToLogin();
      return;
    }
    this.goToRank();
  },

  goToPet() {
    wx.navigateTo({ url: '/pages/student/pet/pet' });
  },

  openPet() {
    if (this.data.guestMode) {
      this.goToLogin();
      return;
    }
    this.goToPet();
  },

  goToShop() {
    wx.switchTab({ url: '/pages/student/shop/shop' });
  },

  goToDashboard() {
    wx.navigateTo({ url: '/pages/teacher/dashboard/dashboard' });
  },

  logout() {
    wx.showModal({
      title: '退出登录',
      content: '确认退出当前账号吗？',
      confirmColor: '#d85045',
      success: (res) => {
        if (!res.confirm) return;
        app.clearCurrentUser();
        this.loadPage();
        wx.showToast({ title: '已退出登录', icon: 'success' });
      },
    });
  },
});
