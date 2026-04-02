const db = wx.cloud.database();

Page({
  data: {
    sections: [
      {
        title: '招生关注重点',
        desc: '先关注报名时间、材料准备、学段衔接和课程安排，再决定资料与课程的优先级。',
      },
      {
        title: '资料使用建议',
        desc: '先看政策解读，再做真题资料，最后搭配精品视频和课程，效率会更高。',
      },
      {
        title: '加入校区后能获得什么',
        desc: '加入专属校区后，可看到机构课程、老师资源、专属邀请和进度激励。',
      },
    ],
    policyResources: [],
  },

  onShow() {
    this.loadPolicyResources();
  },

  async loadPolicyResources() {
    const regexp = db.RegExp({
      regexp: '政策|招生|升学|志愿|解读',
      options: 'i',
    });

    try {
      const res = await db.collection('resources').where({
        title: regexp,
      }).limit(6).get();

      this.setData({
        policyResources: res.data.filter((item) => !item.userId),
      });
    } catch (error) {
      console.error('load policy resources error', error);
    }
  },

  goSearch(e) {
    const keyword = e.currentTarget.dataset.keyword || '政策解读';
    wx.navigateTo({
      url: `/pages/student/search/search?keyword=${encodeURIComponent(keyword)}`,
    });
  },

  goResourceCenter() {
    wx.navigateTo({ url: '/pages/student/resourceDetail/resourceDetail' });
  },
});
