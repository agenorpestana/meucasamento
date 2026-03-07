import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import multer from "multer";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("wedding.db");
const JWT_SECRET = process.env.JWT_SECRET || "wedding-secret-key";

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS weddings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    couple_names TEXT NOT NULL,
    wedding_date TEXT,
    story TEXT,
    location TEXT,
    theme_color TEXT DEFAULT '#F27D26',
    banner_url TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS guests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wedding_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    status TEXT DEFAULT 'pending', -- pending, confirmed, declined
    FOREIGN KEY (wedding_id) REFERENCES weddings(id)
  );

  CREATE TABLE IF NOT EXISTS gifts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wedding_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price REAL,
    image_url TEXT,
    is_purchased BOOLEAN DEFAULT 0,
    FOREIGN KEY (wedding_id) REFERENCES weddings(id)
  );

  CREATE TABLE IF NOT EXISTS gift_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gift_id INTEGER NOT NULL,
    buyer_name TEXT NOT NULL,
    buyer_message TEXT,
    amount REAL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (gift_id) REFERENCES gifts(id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use("/uploads", express.static("uploads"));

  if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads");
  }

  const storage = multer.diskStorage({
    destination: "uploads/",
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
    },
  });
  const upload = multer({ storage });

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      req.user = jwt.verify(token, JWT_SECRET);
      next();
    } catch (e) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  // --- API ROUTES ---

  // Auth
  app.post("/api/auth/register", async (req, res) => {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      const result = db.prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)").run(name, email, hashedPassword);
      const token = jwt.sign({ id: result.lastInsertRowid, email }, JWT_SECRET);
      res.json({ token, user: { id: result.lastInsertRowid, name, email } });
    } catch (e) {
      res.status(400).json({ error: "Email already exists" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ id: user.id, email }, JWT_SECRET);
      res.json({ token, user: { id: user.id, name: user.name, email } });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // Wedding
  app.get("/api/wedding/me", authenticate, (req: any, res) => {
    const wedding = db.prepare("SELECT * FROM weddings WHERE user_id = ?").get(req.user.id);
    res.json(wedding || null);
  });

  app.post("/api/wedding", authenticate, (req: any, res) => {
    const { slug, couple_names, wedding_date, story, location } = req.body;
    try {
      const result = db.prepare(`
        INSERT INTO weddings (user_id, slug, couple_names, wedding_date, story, location)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(req.user.id, slug, couple_names, wedding_date, story, location);
      res.json({ id: result.lastInsertRowid });
    } catch (e) {
      res.status(400).json({ error: "Slug already taken" });
    }
  });

  app.put("/api/wedding", authenticate, (req: any, res) => {
    const { couple_names, wedding_date, story, location, theme_color } = req.body;
    db.prepare(`
      UPDATE weddings SET couple_names = ?, wedding_date = ?, story = ?, location = ?, theme_color = ?
      WHERE user_id = ?
    `).run(couple_names, wedding_date, story, location, theme_color, req.user.id);
    res.json({ success: true });
  });

  // Public Wedding Page
  app.get("/api/public/wedding/:slug", (req, res) => {
    const wedding: any = db.prepare("SELECT * FROM weddings WHERE slug = ?").get(req.params.slug);
    if (!wedding) return res.status(404).json({ error: "Wedding not found" });
    const gifts = db.prepare("SELECT * FROM gifts WHERE wedding_id = ?").all(wedding.id);
    res.json({ wedding, gifts });
  });

  // Guests (RSVP)
  app.get("/api/guests", authenticate, (req: any, res) => {
    const wedding: any = db.prepare("SELECT id FROM weddings WHERE user_id = ?").get(req.user.id);
    if (!wedding) return res.json([]);
    const guests = db.prepare("SELECT * FROM guests WHERE wedding_id = ?").all(wedding.id);
    res.json(guests);
  });

  app.post("/api/public/rsvp/:slug", (req, res) => {
    const { name, email, phone, status } = req.body;
    const wedding: any = db.prepare("SELECT id FROM weddings WHERE slug = ?").get(req.params.slug);
    if (!wedding) return res.status(404).json({ error: "Wedding not found" });
    db.prepare("INSERT INTO guests (wedding_id, name, email, phone, status) VALUES (?, ?, ?, ?, ?)").run(wedding.id, name, email, phone, status);
    res.json({ success: true });
  });

  // Gifts
  app.get("/api/gifts", authenticate, (req: any, res) => {
    const wedding: any = db.prepare("SELECT id FROM weddings WHERE user_id = ?").get(req.user.id);
    if (!wedding) return res.json([]);
    const gifts = db.prepare("SELECT * FROM gifts WHERE wedding_id = ?").all(wedding.id);
    res.json(gifts);
  });

  app.post("/api/gifts", authenticate, (req: any, res) => {
    const { name, description, price, image_url } = req.body;
    const wedding: any = db.prepare("SELECT id FROM weddings WHERE user_id = ?").get(req.user.id);
    db.prepare("INSERT INTO gifts (wedding_id, name, description, price, image_url) VALUES (?, ?, ?, ?, ?)").run(wedding.id, name, description, price, image_url);
    res.json({ success: true });
  });

  // Image Upload
  app.post("/api/upload", authenticate, upload.single("image"), (req: any, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    res.json({ url: `/uploads/${req.file.filename}` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
