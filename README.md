# 青源智盟

一个基于微信小程序原生框架 + 微信云开发搭建的教育机构获客与学习运营项目。

它不是单一功能的小程序，而是一套把“机构招生获客、学生注册绑定、日常学习打卡、积分激励、资源兑换、互动传播、教师端运营”串在一起的轻量教育 SaaS / MVP 原型。

适合的使用场景：

- K12 教培机构私域运营
- 自习室 / 学习营 /训练营的打卡激励
- 教育工作室的招生裂变与学员留存
- 课程项目、毕设项目、教育产品原型验证

## 项目定位

这套项目的核心思路不是“做一个单点工具”，而是围绕教育机构的完整转化链路设计：

1. 机构通过邀请码、海报、专属校区页等方式做拉新
2. 学生注册后加入机构体系，形成私域归属
3. 学生在小程序内完成词汇学习、签到、互动、兑换、养成
4. 教师端通过资源发布、商品管理、订单处理、学员运营完成转化闭环
5. 学生再通过海报、动态、活动传播带来新线索

从代码现状来看，它已经具备较完整的产品雏形，但整体更接近“可运行的 MVP / 原型系统”，距离正式商用还需要补齐权限、安全、数据结构统一和部分缺失模块。

## 核心功能

### 学生端

- 首页班级圈
  - 查看动态流
  - 发布图文动态
  - 点赞、评论、关注作者
  - 进入他人主页查看历史动态
- 词汇闯关
  - 支持中考 / 高考两个词库
  - 每次拉取 5 个单词进行学习
  - 学习完成后进入随堂测试
  - 完成一轮任务可获得积分奖励
- 积分体系
  - 新用户注册赠送积分
  - 每日签到加积分
  - 绑定手机号加积分
  - 完成学习任务加积分
- 积分商城
  - 虚拟荣誉类商品
  - 线下实物福利
  - 智宠道具
- 智宠空间
  - 像素神兽养成
  - 五行属性成长
  - 背包道具使用
  - 探宝获取积分
- 资源中心
  - 搜索资料
  - 消耗积分兑换资料
  - 在“我的书包”中提取资料链接
- 个人中心
  - 修改头像、昵称
  - 查看消息通知
  - 查看订单
  - 查看关注列表
  - 查看排行榜
  - 生成战绩海报

### 教师 / 机构端

- 工作台 / 数据大盘
  - 今日新增线索
  - 今日打卡人数
  - 在读学员数
- 学员管理
  - 查看学员档案
  - 搜索学员
  - Demo 模式注入模拟数据
- 招生活动 / 海报预览
  - 预设获客活动
  - 跳转预览分享海报
- 商城管理
  - 上架商品
  - 删除商品
  - 配置智宠道具属性
- 资源管理
  - 发布资料 / 课程资源
  - 审核并强制下架资料
- 订单处理
  - 查看待发货订单
  - 标记已发货
- 运营报表
  - 查看月报样例
  - 导出提示入口

### 机构展示页

- 展示平台价值与合作权益
- 提供微信二维码和微信号复制能力
- 作为机构合作 / 入驻落地页使用

## 主要业务闭环

### 1. 招生绑定

- 学生通过手机号注册
- 可选填写机构邀请码
- 系统根据邀请码匹配教师账号
- 注册成功后把学生挂到对应机构名下

### 2. 学习激励

- 学生完成签到、背词、互动后获得积分
- 积分可用于兑换资料、商品、道具
- 道具又可以继续用于宠物养成和互动体验

### 3. 社区留存

- 学生可发布动态、评论、点赞、关注
- 被点赞 / 评论的用户会收到消息通知
- 通过个人主页和关注列表形成轻社交关系

### 4. 转化成交

- 教师上架虚拟商品、线下福利、资源包
- 学生消耗积分兑换商品或资料
- 实物兑换生成订单，教师后台处理发货

## 技术栈

- 微信小程序原生开发
- 微信云开发 `wx.cloud`
- 云数据库
- 云存储
- 云函数
- Canvas 2D
- `wx.createInnerAudioContext` 单词发音

项目没有使用前后端分离框架，也没有引入统一的 Web 后端服务，整体以微信原生能力和云开发直连数据库为主。

## 项目结构

