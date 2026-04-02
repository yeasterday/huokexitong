const app = getApp();
const db = wx.cloud.database();
const { formatDateTime } = require('../../../utils/date');

function getCategory(item = {}) {
  const categoryKey = item.categoryKey || '';
  if (categoryKey) return categoryKey;
  const type = `${item.type || ''}${item.title || ''}`.toLowerCase();
  if (type.includes('政策')) return 'policy';
  if (type.includes('视频') || type.includes('video')) return 'video';
  return 'material';
}

Page({
  data: {
    list: [],
    displayList: [],
    loading: true,
    filter: 'all',
  },

  onShow() {
    this.loadMyBag();
  },

  async loadMyBag() {
    const user = await app.requireLogin();
    if (!user || !user._id) {
      this.setData({ loading: false, list: [], displayList: [] });
      return;
    }

    try {
      const res = await db.collection('my_resources')
        .where({ userId: user._id })
        .orderBy('buyTime', 'desc')
        .limit(100)
        .get()
        .catch(async () => (
          db.collection('resources').where({ userId: user._id }).orderBy('buyTime', 'desc').limit(100).get()
        ));

      const list = (res.data || []).map((item) => ({
        ...item,
        categoryKey: getCategory(item),
        timeText: formatDateTime(item.buyTime || item.createTime),
      }));

      this.setData({ loading: false, list }, () => this.applyFilter());
    } catch (error) {
      console.error('load my resources error', error);
      this.setData({ loading: false, list: [], displayList: [] });
      wx.showToast({ title: '加载资料失败', icon: 'none' });
    }
  },

  changeFilter(e) {
    const filter = e.currentTarget.dataset.filter;
    if (!filter || filter === this.data.filter) return;
    this.setData({ filter }, () => this.applyFilter());
  },

  applyFilter() {
    const displayList = this.data.filter === 'all'
      ? this.data.list
      : this.data.list.filter((item) => item.categoryKey === this.data.filter);

    this.setData({ displayList });
  },

  copyLink(e) {
    const item = e.currentTarget.dataset.item;
    const link = item.fileId || item.link;
    if (!link) {
      wx.showToast({ title: '这份资料暂无提取链接，请联系老师', icon: 'none' });
      return;
    }

    wx.setClipboardData({
      data: link,
      success: () => {
        wx.showToast({ title: '链接已复制', icon: 'success' });
      },
    });
  },

  goToResourceCenter() {
    wx.navigateTo({ url: '/pages/student/resourceDetail/resourceDetail' });
  },
});
