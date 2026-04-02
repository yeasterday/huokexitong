const db = wx.cloud.database();

Page({
  data: {
    videoResources: [],
    courses: [],
  },

  onShow() {
    this.loadData();
  },

  async loadData() {
    const regexp = db.RegExp({
      regexp: '视频|讲解|直播|课',
      options: 'i',
    });

    try {
      const [videoRes, courseRes] = await Promise.all([
        db.collection('resources').where({
          title: regexp,
        }).limit(8).get().catch(() => ({ data: [] })),
        db.collection('courses').limit(6).get().catch(() => ({ data: [] })),
      ]);

      this.setData({
        videoResources: videoRes.data.filter((item) => !item.userId),
        courses: courseRes.data,
      });
    } catch (error) {
      console.error('load video page data error', error);
    }
  },

  copyVideoLink(e) {
    const item = e.currentTarget.dataset.item;
    const link = item.link || item.fileId;
    if (!link) {
      wx.showToast({ title: '暂时还没有可复制的观看链接', icon: 'none' });
      return;
    }

    wx.setClipboardData({
      data: link,
      success: () => {
        wx.showToast({ title: '链接已复制，去微信里打开吧', icon: 'none' });
      },
    });
  },

  openCourse(e) {
    const item = e.currentTarget.dataset.item;
    if (!item) return;
    wx.showToast({
      title: item.title || '课程整理中',
      icon: 'none',
    });
  },

  goResourceCenter() {
    wx.navigateTo({ url: '/pages/student/resourceDetail/resourceDetail' });
  },
});
