const db = wx.cloud.database();

// 🌟 道具说明图鉴：全面对接【五行灵根】系统
const ITEM_DESC_DICT = {
  '补天丹': '蕴含纯净灵力的古老丹药，修为值暴增 +200！',
  '金晶铁': '至坚至锐的金系灵物，永久增加 50 点【金灵根】。',
  '建木叶': '采集自通天建木的嫩叶，永久增加 50 点【木灵根】。',
  '天河水': '取自九天之上的天河之水，永久增加 50 点【水灵根】。',
  '三昧火': '永不熄灭的纯阳真火，永久增加 50 点【火灵根】。',
  '息壤土': '万土之祖，落地即生，永久增加 50 点【土灵根】。',
  '全能耀星': '稀有的五行碎片！全系灵根 +30，修为值 +300。'
};

Page({
  data: { 
    score: 0, 
    virtualGoods: [], 
    realGoods: [], 
    petGoods: [],
    showBuyModal: false,
    currentBuyItem: null,
    buyQuantity: 1
  },

  onShow() { 
    this.loadUserScore(); 
    this.loadShopItems(); 
  },

  // 加载学生当前积分
  loadUserScore() {
    const user = wx.getStorageSync('currentUser');
    if (!user) return;
    db.collection('users').doc(user._id).get().then(res => {
      this.setData({ score: res.data.score || 0 });
    });
  },

  // 加载商城列表
  loadShopItems() {
    db.collection('shop_items').get().then(res => {
      this.setData({
        virtualGoods: res.data.filter(item => item.category === '虚拟荣誉'),
        realGoods: res.data.filter(item => item.category === '线下福利'),
        petGoods: res.data.filter(item => item.category === '智宠道具') 
      });
    });
  },

  // 唤起结算台
  exchange(e) {
    let item = e.currentTarget.dataset.item;
    
    // 🌟 动态匹配修仙文案
    item.desc = ITEM_DESC_DICT[item.name] || 
      (item.category === '智宠道具' ? '蕴含五行灵力的神秘道具。' : 
      (item.category === '线下福利' ? '精美实体奖品，兑换后请填写道友地址。' : '专属特权，即刻加持。'));

    this.setData({
      showBuyModal: true,
      currentBuyItem: item,
      buyQuantity: 1 
    });
  },

  closeBuyModal() { this.setData({ showBuyModal: false }); },
  subQty() { if (this.data.buyQuantity > 1) this.setData({ buyQuantity: this.data.buyQuantity - 1 }); },
  addQty() { this.setData({ buyQuantity: this.data.buyQuantity + 1 }); },

  // 确认购买
  confirmBuy() {
    const item = this.data.currentBuyItem;
    const qty = this.data.buyQuantity;
    const totalPrice = item.price * qty;

    if (this.data.score < totalPrice) {
      return wx.showToast({ title: '灵力积分不足，快去勤勉修习！', icon: 'none' });
    }

    if (item.category === '线下福利') {
      wx.showModal({
        title: '填写收件信息', editable: true, placeholderText: '请输入收货地址和电话',
        success: (res) => { if (res.confirm && res.content) this.processExchange(item, res.content, qty, totalPrice); }
      });
    } else {
      this.processExchange(item, '系统法阵发放', qty, totalPrice);
    }
  },

  // 🌟 核心引擎：处理扣款与存入乾坤袋
  processExchange(item, addressInfo, qty, totalPrice) {
    wx.showLoading({ title: '灵力流转中...' });
    const user = wx.getStorageSync('currentUser');
    const _ = db.command;

    // 1. 准备更新：扣积分
    let updateData = { score: _.inc(-totalPrice) };

    // 2. 🌟 乾坤袋逻辑同步
    if (item.category === '智宠道具') {
      // 增加数量
      updateData[`bag.${item.name}`] = _.inc(qty); 
      // 存储道具静态配置（包含校长设定的 effects 数值）
      updateData[`bagInfo.${item.name}`] = {
        icon: item.icon || '🎁',
        desc: item.desc,
        // 这里的 effects 包含 jin, mu, shui, huo, tu, exp
        effects: item.effects || { exp: 50 } 
      };
    }

    db.collection('users').doc(user._id).update({ data: updateData }).then(() => {
      // 记录非道具类的订单（用于老师后台核销）
      if (item.category !== '智宠道具') {
        db.collection('orders').add({
          data: { 
            userId: user._id, 
            nickname: user.nickname, 
            itemName: `${item.name} x${qty}`, 
            price: totalPrice, 
            address: addressInfo, 
            status: '待发货', 
            createTime: db.serverDate() 
          }
        });
      }
      
      wx.hideLoading();
      this.closeBuyModal(); 
      wx.showToast({ title: '已收入乾坤袋', icon: 'success' });
      this.loadUserScore(); // 刷新本地积分显示
    });
  }
});