const db = wx.cloud.database();

Page({
  data: {
    account: '',
    password: ''
  },

  handleLogin() {
    const { account, password } = this.data;
    
    if (!account || !password) {
      return wx.showToast({ title: '账号密码不能为空', icon: 'none' });
    }

    wx.showLoading({ title: '正在登录...' });

    // 去数据库比对账号和密码
    db.collection('users').where({
      account: account,
      password: password
    }).get().then(res => {
      wx.hideLoading();
      
      if (res.data.length > 0) {
        const user = res.data[0];
        
        // 登录成功，把信息存入咱们的“专属抽屉”
        wx.setStorageSync('userInfo', user);
        wx.setStorageSync('currentUser', user);
        
        wx.showToast({ title: '登录成功', icon: 'success' });
        
        // 延迟一秒退回到之前的页面
        setTimeout(() => {
          wx.navigateBack({
            fail: () => {
              // 如果没有上一页，就跳回首页
              wx.switchTab({ url: '/pages/student/index/index' });
            }
          });
        }, 1000);
      } else {
        // 查不到数据，说明账号或密码错了
        wx.showToast({ title: '账号或密码错误', icon: 'error' });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error("登录异常", err);
      wx.showToast({ title: '网络开小差了', icon: 'none' });
    });
  },

  goToRegister() {
    wx.navigateTo({ url: '/pages/login/register' });
  }
});