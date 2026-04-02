const app = getApp();
const db = wx.cloud.database();
const { formatDateTime } = require('../../../utils/date');

function normalizeStatus(status) {
  if (!status) return 'pending';
  if (status === 'pending' || status === 'shipped' || status === 'completed') return status;
  const text = String(status);
  if (text.includes('待')) return 'pending';
  if (text.includes('发')) return 'shipped';
  if (text.includes('完成')) return 'completed';
  return 'pending';
}

function getStatusText(status) {
  if (status === 'shipped') return '已发货';
  if (status === 'completed') return '已完成';
  return '待处理';
}

Page({
  data: {
    loading: true,
    filter: 'all',
    orders: [],
    displayOrders: [],
  },

  onShow() {
    this.loadOrders();
  },

  async loadOrders() {
    const user = await app.requireLogin();
    if (!user || !user._id) {
      this.setData({ loading: false, orders: [], displayOrders: [] });
      return;
    }

    this.setData({ loading: true });

    try {
      const res = await db.collection('orders')
        .where({ userId: user._id })
        .orderBy('createTime', 'desc')
        .limit(100)
        .get();

      const orders = (res.data || []).map((item) => {
        const statusKey = normalizeStatus(item.status);
        return {
          ...item,
          statusKey,
          statusText: getStatusText(statusKey),
          timeText: formatDateTime(item.createTime),
        };
      });

      this.setData({ loading: false, orders }, () => this.applyFilter());
    } catch (error) {
      console.error('load orders error', error);
      this.setData({ loading: false, orders: [], displayOrders: [] });
      wx.showToast({ title: '加载订单失败', icon: 'none' });
    }
  },

  changeFilter(e) {
    const filter = e.currentTarget.dataset.filter;
    if (!filter || filter === this.data.filter) return;
    this.setData({ filter }, () => this.applyFilter());
  },

  applyFilter() {
    const displayOrders = this.data.filter === 'all'
      ? this.data.orders
      : this.data.orders.filter((item) => item.statusKey === this.data.filter);

    this.setData({ displayOrders });
  },
});
