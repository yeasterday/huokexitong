# 青源智盟

一个基于微信小程序原生框架和微信云开发搭建的教育机构获客与学习运营项目。

它不是单点功能小程序，而是一套围绕教育机构私域运营设计的轻量化系统：把学生注册绑定、词汇闯关、签到积分、资源兑换、互动消息、教师运营、订单处理串成一条完整闭环。

当前仓库只聚焦微信小程序能力本身，不依赖独立 Web 前端，也不依赖单独部署的传统后端服务。核心能力由：

- 微信小程序原生页面
- 云数据库
- 云存储
- 云函数

共同组成。

## 最近更新

本次代码已补齐并落地以下能力：

- 登录注册接入 `auth` 云函数，支持 `wxOpenId` 绑定、会话回流、自动登录恢复
- 首页重做，增加任务看板、消息提醒、资源入口、搜索、政策和视频页面
- 消息中心升级为真实分页列表，支持点赞、评论、订单、系统消息分类
- 学生端任务闭环补齐
  - 词汇闯关
  - 闯关记录
  - 错词本
  - 学习日历
  - 连续闯关记录
- 个人中心重做
  - 资料完整度
  - 学习档案
  - 成长时间线
  - 签到落库
  - 资料/订单/消息统一入口
- 资源兑换闭环补齐
  - `resources` 作为资源主表
  - `my_resources` 作为个人资料库
  - `orders` 支持状态流转
- 教师端重做为真实机构维度数据
  - 统一使用 `orgId / orgName`
  - 仪表盘真实统计
  - 学员管理
  - 资源发布与审核
  - 商城商品管理
  - 订单发货并推送学生消息
  - 推广页和报表页接真实数据

## 项目定位

适合的使用场景：

- K12 教培机构私域运营
- 学习营 / 训练营 / 自习室的签到与激励
- 词汇学习、打卡、积分兑换一体化原型
- 教育 SaaS MVP 验证
- 课程项目、毕设项目、机构内部运营工具原型

这套系统的目标不是做一个单功能工具，而是打通以下链路：

1. 教师通过邀请码、海报、资源内容做拉新
2. 学生注册后自动绑定所属校区
3. 学生在小程序内完成签到、闯关、互动、兑换
4. 教师在小程序内完成发布、审核、商城、订单、报表
5. 通过消息、海报、内容和成长反馈提升留存与复购

## 核心功能

### 学生端

- 登录注册
  - 手机号注册
  - 邀请码绑定校区
  - 微信会话回流
- 首页
  - 学习总览
  - 今日任务卡片
  - 最新通知
  - 搜索入口
  - 动态流
- 互动社区
  - 发布动态
  - 点赞
  - 评论
  - 关注
  - 个人主页
  - 消息通知
- 词汇闯关
  - 中考 / 高考词库切换
  - 单词学习
  - 随堂测试
  - 结果结算
  - 错词沉淀
  - 闯关记录
  - 学习日历
- 积分体系
  - 注册奖励
  - 每日签到
  - 闯关奖励
  - 绑定手机号奖励
- 资料中心
  - 资料搜索
  - 政策内容
  - 视频内容
  - 资料兑换
  - 我的资料库
- 商城
  - 虚拟权益
  - 实物福利
  - 灵宠道具
  - 订单查看
- 个人中心
  - 头像昵称修改
  - 资料完整度
  - 学习档案
  - 成长时间线
  - 排行榜
  - 灵宠空间

### 教师端

- 工作台
  - 今日签到数
  - 今日闯关数
  - 在读学员数
  - 待处理订单数
  - 邀请码展示
- 学员管理
  - 按校区查看学生
  - 搜索姓名 / 昵称 / 手机号
  - 查看积分与累计学习词数
- 资源运营
  - 发布资源
  - 发布政策 / 视频 / 真题 / 素材
  - 审核与下架
