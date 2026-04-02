// cloudfunctions/generatePet/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const GRID_SIZE = 12;
const PALETTE = ['#f44336','#E91E63','#9C27B0','#2196F3','#00BCD4','#4CAF50','#FFEB3B','#FF9800','#795548'];

exports.main = async (event, context) => {
  let canvas = new Array(GRID_SIZE * GRID_SIZE).fill('');
  let themeColor = PALETTE[Math.floor(Math.random() * PALETTE.length)];
  let subColor = PALETTE[Math.floor(Math.random() * PALETTE.length)];
  
  // 1. 云端极速对称解算
  const half = GRID_SIZE / 2;
  for (let r = 1; r < GRID_SIZE - 1; r++) {
    let start = Math.floor(Math.random() * (half - 1)) + 1;
    let end = Math.floor(Math.random() * (half - start)) + start + 1;
    for (let c = start; c < end; c++) {
      let color = (Math.random() > 0.3) ? themeColor : subColor;
      if (c === start || r === 1 || r === GRID_SIZE - 2) color = '#000000'; // 描黑边
      canvas[r * GRID_SIZE + c] = color;
      canvas[r * GRID_SIZE + (GRID_SIZE - 1 - c)] = color; // 对称
    }
  }

  // 2. 点睛
  let eyeR = Math.floor(GRID_SIZE * 0.3);
  let eyeC = Math.floor(half * 0.6);
  canvas[eyeR * GRID_SIZE + eyeC] = '#000000';
  canvas[eyeR * GRID_SIZE + eyeC + 1] = '#ffffff';
  canvas[eyeR * GRID_SIZE + (GRID_SIZE - 1 - eyeC)] = '#000000';
  canvas[eyeR * GRID_SIZE + (GRID_SIZE - 1 - eyeC) - 1] = '#ffffff';

  // 3. 将矩阵渲染为工业级 SVG 矢量图代码
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${GRID_SIZE*10} ${GRID_SIZE*10}">`;
  for(let r=0; r<GRID_SIZE; r++){
    for(let c=0; c<GRID_SIZE; c++){
       let color = canvas[r*GRID_SIZE + c];
       if(color) {
          // 这里以后可以无限叠加衣服、武器的矩形图层
          svg += `<rect x="${c*10}" y="${r*10}" width="10" height="10" fill="${color}" />`;
       }
    }
  }
  svg += `</svg>`;

  // 4. 转码输出给手机端
  const base64Svg = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
  
  return {
    svgData: base64Svg,
    name: "智脑" + Math.floor(Math.random() * 999) + "号"
  }
}