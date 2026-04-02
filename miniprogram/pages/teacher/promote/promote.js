const app = getApp();
const db = wx.cloud.database();
const { getOrgScope } = require('../../../utils/org');

Page({
  data: {
    orgName: '',
    inviteCode: '',
    stats: {
      students: 0,
      resources: 0,
      shopItems: 0,
    },
    promotions: [],
  },

  onShow() {
    this.loadPromotions();
  },

  async loadPromotions() {
    const user = await app.requireLogin({ redirect: false });
    if (!user || !user._id) return;
    const { orgId, orgName } = getOrgScope(user);

    try {
      const [studentRes, resourceRes, shopRes] = await Promise.all([
        db.collection('users').where({ orgId, role: 'student' }).count().catch(() => ({ total: 0 })),
        db.collection('resources').where({ orgId }).count().catch(() => ({ total: 0 })),
        db.collection('shop_items').where({ orgId }).count().catch(() => ({ total: 0 })),
      ]);

      this.setData({
        orgName,
        inviteCode: user.inviteCode || '',
        stats: {
          students: studentRes.total || 0,
          resources: resourceRes.total || 0,
          shopItems: shopRes.total || 0,
        },
        promotions: [
          {
            id: 'invite',
            title: `${orgName} 新生拉新`,
            type: '邀请码招生',
            desc: `把邀请码 ${user.inviteCode || '未配置'} 发给家长或学员，新注册会自动归属到当前校区。`,
            leads: studentRes.total || 0,
          },
          {
            id: 'resource',
            title: '资源包转化',
            type: '内容获客',
            desc: `当前已发布 ${resourceRes.total || 0} 份资源，可以结合政策解读和精品视频做引流。`,
            leads: resourceRes.total || 0,
          },
        ],
      });
    } catch (error) {
      console.error('load promote page error', error);
      wx.showToast({ title: '加载推广页失败', icon: 'none' });
    }
  },

  copyInviteCode() {
    if (!this.data.inviteCode) {
      wx.showToast({ title: '当前账号未配置邀请码', icon: 'none' });
      return;
    }
    wx.setClipboardData({
      data: this.data.inviteCode,
      success: () => wx.showToast({ title: '邀请码已复制', icon: 'success' }),
    });
  },

  previewPoster(e) {
    const item = e.currentTarget.dataset.item;
    wx.navigateTo({
      url: `/pages/student/share/share?title=${encodeURIComponent(item.title)}&inviteCode=${encodeURIComponent(this.data.inviteCode || '')}`,
    });
  },
});
