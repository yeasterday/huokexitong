const db = wx.cloud.database();
const innerAudioContext = wx.createInnerAudioContext();

Page({
  data: {
    step: 'dashboard', 
    score: 0,
    
    // 词库状态配置
    currentBankId: 'zhongkao',
    bankConfig: {
      'zhongkao': { name: '中考高频核心词库', total: 1600 },
      'gaokao': { name: '高考必刷词汇', total: 3500 }
    },
    
    wordList: [], // 当前正在背的 5 个词
    totalLearned: 0, 
    userProgressMap: {}, 

    // 认词与测试状态
    currentIndex: 0,
    currentWord: {},
    showTranslation: false,
    quizIndex: 0,
    quizSelected: -1,
    quizShowResult: false
  },

  onLoad() {
    const lastBankId = wx.getStorageSync('lastBankId') || 'zhongkao';
    this.setData({ currentBankId: lastBankId });
    this.loadUserData();
  },

  onShow() {
    wx.setNavigationBarTitle({ title: '词汇集训营' });
  },

  loadUserData() {
    const user = wx.getStorageSync('currentUser');
    if (!user || !user._id) return;

    db.collection('users').doc(user._id).get().then(res => {
      const userData = res.data;
      const progressMap = userData.progress || {}; 
      
      this.setData({ 
        score: userData.score || 0,
        userProgressMap: progressMap,
        totalLearned: progressMap[this.data.currentBankId] || 0
      });
    }).catch(err => console.error("数据拉取失败", err));
  },

  changeBank(e) {
    const targetId = e.currentTarget.dataset.id;
    if (targetId === this.data.currentBankId) return; 
    
    this.setData({
      currentBankId: targetId,
      totalLearned: this.data.userProgressMap[targetId] || 0
    });
    wx.setStorageSync('lastBankId', targetId); 
  },

  // 核心：点击开始背词时，从云端按进度拉取新词
  startLearning() {
    const bankId = this.data.currentBankId;
    const skipCount = this.data.totalLearned || 0;
    const limitCount = 5; // 每次学 5 个词

    wx.showLoading({ title: '拉取词库中' });
    
    db.collection('words_lib')
      .where({ bank_type: bankId })
      .skip(skipCount)
      .limit(limitCount)
      .get()
      .then(res => {
        wx.hideLoading();
        const words = res.data;
        
        if (words.length === 0) {
          return wx.showToast({ title: '本词库已全部学完！', icon: 'none' });
        }

        // 拿到云端纯粹的单词数据后，通过算法动态生成带有 4 个选项的题库结构
        const processedWords = this.generateQuizOptions(words);

        this.setData({
          wordList: processedWords,
          step: 'learn',
          currentIndex: 0,
          currentWord: processedWords[0],
          showTranslation: false
        });
        this.playAudio(processedWords[0].word);
      })
      .catch(err => {
        wx.hideLoading();
        console.error("加载失败", err);
        wx.showToast({ title: '网络异常', icon: 'error' });
      });
  },

  // 核心算法：自动提取本次学习的其他单词释义，作为干扰项生成考题
  generateQuizOptions(words) {
    const allMeanings = words.map(w => w.zh); // 提取所有中文
    const fallbackOptions = ['n. 能力', 'v. 放弃', 'adj. 重要的', 'adv. 突然地']; // 兜底选项

    return words.map(wordObj => {
      // 1. 过滤掉正确的中文，剩下的作为错误选项池
      let wrongOptions = allMeanings.filter(m => m !== wordObj.zh);
      
      // 2. 如果这批单词不够多（凑不齐3个错误选项），用兜底词补齐
      while (wrongOptions.length < 3) {
        wrongOptions.push(fallbackOptions.pop());
      }

      // 3. 随机抽取 3 个错误选项，再加入 1 个正确选项
      wrongOptions.sort(() => 0.5 - Math.random());
      let finalOptions = wrongOptions.slice(0, 3);
      finalOptions.push(wordObj.zh);

      // 4. 将这 4 个选项再次打乱顺序
      finalOptions.sort(() => 0.5 - Math.random());

      // 5. 记录正确选项被打乱后的最终索引位置
      const correctIdx = finalOptions.indexOf(wordObj.zh);

      return {
        ...wordObj,
        options: finalOptions,
        correctIdx: correctIdx
      };
    });
  },

  playAudio(wordStr) {
    const word = wordStr || this.data.currentWord.word;
    innerAudioContext.src = `https://dict.youdao.com/dictvoice?audio=${word}&type=2`;
    innerAudioContext.play();
  },

  showAnswer() { this.setData({ showTranslation: true }); },

  nextWord(e) {
    const nextIdx = this.data.currentIndex + 1;
    if (nextIdx < this.data.wordList.length) {
      this.setData({
        currentIndex: nextIdx,
        currentWord: this.data.wordList[nextIdx],
        showTranslation: false
      });
      this.playAudio(this.data.wordList[nextIdx].word);
    } else {
      wx.showToast({ title: '开始随堂测试', icon: 'none' });
      this.setData({
        step: 'quiz',
        quizIndex: 0,
        currentWord: this.data.wordList[0],
        quizSelected: -1,
        quizShowResult: false
      });
      this.playAudio(this.data.wordList[0].word);
    }
  },

  selectOption(e) {
    if (this.data.quizShowResult) return;
    const idx = e.currentTarget.dataset.index;
    this.setData({ quizSelected: idx, quizShowResult: true });
    if(idx !== this.data.currentWord.correctIdx) { wx.vibrateShort(); }
  },

  nextQuiz() {
    const nextIdx = this.data.quizIndex + 1;
    if (nextIdx < this.data.wordList.length) {
      this.setData({
        quizIndex: nextIdx,
        currentWord: this.data.wordList[nextIdx],
        quizSelected: -1,
        quizShowResult: false
      });
      this.playAudio(this.data.wordList[nextIdx].word);
    } else {
      this.setData({ step: 'result' });
    }
  },

  finishSession() {
    wx.showLoading({ title: '同步数据中' });
    const user = wx.getStorageSync('currentUser');
    const bankId = this.data.currentBankId;
    const learnedCount = this.data.wordList.length; 
    
    if (user && user._id) {
      const updateData = {
        score: db.command.inc(15),
        [`progress.${bankId}`]: db.command.inc(learnedCount)
      };

      db.collection('users').doc(user._id).update({
        data: updateData
      }).then(() => {
        wx.hideLoading();
        this.loadUserData(); 
        this.setData({ step: 'dashboard' }); 
        wx.showToast({ title: '进度已保存', icon: 'success' });
      }).catch(err => {
        wx.hideLoading();
        wx.showToast({ title: '网络异常', icon: 'error' });
      });
    } else {
      wx.hideLoading();
      this.setData({ step: 'dashboard' });
    }
  },

  quitToDashboard() { this.setData({ step: 'dashboard' }); },
  comingSoon() { wx.showToast({ title: '模块研发中', icon: 'none' }); }
});