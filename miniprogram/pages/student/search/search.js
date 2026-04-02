const db = wx.cloud.database();

Page({
  data: {
    keyword: '',
    tabs: [
      { key: 'resource', label: '资料' },
      { key: 'course', label: '课程' },
      { key: 'moment', label: '动态' },
    ],
    activeTab: 'resource',
    loading: false,
    resourceList: [],
    courseList: [],
    momentList: [],
    suggestions: ['小升初政策', '真题资料', '英语单词', '学习规划'],
  },

  onLoad(options) {
    const keyword = options.keyword ? decodeURIComponent(options.keyword) : '';
    this.setData({ keyword });
    if (keyword) {
      this.searchAll();
    }
  },

  handleInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  async searchAll() {
    const keyword = this.data.keyword.trim();
    if (!keyword) {
      wx.showToast({ title: '请输入搜索关键词', icon: 'none' });
      return;
    }

    const regexp = db.RegExp({
      regexp: keyword,
      options: 'i',
    });

    this.setData({ loading: true });

    try {
      const [resourceRes, courseRes, momentRes] = await Promise.all([
        db.collection('resources').where({
          title: regexp,
        }).limit(20).get().catch(() => ({ data: [] })),
        db.collection('courses').where({
          title: regexp,
        }).limit(20).get().catch(() => ({ data: [] })),
        db.collection('moments').where({
          content: regexp,
        }).limit(20).get().catch(() => ({ data: [] })),
      ]);

      this.setData({
        resourceList: resourceRes.data.filter((item) => !item.userId),
        courseList: courseRes.data,
        momentList: momentRes.data,
      });
    } catch (error) {
      console.error('search all error', error);
      wx.showToast({ title: '搜索失败，请稍后重试', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  changeTab(e) {
    this.setData({ activeTab: e.currentTarget.dataset.key });
  },

  chooseSuggestion(e) {
    const keyword = e.currentTarget.dataset.keyword;
    this.setData({ keyword });
    this.searchAll();
  },

  openResource() {
    wx.navigateTo({ url: '/pages/student/resourceDetail/resourceDetail' });
  },

  openCourse(e) {
    const item = e.currentTarget.dataset.item;
    if (!item) return;
    if (item.school_id || item.schoolId) {
      wx.navigateTo({
        url: `/pages/student/courseList/courseList?schoolId=${item.school_id || item.schoolId}&schoolName=${item.schoolName || item.orgName || '课程中心'}`,
      });
      return;
    }
    wx.showToast({ title: '课程详情整理中', icon: 'none' });
  },

  openMoment(e) {
    const item = e.currentTarget.dataset.item;
    if (!item || !item.userId) return;
    wx.navigateTo({
      url: `/pages/student/userMoments/userMoments?userId=${item.userId}`,
    });
  },
});
