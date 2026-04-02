Page({
  data: {
    promotions: [
      { id: 1, title: '0 元领艺术体验课', type: '裂变引流', desc: '新学员扫码即可免费预约价值 199 元的艺术课一节', leads: 12 },
      { id: 2, title: '暑期单词王打卡营', type: '品牌宣传', desc: '坚持打卡 21 天，赢取精美文具礼盒', leads: 45 }
    ]
  },
  previewPoster(e) {
    const item = e.currentTarget.dataset.item;
    wx.navigateTo({ url: `/pages/student/share/share?title=${item.title}` });
  }
});