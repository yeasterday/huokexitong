const app = getApp();
const db = wx.cloud.database();
const { formatDateTime } = require('../../../utils/date');

function normalizeTime(input) {
  if (!input) return 0;
  if (typeof input === 'string' || typeof input === 'number') return new Date(input).getTime();
  if (input.$date) return new Date(input.$date).getTime();
  return new Date(input).getTime();
}

Page({
  data: {
    loading: true,
    summary: {
      checkins: 0,
      quests: 0,
      resources: 0,
      posts: 0,
    },
    timeline: [],
  },

  onShow() {
    this.loadGrowth();
  },

  async loadGrowth() {
    const user = await app.requireLogin();
    if (!user || !user._id) {
      this.setData({ loading: false });
      return;
    }

    this.setData({ loading: true });

    try {
      const [checkinsRes, questRes, ordersRes, resourceRes, momentsRes] = await Promise.all([
        db.collection('daily_checkins').where({ userId: user._id }).orderBy('createTime', 'desc').limit(30).get().catch(() => ({ data: [] })),
        db.collection('quest_records').where({ userId: user._id }).orderBy('createTime', 'desc').limit(30).get().catch(() => ({ data: [] })),
        db.collection('orders').where({ userId: user._id }).orderBy('createTime', 'desc').limit(30).get().catch(() => ({ data: [] })),
        db.collection('my_resources').where({ userId: user._id }).orderBy('buyTime', 'desc').limit(30).get().catch(async () => (
          db.collection('resources').where({ userId: user._id }).orderBy('buyTime', 'desc').limit(30).get()
        )),
        db.collection('moments').where({ userId: user._id }).orderBy('createTime', 'desc').limit(30).get().catch(() => ({ data: [] })),
      ]);

      const timeline = []
        .concat((checkinsRes.data || []).map((item) => ({
          id: `checkin-${item._id}`,
          time: item.createTime,
          timeText: formatDateTime(item.createTime || item.dateKey),
          type: 'checkin',
          title: '完成每日签到',
          desc: '连续学习从稳定签到开始',
        })))
        .concat((questRes.data || []).map((item) => ({
          id: `quest-${item._id}`,
          time: item.createTime,
          timeText: formatDateTime(item.createTime),
          type: 'quest',
          title: `完成 ${item.bankName || '词汇闯关'}`,
          desc: `正确率 ${item.accuracy || 0}% · 奖励 ${item.rewardPoints || 0} 积分`,
        })))
        .concat((ordersRes.data || []).map((item) => ({
          id: `order-${item._id}`,
          time: item.createTime,
          timeText: formatDateTime(item.createTime),
          type: 'order',
          title: `提交订单：${item.itemName || item.title || '未命名商品'}`,
          desc: `当前状态：${item.status || '已提交'}`,
        })))
        .concat((resourceRes.data || []).map((item) => ({
          id: `resource-${item._id}`,
          time: item.buyTime || item.createTime,
          timeText: formatDateTime(item.buyTime || item.createTime),
          type: 'resource',
          title: `解锁资料：${item.title || '学习资料'}`,
          desc: item.type ? `资料分类：${item.type}` : '已加入我的资料',
        })))
        .concat((momentsRes.data || []).map((item) => ({
          id: `moment-${item._id}`,
          time: item.createTime,
          timeText: formatDateTime(item.createTime),
          type: 'moment',
          title: '发布了一条动态',
          desc: item.content ? item.content.slice(0, 40) : '上传了新的学习动态',
        })))
        .sort((left, right) => normalizeTime(right.time) - normalizeTime(left.time));

      this.setData({
        loading: false,
        summary: {
          checkins: (checkinsRes.data || []).length,
          quests: (questRes.data || []).length,
          resources: (resourceRes.data || []).length,
          posts: (momentsRes.data || []).length,
        },
        timeline: timeline.slice(0, 60),
      });
    } catch (error) {
      console.error('load growth error', error);
      this.setData({ loading: false, timeline: [] });
      wx.showToast({ title: '加载成长记录失败', icon: 'none' });
    }
  },
});
