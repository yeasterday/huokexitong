const db = wx.cloud.database();

Page({
  data: {
    schoolId: '',
    courses: [],
    isLoading: true
  },

  onLoad(options) {
    this.setData({ schoolId: options.schoolId });
    // 动态修改顶部标题
    wx.setNavigationBarTitle({ title: `${options.schoolName} - 精品课程` });
    
    this.fetchCourses();
  },

  // 获取本机构专属课程
  fetchCourses() {
    db.collection('courses')
      .where({
        school_id: this.data.schoolId // 严格隔离：只查这家店的课！
      })
      .get()
      .then(res => {
        this.setData({
          courses: res.data,
          isLoading: false
        });
        console.log("成功拉取课程:", res.data);
      })
      .catch(err => {
        console.error("课程拉取失败", err);
        this.setData({ isLoading: false });
      });
  },

  // 点击购买按钮
  buyCourse(e) {
    const courseId = e.currentTarget.dataset.id;
    // 咱们现在还没接微信支付，先弹窗过过瘾
    wx.showToast({
      title: '微信支付模块正在接入中...',
      icon: 'none',
      duration: 2000
    });
  }
});