```text
huokexitong/
├─ miniprogram/                    # 小程序前端
│  ├─ app.js                       # 小程序入口，初始化云环境
│  ├─ app.json                     # 页面路由与 tabBar 配置
│  ├─ pages/
│  │  ├─ login/                    # 登录注册
│  │  ├─ org/                      # 机构入驻/合作页
│  │  ├─ student/                  # 学生端页面
│  │  └─ teacher/                  # 教师端页面
│  ├─ components/
│  │  └─ cloudTipModal/            # 云开发模板遗留组件
│  └─ images/                      # 项目素材
├─ cloudfunctions/                 # 云函数
│  ├─ generatePet/                 # 生成像素宠物 SVG
│  ├─ quickstartFunctions/         # 云开发默认示例函数
│  └─ sendMessage/                 # 订阅消息发送函数
├─ project.config.json             # 微信开发者工具配置
├─ project.private.config.json     # 本地私有配置
└─ uploadCloudFunction.sh          # 云函数上传脚本（当前仅覆盖示例函数）
```

## 页面结构

### 学生端页面

- `pages/student/index/index`
  - 首页 / 班级圈 / 动态流
- `pages/student/publish/publish`
  - 发布动态
- `pages/student/userMoments/userMoments`
  - 个人主页与历史动态
- `pages/student/followList/followList`
  - 我的关注
- `pages/student/messages/messages`
  - 点赞与评论消息通知
- `pages/student/quest/quest`
  - 词汇闯关学习页
- `pages/student/shop/shop`
  - 积分商城
- `pages/student/resourceDetail/resourceDetail`
  - 资源列表与积分兑换
- `pages/student/myResources/myResources`
  - 我的书包 / 已兑换资料
- `pages/student/orders/orders`
  - 我的订单
- `pages/student/profile/profile`
  - 个人中心
- `pages/student/rank/rank`
  - 排行榜
- `pages/student/pet/pet`
  - 智宠空间
- `pages/student/poster/poster`
  - Canvas 海报生成
- `pages/student/share/share`
  - 分享页 / 海报页
- `pages/student/schoolDetail/schoolDetail`
  - 机构详情入口页
- `pages/student/courseList/courseList`
  - 机构课程列表

### 教师端页面

- `pages/teacher/dashboard/dashboard`
  - 校长工作台 / 数据面板
- `pages/teacher/students/students`
  - 学员管理
- `pages/teacher/promote/promote`
  - 获客活动与海报预览
- `pages/teacher/report/report`
  - 月报页面
- `pages/teacher/manageShop/manageShop`
  - 商城商品管理
- `pages/teacher/addShopItem/addShopItem`
  - 新增商品
- `pages/teacher/addResource/addResource`
  - 发布资源
- `pages/teacher/orderList/orderList`
  - 待发货订单
- `pages/teacher/audit/audit`
  - 资源审核 / 强制下架

### 登录与机构页

- `pages/login/login`
- `pages/login/register`
- `pages/org/org`

## 当前使用到的数据库集合

| 集合名 | 用途 | 代码中的主要字段 |
| --- | --- | --- |
| `users` | 用户、学员、教师数据 | `account` `password` `role` `name` `nickname` `avatar` `phone` `score` `orgId` `orgName` `inviteCode` `progress` `pet` `bag` `bagInfo` `lastCheckInDate` |
| `moments` | 动态流 | `content` `images` `userId` `name` `avatar` `likes` `likedBy` `comments` `commentsList` `createTime` |
| `follows` | 关注关系 | `followerId` `followedId` `targetName` `targetAvatar` `createTime` |
| `messages` | 点赞 / 评论通知 | `receiverId` `senderName` `senderAvatar` `content` `momentText` `type` `isRead` `createTime` |
| `resources` | 资料资源 | `title` `points` `content` `link` `type` `downloads` `author` `createTime` |
| `shop_items` | 商城商品 | `name` `price` `category` `imageUrl` `icon` `desc` `effects` `createTime` |
| `orders` | 实物 / 权益兑换订单 | `userId` `nickname` `itemName` `price` `address` `status` `createTime` |
| `words_lib` | 背词词库 | `bank_type` `word` `phonetic` `zh` `exEn` `exZh` `imgUrl` |
| `courses` | 机构课程 | `school_id` 以及课程标题、价格、描述等业务字段 |
| `sales` | 腾讯云开发示例数据 | 仅 `quickstartFunctions` 使用，与主业务无关 |

### 关于 `resources` 集合的特别说明

当前代码里，`resources` 集合被同时用于两类数据：

- 平台公开资源列表
- 学生兑换后的“我的书包”记录

这意味着一个集合里混合了两种 schema。代码注释里其实提到过 `my_resources`，但最终实现仍然写回了 `resources`。如果继续迭代，建议尽快拆分为：

- `resources`：资源主表
- `my_resources`：用户已兑换资源表

## 云函数说明

