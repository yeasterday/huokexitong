const app = getApp();
const db = wx.cloud.database();
const { getOrgScope } = require('../../../utils/org');
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

Page({
  data: {
    filter: 'pending',
    orders: [],
    displayOrders: [],
  },

  onShow() {
    this.loadAllOrders();
  },

  async loadAllOrders() {
    const user = await app.requireLogin({ redirect: false });
    if (!user || !user._id) return;
    const { orgId } = getOrgScope(user);

    try {
      const res = await db.collection('orders')
        .where({ orgId })
        .orderBy('createTime', 'desc')
        .limit(100)
        .get();

      const orders = (res.data || []).map((item) => ({
        ...item,
        statusKey: normalizeStatus(item.status),
        timeText: formatDateTime(item.createTime),
      }));

      this.setData({ orders }, () => this.applyFilter());
    } catch (error) {
      console.error('load teacher orders error', error);
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

  finishOrder(e) {
    const order = e.currentTarget.dataset.order;
    if (!order || !order._id) return;

    wx.showModal({
      title: '确认发货',
      editable: true,
      placeholderText: '可填写快递单号或取货备注',
      success: async (res) => {
        if (!res.confirm) return;
        const deliveryInfo = (res.content || '').trim();
        try {
          await db.collection('orders').doc(order._id).update({
            data: {
              status: 'shipped',
              deliveryInfo,
              shippedTime: db.serverDate(),
            },
          });

          await db.collection('messages').add({
            data: {
              type: 'order',
              receiverId: order.userId,
              senderName: '课程中心',
              senderAvatar: '',
              content: `${order.itemName} 已发货${deliveryInfo ? `：${deliveryInfo}` : ''}`,
              momentText: order.itemName,
              createTime: db.serverDate(),
              isRead: false,
            },
          }).catch(() => {});

          wx.showToast({ title: '已标记发货', icon: 'success' });
          this.loadAllOrders();
        } catch (error) {
          console.error('finish order error', error);
          wx.showToast({ title: '处理失败，请稍后重试', icon: 'none' });
        }
      },
    });
  },
});
