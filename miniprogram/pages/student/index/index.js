const app = getApp();
const db = wx.cloud.database();
const { formatMonthDay, sumProgress } = require('../../../utils/date');

const PAGE_SIZE = 10;

Page({
  data: {
    keyword: '',
    moments: [],
    userInfo: {},
    showCommentInput: false,
    commentContent: '',
    activeMomentIndex: null,
    loadingMoments: false,
    pageNo: 1,
    hasMore: true,
    taskCards: [],
    notices: [],
    overview: {
      score: 0,
      totalLearned: 0,
      unreadCount: 0,
      resourceCount: 0,
      pendingOrders: 0,
    },
  },

  async onShow() {
    await app.globalData.sessionReady;
    const user = app.getCurrentUser() || {};
    this.setData({ userInfo: user });
    await this.loadPage(true);
  },

  onPullDownRefresh() {
    this.loadPage(true).finally(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    this.loadMoments();
  },

  async loadPage(reset = false) {
    await Promise.all([
      this.loadDashboardData(),
      this.loadMoments(reset),
    ]);
  },

  async loadDashboardData() {
    const user = app.getCurrentUser();

    if (!user || !user._id) {
      this.setData({
        taskCards: [
          { key: 'login', title: '绑定微信登录', desc: '下次打开可自动进入', value: '立即开始', action: 'goToLogin', highlight: true },
          { key: 'policy', title: '政策速览', desc: '先看招生与升学指引', value: '查看', action: 'navToPolicy' },
          { key: 'video', title: '精品视频', desc: '快速了解课程与内容', value: '查看', action: 'navToVideo' },
          { key: 'org', title: '选择机构', desc: '加入专属校区和任务体系', value: '入驻', action: 'navToSchools' },
        ],
        notices: [
          { id: 'guest-1', text: '登录并绑定当前微信后，下次可直接回到你的学习首页。' },
          { id: 'guest-2', text: '先逛政策解读和精品视频，再决定加入哪个校区。' },
        ],
        overview: {
          score: 0,
          totalLearned: 0,
          unreadCount: 0,
          resourceCount: 0,
          pendingOrders: 0,
        },
      });
      return;
    }

    try {
      const latestUser = await app.refreshCurrentUser() || user;
      const todayKey = app.getTodayKey();

      const [unreadRes, resourceRes, orderRes, latestResources] = await Promise.all([
        db.collection('messages').where({
          receiverId: latestUser._id,
          isRead: false,
        }).count(),
        db.collection('my_resources').where({ userId: latestUser._id }).count().catch(async () => {
          const fallback = await db.collection('resources').where({ userId: latestUser._id }).count();
          return fallback;
        }),
        db.collection('orders').where({
          userId: latestUser._id,
        }).limit(100).get().catch(() => ({ data: [] })),
        db.collection('resources')
          .where({ status: 'published' })
          .orderBy('createTime', 'desc')
          .limit(2)
          .get()
          .catch(() => ({ data: [] })),
      ]);

      const unreadCount = unreadRes.total || 0;
      const resourceCount = resourceRes.total || 0;
      const pendingOrders = (orderRes.data || []).filter((item) => {
        const status = String(item.status || '');
        return status === 'pending' || status.includes('待');
      }).length;
      const totalLearned = sumProgress(latestUser.progress || {});
      const needsCheckIn = latestUser.lastCheckInDate !== todayKey;
      const learnedToday = latestUser.lastQuestDate === todayKey;

      const taskCards = [
        {
          key: 'checkin',
          title: needsCheckIn ? '今日签到' : '签到完成',
          desc: needsCheckIn ? '完成签到可获得 5 积分' : '今天已经完成签到',
          value: needsCheckIn ? '+5 分' : '已完成',
          action: needsCheckIn ? 'doCheckIn' : 'goToProfile',
          highlight: needsCheckIn,
        },
        {
          key: 'quest',
          title: learnedToday ? '今日闯关已完成' : '今日词汇闯关',
          desc: learnedToday ? '去看复盘记录或错词本' : '继续完成今天的 5 词训练',
          value: `${totalLearned} 词`,
          action: 'goToQuest',
        },
        {
          key: 'message',
          title: '消息中心',
          desc: unreadCount > 0 ? `你有 ${unreadCount} 条未读提醒` : '互动消息都在这里',
          value: unreadCount > 0 ? `${unreadCount} 条` : '已清空',
          action: 'goToMessages',
          highlight: unreadCount > 0,
        },
        {
          key: 'resource',
          title: '我的资料与订单',
          desc: pendingOrders > 0 ? `还有 ${pendingOrders} 个订单待发货` : '资料和兑换记录集中查看',
          value: `${resourceCount} 份`,
          action: 'goToMyAssets',
        },
      ];

      const notices = [
        {
          id: 'notice-user',
          text: latestUser.orgName
            ? `你当前已加入 ${latestUser.orgName}，可以查看专属课程和资源。`
            : '填写邀请码加入校区后，可获得专属课程、资料和老师端服务。',
        },
        {
          id: 'notice-message',
          text: unreadCount > 0
            ? `有 ${unreadCount} 条互动提醒还没查看，记得及时回复。`
            : '你的消息中心已经清空，继续发动态或参与互动吧。',
        },
        ...latestResources.data.map((item, index) => ({
          id: `notice-resource-${index}`,
          text: `最新资料上架：${item.title}`,
        })),
      ].slice(0, 4);

      this.setData({
        userInfo: latestUser,
        taskCards,
        notices,
        overview: {
          score: latestUser.score || 0,
          totalLearned,
          unreadCount,
          resourceCount,
          pendingOrders,
        },
      });

      app.updateUnreadBadge();
    } catch (error) {
      console.error('load dashboard data error', error);
    }
  },

  async loadMoments(reset = false) {
    if (this.data.loadingMoments) return;
    if (!this.data.hasMore && !reset) return;

    this.setData({ loadingMoments: true });

    try {
      const currentUserId = this.data.userInfo._id;
      let myFollows = [];

      if (currentUserId) {
        const followRes = await db.collection('follows').where({ followerId: currentUserId }).get();
        myFollows = followRes.data.map((item) => item.followedId);
      }

      const pageNo = reset ? 1 : this.data.pageNo;
      const res = await db.collection('moments')
        .orderBy('createTime', 'desc')
        .skip((pageNo - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .get();

      const realMoments = res.data.map((item) => ({
        ...item,
        time: item.createTime ? formatMonthDay(item.createTime) : '刚刚',
        likes: item.likes || 0,
        comments: item.comments || 0,
        isFollowed: myFollows.includes(item.userId),
        isLiked: (item.likedBy || []).includes(currentUserId),
      }));

      this.setData({
        moments: reset ? realMoments : this.data.moments.concat(realMoments),
        pageNo: pageNo + 1,
        hasMore: realMoments.length === PAGE_SIZE,
      });
    } catch (error) {
      console.error('load moments error', error);
      if (reset) {
        this.setData({ moments: [] });
      }
    } finally {
      this.setData({ loadingMoments: false });
    }
  },

  handleKeywordInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  onSearch() {
    const keyword = this.data.keyword.trim();
    wx.navigateTo({
      url: keyword
        ? `/pages/student/search/search?keyword=${encodeURIComponent(keyword)}`
        : '/pages/student/search/search',
    });
  },

  clearSearch() {
    this.setData({ keyword: '' });
  },

  openTask(e) {
    const { action } = e.currentTarget.dataset;
    if (action && typeof this[action] === 'function') {
      this[action]();
    }
  },

  goToLogin() {
    wx.navigateTo({ url: '/pages/login/login' });
  },

  goToQuest() {
    wx.switchTab({ url: '/pages/student/quest/quest' });
  },

  goToMessages() {
    wx.navigateTo({ url: '/pages/student/messages/messages' });
  },

  goToMyAssets() {
    wx.navigateTo({ url: '/pages/student/myResources/myResources' });
  },

  goToProfile() {
    wx.switchTab({
      url: '/pages/student/profile/profile',
      fail: () => wx.navigateTo({ url: '/pages/student/profile/profile' }),
    });
  },

  navToPolicy() {
    wx.navigateTo({ url: '/pages/student/policy/policy' });
  },

  navToResource() {
    wx.navigateTo({ url: '/pages/student/resourceDetail/resourceDetail' });
  },

  navToVideo() {
    wx.navigateTo({ url: '/pages/student/video/video' });
  },

  navToPoints() {
    wx.switchTab({ url: '/pages/student/shop/shop' });
  },

  navToSchools() {
    wx.navigateTo({ url: '/pages/org/org' });
  },

  goToUserPage(e) {
    const targetId = e.currentTarget.dataset.userid;
    if (!targetId) return;
    wx.navigateTo({ url: `/pages/student/userMoments/userMoments?userId=${targetId}` });
  },

  async followAuthor(e) {
    const user = app.getCurrentUser();
    if (!user || !user._id) {
      wx.showToast({ title: '登录后才能关注同学', icon: 'none' });
      return;
    }

    const index = e.currentTarget.dataset.index;
    const targetUser = this.data.moments[index];
    const isCurrentlyFollowed = targetUser.isFollowed;

    wx.showLoading({ title: '处理中...' });

    try {
      if (isCurrentlyFollowed) {
        const fRes = await db.collection('follows').where({
          followerId: user._id,
          followedId: targetUser.userId,
        }).get();
        if (fRes.data.length > 0) {
          await db.collection('follows').doc(fRes.data[0]._id).remove();
        }
      } else {
        await db.collection('follows').add({
          data: {
            followerId: user._id,
            followedId: targetUser.userId,
            targetName: targetUser.name,
            targetAvatar: targetUser.avatar,
            createTime: db.serverDate(),
          },
        });
      }

      const newMoments = this.data.moments.map((item) => (
        item.userId === targetUser.userId
          ? { ...item, isFollowed: !isCurrentlyFollowed }
          : item
      ));

      this.setData({ moments: newMoments });
      wx.showToast({ title: !isCurrentlyFollowed ? '关注成功' : '已取消关注', icon: 'success' });
    } catch (error) {
      console.error('follow author error', error);
      wx.showToast({ title: '处理失败，请稍后再试', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  openComment(e) {
    const user = app.getCurrentUser();
    if (!user || !user._id) {
      wx.showToast({ title: '登录后才能评论', icon: 'none' });
      return;
    }

    this.setData({
      showCommentInput: true,
      activeMomentIndex: e.currentTarget.dataset.index,
      commentContent: '',
    });
  },

  closeComment() {
    this.setData({ showCommentInput: false });
  },

  handleCommentInput(e) {
    this.setData({ commentContent: e.detail.value });
  },

  async sendComment() {
    const user = app.getCurrentUser();
    if (!user || !user._id) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    const content = this.data.commentContent.trim();
    if (!content) {
      wx.showToast({ title: '先写点内容吧', icon: 'none' });
      return;
    }

    const index = this.data.activeMomentIndex;
    const moment = this.data.moments[index];

    const newComment = {
      name: user.nickname || user.name || '同学',
      content,
      time: Date.now(),
    };

    wx.showLoading({ title: '发送中...' });

    try {
      await db.collection('moments').doc(moment._id).update({
        data: {
          commentsList: db.command.push(newComment),
          comments: db.command.inc(1),
        },
      });

      if (moment.userId && moment.userId !== user._id) {
        await db.collection('messages').add({
          data: {
            type: 'comment',
            receiverId: moment.userId,
            senderName: newComment.name,
            senderAvatar: user.avatar,
            content,
            momentText: moment.content ? moment.content.substring(0, 24) : '',
            createTime: db.serverDate(),
            isRead: false,
          },
        });
      }

      const moments = this.data.moments.slice();
      if (!moments[index].commentsList) moments[index].commentsList = [];
      moments[index].commentsList.push(newComment);
      moments[index].comments = (moments[index].comments || 0) + 1;

      this.setData({
        moments,
        showCommentInput: false,
        commentContent: '',
      });

      app.updateUnreadBadge();
      wx.showToast({ title: '评论成功', icon: 'success' });
    } catch (error) {
      console.error('send comment error', error);
      wx.showToast({ title: '评论失败，请稍后重试', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  async toggleLike(e) {
    const user = app.getCurrentUser();
    if (!user || !user._id) {
      wx.showToast({ title: '登录后才能点赞', icon: 'none' });
      return;
    }

    const index = e.currentTarget.dataset.index;
    const moment = this.data.moments[index];
    const isCurrentlyLiked = moment.isLiked;

    const keyLiked = `moments[${index}].isLiked`;
    const keyLikesCount = `moments[${index}].likes`;

    this.setData({
      [keyLiked]: !isCurrentlyLiked,
      [keyLikesCount]: isCurrentlyLiked ? (moment.likes - 1) : (moment.likes + 1),
    });

    wx.vibrateShort();

    try {
      await db.collection('moments').doc(moment._id).update({
        data: {
          likes: db.command.inc(isCurrentlyLiked ? -1 : 1),
          likedBy: isCurrentlyLiked ? db.command.pull(user._id) : db.command.push(user._id),
        },
      });

      if (!isCurrentlyLiked && moment.userId && moment.userId !== user._id) {
        await db.collection('messages').add({
          data: {
            type: 'like',
            receiverId: moment.userId,
            senderName: user.nickname || user.name || '同学',
            senderAvatar: user.avatar,
            momentText: moment.content ? moment.content.substring(0, 24) : '',
            createTime: db.serverDate(),
            isRead: false,
          },
        });
        app.updateUnreadBadge();
      }
    } catch (error) {
      console.error('toggle like error', error);
      this.setData({
        [keyLiked]: isCurrentlyLiked,
        [keyLikesCount]: moment.likes,
      });
    }
  },

  goToPublish() {
    const user = app.getCurrentUser();
    if (!user || !user._id) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    wx.navigateTo({ url: '/pages/student/publish/publish' });
  },
});
