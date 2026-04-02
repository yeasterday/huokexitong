const db = wx.cloud.database();
Page({
  data: {
    userInfo: { nickname: '点击这里登录', id: null },
    score: 0,
    hasCheckedIn: false,
    showPhoneModal: false,
    phoneNumber: '',
    
    // 🌟 新增：改名的状态
    showNameModal: false,
    newNickname: ''
  },
  
  onShow() { this.loadRealUserData(); },
  
  loadRealUserData() {
    const user = wx.getStorageSync('currentUser');
    if (!user) { 
      this.setData({
        userInfo: { nickname: '点击这里登录', avatarUrl: '', _id: null },
        score: 0,
        hasCheckedIn: false
      });
      return; 
    }
    
    db.collection('users').doc(user._id).get().then(res => {
      this.setData({ 
        userInfo: res.data,
        score: res.data.score || 0,
        hasCheckedIn: res.data.lastCheckInDate === (new Date().getFullYear()+'-'+(new Date().getMonth()+1)+'-'+new Date().getDate())
      });
      wx.setStorageSync('currentUser', res.data); 
      wx.setStorageSync('userInfo', res.data);
    });
  },

  goToLogin() {
    const user = wx.getStorageSync('currentUser');
    if (!user) wx.navigateTo({ url: '/pages/login/login' });
  },

  // ================= 🌟 核心：改名全套动作 =================
  openNameModal() {
    this.setData({
      showNameModal: true,
      // 打开弹窗时，输入框里自动填上现在的名字
      newNickname: this.data.userInfo.nickname || this.data.userInfo.name || ''
    });
  },

  closeNameModal() {
    this.setData({ showNameModal: false });
  },

// 🌟 加强版 1：改名时，顺便把以前发过的帖子名字全改了
saveNickname() {
  const name = this.data.newNickname.trim();
  if (!name) return wx.showToast({ title: '名字不能为空哦', icon: 'none' });

  wx.showLoading({ title: '保存中...' });
  
  db.collection('users').doc(this.data.userInfo._id).update({
    data: { name: name, nickname: name }
  }).then(() => {
    
    // 🔥 核心绝招：批量更新历史动态里的名字
    db.collection('moments').where({ userId: this.data.userInfo._id }).update({
      data: { name: name }
    });

    wx.hideLoading();
    wx.showToast({ title: '改名成功！', icon: 'success' });
    this.setData({ showNameModal: false });
    this.loadRealUserData(); 
  }).catch(err => {
    wx.hideLoading();
    wx.showToast({ title: '网络异常', icon: 'error' });
  });
},

  // ================= 原有逻辑 =================
  changeAvatar() {
    const user = wx.getStorageSync('currentUser');
    if (!user || !user._id) return this.goToLogin();

    wx.chooseMedia({
      count: 1, mediaType: ['image'], sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.uploadAvatarToCloud(tempFilePath, user);
      }
    });
  },
// 🌟 加强版 2：换头像时，顺便把以前发过的帖子头像全换了
uploadAvatarToCloud(filePath, user) {
  wx.showLoading({ title: '换装中...', mask: true });
  const suffix = filePath.match(/\.[^.]+?$/)[0] || '.png';
  const cloudPath = `avatars/${user._id}_${Date.now()}${suffix}`;

  wx.cloud.uploadFile({
    cloudPath: cloudPath, 
    filePath: filePath,
    success: (res) => {
      const newAvatarUrl = res.fileID;
      db.collection('users').doc(user._id).update({
        data: { avatar: newAvatarUrl, avatarUrl: newAvatarUrl }
      }).then(() => {
        
        // 🔥 核心绝招：批量更新历史动态里的头像
        db.collection('moments').where({ userId: user._id }).update({
          data: { avatar: newAvatarUrl }
        });

        wx.hideLoading();
        wx.showToast({ title: '新头像真好看！', icon: 'success' });
        this.loadRealUserData(); 
      });
    }
  });
},
  
  goToMyFollows() { wx.navigateTo({ url: '/pages/student/followList/followList' }); },
  goToMyPage() {
    const user = wx.getStorageSync('currentUser');
    if (!user || !user._id) return wx.showToast({ title: '请先登录', icon: 'none' });
    wx.navigateTo({ url: `/pages/student/userMoments/userMoments?userId=${user._id}` });
  },
  goToOrders() { wx.navigateTo({ url: '/pages/student/orders/orders' }); },
  goToMessages() {
    const user = wx.getStorageSync('currentUser');
    if (!user) return wx.showToast({ title: '请先登录', icon: 'none' });
    wx.navigateTo({ url: '/pages/student/messages/messages' });
  },
  openPhoneModal() { this.setData({ showPhoneModal: true }); },
  closePhoneModal() { this.setData({ showPhoneModal: false }); },
  savePhone() {
    if (!this.data.phoneNumber || this.data.phoneNumber.length !== 11) return wx.showToast({ title: '格式错误', icon: 'none' });
    db.collection('users').doc(this.data.userInfo._id).update({
      data: { phone: this.data.phoneNumber, score: db.command.inc(50) }
    }).then(() => {
      wx.showToast({ title: '绑定成功+50分' });
      this.setData({ showPhoneModal: false });
      this.loadRealUserData();
    });
  },
  doCheckIn() {
    const user = wx.getStorageSync('currentUser');
    if (!user) return wx.showToast({ title: '请先登录', icon: 'none' }); 
    if (this.data.hasCheckedIn) return wx.showToast({ title: '今日已领', icon: 'none' });
    const today = new Date().getFullYear()+'-'+(new Date().getMonth()+1)+'-'+new Date().getDate();
    db.collection('users').doc(this.data.userInfo._id).update({
      data: { score: db.command.inc(5), lastCheckInDate: today }
    }).then(() => {
      wx.showToast({ title: '积分+5' });
      this.loadRealUserData();
    });
  },
  goToShop() { wx.switchTab({ url: '/pages/student/shop/shop' }); },
  goToRank() { wx.navigateTo({ url: '/pages/student/rank/rank' }); },
  goToPet() { wx.navigateTo({ url: '/pages/student/pet/pet' }); },
  goToMyBag() { wx.navigateTo({ url: '/pages/student/myResources/myResources' }); },
  goToPoster() { wx.navigateTo({ url: '/pages/student/poster/poster' }); },
  goToDashboard() { wx.navigateTo({ url: '/pages/teacher/dashboard/dashboard' }); },
  comingSoon() { wx.showToast({ title: '开发中...', icon: 'none' }); },
  logout() {
    wx.showModal({
      title: '退出确认', content: '确定要退出当前账号吗？', confirmColor: '#e53935',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('currentUser');
          wx.removeStorageSync('userInfo');
          this.loadRealUserData();
          wx.showToast({ title: '已安全退出', icon: 'success' });
        }
      }
    });
  }
});