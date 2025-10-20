const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// DB connect
const db = new sqlite3.Database("./silkroad.db", (err) => {
  if (err) {
    console.error("❌ DB error:", err.message);
  } else {
    console.log("✅ SQLite connected");
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT,
      lastName TEXT,
      username TEXT UNIQUE,
      password TEXT,
      email TEXT,
      country TEXT,
      address TEXT
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT,
      subcategory TEXT,
      name TEXT,
      price REAL,
      image TEXT
    )`);
  }
});

// Auth: register
app.post("/api/register", async (req, res) => {
  const { firstName, lastName, username, password, email, country, address } = req.body;
  if (!firstName || !lastName || !username || !password || !email || !country || !address) {
    return res.status(400).json({ error: "Все поля обязательны!" });
  }
  db.get("SELECT id FROM users WHERE username=?", [username], async (err, row) => {
    if (err) return res.status(500).json({ error: "Ошибка сервера" });
    if (row) return res.status(400).json({ error: "Логин уже занят!" });
    const hash = await bcrypt.hash(password, 10);
    db.run(
      `INSERT INTO users (firstName, lastName, username, password, email, country, address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [firstName, lastName, username, hash, email, country, address],
      (e) => {
        if (e) return res.status(500).json({ error: "Ошибка сохранения" });
        res.json({ message: "✅ Регистрация успешна!", username });
      }
    );
  });
});

// Auth: login
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE username=?", [username], async (err, user) => {
    if (err) return res.status(500).json({ error: "Ошибка сервера" });
    if (!user) return res.status(400).json({ error: "Пользователь не найден" });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: "Неверный пароль" });
    res.json({ message: "✅ Вход выполнен успешно!", username: user.username });
  });
});

// Products by category
app.get("/api/products/:category", (req, res) => {
  db.all("SELECT * FROM products WHERE category=?", [req.params.category], (err, rows) => {
    if (err) return res.status(500).json({ error: "Ошибка получения товаров" });
    res.json(rows);
  });
});
// Скидки (рандом 12 шт.)
app.get("/api/products/discounts", (req, res) => {
  db.all("SELECT * FROM products ORDER BY RANDOM() LIMIT 12", [], (err, rows) => {
    if (err) return res.status(500).json({ error: "Ошибка получения скидок" });
    res.json(rows);
  });
});

// Хиты продаж (рандом 12 шт.)
app.get("/api/products/top", (req, res) => {
  db.all("SELECT * FROM products ORDER BY RANDOM() LIMIT 12", [], (err, rows) => {
    if (err) return res.status(500).json({ error: "Ошибка получения хитов" });
    res.json(rows);
  });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));
