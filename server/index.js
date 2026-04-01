const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const multer = require('multer');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// ===== 商品 API =====
app.get('/api/goods', (req, res) => {
  try {
    const goods = db.prepare('SELECT * FROM goods WHERE is_active = 1 ORDER BY sort_order ASC').all();
    goods.forEach(g => {
      g.tags = g.tags ? g.tags.split('|') : [];
      g.benefits = g.benefits ? g.benefits.split('\n') : [];
    });
    res.json({ code: 0, data: goods });
  } catch (err) {
    res.status(500).json({ code: 1, msg: err.message });
  }
});

app.get('/api/goods/:id', (req, res) => {
  try {
    const goods = db.prepare('SELECT * FROM goods WHERE id = ? AND is_active = 1').get(req.params.id);
    if (!goods) return res.status(404).json({ code: 1, msg: '商品不存在' });
    goods.tags = goods.tags ? goods.tags.split('|') : [];
    goods.benefits = goods.benefits ? goods.benefits.split('\n') : [];
    res.json({ code: 0, data: goods });
  } catch (err) {
    res.status(500).json({ code: 1, msg: err.message });
  }
});

// ===== 订单 API =====
app.post('/api/orders/create', async (req, res) => {
  try {
    const { goods_id, openid } = req.body;
    if (!goods_id) return res.status(400).json({ code: 1, msg: '缺少商品ID' });

    const goods = db.prepare('SELECT * FROM goods WHERE id = ? AND is_active = 1').get(goods_id);
    if (!goods) return res.status(404).json({ code: 1, msg: '商品不存在' });

    const orderNo = 'KY' + Date.now() + uuidv4().slice(0, 4).toUpperCase();
    const order = db.prepare(`
      INSERT INTO orders (order_no, openid, goods_id, goods_title, price, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `).run(orderNo, openid || '', goods_id, goods.title, goods.price);

    // 生成支付二维码（模拟）
    const payUrl = `https://example.com/pay/${orderNo}`;
    const qrDataUrl = await QRCode.toDataURL(payUrl, { width: 200, margin: 1 });

    res.json({
      code: 0,
      data: {
        order_id: order.lastInsertRowid,
        order_no: orderNo,
        price: goods.price,
        qr_data_url: qrDataUrl,
        goods_title: goods.title
      }
    });
  } catch (err) {
    res.status(500).json({ code: 1, msg: err.message });
  }
});

// 模拟支付回调（开发测试用）
app.post('/api/orders/:orderNo/pay-callback', (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE order_no = ?').get(req.params.orderNo);
    if (!order) return res.status(404).json({ code: 1, msg: '订单不存在' });
    if (order.status === 'paid') return res.json({ code: 0, msg: '已支付' });

    db.prepare(`UPDATE orders SET status = 'paid', pay_time = datetime('now') WHERE order_no = ?`)
      .run(req.params.orderNo);

    res.json({ code: 0, msg: '支付成功' });
  } catch (err) {
    res.status(500).json({ code: 1, msg: err.message });
  }
});

// 查询订单状态
app.get('/api/orders/:orderNo', (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE order_no = ?').get(req.params.orderNo);
    if (!order) return res.status(404).json({ code: 1, msg: '订单不存在' });
    res.json({ code: 0, data: order });
  } catch (err) {
    res.status(500).json({ code: 1, msg: err.message });
  }
});

// 用户订单列表
app.get('/api/orders', (req, res) => {
  try {
    const { openid } = req.query;
    const orders = db.prepare('SELECT * FROM orders WHERE openid = ? ORDER BY created_at DESC').all(openid || '');
    res.json({ code: 0, data: orders });
  } catch (err) {
    res.status(500).json({ code: 1, msg: err.message });
  }
});

// 获取订单发货内容
app.get('/api/orders/:orderNo/deliver', (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE order_no = ?').get(req.params.orderNo);
    if (!order) return res.status(404).json({ code: 1, msg: '订单不存在' });
    if (order.status !== 'paid') return res.json({ code: 1, msg: '订单未支付' });

    let content = order.deliver_content;
    if (!content) {
      const goods = db.prepare('SELECT * FROM goods WHERE id = ?').get(order.goods_id);
      content = goods ? goods.auto_deliver_content : '';
    }
    res.json({ code: 0, data: { content } });
  } catch (err) {
    res.status(500).json({ code: 1, msg: err.message });
  }
});

// ===== 店铺配置 API =====
app.get('/api/config', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM shop_config').all();
    const config = {};
    rows.forEach(r => { config[r.key] = r.value; });
    res.json({ code: 0, data: config });
  } catch (err) {
    res.status(500).json({ code: 1, msg: err.message });
  }
});

app.post('/api/config', (req, res) => {
  try {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ code: 1, msg: '缺少key' });
    db.prepare('INSERT OR REPLACE INTO shop_config (key, value) VALUES (?, ?)').run(key, value || '');
    res.json({ code: 0, msg: '保存成功' });
  } catch (err) {
    res.status(500).json({ code: 1, msg: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`考研商城服务已启动: http://localhost:${PORT}`);
  console.log(`管理后台: http://localhost:${PORT}/admin.html`);
  console.log(`默认管理员账号: admin / admin123`);
});
