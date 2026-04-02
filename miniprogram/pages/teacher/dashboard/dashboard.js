Page({
  data: {
    institutionName: '青水教育专属版', // 演示用机构名
    todayCheckins: 0,   // 今日打卡人数
    newLeads: 0,        // 新增体验线索 (通过海报扫码来的)
    totalStudents: 0    // 在读学员总数
  },

  onLoad() {
    wx.setNavigationBarTitle({ title: '校长工作台' });
    this.loadDashboardData();
  },

  // 模拟从云端拉取该机构的核心运营数据
  loadDashboardData() {
    wx.showLoading({ title: '加载数据中' });
    // 实际生产中，这里会通过 wx.cloud.database() 加上 institutionId 去 count 数据
    setTimeout(() => {
      this.setData({
        todayCheckins: 28,
        newLeads: 5,
        totalStudents: 106
      });
      wx.hideLoading();
    }, 800);
  },

  // 跳转到学员管理 (复用你现有的页面)
  goToStudents() {
    wx.navigateTo({ 
      url: '/pages/teacher/students/students',
      fail: () => wx.showToast({ title: '路由错误', icon: 'none' })
    });
  },

  // 占位符：后续我们要开发的海报裂变设置页
  goToPosterConfig() {
    wx.showToast({ title: '招生海报配置开发中', icon: 'none' });
  },

  // 占位符：班级管理
  goToClasses() {
    wx.showToast({ title: '班级管理开发中', icon: 'none' });
  },

  comingSoon() {
    wx.showToast({ title: '增值模块，敬请期待', icon: 'none' });
  }
});