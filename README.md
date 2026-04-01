# 考研网盘云群 H5 商城系统

面向考研群体的虚拟商品（网盘群）在线购买平台，白橙色主色调，适配手机微信端，内置完整管理后台。

---

## 功能概览

### 用户端（微信 H5）
- 首页：双列商品卡片展示，含封面、标题、卖点标签、权益星级列表、价格
- 个人中心：订单列表、查看发货内容、复制群链接
- 底部导航栏：店铺首页 / 个人中心

### 管理后台
- 仪表盘：商品数、订单数、收入统计、最近订单
- 商品管理：添加/编辑/删除商品
- 订单管理：查看订单、标记已支付、手动发货
- 子账号管理：分配不同角色权限

---

## 部署指南（图文版）

### 第一步：在 Railway 上部署后端（免费）

1. 打开 **https://railway.app**，用 GitHub 账号登录
2. 点击 **New Project** → **Deploy from GitHub repo**
3. 授权 GitHub，选择 `kaoyan-shop` 仓库
4. Railway 会自动识别 Node.js 项目，点击 **Deploy Now**
5. 等待部署完成（约1-2分钟）
6. 部署成功后，复制 Railway 给你的域名，格式类似：
   ```
   https://kaoyan-shop.up.railway.app
   ```

### 第二步：启用 GitHub Pages

1. 打开你的 GitHub 仓库：https://github.com/kaede123456/-/settings/pages
2. **Source** 选择 **Deploy from a branch**
3. **Branch** 选择 **main**，目录选 **/ (root)**
4. 点击 **Save**
5. 等待几分钟后，访问你的 GitHub Pages 地址：
   ```
   https://kaede123456.github.io/-
   ```
   （具体地址以你的仓库名准）

### 第三步：让网页连接到后端

1. 用任意文本编辑器打开 `public/index.html`
2. 找到这行（大约在文件开头处）：
   ```javascript
   const API_BASE = window.location.port === '3001' ? '' : `http://localhost:${window.location.port}`;
   ```
3. 把它改成你的 Railway 域名：
   ```javascript
   const API_BASE = 'https://kaoyan-shop.up.railway.app';
   ```
4. 用同样方法修改 `public/user.html` 中的同一行

> ⚠️ 如果你的 Railway 域名是 https 开头，API_BASE 也要用 https 开头，否则浏览器会阻止请求。

5. 保存文件，推送到 GitHub：
   ```bash
   git add -A
   git commit -m "fix: 绑定 Railway 后端地址"
   git push origin main
   ```
6. 等待 GitHub Pages 自动更新（约1-2分钟）

### 第四步：访问你的商城 🎉

GitHub Pages 地址就是你的商城地址，分享给任何人点开就能用！

---

## 管理后台

部署完成后访问：**你的GitHub Pages地址/admin.html**

```
默认账号：admin
默认密码：admin123
```

> ⚠️ 正式使用请务必修改默认密码！

---

## 默认商品（自动创建）

| 商品 | 价格 | 标签 |
|------|------|------|
| 27考研网盘云群 | ¥19.90 | 不加密·含押题·精华笔记 |
| 26考研网盘云群 | ¥9.90 | 冲刺·押题卷·全程更新 |
| 25考研网盘云群 | ¥9.90 | 历年真题·全程更新 |

---

## 目录结构

```
kaoyan-shop/
├── package.json          # 依赖配置
├── Procfile              # Railway 启动命令
├── railway.json          # Railway 配置
├── server/
│   ├── index.js          # 用户端 API（商品、订单）
│   ├── admin.js          # 管理后台 API（含认证）
│   └── db.js             # SQLite 数据库（自动建表）
└── public/
    ├── index.html        # 店铺首页
    ├── user.html         # 个人中心
    └── admin.html        # 管理后台
```

---

## 接入真实微信支付

当前为**模拟支付**，真实接入需：
1. 申请微信支付商户号
2. 在后端调用微信支付接口
3. 替换 `server/index.js` 中的支付相关代码

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | HTML5 + CSS3 + Vanilla JS |
| 后端 | Node.js + Express |
| 数据库 | SQLite |
| 托管 | Railway（后端）+ GitHub Pages（前端） |

---

## License

MIT License
