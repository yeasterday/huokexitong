const db = wx.cloud.database();

Page({
  data: {
    resourceList: [],
    keyword: ''
  },

  onShow() {
    // 每次进入页面自动拉取最新的资源列表
    this.loadResources();
  },

  loadResources() {
    wx.showLoading({ title: '加载资料中...' });
    
    let query = {};
    if (this.data.keyword) {
      query = {
        title: db.RegExp({
          regexp: this.data.keyword,
          options: 'i', // 忽略大小写
        })
      };
    }

    // 从 resources 表拉取数据，按下载量倒序
    db.collection('resources').where(query).orderBy('downloads', 'desc').get().then(res => {
      this.setData({ resourceList: res.data });
      wx.hideLoading();
      
      if (res.data.length === 0 && this.data.keyword) {
        wx.showToast({ title: '没搜到相关资料', icon: 'none' });
      }
    }).catch(err => {
      wx.hideLoading();
      console.error("加载失败", err);
      wx.showToast({ title: '网络异常', icon: 'error' });
    });
  },

  onSearch() {
    if (!this.data.keyword.trim()) {
      wx.showToast({ title: '请输入搜索词', icon: 'none' });
      return;
    }
    this.loadResources();
  },

  clearSearch() {
    this.setData({ keyword: '' });
    this.loadResources();
  },

// 🌟 安全版：修复权限报错的兑换逻辑
async handleDownload(e) {
  const item = e.currentTarget.dataset.item;
  const requiredPoints = item.points || 10;
  
  const user = wx.getStorageSync('currentUser') || wx.getStorageSync('userInfo');

  if (!user || !user._id) {
    return wx.showToast({ title: '请先登录系统', icon: 'none' });
  }

  wx.showModal({
    title: '确认兑换',
    content: `是否消耗 ${requiredPoints} 脑力积分兑换《${item.title}》？`,
    success: async (res) => {
      if (res.confirm) {
        wx.showLoading({ title: '处理中...', mask: true });
        
        try {
          // 1. 查余额
          const userRes = await db.collection('users').doc(user._id).get();
          const currentScore = userRes.data.score || 0;

          if (currentScore < requiredPoints) {
            wx.hideLoading();
            return wx.showToast({ title: '积分不够哦，快去打卡赚积分吧！', icon: 'none' });
          }

          // 2. 扣款（修改自己的积分，不会触发权限报错）
          await db.collection('users').doc(user._id).update({
            data: {
              score: db.command.inc(-requiredPoints)
            }
          });

          // 💡 这里的“增加热度下载量”逻辑已删除，避开权限拦截

          // 3. 发货：存入我的书包 (请确保你在云开发后台已经新建了 my_resources 集合)
          await db.collection('resources').add({
            data: {
              userId: user._id, 
              resourceId: item._id, 
              title: item.title, 
              type: item.type,
              fileId: item.fileId || item.link || '', // 把网盘链接或文件ID一起存入书包
              buyTime: db.serverDate() 
            }
          });

          wx.hideLoading();
          wx.showToast({ title: '已放进我的书包！', icon: 'success' });
          this.loadResources();

        } catch (err) {
          wx.hideLoading();
          console.error("兑换失败，详细错误：", err);
          wx.showToast({ title: '兑换失败，请检查集合名是否正确', icon: 'none' });
        }
      }
    }
  });
},

  // 跳转到你现有的 teacher/addResource 页面去发资源
  goToPublishResource() {
    wx.navigateTo({ 
      url: '/pages/teacher/addResource/addResource',
      fail: (err) => {
        console.error('跳转失败', err);
        wx.showToast({ title: '请检查老师端页面路径', icon: 'none' });
      }
    });
  }
});