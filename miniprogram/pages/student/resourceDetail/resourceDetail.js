const app = getApp();
const db = wx.cloud.database();

const PAGE_SIZE = 12;

function getCategory(item = {}) {
  const type = `${item.type || ''}${item.title || ''}`.toLowerCase();
  if (type.includes('政策')) return 'policy';
  if (type.includes('视频') || type.includes('video')) return 'video';
  return 'material';
}

Page({
  data: {
    keyword: '',
    filter: 'all',
    loading: false,
    pageNo: 1,
    hasMore: true,
    resourceList: [],
    canPublish: false,
  },

  onLoad(options) {
    if (options.keyword) {
      this.setData({ keyword: decodeURIComponent(options.keyword) });
    }
  },

  onShow() {
    this.setData({ canPublish: app.isTeacher() });
    this.loadResources(true);
  },

  onPullDownRefresh() {
    this.loadResources(true).finally(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    this.loadResources();
  },

  async loadResources(reset = false) {
    if (this.data.loading) return;
    if (!this.data.hasMore && !reset) return;

    this.setData({ loading: true });
    const pageNo = reset ? 1 : this.data.pageNo;

    try {
      const res = await db.collection('resources')
        .orderBy('createTime', 'desc')
        .skip((pageNo - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .get();

      const nextList = (res.data || [])
        .filter((item) => !item.status || item.status === 'published')
        .map((item) => ({
          ...item,
          categoryKey: getCategory(item),
        }))
        .filter((item) => {
          if (this.data.filter !== 'all' && item.categoryKey !== this.data.filter) {
            return false;
          }
          const keyword = this.data.keyword.trim().toLowerCase();
          if (!keyword) return true;
          return `${item.title || ''}${item.content || ''}${item.type || ''}`.toLowerCase().includes(keyword);
        });

      this.setData({
        loading: false,
        resourceList: reset ? nextList : this.data.resourceList.concat(nextList),
        pageNo: pageNo + 1,
        hasMore: (res.data || []).length === PAGE_SIZE,
      });
    } catch (error) {
      console.error('load resources error', error);
      this.setData({ loading: false });
      wx.showToast({ title: '加载资源失败', icon: 'none' });
    }
  },

  handleInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  onSearch() {
    this.loadResources(true);
  },

  clearSearch() {
    this.setData({ keyword: '' });
    this.loadResources(true);
  },

  changeFilter(e) {
    const filter = e.currentTarget.dataset.filter;
    if (!filter || filter === this.data.filter) return;
    this.setData({ filter });
    this.loadResources(true);
  },

  async handleDownload(e) {
    const item = e.currentTarget.dataset.item;
    const requiredPoints = Number(item.points) || 10;
    const user = await app.requireLogin();
    if (!user || !user._id) return;

    try {
      const ownedRes = await db.collection('my_resources').where({
        userId: user._id,
        resourceId: item._id,
      }).limit(1).get().catch(() => ({ data: [] }));

      if (ownedRes.data.length) {
        wx.showToast({ title: '这份资料已经在你的资料库里了', icon: 'none' });
        return;
      }

      const userRes = await db.collection('users').doc(user._id).get();
      const currentScore = userRes.data.score || 0;
      if (currentScore < requiredPoints) {
        wx.showToast({ title: '积分不足，先去签到或闯关吧', icon: 'none' });
        return;
      }

      const confirmText = `确定花费 ${requiredPoints} 积分解锁《${item.title}》吗？`;
      wx.showModal({
        title: '确认解锁',
        content: confirmText,
        success: async (modalRes) => {
          if (!modalRes.confirm) return;

          wx.showLoading({ title: '正在解锁...' });
          try {
            await db.collection('users').doc(user._id).update({
              data: {
                score: db.command.inc(-requiredPoints),
              },
            });

            const resourceData = {
              userId: user._id,
              orgId: user.orgId || item.orgId || '',
              orgName: user.orgName || item.orgName || '',
              resourceId: item._id,
              title: item.title,
              type: item.type || '学习资料',
              categoryKey: item.categoryKey,
              content: item.content || '',
              fileId: item.fileId || '',
              link: item.link || '',
              points: requiredPoints,
              buyTime: db.serverDate(),
            };

            try {
              await db.collection('my_resources').add({ data: resourceData });
            } catch (bagError) {
              await db.collection('resources').add({
                data: {
                  ...resourceData,
                  status: 'owned_record',
                },
              });
            }

            wx.hideLoading();
            wx.showToast({ title: '已加入我的资料', icon: 'success' });
            app.refreshCurrentUser();
          } catch (saveError) {
            wx.hideLoading();
            console.error('unlock resource error', saveError);
            wx.showToast({ title: '解锁失败，请稍后重试', icon: 'none' });
          }
        },
      });
    } catch (error) {
      console.error('pre check resource error', error);
      wx.showToast({ title: '操作失败，请稍后重试', icon: 'none' });
    }
  },

  goToPublishResource() {
    if (!app.isTeacher()) {
      wx.showToast({ title: '仅教师账号可发布资源', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: '/pages/teacher/addResource/addResource' });
  },
});
