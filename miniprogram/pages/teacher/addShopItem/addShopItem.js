const app = getApp();
const db = wx.cloud.database();
const { getOrgScope } = require('../../../utils/org');

Page({
  data: {
    name: '',
    imageUrl: '',
    price: '',
    types: ['虚拟权益', '实物福利', '灵宠道具'],
    typeIndex: 0,
    propIcon: '',
    propDesc: '',
    addExp: 0,
    addJin: 0,
    addMu: 0,
    addShui: 0,
    addHuo: 0,
    addTu: 0,
  },

  onTypeChange(e) {
    this.setData({ typeIndex: Number(e.detail.value) });
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: (res) => {
        this.setData({ imageUrl: res.tempFiles[0].tempFilePath });
      },
    });
  },

  async submit() {
    const user = await app.requireLogin({ redirect: false });
    if (!user || !user._id) {
      wx.showToast({ title: '请先登录教师账号', icon: 'none' });
      return;
    }

    const {
      name,
      price,
      types,
      typeIndex,
      imageUrl,
      propIcon,
      propDesc,
      addExp,
      addJin,
      addMu,
      addShui,
      addHuo,
      addTu,
    } = this.data;

    if (!name.trim() || !price) {
      wx.showToast({ title: '请填写商品名称和积分', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '上架中...' });

    try {
      let finalImage = imageUrl;
      if (imageUrl && !String(imageUrl).startsWith('cloud://')) {
        const imageMatch = imageUrl.match(/\.[^.]+?$/);
        const suffix = (imageMatch && imageMatch[0]) || '.png';
        const uploadRes = await wx.cloud.uploadFile({
          cloudPath: `shop/${Date.now()}${suffix}`,
          filePath: imageUrl,
        });
        finalImage = uploadRes.fileID;
      }

      const category = types[typeIndex];
      const { orgId, orgName } = getOrgScope(user);
      const dataObj = {
        name: name.trim(),
        price: Number(price) || 0,
        category,
        orgId,
        orgName,
        status: 'published',
        createTime: db.serverDate(),
      };

      if (finalImage) dataObj.imageUrl = finalImage;

      if (category === '灵宠道具') {
        dataObj.icon = propIcon || '宠';
        dataObj.desc = propDesc || '灵宠成长道具';
        dataObj.effects = {
          exp: Number(addExp) || 0,
          jin: Number(addJin) || 0,
          mu: Number(addMu) || 0,
          shui: Number(addShui) || 0,
          huo: Number(addHuo) || 0,
          tu: Number(addTu) || 0,
        };
      } else if (propDesc) {
        dataObj.desc = propDesc;
      }

      await db.collection('shop_items').add({ data: dataObj });

      wx.hideLoading();
      wx.showToast({ title: '商品已上架', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 500);
    } catch (error) {
      wx.hideLoading();
      console.error('submit shop item error', error);
      wx.showToast({ title: '上架失败，请稍后重试', icon: 'none' });
    }
  },
});