| 云函数 | 作用 | 当前状态 |
| --- | --- | --- |
| `sendMessage` | 发送订阅消息 | 已编写，但前端主流程未接入 |
| `generatePet` | 生成随机像素宠物 SVG | 已编写，但当前宠物页实际走的是前端本地 Canvas 绘制 |
| `quickstartFunctions` | 微信云开发示例函数 | 模板遗留，与主业务基本无关 |

## 快速开始

### 1. 导入项目

使用微信开发者工具导入项目根目录。

### 2. 创建并绑定云环境

在微信开发者工具中开通云开发，并创建你自己的云环境。

然后修改：

- `miniprogram/app.js`
  - 把 `wx.cloud.init` 里的 `env` 改成你自己的云环境 ID

### 3. 安装云函数依赖

分别进入以下目录安装依赖并部署：

- `cloudfunctions/sendMessage`
- `cloudfunctions/generatePet`
- `cloudfunctions/quickstartFunctions`

如果你使用微信开发者工具，也可以直接在工具中对每个云函数执行“上传并部署：云端安装依赖”。

### 4. 创建数据库集合

至少需要以下集合：

- `users`
- `moments`
- `follows`
- `messages`
- `resources`
- `shop_items`
- `orders`
- `words_lib`
- `courses`

可选：

- `sales`

### 5. 初始化基础数据

这个项目不是“零数据即开箱即用”的，需要你先准备几类种子数据。

#### 教师账号

注册页只支持学生注册，教师账号需要你手动在数据库里创建。至少建议包含：

```json
{
  "account": "13800000000",
  "password": "12345678",
  "role": "teacher",
  "name": "张老师",
  "nickname": "张老师",
  "orgName": "青水教育",
  "inviteCode": "QY2026",
  "institutionId": "demo_001",
  "avatar": "https://..."
}
```

#### 学生账号

学生可以通过注册页生成，默认会写入：

- `score: 100`
- `role: "student"`
- `orgId`
- `orgName`

如果你要完整体验宠物、背包、排行榜等功能，建议为学生补齐这些字段：

```json
{
  "progress": {
    "zhongkao": 0,
    "gaokao": 0
  },
  "bag": {},
  "bagInfo": {},
  "pet": {
    "name": "像素神兽",
    "level": 1,
    "exp": 0,
    "evoAttr": "default",
    "stats": {
      "jin": 0,
      "mu": 0,
      "shui": 0,
      "huo": 0,
      "tu": 0
    }
  }
}
```

#### 词库数据 `words_lib`

至少需要：

```json
{
  "bank_type": "zhongkao",
  "word": "ability",
  "phonetic": "/əˈbɪləti/",
  "zh": "能力",
  "exEn": "He has the ability to solve the problem.",
  "exZh": "他有能力解决这个问题。",
  "imgUrl": "https://..."
}
```

高考词库把 `bank_type` 改为 `gaokao` 即可。

#### 商城商品 `shop_items`

商品类别在当前代码中有三种：

- `虚拟荣誉`
- `线下福利`
- `智宠道具`

智宠道具额外支持：

```json
{
  "effects": {
    "exp": 50,
    "jin": 0,
    "mu": 0,
    "shui": 0,
    "huo": 10,
    "tu": 0
  }
}
```

#### 课程数据 `courses`

至少要带上机构筛选字段：

```json
{
  "school_id": "demo_001",
  "title": "中考英语冲刺班",
  "price": 1999
}
```

### 6. 修改品牌信息

项目中有部分品牌信息是直接写死在页面里的，上线前建议统一替换：

- `pages/org/org.js`
  - 微信二维码图片链接
  - 微信号
- `pages/student/poster/poster.js`
  - 海报标题、电话、二维码区
- `pages/teacher/dashboard/dashboard.js`
  - 机构名称示例文案

## 运行说明

### 学生注册流程

- 进入注册页
- 输入手机号、昵称、密码
- 可选填写机构邀请码
- 注册后返回登录页登录

### 学生学习流程

- 进入“闯关”页面
- 选择词库
- 学习 5 个单词
- 完成测验
- 领取积分

### 学生兑换流程

- 进入资源页或商城页
- 消耗积分兑换
- 实物类会生成订单
- 道具类进入背包
- 资料类进入“我的书包”

### 教师运营流程

- 手动创建教师账号
- 配置邀请码和机构信息
- 引导学生通过邀请码注册
- 发布资源和商品
- 在后台处理订单与内容审核

## 当前状态评估

从代码完成度来看，这个项目已经具备：

- 完整的页面骨架
- 主流程可读的业务代码
- 学生端大部分关键交互
- 教师端若干运营页面
- 云开发数据库与云存储接入

