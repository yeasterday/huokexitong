const db = wx.cloud.database();

Page({
  data: {
    name: '', imageUrl: '', price: '',
    types: ['虚拟荣誉', '线下福利', '智宠道具'],
    typeIndex: 0,
    propIcon: '💊', propDesc: '', 
    addExp: 0, addJin: 0, addMu: 0, addShui: 0, addHuo: 0, addTu: 0 // 改成五行
  },

  onTypeChange(e) { this.setData({ typeIndex: e.detail.value }); },
  chooseImage() {
    wx.chooseMedia({ count: 1, mediaType: ['image'], success: (res) => { this.setData({ imageUrl: res.tempFiles[0].tempFilePath }); } });
  },

  submit() {
    const { name, price, types, typeIndex, imageUrl, propIcon, propDesc, addExp, addJin, addMu, addShui, addHuo, addTu } = this.data;
    if (!name || !price) return wx.showToast({ title: '请填写名称和积分', icon: 'none' });

    wx.showLoading({ title: '上架中...' });
    const category = types[typeIndex];

    let dataObj = { name, price: parseInt(price), category, createTime: db.serverDate() };
    if (imageUrl) dataObj.imageUrl = imageUrl;

    if (category === '智宠道具') {
      dataObj.icon = propIcon || '🎁';
      dataObj.desc = propDesc || '神秘五行道具';
      dataObj.effects = {
        exp: parseInt(addExp) || 0,
        jin: parseInt(addJin) || 0,
        mu: parseInt(addMu) || 0,
        shui: parseInt(addShui) || 0,
        huo: parseInt(addHuo) || 0,
        tu: parseInt(addTu) || 0
      };
    }

    db.collection('shop_items').add({ data: dataObj }).then(() => {
      wx.hideLoading(); wx.showToast({ title: '上架成功', icon: 'success' });
      setTimeout(() => { wx.navigateBack(); }, 1500);
    });
  }
});