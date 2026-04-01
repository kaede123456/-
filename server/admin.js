const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.ADMIN_PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'kaoyan-shop-secret-2024';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ===== 认证中间件 =====
function auth(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ code: 1, msg: '未登录' });
  try {
    const decoded = jwt.verify(token.split(' ')[1], JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    res.status(401).json({ code: 1, msg: '登录已过期' });
  }
}

// ===== 管理员登录 =====
app.post('/api/admin/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = db.prepare('SELECT * FROM admin WHERE username = ? AND password = ?').get(username, password);
    if (!admin) return res.status(401).json({ code: 1, msg: '用户名或密码错误' });
    const token = jwt.sign({ id: admin.id, username: admin.username, role: admin.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ code: 0, data: { token, username: admin.username, role: admin.role } });
  } catch (err) {
    res.status(500).json({ code: 1, msg: err.message });
  }
});

// ===== 商品管理 =====
app.get('/api/admin/goods', auth, (req, res) => {
  try {
    const goods = db.prepare('SELECT * FROM goods ORDER BY sort_order ASC').all();
    goods.forEach(g => {
      g.tags = g.tags ? g.tags.split('|') : [];
      g.benefits = g.benefits ? g.benefits.split('\n') : [];
    });
    res.json({ code: 0, data: goods });
  } catch (err) {
    res.status(500).json({ code: 1, msg: err.message });
  }
});

app.post('/api/admin/goods', auth, (req, res) => {
  try {
    const { title, subtitle, cover_bg, cover_text, price, original_price, tags, benefits, auto_deliver_content, sort_order, is_active } = req.body;
    if (!title || price === undefined) return res.status(400).json({ code: 1, msg: '标题和价格不能为空' });

    db.prepare(`
      INSERT INTO goods (title, subtitle, cover_bg, cover_text, price, original_price, tags, benefits, auto_deliver_content, sort_order, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      title, subtitle || '', cover_bg || '#FF6B35', cover_text || 'NEW',
      price, original_price || 0,
      Array.isArray(tags) ? tags.join('|') : (tags || ''),
      Array.isArray(benefits) ? benefits.join('\n') : (benefits || ''),
      auto_deliver_content || '',
      sort_order || 0,
      is_active !== undefined ? is_active : 1
    );
    res.json({ code: 0, msg: '添加成功' });
  } catch (err) {
    res.status(500).json({ code: 1, msg: err.message });
  }
});

app.put('/api/admin/goods/:id', auth, (req, res) => {
  try {
    const { title, subtitle, cover_bg, cover_text, price, original_price, tags, benefits, auto_deliver_content, sort_order, is_active } = req.body;
    db.prepare(`
      UPDATE goods SET
        title = COALESCE(?, title),
        subtitle = COALESCE(?, subtitle),
        cover_bg = COALESCE(?, cover_bg),
        cover_text = COALESCE(?, cover_text),
        price = COALESCE(?, price),
        original_price = ?,
        tags = COALESCE(?, tags),
        benefits = COALESCE(?, benefits),
        auto_deliver_content = COALESCE(?, auto_deliver_content),
        sort_order = COALESCE(?, sort_order),
        is_active = COALESCE(?, is_active),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      title, subtitle, cover_bg, cover_text, price,
      original_price,
      Array.isArray(tags) ? tags.join('|') : tags,
      Array.isArray(benefits) ? benefits.join('\n') : benefits,
      auto_deliver_content, sort_order, is_active,
      req.params.id
    );
    res.json({ code: 0, msg: '更新成功' });
  } catch (err) {
    res.status(500).json({ code: 1, msg: err.message });
  }
});

app.delete('/api/admin/goods/:id', auth, (req, res) => {
  try {
    db.prepare('DELETE FROM goods WHERE id = ?').run(req.params.id);
    res.json({ code: 0, msg: '删除成功' });
  } catch (err) {
    res.status(500).json({ code: 1, msg: err.message });
  }
});

