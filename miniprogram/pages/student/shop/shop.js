const app = getApp();
const db = wx.cloud.database();

function getCategoryKey(item = {}) {
  const text = String(item.category || '').toLowerCase();
  if (text.includes('实物') || text.includes('线下') || text.includes('physical')) return 'physical';
  if (text.includes('宠') || text.includes('道具') || text.includes('pet')) return 'pet';
  return 'virtual';
}

function getCategoryLabel(key) {
  if (key === 'physical') return '实物福利';
  if (key === 'pet') return '灵宠道具';
  return '虚拟权益';
}

Page({
  data: {
    userInfo: {},
    score: 0,
    filter: 'all',
    itemList: [],
    displayList: [],
    showBuyModal: false,
    currentBuyItem: null,
    buyQuantity: 1,
    addressInfo: '',
  },

  async onShow() {
    await app.globalData.sessionReady;
    this.loadPage();
  },

  async loadPage() {
    const user = app.getCurrentUser() || {};
    this.setData({ userInfo: user, score: user.score || 0 });
    await Promise.all([
      this.loadUserScore(),
      this.loadShopItems(),
    ]);
  },

  async loadUserScore() {
    const user = app.getCurrentUser();
    if (!user || !user._id) return;

    try {
      const res = await db.collection('users').doc(user._id).get();
      this.setData({ score: res.data.score || 0, userInfo: res.data });
    } catch (error) {
      console.error('load user score error', error);
    }
  },

  async loadShopItems() {
    try {
      const user = app.getCurrentUser() || {};
      const res = await db.collection('shop_items')
        .orderBy('createTime', 'desc')
        .limit(100)
        .get();

      const itemList = (res.data || [])
        .filter((item) => item.status !== 'draft')
        .filter((item) => {
          if (!user.orgId || !item.orgId) return true;
          return item.orgId === user.orgId;
        })
        .map((item) => ({
          ...item,
          categoryKey: getCategoryKey(item),
          categoryLabel: getCategoryLabel(getCategoryKey(item)),
        }));

      this.setData({ itemList }, () => this.applyFilter());
    } catch (error) {
      console.error('load shop items error', error);
      wx.showToast({ title: '加载商城失败', icon: 'none' });
    }
  },

  changeFilter(e) {
    const filter = e.currentTarget.dataset.filter;
    if (!filter || filter === this.data.filter) return;
    this.setData({ filter }, () => this.applyFilter());
  },

  applyFilter() {
    const displayList = this.data.filter === 'all'
      ? this.data.itemList
      : this.data.itemList.filter((item) => item.categoryKey === this.data.filter);
    this.setData({ displayList });
  },

  async exchange(e) {
    const item = e.currentTarget.dataset.item;
    const user = await app.requireLogin();
    if (!user || !user._id) return;

    this.setData({
      showBuyModal: true,
      currentBuyItem: item,
      buyQuantity: 1,
      addressInfo: '',
    });
  },

  closeBuyModal() {
    this.setData({ showBuyModal: false });
  },

  stopP() {},

  subQty() {
    if (this.data.buyQuantity <= 1) return;
    this.setData({ buyQuantity: this.data.buyQuantity - 1 });
  },

  addQty() {
    this.setData({ buyQuantity: this.data.buyQuantity + 1 });
  },

  handleInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [field]: e.detail.value });
  },

  async confirmBuy() {
    const item = this.data.currentBuyItem;
    const qty = this.data.buyQuantity;
    if (!item) return;

    if (item.categoryKey === 'physical' && !this.data.addressInfo.trim()) {
      wx.showToast({ title: '请先填写收货信息', icon: 'none' });
      return;
    }

    const totalPoints = (Number(item.price) || 0) * qty;
    if (this.data.score < totalPoints) {
      wx.showToast({ title: '积分不足，先去闯关赚积分吧', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '提交订单...' });

    try {
      const user = await app.refreshCurrentUser();
      const latestScore = user.score || 0;
      if (latestScore < totalPoints) {
        wx.hideLoading();
        wx.showToast({ title: '积分已经变化，请重新下单', icon: 'none' });
        this.loadPage();
        return;
      }

      const updateData = {
        score: db.command.inc(-totalPoints),
      };

      if (item.categoryKey === 'pet') {
        updateData[`bag.${item.name}`] = db.command.inc(qty);
        updateData[`bagInfo.${item.name}`] = {
          icon: item.icon || '道具',
          desc: item.desc || '灵宠道具',
          effects: item.effects || { exp: 30 },
        };
      }

      await db.collection('users').doc(user._id).update({ data: updateData });

      await db.collection('orders').add({
        data: {
          userId: user._id,
          nickname: user.nickname || user.name || '学员',
          userAvatar: user.avatar || user.avatarUrl || '',
          orgId: item.orgId || user.orgId || '',
          orgName: item.orgName || user.orgName || '',
          itemId: item._id,
          itemName: item.name,
          title: item.name,
          category: item.categoryLabel,
          categoryKey: item.categoryKey,
          quantity: qty,
          unitPrice: Number(item.price) || 0,
          price: totalPoints,
          totalPoints,
          address: item.categoryKey === 'physical' ? this.data.addressInfo.trim() : '',
          deliveryInfo: '',
          status: item.categoryKey === 'physical' ? 'pending' : 'completed',
          createTime: db.serverDate(),
        },
      });

      wx.hideLoading();
      this.setData({ showBuyModal: false });
      wx.showToast({
        title: item.categoryKey === 'physical' ? '订单已提交' : '兑换成功',
        icon: 'success',
      });
      this.loadPage();
    } catch (error) {
      wx.hideLoading();
      console.error('confirm buy error', error);
      wx.showToast({ title: '兑换失败，请稍后重试', icon: 'none' });
    }
  },
});
