const db = wx.cloud.database();
const _ = db.command;

const COLORS = {
  huo: '#d32f2f', shui: '#1976d2', jin: '#fbc02d', mu: '#388e3c', tu: '#5d4037', default: '#8d6e63'
};

Page({
  data: { pet: null, score: 0, expPercent: 0, showBag: false, bagItems: [], dialogText: '' },

  onShow() { this.loadPetData(); },

  loadPetData() {
    const user = wx.getStorageSync('currentUser');
    if (!user) return;
    db.collection('users').doc(user._id).get().then(res => {
      const pet = res.data.pet;
      if (pet) {
        let bagList = [];
        const bag = res.data.bag || {};
        const info = res.data.bagInfo || {};
        for(let k in bag) { if(bag[k] > 0) bagList.push({ name: k, count: bag[k], ...info[k] }); }

        this.setData({
          user: res.data, score: res.data.score || 0, pet: pet,
          expPercent: (pet.exp / (pet.level * 100)) * 100,
          bagItems: bagList
        }, () => {
          setTimeout(() => this.drawTruePixelPet(), 100);
        });
      }
    });
  },

  // 🌟 核心：真正的像素艺术绘图（模仿星露谷形态）
  drawTruePixelPet() {
    const query = wx.createSelectorQuery();
    query.select('#petCanvas').fields({ node: true, size: true }).exec((res) => {
      if (!res[0] || !res[0].node) return;
      const canvas = res[0].node;
      const ctx = canvas.getContext('2d');
      const dpr = wx.getSystemInfoSync().pixelRatio;
      canvas.width = res[0].width * dpr;
      canvas.height = res[0].height * dpr;
      ctx.scale(dpr, dpr);

      const pet = this.data.pet;
      const theme = COLORS[pet.evoAttr || 'default'];
      const s = 12; // 🌟 像素点大小，控制颗粒感
      const ox = 3, oy = 5; // 坐标偏移

      ctx.clearRect(0, 0, 300, 300);

      // --- 绘制函数：只用 fillRect 保证硬边缘 ---
      const drawP = (x, y, color) => {
        ctx.fillStyle = color;
        ctx.fillRect((ox + x) * s, (oy + y) * s, s, s);
      };

      // 1. 绘制神兽本体（点阵坐标，模仿旺崽/龙）
      const body = [
        [3,2],[4,2],[5,2],[6,2],[7,2],[8,2],[9,2],[10,2], // 顶
        [2,3],[3,3],[4,3],[5,3],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],
        [2,4],[3,4],[4,4],[5,4],[6,4],[7,4],[8,4],[9,4],[10,4],[11,4],
        [1,5],[2,5],[3,5],[4,5],[5,5],[6,5],[7,5],[8,5],[9,5],[10,5],[11,5],[12,5],
        [1,6],[2,6],[3,6],[4,6],[5,6],[6,6],[7,6],[8,6],[9,6],[10,6],[11,6],[12,6],
        [2,7],[3,7],[4,7],[5,7],[6,7],[7,7],[8,7],[9,7],[10,7],[11,7],
        [3,8],[4,8],[5,8],[6,8],[7,8],[8,8],[9,8],[10,8] // 底
      ];
      body.forEach(p => drawP(p[0], p[1], theme));

      // 2. 绘制勾边（深色勾边是星露谷精髓）
      const outline = [
        [3,1],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],
        [2,2],[11,2],[1,3],[12,3],[0,4],[13,4],[0,5],[13,5],[1,6],[12,6],[2,7],[11,7],[3,9],[4,9],[5,9],[6,9],[7,9],[8,9],[9,9],[10,9]
      ];
      outline.forEach(p => drawP(p[0], p[1], '#3e2723'));

      // 3. 绘制眼睛（经典的方块眼）
      drawP(4, 4, '#fff'); drawP(5, 4, '#000'); // 左眼
      drawP(8, 4, '#fff'); drawP(9, 4, '#000'); // 右眼

      // 4. 进化特征：翅膀（如果是火系且Lv5+）
      if (pet.level >= 5) {
        const wingColor = pet.evoAttr === 'huo' ? '#ff1744' : theme;
        const wings = [
          [-1,3],[-2,3],[-2,4],[-3,4],[-3,5],[-2,5],[-1,5], // 左翼
          [14,3],[15,3],[15,4],[16,4],[16,5],[15,5],[14,5] // 右翼
        ];
        wings.forEach(p => drawP(p[0], p[1], wingColor));
      }
    });
  },

  // 功能逻辑保留
  feedPet(e) {
    const type = e.currentTarget.dataset.type;
    let pet = this.data.pet;
    if (this.data.score < 10) return wx.showToast({ title: '积分不足', icon: 'none' });
    this.updatePet(pet, type, 30, 10, -10, '口感极佳！');
  },

  useItem(e) {
    const name = e.currentTarget.dataset.name;
    const eff = this.data.user.bagInfo[name].effects || { exp: 50 };
    let pet = this.data.pet;
    pet.stats.jin += (eff.jin || 0); pet.stats.mu += (eff.mu || 0);
    pet.stats.shui += (eff.shui || 0); pet.stats.huo += (eff.huo || 0); pet.stats.tu += (eff.tu || 0);
    this.updatePet(pet, null, eff.exp, 0, 0, `吸收了【${name}】！`, `bag.${name}`);
  },

  updatePet(pet, statType, exp, val, score, msg, bagKey) {
    pet.exp += exp;
    if(statType) pet.stats[statType] += val;
    while (pet.exp >= pet.level * 100) {
      pet.exp -= pet.level * 100; pet.level += 1;
      if (pet.level % 5 === 0) {
        const s = pet.stats; const max = Math.max(s.jin, s.mu, s.shui, s.huo, s.tu);
        pet.evoAttr = max === s.huo ? 'huo' : (max === s.shui ? 'shui' : (max === s.jin ? 'jin' : (max === s.mu ? 'mu' : 'tu')));
      }
    }
    let up = { pet }; if(score) up.score = _.inc(score); if(bagKey) up[bagKey] = _.inc(-1);
    db.collection('users').doc(this.data.user._id).update({ data: up }).then(() => this.loadPetData());
  },

  playWithPet() {
    this.showDialog('神兽去后山寻宝了...');
    setTimeout(() => {
      const bonus = Math.floor(Math.random()*50 + 20);
      db.collection('users').doc(this.data.user._id).update({ data: { score: _.inc(bonus) } }).then(() => {
        this.loadPetData(); this.showDialog(`找到了 ${bonus} 灵力积分！`);
      });
    }, 1500);
  },

  renamePet() {
    wx.showModal({ title: '重命名', editable: true, success: (res) => {
      if(res.confirm) db.collection('users').doc(this.data.user._id).update({ data: { 'pet.name': res.content } }).then(() => this.loadPetData());
    }});
  },
  openBag() { this.setData({ showBag: true }); },
  closeBag() { this.setData({ showBag: false }); },
  stopP() {},
  showDialog(text) { this.setData({ dialogText: text }); setTimeout(() => this.setData({ dialogText: '' }), 3000); }
});