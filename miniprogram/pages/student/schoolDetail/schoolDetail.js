Page({
  data: {
    schoolId: '',
    schoolName: ''
  },

  // 用户刚进页面时，接收首页传过来的参数
  onLoad(options) {
    const id = options.id;
    const name = options.name;

    this.setData({
      schoolId: id,
      schoolName: name
    });

    // 把当前页面的顶部标题，自动改成这个机构的名字！
    wx.setNavigationBarTitle({
      title: name || '机构主页'
    });
  },

  // 点击“打卡闯关”，带着机构ID去真正的闯关地图
  goToQuestMap() {
    wx.navigateTo({ 
      // 注意：把 schoolId 塞进网址里带过去
      url: `/pages/student/quest/quest?schoolId=${this.data.schoolId}&schoolName=${this.data.schoolName}` 
    });
  },

  // 点击“精品课程”，带着机构ID去卖课大厅
  goToCourseList() {
    wx.navigateTo({
      url: `/pages/student/courseList/courseList?schoolId=${this.data.schoolId}&schoolName=${this.data.schoolName}`
    });
  },
});