- 商城运营
  - 上架商品
  - 配置灵宠道具效果
  - 按校区管理商品
- 订单处理
  - 查看订单
  - 标记发货
  - 自动给学生写入订单通知消息
- 推广与报表
  - 推广页展示邀请码和内容引流建议
  - 报表页按校区汇总签到、闯关、学习词数

## 技术栈

- 微信小程序原生开发
- 微信云开发 `wx.cloud`
- 云数据库
- 云存储
- 云函数
- Canvas 2D
- `wx.createInnerAudioContext`

## 项目结构

```text
huokexitong/
├─ miniprogram/
│  ├─ app.js
│  ├─ app.json
│  ├─ utils/
│  │  ├─ date.js
│  │  └─ org.js
│  └─ pages/
│     ├─ login/
│     ├─ org/
│     ├─ student/
│     │  ├─ index/
│     │  ├─ messages/
│     │  ├─ messageDetail/
│     │  ├─ search/
│     │  ├─ policy/
│     │  ├─ video/
│     │  ├─ quest/
│     │  ├─ questRecords/
│     │  ├─ questWrongbook/
│     │  ├─ questCalendar/
│     │  ├─ resourceDetail/
│     │  ├─ myResources/
│     │  ├─ orders/
│     │  ├─ shop/
│     │  ├─ profile/
│     │  ├─ archive/
│     │  ├─ growth/
│     │  ├─ rank/
│     │  ├─ pet/
│     │  ├─ publish/
│     │  ├─ userMoments/
│     │  ├─ followList/
│     │  ├─ poster/
│     │  ├─ share/
│     │  ├─ schoolDetail/
│     │  └─ courseList/
│     └─ teacher/
│        ├─ dashboard/
│        ├─ students/
│        ├─ addResource/
│        ├─ audit/
│        ├─ manageShop/
│        ├─ addShopItem/
│        ├─ orderList/
│        ├─ promote/
│        └─ report/
├─ cloudfunctions/
│  ├─ auth/
│  ├─ sendMessage/
│  ├─ generatePet/
│  └─ quickstartFunctions/
├─ project.config.json
└─ README.md
```

## 主要页面

### TabBar

- `pages/student/index/index`
- `pages/student/quest/quest`
- `pages/student/shop/shop`
- `pages/student/profile/profile`

### 学生端主要页面

- `pages/login/login`
- `pages/login/register`
- `pages/student/messages/messages`
- `pages/student/messageDetail/messageDetail`
- `pages/student/search/search`
- `pages/student/policy/policy`
- `pages/student/video/video`
- `pages/student/resourceDetail/resourceDetail`
- `pages/student/myResources/myResources`
- `pages/student/orders/orders`
- `pages/student/archive/archive`
- `pages/student/growth/growth`
- `pages/student/rank/rank`
- `pages/student/pet/pet`

### 教师端主要页面

- `pages/teacher/dashboard/dashboard`
- `pages/teacher/students/students`
- `pages/teacher/addResource/addResource`
- `pages/teacher/audit/audit`
- `pages/teacher/manageShop/manageShop`
- `pages/teacher/addShopItem/addShopItem`
- `pages/teacher/orderList/orderList`
- `pages/teacher/promote/promote`
- `pages/teacher/report/report`

## 云函数

### `auth`

当前主流程已接入。

支持动作：

- `checkSession`
- `login`
- `register`

作用：

- 用 `wxOpenId` 绑定当前微信会话
- 注册时按邀请码绑定教师 / 校区
- 登录后写回最新用户资料
- 小程序启动时可自动恢复登录会话

### `sendMessage`

仓库中保留，但当前主流程消息写入主要直接走数据库集合 `messages`。

### `generatePet`

保留的灵宠相关云函数目录。

### `quickstartFunctions`

云开发初始化模板遗留目录，不属于核心业务。

## 当前使用到的数据库集合

