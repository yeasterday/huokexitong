const db = wx.cloud.database();

Page({
  data: {
    title: '',
    points: '',
    content: '',
    link: '',
    typeList: ['备考真题', '学术笔记', '职场干货', '技能培训'],
    typeIndex: 0
  },

  onTypeChange(e) {
    this.setData({ typeIndex: e.detail.value });
  },

  submitResource() {
    const { title, points, content, link, typeList, typeIndex } = this.data;

    // 简单校验
    if (!title || !points || !content) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '正在同步云端...' });

    // 🌟 核心：往数据库里加数据
    db.collection('resources').add({
      data: {
        title: title,
        points: parseInt(points), // 转成数字
        content: content,
        link: link,
        type: typeList[typeIndex],
        downloads: 0,
        createTime: db.serverDate(), // 获取服务器时间
        author: '官方管理员'
      }
    }).then(res => {
      wx.hideLoading();
      wx.showToast({ title: '发布成功！', icon: 'success' });
      // 发布成功后延迟返回
      setTimeout(() => { wx.navigateBack(); }, 1500);
    }).catch(err => {
      wx.hideLoading();
      wx.showToast({ title: '发布失败，请重试', icon: 'none' });
    });
  }
});