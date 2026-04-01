# 考研网盘云群 H5 商城系统

面向考研群体的虚拟商品（网盘群）在线购买平台，白橙色主色调，适配手机微信端，内置完整管理后台。

---

## 功能概览

### 用户端（微信 H5）
- 首页：双列商品卡片展示，含封面、标题、卖点标签、权益星级列表、价格
- 个人中心：订单列表、查看发货内容、复制群链接
- 支付流程：下单 → 二维码支付 → 确认支付 → 自动显示发货内容
- 底部导航栏：店铺首页 / 个人中心

### 管理后台
- 仪表盘：商品数、订单数、收入统计、最近订单
- 商品管理：添加/编辑/删除商品（标题、副标题、价格、封面颜色、标签、权益、自动发货内容）
- 订单管理：查看全部订单、标记已支付、手动发货
- 子账号管理：分配不同角色权限（运营/客服/超级管理员）

---

## 快速启动

### 1. 安装依赖

```bash
cd kaoyan-shop
npm install
```

### 2. 启动服务

**用户端（端口 3000）**
```bash
npm start
# 访问 http://localhost:3000
```

**管理后台（端口 3001）**
```bash
npm run admin
# 访问 http://localhost:3001/admin.html
```

**开发模式（热重载）**
```bash
npm run dev
```

### 3. 访问页面

| 页面 | 地址 |
|------|------|
| 店铺首页 | http://localhost:3000 |
| 个人中心 | http://localhost:3000/user.html |
| 管理后台 | http://localhost:3001/admin.html |

### 4. 默认账号

```
用户名：admin
密码：admin123
```

> ⚠️ 正式部署请务必修改默认密码！

---

## 目录结构

```
kaoyan-shop/
├── package.json          # 依赖配置
├── server/
│   ├── index.js          # 用户端 API 服务（商品、订单）
│   ├── admin.js          # 管理后台 API 服务（含认证）
│   └── db.js             # SQLite 数据库初始化
└── public/
    ├── index.html        # 店铺首页
    ├── user.html         # 个人中心
    ├── admin.html        # 管理后台
    └── uploads/          # 上传文件目录（自动创建）
```

---

## 部署到 GitHub

### 方式一：GitHub Pages + 后端服务

1. 将代码推送到 GitHub 仓库
2. 在 Vercel / Netlify 部署前端静态文件
3. 将后端部署到 Railway / Render / 自己的服务器
4. 修改前端 `API_BASE` 地址指向你的后端域名

### 方式二：Railway 一键部署（推荐）

```bash
# 1. 创建 Railway 账号
# 2. 连接 GitHub 仓库
# 3. 设置启动命令：npm start
# 4. 自动识别 Node.js 环境
```

### 方式三：Docker 部署

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### 方式四：Vercel Serverless Functions

将 `server/` 目录迁移为 Vercel Serverless Functions，前端作为静态文件部署。

---

## 接入真实微信支付（沙箱/正式）

当前为**模拟支付流程**，真实接入需：

1. 申请 **微信支付商户号**
2. 在微信商户平台开通 **Native支付** 或 **H5支付**
3. 后端调用微信支付统一下单接口，生成真实支付二维码
4. 替换 `server/index.js` 中的 `/api/orders/create` 接口

---

## 自定义配置

### 修改店铺名称

编辑 `public/index.html`，修改 `<title>` 和 `.header-title` 内容。

### 修改默认商品

编辑 `server/db.js` 中的 `initGoods` 部分，修改示例商品数据。

### 修改配色

在 `public/index.html` 和 `public/user.html` 的 CSS 变量中修改 `--orange` / `--red` 等颜色值。

### 修改默认管理员密码

在 `server/db.js` 中修改 `initAdmin.run('admin', 'admin123', 'admin')`，将第二个参数改为你的密码。

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | HTML5 + CSS3 + Vanilla JS（零框架，纯原生） |
| 后端 | Node.js + Express |
| 数据库 | SQLite（better-sqlite3） |
| 认证 | JWT |
| 文件存储 | 本地文件系统 |
| 部署 | 支持任意 Node.js 托管平台 |

---

## License

MIT License - 仅供学习与个人使用
