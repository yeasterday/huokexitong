const db = wx.cloud.database();

Page({
  data: {
    account: '',
    nickname: '',
    password: '',
    inviteCode: '' // 新增邀请码变量
  },

  async handleRegister() {
    const { account, nickname, password, inviteCode } = this.data;
    
    // 1. 基础非空校验
    if (!account || !nickname || !password) {
      return wx.showToast({ title: '请填写必填信息', icon: 'none' });
    }
    
    // 2. 手机号格式严格校验 (必须是1开头，且满11位纯数字)
    if (!/^1[3-9]\d{9}$/.test(account)) {
      return wx.showToast({ title: '请输入正确的11位手机号', icon: 'none' });
    }

    // 3. 密码长度校验
    if (password.length < 8) {
      return wx.showToast({ title: '密码安全性太低，不能少于8位', icon: 'none' });
    }

    wx.showLoading({ title: '正在验证身份...' });

    try {
      // 4. 查一下这个手机号是不是已经注册过了
      const existRes = await db.collection('users').where({ account: account }).get();
      if (existRes.data.length > 0) {
        wx.hideLoading();
        return wx.showToast({ title: '该手机号已注册，请直接登录', icon: 'none' });
      }

      // 🌟 5. 核心：如果填了邀请码，去验证这个码是哪个校长的
      let orgId = '';
      let orgName = '';

      if (inviteCode) {
        // 去查数据库里哪个老师（role: 'teacher'）拥有这个邀请码
        const orgRes = await db.collection('users').where({ 
          inviteCode: inviteCode, 
          role: 'teacher' 
        }).get();

        if (orgRes.data.length === 0) {
          wx.hideLoading();
          return wx.showToast({ title: '邀请码无效，请核对后重试', icon: 'none' });
        }

        // 验证成功，提取该校长的机构信息
        const teacherData = orgRes.data[0];
        orgId = teacherData._id;
        // 如果校长资料里填了机构名就用机构名，没填就用校长的名字代替
        orgName = teacherData.orgName || `${teacherData.name}的专属校区`; 
      }

      // 6. 账号没人用，且邀请码没问题，开始写入数据库
      await db.collection('users').add({
        data: {
          account: account,
          phone: account, // 既然账号就是手机号，顺便把手机号字段也填上，省得以后再绑
          password: password,
          name: nickname,
          nickname: nickname,
          score: 100, // 新手送 100 积分
          role: 'student',
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${account}`,
          createTime: db.serverDate(),
          
          // 🌟 注入机构血统（如果是空，说明没填邀请码，是个散客）
          orgId: orgId, 
          orgName: orgName 
        }
      });

      wx.hideLoading();
      wx.showToast({ title: '注册成功！', icon: 'success' });
      
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);

    } catch (err) {
      wx.hideLoading();
      console.error("注册报错", err);
      wx.showToast({ title: '网络异常，请重试', icon: 'error' });
    }
  }
});