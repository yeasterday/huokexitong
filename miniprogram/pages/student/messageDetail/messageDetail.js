const app = getApp();
const db = wx.cloud.database();
const { formatDateTime } = require('../../../utils/date');

function getTypeMeta(type) {
  const map = {
    like: '点赞提醒',
    comment: '评论互动',
    order: '订单通知',
    system: '系统通知',
  };

  return map[type] || '消息详情';
}

Page({
  data: {
    message: null,
  },

  async onLoad(options) {
    await app.globalData.sessionReady;
    if (!options.id) {
      wx.showToast({ title: '消息不存在', icon: 'none' });
      return;
    }

    this.loadMessage(options.id);
  },

  async loadMessage(id) {
    try {
      const res = await db.collection('messages').doc(id).get();
      if (!res.data) {
        wx.showToast({ title: '消息不存在', icon: 'none' });
        return;
      }

      const message = {
        ...res.data,
        typeLabel: getTypeMeta(res.data.type),
        timeText: formatDateTime(res.data.createTime),
      };

      this.setData({ message });
      wx.setNavigationBarTitle({ title: message.typeLabel });

      if (!message.isRead) {
        await db.collection('messages').doc(id).update({
          data: {
            isRead: true,
            readTime: db.serverDate(),
          },
        });
        app.updateUnreadBadge();
      }
    } catch (error) {
      console.error('load message detail error', error);
      wx.showToast({ title: '消息加载失败', icon: 'none' });
    }
  },
});
