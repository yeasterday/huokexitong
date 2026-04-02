const db = wx.cloud.database();

Page({
  data: {
    resourceList: []
  },

  onShow() {
    this.loadAllResources();
  },

  // 1. 盟主特权：无视权限，拉取全站最新资源
  loadAllResources() {
    wx.showLoading({ title: '扫描社区中...' });
    db.collection('resources').orderBy('createTime', 'desc').get().then(res => {
      this.setData({ resourceList: res.data });
      wx.hideLoading();
    }).catch(err => {
      wx.hideLoading();
      console.error(err);
    });
  },

  // 2. 核心功能：强制下架（删除）
  deleteResource(e) {
    const id = e.currentTarget.dataset.id;
    
    // 二次确认，防止手滑
    wx.showModal({
      title: '高能预警',
      content: '强制下架将永久删除该资源，确定执行吗？',
      confirmColor: '#c62828',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '正在清理...' });
          
          db.collection('resources').doc(id).remove().then(() => {
            wx.hideLoading();
            wx.showToast({ title: '已成功清理', icon: 'success' });
            // 删除成功后，刷新一下列表
            this.loadAllResources();
          }).catch(err => {
            wx.hideLoading();
            wx.showToast({ title: '清理失败，请检查权限', icon: 'none' });
          });
        }
      }
    });
  }
});