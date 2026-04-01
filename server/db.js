const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'shop.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS goods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    subtitle TEXT,
    cover_bg TEXT DEFAULT '#FF6B35',
    cover_text TEXT DEFAULT '27',
    price REAL NOT NULL,
    original_price REAL,
    tags TEXT,
    benefits TEXT,
    auto_deliver_content TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no TEXT UNIQUE NOT NULL,
    openid TEXT,
    goods_id INTEGER NOT NULL,
    goods_title TEXT,
    price REAL,
    status TEXT DEFAULT 'pending',
    pay_time DATETIME,
    deliver_content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (goods_id) REFERENCES goods(id)
  );

  CREATE TABLE IF NOT EXISTS shop_config (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// 初始化管理员账号
const initAdmin = db.prepare(`INSERT OR IGNORE INTO admin (username, password, role) VALUES (?, ?, ?)`);
initAdmin.run('admin', 'admin123', 'admin');

// 初始化示例商品
const initGoods = db.prepare(`SELECT COUNT(*) as cnt FROM goods`);
const { cnt } = initGoods.get();
if (cnt === 0) {
  const insertGoods = db.prepare(`
    INSERT INTO goods (title, subtitle, cover_bg, cover_text, price, original_price, tags, benefits, auto_deliver_content, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertGoods.run(
    '27考研网盘云群',
    '全程更新·初试资料·精华笔记',
    '#FF6B35',
    '27',
    19.90,
    39.90,
    '不加密|含押题|精华笔记',
    '★ 27公共课全年（赠部分统考专业课）\n★ 初试+复试全程资料\n★ 实时更新·不加密\n★ 考前终极押题卷',
    '【入群链接】https://pan.baidu.com/s/xxxxx\n\n【群验证码】kaoyan2027\n\n请复制链接到浏览器打开，或联系客服拉群。',
    1
  );
  insertGoods.run(
    '26考研网盘云群',
    '冲刺押题·全程更新',
    '#E74C3C',
    '26',
    9.90,
    29.90,
    '冲刺|押题卷|全程更新',
    '★ 26冲刺押题密训\n★ 考前最后三套卷\n★ 初试资料全覆盖\n★ 实时更新不加密',
    '【入群链接】https://pan.baidu.com/s/yyyyy\n\n【群验证码】kaoyan2026',
    2
  );
  insertGoods.run(
    '25考研网盘云群',
    '历年真题·全程更新',
    '#2ECC71',
    '25',
    9.90,
    29.90,
    '历年真题|全程更新',
    '★ 历年真题全套\n★ 高分学长笔记\n★ 初试资料全覆盖\n★ 实时更新不加密',
    '【入群链接】https://pan.baidu.com/s/zzzzz\n\n【群验证码】kaoyan2025',
    3
  );
}

module.exports = db;
