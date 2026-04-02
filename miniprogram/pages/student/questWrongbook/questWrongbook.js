const app = getApp();
const db = wx.cloud.database();
const innerAudioContext = wx.createInnerAudioContext();
const { formatDateTime } = require('../../../utils/date');

Page({
  data: {
    loading: true,
    list: [],
    displayList: [],
    filter: 'all',
    keyword: '',
  },

  onShow() {
    this.loadList();
  },

  onUnload() {
    innerAudioContext.stop();
  },

  async loadList() {
    const user = await app.requireLogin();
    if (!user || !user._id) {
      this.setData({ loading: false, list: [], displayList: [] });
      return;
    }

    this.setData({ loading: true });

    try {
      const where = { userId: user._id };
      if (this.data.filter !== 'all') {
        where.bankId = this.data.filter;
      }

      const res = await db.collection('quest_wrong_words')
        .where(where)
        .orderBy('latestWrongTime', 'desc')
        .limit(100)
        .get();

      const list = (res.data || []).map((item) => ({
        ...item,
        timeText: formatDateTime(item.latestWrongTime || item.createTime),
      }));

      this.setData({ loading: false, list }, () => this.applyKeyword());
    } catch (error) {
      console.error('load wrongbook error', error);
      this.setData({ loading: false, list: [], displayList: [] });
      wx.showToast({ title: '加载错词本失败', icon: 'none' });
    }
  },

  changeFilter(e) {
    const filter = e.currentTarget.dataset.filter;
    if (!filter || filter === this.data.filter) return;
    this.setData({ filter });
    this.loadList();
  },

  handleKeyword(e) {
    this.setData({ keyword: e.detail.value }, () => this.applyKeyword());
  },

  applyKeyword() {
    const keyword = this.data.keyword.trim().toLowerCase();
    if (!keyword) {
      this.setData({ displayList: this.data.list });
      return;
    }

    const displayList = this.data.list.filter((item) => (
      String(item.word || '').toLowerCase().includes(keyword)
      || String(item.zh || '').toLowerCase().includes(keyword)
    ));
    this.setData({ displayList });
  },

  playWord(e) {
    const word = e.currentTarget.dataset.word;
    if (!word) return;
    innerAudioContext.src = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=2`;
    innerAudioContext.play();
  },

  removeWord(e) {
    const id = e.currentTarget.dataset.id;
    if (!id) return;

    wx.showModal({
      title: '移出错词本',
      content: '确认把这个单词从错词本移除吗？',
      success: async (res) => {
        if (!res.confirm) return;

        try {
          await db.collection('quest_wrong_words').doc(id).remove();
          wx.showToast({ title: '已移除', icon: 'success' });
          this.loadList();
        } catch (error) {
          console.error('remove wrong word error', error);
          wx.showToast({ title: '操作失败，请稍后重试', icon: 'none' });
        }
      },
    });
  },

  goQuest() {
    wx.switchTab({ url: '/pages/student/quest/quest' });
  },
});
