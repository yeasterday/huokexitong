const app = getApp();
const db = wx.cloud.database();
const innerAudioContext = wx.createInnerAudioContext();
const { formatDateKey } = require('../../../utils/date');

const SESSION_SIZE = 5;

function cloneWord(word) {
  return {
    _id: word._id,
    word: word.word,
    zh: word.zh,
    phonetic: word.phonetic || '',
    exEn: word.exEn || '',
    exZh: word.exZh || '',
    imgUrl: word.imgUrl || '',
    bank_type: word.bank_type,
  };
}

Page({
  data: {
    step: 'dashboard',
    loading: false,
    userInfo: null,
    score: 0,
    streak: 0,
    todayDone: false,
    wrongbookCount: 0,
    recordCount: 0,
    recentAccuracy: 0,
    currentBankId: 'zhongkao',
    bankConfig: {
      zhongkao: { name: '中考高频核心词库', total: 1600 },
      gaokao: { name: '高考必刷词汇', total: 3500 },
    },
    userProgressMap: {},
    totalLearned: 0,
    wordList: [],
    currentIndex: 0,
    currentWord: {},
    showTranslation: false,
    quizIndex: 0,
    quizSelected: -1,
    quizShowResult: false,
    correctCount: 0,
    wrongWords: [],
    durationSeconds: 0,
    rewardPoints: 0,
    lastSessionSummary: null,
  },

  async onLoad() {
    const lastBankId = wx.getStorageSync('lastBankId') || 'zhongkao';
    this.setData({ currentBankId: lastBankId });
    wx.setNavigationBarTitle({ title: '词汇闯关' });
  },

  async onShow() {
    await app.globalData.sessionReady;
    this.loadDashboard();
  },

  onUnload() {
    innerAudioContext.stop();
  },

  async loadDashboard() {
    const user = app.getCurrentUser();
    if (!user || !user._id) {
      this.setData({
        userInfo: null,
        score: 0,
        streak: 0,
        todayDone: false,
        wrongbookCount: 0,
        recordCount: 0,
        recentAccuracy: 0,
        userProgressMap: {},
        totalLearned: 0,
        step: 'dashboard',
      });
      return;
    }

    try {
      const latestUser = await app.refreshCurrentUser() || user;
      const bankId = this.data.currentBankId;
      const progressMap = latestUser.progress || {};
      const [wrongRes, recordRes] = await Promise.all([
        db.collection('quest_wrong_words').where({ userId: latestUser._id }).count().catch(() => ({ total: 0 })),
        db.collection('quest_records')
          .where({ userId: latestUser._id })
          .orderBy('createTime', 'desc')
          .limit(20)
          .get()
          .catch(() => ({ data: [] })),
      ]);

      const recentRecords = recordRes.data || [];
      const recentAccuracy = recentRecords.length
        ? Math.round(
          recentRecords.reduce((total, item) => total + (item.accuracy || 0), 0) / recentRecords.length,
        )
        : 0;

      this.setData({
        userInfo: latestUser,
        score: latestUser.score || 0,
        streak: latestUser.questStreak || 0,
        todayDone: latestUser.lastQuestDate === app.getTodayKey(),
        wrongbookCount: wrongRes.total || 0,
        recordCount: recentRecords.length,
        recentAccuracy,
        userProgressMap: progressMap,
        totalLearned: progressMap[bankId] || 0,
        step: 'dashboard',
      });
    } catch (error) {
      console.error('load quest dashboard error', error);
    }
  },

  changeBank(e) {
    const bankId = e.currentTarget.dataset.id;
    if (!bankId || bankId === this.data.currentBankId) return;

    const progressMap = this.data.userProgressMap || {};
    this.setData({
      currentBankId: bankId,
      totalLearned: progressMap[bankId] || 0,
    });
    wx.setStorageSync('lastBankId', bankId);
  },

  async startLearning() {
    const user = await app.requireLogin();
    if (!user || !user._id) return;

    const bankId = this.data.currentBankId;
    const skipCount = this.data.totalLearned || 0;

    wx.showLoading({ title: '拉取词库中...' });

    try {
      const res = await db.collection('words_lib')
        .where({ bank_type: bankId })
        .skip(skipCount)
        .limit(SESSION_SIZE)
        .get();

      wx.hideLoading();

      if (!res.data.length) {
        wx.showToast({ title: '这套词库已经学完了', icon: 'none' });
        return;
      }

      const words = this.generateQuizOptions(res.data);
      this.sessionStartedAt = Date.now();

      this.setData({
        step: 'learn',
        wordList: words,
        currentIndex: 0,
        currentWord: words[0],
        showTranslation: false,
        quizIndex: 0,
        quizSelected: -1,
        quizShowResult: false,
        correctCount: 0,
        wrongWords: [],
        rewardPoints: 0,
        durationSeconds: 0,
        lastSessionSummary: null,
      });

      this.playAudio(words[0].word);
    } catch (error) {
      wx.hideLoading();
      console.error('start learning error', error);
      wx.showToast({ title: '词库加载失败，请稍后再试', icon: 'none' });
    }
  },

  generateQuizOptions(words) {
    const allMeanings = words.map((item) => item.zh);
    const fallbackOptions = ['n. 能力', 'v. 放弃', 'adj. 重要的', 'adv. 突然地', 'n. 机会'];

    return words.map((wordObj) => {
      const wrongOptions = allMeanings.filter((item) => item !== wordObj.zh);
      while (wrongOptions.length < 3) {
        wrongOptions.push(fallbackOptions[wrongOptions.length % fallbackOptions.length]);
      }

      wrongOptions.sort(() => 0.5 - Math.random());
      const finalOptions = wrongOptions.slice(0, 3).concat(wordObj.zh).sort(() => 0.5 - Math.random());

      return {
        ...wordObj,
        options: finalOptions,
        correctIdx: finalOptions.indexOf(wordObj.zh),
      };
    });
  },

  playAudio(wordStr) {
    const word = wordStr || this.data.currentWord.word;
    if (!word) return;
    innerAudioContext.src = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=2`;
    innerAudioContext.play();
  },

  showAnswer() {
    this.setData({ showTranslation: true });
  },

  nextWord() {
    const nextIdx = this.data.currentIndex + 1;
    if (nextIdx < this.data.wordList.length) {
      const nextWord = this.data.wordList[nextIdx];
      this.setData({
        currentIndex: nextIdx,
        currentWord: nextWord,
        showTranslation: false,
      });
      this.playAudio(nextWord.word);
      return;
    }

    const firstWord = this.data.wordList[0];
    this.setData({
      step: 'quiz',
      quizIndex: 0,
      currentWord: firstWord,
      quizSelected: -1,
      quizShowResult: false,
    });
    this.playAudio(firstWord.word);
  },

  selectOption(e) {
    if (this.data.quizShowResult) return;

    const index = Number(e.currentTarget.dataset.index);
    const currentWord = this.data.currentWord;
    const isCorrect = index === currentWord.correctIdx;
    const wrongWords = this.data.wrongWords.slice();

    if (!isCorrect) {
      wx.vibrateShort({ fail: () => {} });
      wrongWords.push(cloneWord(currentWord));
    }

    this.setData({
      quizSelected: index,
      quizShowResult: true,
      correctCount: isCorrect ? this.data.correctCount + 1 : this.data.correctCount,
      wrongWords,
    });
  },

  nextQuiz() {
    const nextIdx = this.data.quizIndex + 1;
    if (nextIdx < this.data.wordList.length) {
      const nextWord = this.data.wordList[nextIdx];
      this.setData({
        quizIndex: nextIdx,
        currentWord: nextWord,
        quizSelected: -1,
        quizShowResult: false,
      });
      this.playAudio(nextWord.word);
      return;
    }

    const durationSeconds = Math.max(1, Math.round((Date.now() - (this.sessionStartedAt || Date.now())) / 1000));
    const rewardPoints = 10 + this.data.correctCount;
    const accuracy = this.data.wordList.length
      ? Math.round((this.data.correctCount / this.data.wordList.length) * 100)
      : 0;

    this.setData({
      step: 'result',
      durationSeconds,
      rewardPoints,
      lastSessionSummary: {
        totalCount: this.data.wordList.length,
        correctCount: this.data.correctCount,
        wrongCount: this.data.wordList.length - this.data.correctCount,
        accuracy,
      },
    });
  },

  async finishSession() {
    const user = app.getCurrentUser();
    if (!user || !user._id) {
      this.quitToDashboard();
      return;
    }

    const totalCount = this.data.wordList.length;
    const wrongCount = totalCount - this.data.correctCount;
    const accuracy = totalCount ? Math.round((this.data.correctCount / totalCount) * 100) : 0;
    const bankId = this.data.currentBankId;
    const bankName = this.data.bankConfig[bankId].name;
    const rewardPoints = this.data.rewardPoints || (10 + this.data.correctCount);
    const todayKey = app.getTodayKey();

    wx.showLoading({ title: '保存本次闯关...' });

    try {
      const latestUser = await app.refreshCurrentUser() || user;
      const previousDate = latestUser.lastQuestDate;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = formatDateKey(yesterday);

      let nextStreak = 1;
      if (previousDate === todayKey) {
        nextStreak = latestUser.questStreak || 1;
      } else if (previousDate === yesterdayKey) {
        nextStreak = (latestUser.questStreak || 0) + 1;
      }

      await db.collection('users').doc(latestUser._id).update({
        data: {
          score: db.command.inc(rewardPoints),
          [`progress.${bankId}`]: db.command.inc(totalCount),
          lastQuestDate: todayKey,
          questStreak: nextStreak,
        },
      });

      await db.collection('quest_records').add({
        data: {
          userId: latestUser._id,
          orgId: latestUser.orgId || '',
          orgName: latestUser.orgName || '',
          bankId,
          bankName,
          totalCount,
          correctCount: this.data.correctCount,
          wrongCount,
          accuracy,
          rewardPoints,
          durationSeconds: this.data.durationSeconds,
          words: this.data.wordList.map((item) => cloneWord(item)),
          wrongWords: this.data.wrongWords,
          dateKey: todayKey,
          createTime: db.serverDate(),
        },
      });

      await Promise.all(
        this.data.wrongWords.map(async (item) => {
          const existRes = await db.collection('quest_wrong_words').where({
            userId: latestUser._id,
            bankId,
            wordId: item._id,
          }).limit(1).get();

          if (existRes.data.length) {
            return db.collection('quest_wrong_words').doc(existRes.data[0]._id).update({
              data: {
                wrongCount: db.command.inc(1),
                latestWrongTime: db.serverDate(),
                word: item.word,
                zh: item.zh,
                phonetic: item.phonetic || '',
                exEn: item.exEn || '',
                exZh: item.exZh || '',
              },
            });
          }

          return db.collection('quest_wrong_words').add({
            data: {
              userId: latestUser._id,
              orgId: latestUser.orgId || '',
              orgName: latestUser.orgName || '',
              bankId,
              bankName,
              wordId: item._id,
              word: item.word,
              zh: item.zh,
              phonetic: item.phonetic || '',
              exEn: item.exEn || '',
              exZh: item.exZh || '',
              wrongCount: 1,
              latestWrongTime: db.serverDate(),
              createTime: db.serverDate(),
            },
          });
        }),
      );

      wx.hideLoading();
      await this.loadDashboard();
      wx.showToast({ title: '闯关结果已保存', icon: 'success' });
    } catch (error) {
      wx.hideLoading();
      console.error('finish session error', error);
      wx.showToast({ title: '保存失败，请稍后再试', icon: 'none' });
    }
  },

  quitToDashboard() {
    innerAudioContext.stop();
    this.setData({ step: 'dashboard' });
  },

  goToRecords() {
    wx.navigateTo({ url: '/pages/student/questRecords/questRecords' });
  },

  goToWrongbook() {
    wx.navigateTo({ url: '/pages/student/questWrongbook/questWrongbook' });
  },

  goToCalendar() {
    wx.navigateTo({ url: '/pages/student/questCalendar/questCalendar' });
  },

  goToRank() {
    wx.navigateTo({ url: '/pages/student/rank/rank' });
  },
});