| 集合名 | 用途 | 关键字段 |
| --- | --- | --- |
| `users` | 学生 / 教师统一用户表 | `account` `phone` `passwordHash` `role` `name` `nickname` `avatar` `score` `orgId` `orgName` `inviteCode` `teacherId` `progress` `lastCheckInDate` `lastQuestDate` `questStreak` `profile` `pet` `bag` `bagInfo` |
| `words_lib` | 词库主表 | `word` `zh` `phonetic` `exEn` `exZh` `imgUrl` `bank_type` |
| `moments` | 动态内容 | `userId` `name` `avatar` `content` `images` `likes` `comments` `likedBy` `commentsList` `createTime` |
| `follows` | 关注关系 | `followerId` `followedId` `targetName` `targetAvatar` `createTime` |
| `messages` | 消息中心 | `type` `receiverId` `senderName` `senderAvatar` `content` `momentText` `isRead` `readTime` `createTime` |
| `resources` | 资源主表 | `title` `points` `content` `link` `fileId` `type` `status` `orgId` `orgName` `authorId` `authorName` `createTime` |
| `my_resources` | 学生已解锁资料 | `userId` `resourceId` `title` `type` `categoryKey` `content` `link` `fileId` `points` `orgId` `orgName` `buyTime` |
| `shop_items` | 商城商品 | `name` `price` `category` `imageUrl` `icon` `desc` `effects` `orgId` `orgName` `status` `createTime` |
| `orders` | 兑换订单 | `userId` `nickname` `itemId` `itemName` `category` `categoryKey` `quantity` `unitPrice` `totalPoints` `address` `deliveryInfo` `status` `orgId` `orgName` `createTime` |
| `quest_records` | 闯关记录 | `userId` `bankId` `bankName` `totalCount` `correctCount` `wrongCount` `accuracy` `rewardPoints` `durationSeconds` `words` `wrongWords` `dateKey` `orgId` `orgName` `createTime` |
| `quest_wrong_words` | 错词本 | `userId` `bankId` `bankName` `wordId` `word` `zh` `phonetic` `exEn` `exZh` `wrongCount` `latestWrongTime` `orgId` `orgName` `createTime` |
| `daily_checkins` | 每日签到记录 | `userId` `dateKey` `orgId` `orgName` `createTime` |
| `courses` | 课程列表 | `title` `school_id` / `schoolId` `schoolName` `price` 等 |

### 字段规范说明

- 当前机构维度统一使用 `orgId` 和 `orgName`
- `institutionId` 视为旧字段，文档与新增代码不再继续使用
- `resources` 和 `my_resources` 已拆分为主表与个人资料库
- `orders.status` 建议统一使用：
  - `pending`
  - `shipped`
  - `completed`

## 快速开始

### 1. 导入项目

使用微信开发者工具导入本仓库根目录。

### 2. 配置云环境

当前项目在 [miniprogram/app.js](miniprogram/app.js) 中写了云环境 ID。

如果你要部署到自己的环境，请修改：

```js
wx.cloud.init({
  env: '你的云环境 ID',
  traceUser: true,
})
```

### 3. 安装并部署云函数

至少需要部署：

- `cloudfunctions/auth`

如需使用仓库中其他云函数，再按需部署：

- `cloudfunctions/sendMessage`
- `cloudfunctions/generatePet`

### 4. 创建数据库集合

最少建议创建以下集合：

- `users`
- `words_lib`
- `moments`
- `follows`
- `messages`
- `resources`
- `my_resources`
- `shop_items`
- `orders`
- `quest_records`
- `quest_wrong_words`
- `daily_checkins`
- `courses`

### 5. 初始化基础数据

#### 教师账号

注册页当前面向学生账号，教师账号建议在数据库中手动创建。

最少字段示例：

