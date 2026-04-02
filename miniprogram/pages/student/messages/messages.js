const app = getApp();
const db = wx.cloud.database();
const { formatDateTime } = require('../../../utils/date');

const PAGE_SIZE = 12;

function getTypeMeta(type) {
  const metaMap = {
    like: {
      label: '点赞提醒',
      action: '赞了你的动态',
      color: '#f06292',
    },
    comment: {
      label: '评论互动',
      action: '评论了你的内容',
      color: '#5c6bc0',
    },
    order: {
      label: '订单通知',
      action: '更新了你的兑换订单',
      color: '#26a69a',
    },
    system: {
      label: '系统通知',
      action: '推送了一条平台通知',
      color: '#ffa726',
    },
  };

  return metaMap[type] || {
    label: '消息提醒',
    action: '给你发来了一条新消息',
    color: '#7e57c2',
  };
}

Page({
  data: {
    filters: [
      { key: 'all', label: '全部' },
      { key: 'like', label: '点赞' },
      { key: 'comment', label: '评论' },
      { key: 'system', label: '通知' },
      { key: 'order', label: '订单' },
    ],
    activeFilter: 'all',
    messageList: [],
    pageNo: 1,
    hasMore: true,
    loading: false,
    unreadCount: 0,
  },

  async onShow() {
    await app.globalData.sessionReady;
    const user = app.getCurrentUser();
    if (!user || !user._id) {
      this.setData({ messageList: [], unreadCount: 0 });
      return;
    }

    this.resetAndLoad();
  },

  onPullDownRefresh() {
    this.resetAndLoad().finally(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    this.loadMessages();
  },

  async resetAndLoad() {
    this.setData({
      pageNo: 1,
      messageList: [],
      hasMore: true,
    });
    await this.loadMessages(true);
  },

  async loadMessages(force = false) {
    const user = app.getCurrentUser();
    if (!user || !user._id) return;
    if (this.data.loading) return;
    if (!this.data.hasMore && !force) return;

    this.setData({ loading: true });

    try {
      const query = {
        receiverId: user._id,
      };

      if (this.data.activeFilter !== 'all') {
        query.type = this.data.activeFilter;
      }

      const res = await db.collection('messages')
        .where(query)
        .orderBy('createTime', 'desc')
        .skip((this.data.pageNo - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .get();

      const unreadRes = await db.collection('messages').where({
        receiverId: user._id,
        isRead: false,
      }).count();

      const formatted = res.data.map((item) => {
        const meta = getTypeMeta(item.type);
        return {
          ...item,
          metaLabel: meta.label,
          metaShort: (meta.label || '消').slice(0, 1),
          actionText: meta.action,
          accentColor: meta.color,
          timeText: formatDateTime(item.createTime),
        };
      });

      this.setData({
        unreadCount: unreadRes.total || 0,
        messageList: this.data.pageNo === 1 ? formatted : this.data.messageList.concat(formatted),
        pageNo: this.data.pageNo + 1,
        hasMore: formatted.length === PAGE_SIZE,
      });

      app.updateUnreadBadge();
    } catch (error) {
      console.error('load messages error', error);
      wx.showToast({ title: '消息加载失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  async changeFilter(e) {
    const { key } = e.currentTarget.dataset;
    if (key === this.data.activeFilter) return;

    this.setData({ activeFilter: key });
    await this.resetAndLoad();
  },

  openMessage(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({
      url: `/pages/student/messageDetail/messageDetail?id=${id}`,
    });
  },

  async markAllRead() {
    const user = app.getCurrentUser();
    if (!user || !user._id || !this.data.unreadCount) return;

    try {
      await db.collection('messages').where({
        receiverId: user._id,
        isRead: false,
      }).update({
        data: {
          isRead: true,
          readTime: db.serverDate(),
        },
      });

      this.setData({
        unreadCount: 0,
        messageList: this.data.messageList.map((item) => ({ ...item, isRead: true })),
      });

      app.updateUnreadBadge();
      wx.showToast({ title: '已全部标记已读', icon: 'success' });
    } catch (error) {
      console.error('mark all read error', error);
      wx.showToast({ title: '处理失败，请稍后重试', icon: 'none' });
    }
  },
});