// ===== 订单管理 =====
app.get('/api/admin/orders', auth, (req, res) => {
  try {
    const { status, page = 1, pageSize = 20 } = req.query;
    let sql = 'SELECT * FROM orders';
    const params = [];
    if (status) { sql += ' WHERE status = ?'; params.push(status); }
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), (parseInt(page) - 1) * parseInt(pageSize));
    const orders = db.prepare(sql).all(...params);

    const { total } = db.prepare(`SELECT COUNT(*) as total FROM orders${status ? ' WHERE status = ?' : ''}`).get(status || null);

    res.json({ code: 0, data: { list: orders, total, page: parseInt(page), pageSize: parseInt(pageSize) } });
  } catch (err) {
    res.status(500).json({ code: 1, msg: err.message });
  }
});

app.post('/api/admin/orders/:orderNo/deliver', auth, (req, res) => {
  try {
    const { content } = req.body;
    db.prepare('UPDATE orders SET deliver_content = ? WHERE order_no = ?').run(content || '', req.params.orderNo);
    res.json({ code: 0, msg: '发货成功' });
  } catch (err) {
    res.status(500).json({ code: 1, msg: err.message });
  }
});

app.post('/api/admin/orders/:orderNo/paid', auth, (req, res) => {
  try {
    db.prepare(`UPDATE orders SET status = 'paid', pay_time = datetime('now') WHERE order_no = ?`).run(req.params.orderNo);
    res.json({ code: 0, msg: '标记已支付成功' });
  } catch (err) {
    res.status(500).json({ code: 1, msg: err.message });
  }
});

// ===== 子账号管理 =====
app.get('/api/admin/subadmins', auth, (req, res) => {
  try {
    if (req.admin.role !== 'admin') return res.status(403).json({ code: 1, msg: '权限不足' });
    const admins = db.prepare('SELECT id, username, role, created_at FROM admin ORDER BY id ASC').all();
    res.json({ code: 0, data: admins });
  } catch (err) {
    res.status(500).json({ code: 1, msg: err.message });
  }
});

app.post('/api/admin/subadmins', auth, (req, res) => {
  try {
    if (req.admin.role !== 'admin') return res.status(403).json({ code: 1, msg: '权限不足' });
    const { username, password, role } = req.body;
    if (!username || !password) return res.status(400).json({ code: 1, msg: '用户名和密码不能为空' });
    db.prepare('INSERT INTO admin (username, password, role) VALUES (?, ?, ?)').run(username, password, role || 'editor');
    res.json({ code: 0, msg: '添加成功' });
  } catch (err) {
    res.status(500).json({ code: 1, msg: err.message });
  }
});

app.delete('/api/admin/subadmins/:id', auth, (req, res) => {
  try {
    if (req.admin.role !== 'admin') return res.status(403).json({ code: 1, msg: '权限不足' });
    if (parseInt(req.params.id) === 1) return res.status(400).json({ code: 1, msg: '不能删除超级管理员' });
    db.prepare('DELETE FROM admin WHERE id = ?').run(req.params.id);
    res.json({ code: 0, msg: '删除成功' });
  } catch (err) {
    res.status(500).json({ code: 1, msg: err.message });
  }
});

// ===== 店铺配置 =====
app.get('/api/admin/config', auth, (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM shop_config').all();
    const config = {};
    rows.forEach(r => { config[r.key] = r.value; });
    res.json({ code: 0, data: config });
  } catch (err) {
    res.status(500).json({ code: 1, msg: err.message });
  }
});

app.post('/api/admin/config', auth, (req, res) => {
  try {
    const entries = Object.entries(req.body);
    const upsert = db.prepare('INSERT OR REPLACE INTO shop_config (key, value) VALUES (?, ?)');
    const saveAll = db.transaction((items) => {
      items.forEach(([k, v]) => upsert.run(k, v));
    });
    saveAll(entries);
    res.json({ code: 0, msg: '保存成功' });
  } catch (err) {
    res.status(500).json({ code: 1, msg: err.message });
  }
});

// ===== 封面图上传（存储为本地文件） =====
const storage = multer.diskStorage({
  destination: path.join(__dirname, '../public/uploads'),
  filename: (req, file, cb) => cb(null, uuidv4() + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } });
require('fs').mkdirSync(path.join(__dirname, '../public/uploads'), { recursive: true });

app.post('/api/admin/upload', auth, upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ code: 1, msg: '未上传文件' });
    res.json({ code: 0, data: { url: '/uploads/' + req.file.filename } });
  } catch (err) {
    res.status(500).json({ code: 1, msg: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`考研商城管理后台已启动: http://localhost:${PORT}/admin.html`);
});
