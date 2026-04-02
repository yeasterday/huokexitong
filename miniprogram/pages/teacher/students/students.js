const app = getApp();

Page({
  data: {
    students: [],
    isDemo: false,
    allStudents: []
  },

  onLoad: function() {
    const userInfo = wx.getStorageSync('userInfo');
    this.setData({ isDemo: userInfo.institutionId === 'demo_001' });
    this.fetchStudents();
  },

  // 获取学员列表
  fetchStudents: function() {
    const userInfo = wx.getStorageSync('userInfo');
    const db = wx.cloud.database();
    db.collection('users').where({
      institutionId: userInfo.institutionId,
      role: 'student'
    }).get().then(res => {
      this.setData({ 
        students: res.data,
        allStudents: res.data 
      });
    });
  },

  // 搜索逻辑
  onSearch: function(e) {
    const key = e.detail.value.toLowerCase();
    const filtered = this.data.allStudents.filter(s => s.name.includes(key));
    this.setData({ students: filtered });
  },

  // 【核心功能】一键注入模拟数据
  injectData: function() {
    wx.showLoading({ title: '正在召集学霸...' });
    
    // 模拟 5 个高颜值学生数据
    const names = ['张小明', '李华', '王思齐', '陈语嫣', '赵子轩'];
    const grades = ['三年级', '初二', '高一', '五年级', '初三'];
    const mockData = names.map((name, i) => ({
      name,
      grade: grades[i],
      points: Math.floor(Math.random() * 1000),
      level: Math.floor(Math.random() * 20) + 1,
      active: Math.random() > 0.5,
      role: 'student',
      institutionId: 'demo_001',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}` // 自动生成头像
    }));

    // 这里在演示模式下直接更新本地视图，不写数据库，保护环境
    setTimeout(() => {
      wx.hideLoading();
      this.setData({ 
        students: mockData,
        allStudents: mockData 
      });
      wx.showToast({ title: '注入成功！', icon: 'success' });
    }, 1500);
  }
});