```json
{
  "account": "13800138000",
  "phone": "13800138000",
  "passwordHash": "请用 auth 云函数同规则生成",
  "role": "teacher",
  "name": "张老师",
  "nickname": "张老师",
  "orgId": "org_demo_001",
  "orgName": "青水教育示例校区",
  "inviteCode": "QS2026",
  "score": 0
}
```

#### 词库数据 `words_lib`

示例字段：

```json
{
  "word": "abandon",
  "zh": "v. 放弃",
  "phonetic": "/əˈbændən/",
  "exEn": "He decided to abandon the plan.",
  "exZh": "他决定放弃这个计划。",
  "bank_type": "gaokao"
}
```

#### 商城商品 `shop_items`

示例字段：

```json
{
  "name": "单词挑战礼包",
  "price": 100,
  "category": "虚拟权益",
  "orgId": "org_demo_001",
  "orgName": "青水教育示例校区",
  "status": "published"
}
```

#### 资源数据 `resources`

示例字段：

```json
{
  "title": "2026 中考英语政策解读",
  "points": 20,
  "content": "适合初三学生和家长快速了解最新政策变化。",
  "type": "政策解读",
  "link": "https://example.com",
  "status": "published",
  "orgId": "org_demo_001",
  "orgName": "青水教育示例校区"
}
```

## 核心业务闭环

### 1. 学生注册与机构绑定

1. 学生输入手机号、昵称、密码注册
2. 可选填写教师邀请码
3. `auth` 云函数校验邀请码并写入 `orgId / orgName / teacherId`
4. 当前微信自动与账号绑定，后续打开小程序可自动回流

### 2. 学习激励

1. 学生签到获得积分，并写入 `daily_checkins`
2. 学生完成一轮词汇闯关
3. 系统写入：
   - `users.progress`
   - `users.lastQuestDate`
   - `users.questStreak`
   - `quest_records`
   - `quest_wrong_words`

### 3. 互动留存

1. 学生发布动态
2. 其他学生点赞、评论、关注
3. 系统写入 `messages`
4. 首页和“我的”页同步未读数

### 4. 资源与商城转化

1. 教师发布资源 / 商品
2. 学生消耗积分兑换
3. 资料进入 `my_resources`
4. 实物或权益订单进入 `orders`
5. 教师发货后，系统给学生写入 `order` 类型消息

## 当前状态

当前仓库已经具备一个完整可跑通的小程序 MVP：

- 学生端主闭环已通
- 教师端主闭环已通
- 登录、消息、任务、资料、商城、订单、成长档案均有真实页面和真实数据落库

但它仍然更接近“可运营原型 / MVP”，而不是已经完全产品化的商用系统。

## 仍需注意的点

- 没有完整自动化测试，建议每次改动后都在微信开发者工具和真机上走主流程
- 历史脏数据可能仍保留旧字段或旧状态值，当前代码做了部分兼容
- `sendMessage` 云函数尚未成为主流程依赖
- `org`、`schoolDetail`、`courseList`、`poster`、`share` 等辅助页面仍可继续增强
- 如果要正式商用，建议继续补：
  - 云函数级角色校验
  - 数据权限规则
  - 更严格的订单和积分事务处理
  - 教师账号后台创建工具
  - 资源 / 课程 / 活动更细化的运营模型

## 二次开发建议

优先级建议：

1. 先固化 `users`、`resources`、`orders`、`quest_records` 的最终字段结构
2. 补齐云开发权限规则，避免前端越权写数据
3. 给教师端增加更细粒度的资源审核、订单备注、学生详情页
4. 给学生端增加更多成长反馈，比如周报、连续学习奖励、错词复习计划
5. 如果后续需要多机构 SaaS 化，可继续围绕 `orgId` 做更严格的全链路隔离

## 仓库简介建议

如果要展示到 GitHub，可以使用下面这句简介：

> 一个基于微信小程序云开发的教育机构获客与学习运营系统原型，覆盖学生端学习激励、词汇闯关、互动消息、资料兑换、积分商城与教师端校区运营管理。