但仍然属于“原型可运行、生产未完成”的阶段。

## 已知问题与待完善项

这是目前最值得提前知道的部分。

### 1. 存在缺失页面

首页跳转中引用了以下页面，但仓库中并不存在：

- `pages/policy/policy`
- `pages/video/video`

### 2. 存在缺失云函数

消息页面调用了：

- `markMessagesRead`

但仓库中没有对应云函数实现。

### 3. 教师端部分模块仍为演示数据

以下页面目前主要是静态 / mock 数据：

- `pages/teacher/dashboard/dashboard`
- `pages/teacher/promote/promote`
- `pages/teacher/report/report`

### 4. 数据字段命名不统一

学生注册写入的是：

- `orgId`
- `orgName`

而学员管理页查询使用的是：

- `institutionId`

如果不统一字段，教师端“学员管理”很可能查不到学生数据。

### 5. 资源数据与用户书包数据混用同一集合

`resources` 当前既存资源主数据，也存用户兑换后的个人记录，不利于后续维护和统计。

### 6. 登录与安全方案偏原型

当前登录方式是：

- 前端直接查询 `users`
- 明文比对账号密码

这适合原型验证，不适合正式生产环境。

### 7. 关键业务直接由前端写数据库

如积分扣减、下单、评论、点赞、发货、审核等，当前大量逻辑直接在前端调用数据库完成。正式上线时建议迁移到云函数，配合严格权限规则。

### 8. 权限边界仍比较弱

教师端页面、审核页、订单页虽然有页面入口限制，但缺少完整的后端角色校验。

### 9. 多机构隔离尚未真正闭环

项目目标是机构私域运营，但当前不少教师端查询仍然是全局维度，缺少严格的机构隔离条件，例如：

- 订单页按 `status` 全局查询
- 资源审核页全局查询资源
- 商城商品也是全局共享

如果要做真正的多机构 SaaS，需要补齐 `institutionId / orgId` 维度的全链路隔离。

### 10. 项目内仍保留云开发模板遗留代码

包括：

- `quickstartFunctions`
- `cloudTipModal`
- `projectname: quickstart-wx-cloud`

它们说明这个仓库是在云开发 quickstart 模板基础上继续开发出来的。

### 11. 云函数上传脚本目前不可直接用于业务发布

根目录的 `uploadCloudFunction.sh` 当前只处理 `quickstartFunctions`，并没有覆盖业务实际使用或预留的云函数：

- `sendMessage`
- `generatePet`

正式发布时更建议在微信开发者工具里逐个云函数手动上传部署。

### 12. 部分图片资源引用缺失

学员管理页引用了：

- `/images/default-avatar.png`
- `/images/empty.png`

但当前 `miniprogram/images/` 目录中没有这两个文件。

### 13. 品牌文案未完全统一

代码中同时出现了“青源智盟”“青水教育”等命名，发布前建议统一品牌口径。

## 二次开发建议

如果要把这个项目继续做深，建议优先按下面顺序推进：

1. 统一用户、机构、邀请码相关字段命名
2. 拆分 `resources` / `my_resources`
3. 把扣积分、发货、审核、评论、点赞等关键操作迁移到云函数
4. 增加数据库权限规则与角色校验
5. 补齐缺失页面与缺失云函数
6. 替换明文密码方案，接入更安全的登录体系
7. 让教师端工作台接真实统计数据
8. 增加后台配置能力，去掉写死的二维码、微信号、海报文案

## 这个仓库最适合怎么展示到 GitHub

如果你准备把它公开到 GitHub，我建议把它定位为：

> 一个基于微信小程序云开发的教育机构获客与学习运营系统原型，覆盖学生端学习激励、积分商城、社区互动、资料兑换与教师端运营管理。

这个定位是准确的，不会过度承诺，也能体现项目的完整度。

## 后续可继续补充

如果你后面准备继续完善仓库，建议下一步补这些内容：

- 实机截图
- 数据库权限规则截图
- 云开发环境初始化说明
- 体验账号
- 演示视频
- License

---

如果你是准备继续二开这个项目，最值得先看的代码入口是：

- `miniprogram/app.js`
- `miniprogram/app.json`
- `miniprogram/pages/student/index/index.js`
- `miniprogram/pages/student/quest/quest.js`
- `miniprogram/pages/student/shop/shop.js`
- `miniprogram/pages/student/profile/profile.js`
- `miniprogram/pages/teacher/dashboard/dashboard.js`
- `miniprogram/pages/teacher/manageShop/manageShop.js`

这几个文件基本可以最快帮助你理解整个系统的主线。

测试信息

测试1