import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";
import multer from "multer";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CONFIGURAÇÃO DO BANCO DE DADOS (MYSQL) ---
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "iwedding_db",
};

let pool: mysql.Pool;

async function initDb() {
  pool = mysql.createPool(dbConfig);
  
  // Criar tabelas se não existirem
  const connection = await pool.getConnection();
  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS weddings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        couple_names VARCHAR(255) NOT NULL,
        wedding_date DATE,
        story TEXT,
        location VARCHAR(255),
        theme_color VARCHAR(7) DEFAULT '#F27D26',
        banner_url VARCHAR(255),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS guests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        wedding_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        token VARCHAR(10) UNIQUE,
        status ENUM('pending', 'confirmed', 'declined') DEFAULT 'pending',
        FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // Add token column if it doesn't exist (for existing installations)
    try {
      await connection.query("ALTER TABLE guests ADD COLUMN token VARCHAR(10) UNIQUE AFTER phone");
    } catch (e) {}

    await connection.query(`
      CREATE TABLE IF NOT EXISTS gifts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        wedding_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2),
        image_url VARCHAR(255),
        is_purchased TINYINT(1) DEFAULT 0,
        FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS gift_orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        gift_id INT NOT NULL,
        buyer_name VARCHAR(255) NOT NULL,
        buyer_message TEXT,
        amount DECIMAL(10,2),
        status ENUM('pending', 'paid') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (gift_id) REFERENCES gifts(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS photos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        wedding_id INT NOT NULL,
        url VARCHAR(255) NOT NULL,
        caption VARCHAR(255),
        is_guest_photo TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    console.log("Banco de dados MySQL inicializado com sucesso.");
  } catch (err) {
    console.error("Erro ao inicializar banco de dados:", err);
  } finally {
    connection.release();
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "wedding-secret-key";

async function startServer() {
  await initDb();
  
  const app = express();
  // LER PORTA DO AMBIENTE (IMPORTANTE PARA EVITAR 502)
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' })); // Increase limit for base64 uploads if needed
  const uploadsPath = path.join(__dirname, "uploads");
  app.use("/uploads", express.static(uploadsPath));

  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath);
  }

  const storage = multer.diskStorage({
    destination: uploadsPath,
    filename: (req, file, cb) => {
      cb(null, Date.now() + "-" + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
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

  app.get("/api/health", (req, res) => res.json({ status: "ok", port: PORT }));

  // Auth
  app.post("/api/auth/register", async (req, res) => {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      const [result]: any = await pool.execute(
        "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
        [name, email, hashedPassword]
      );
      const token = jwt.sign({ id: result.insertId, email }, JWT_SECRET);
      res.json({ token, user: { id: result.insertId, name, email } });
    } catch (e) {
      res.status(400).json({ error: "Email already exists" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const [rows]: any = await pool.execute("SELECT * FROM users WHERE email = ?", [email]);
    const user = rows[0];
    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ id: user.id, email }, JWT_SECRET);
      res.json({ token, user: { id: user.id, name: user.name, email } });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // Wedding
  app.get("/api/wedding/me", authenticate, async (req: any, res) => {
    const [rows]: any = await pool.execute("SELECT * FROM weddings WHERE user_id = ?", [req.user.id]);
    res.json(rows[0] || null);
  });

  app.post("/api/wedding", authenticate, async (req: any, res) => {
    const { slug, couple_names, wedding_date, story, location } = req.body;
    try {
      const [result]: any = await pool.execute(
        "INSERT INTO weddings (user_id, slug, couple_names, wedding_date, story, location) VALUES (?, ?, ?, ?, ?, ?)",
        [req.user.id, slug, couple_names, wedding_date || null, story || null, location || null]
      );
      res.json({ id: result.insertId });
    } catch (e) {
      res.status(400).json({ error: "Slug already taken" });
    }
  });

  app.put("/api/wedding", authenticate, async (req: any, res) => {
    const { couple_names, wedding_date, story, location, theme_color } = req.body;
    await pool.execute(
      "UPDATE weddings SET couple_names = ?, wedding_date = ?, story = ?, location = ?, theme_color = ? WHERE user_id = ?",
      [couple_names, wedding_date || null, story || null, location || null, theme_color || '#F27D26', req.user.id]
    );
    res.json({ success: true });
  });

  // Public Wedding Page
  app.get("/api/public/wedding/:slug", async (req, res) => {
    const [wRows]: any = await pool.execute("SELECT * FROM weddings WHERE slug = ?", [req.params.slug]);
    const wedding = wRows[0];
    if (!wedding) return res.status(404).json({ error: "Wedding not found" });
    const [gRows]: any = await pool.execute("SELECT * FROM gifts WHERE wedding_id = ?", [wedding.id]);
    const [pRows]: any = await pool.execute("SELECT * FROM photos WHERE wedding_id = ? ORDER BY created_at DESC", [wedding.id]);
    res.json({ wedding, gifts: gRows, photos: pRows });
  });

  // Guests (RSVP)
  app.get("/api/guests", authenticate, async (req: any, res) => {
    const [wRows]: any = await pool.execute("SELECT id FROM weddings WHERE user_id = ?", [req.user.id]);
    const wedding = wRows[0];
    if (!wedding) return res.json([]);
    const [gRows]: any = await pool.execute("SELECT * FROM guests WHERE wedding_id = ? ORDER BY id DESC", [wedding.id]);
    res.json(gRows);
  });

  app.post("/api/guests", authenticate, async (req: any, res) => {
    const { name, email, phone } = req.body;
    const [wRows]: any = await pool.execute("SELECT id FROM weddings WHERE user_id = ?", [req.user.id]);
    const wedding = wRows[0];
    if (!wedding) return res.status(404).json({ error: "Wedding not found" });

    // Generate a unique 6-character token
    const token = Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
      await pool.execute(
        "INSERT INTO guests (wedding_id, name, email, phone, token) VALUES (?, ?, ?, ?, ?)",
        [wedding.id, name, email || null, phone || null, token]
      );
      res.json({ success: true, token });
    } catch (e) {
      res.status(400).json({ error: "Error creating guest" });
    }
  });

  app.post("/api/public/rsvp/:slug", async (req, res) => {
    const { name, email, phone, status, token } = req.body;
    const [wRows]: any = await pool.execute("SELECT id FROM weddings WHERE slug = ?", [req.params.slug]);
    const wedding = wRows[0];
    if (!wedding) return res.status(404).json({ error: "Wedding not found" });

    // Validate token
    const [gRows]: any = await pool.execute(
      "SELECT id FROM guests WHERE wedding_id = ? AND token = ?",
      [wedding.id, token]
    );
    const guest = gRows[0];

    if (!guest) {
      return res.status(400).json({ error: "Token de convidado inválido ou não encontrado." });
    }

    await pool.execute(
      "UPDATE guests SET name = ?, email = ?, phone = ?, status = ? WHERE id = ?",
      [name, email || null, phone || null, status, guest.id]
    );
    res.json({ success: true });
  });

  // Gifts
  app.get("/api/gifts", authenticate, async (req: any, res) => {
    const [wRows]: any = await pool.execute("SELECT id FROM weddings WHERE user_id = ?", [req.user.id]);
    const wedding = wRows[0];
    if (!wedding) return res.json([]);
    const [gRows]: any = await pool.execute("SELECT * FROM gifts WHERE wedding_id = ?", [wedding.id]);
    res.json(gRows);
  });

  app.post("/api/gifts", authenticate, async (req: any, res) => {
    const { name, description, price, image_url } = req.body;
    const [wRows]: any = await pool.execute("SELECT id FROM weddings WHERE user_id = ?", [req.user.id]);
    const wedding = wRows[0];
    await pool.execute(
      "INSERT INTO gifts (wedding_id, name, description, price, image_url) VALUES (?, ?, ?, ?, ?)",
      [wedding.id, name, description || null, price || 0, image_url || null]
    );
    res.json({ success: true });
  });

  // Photos
  app.get("/api/photos", authenticate, async (req: any, res) => {
    const [wRows]: any = await pool.execute("SELECT id FROM weddings WHERE user_id = ?", [req.user.id]);
    const wedding = wRows[0];
    if (!wedding) return res.json([]);
    const [pRows]: any = await pool.execute("SELECT * FROM photos WHERE wedding_id = ? ORDER BY created_at DESC", [wedding.id]);
    res.json(pRows);
  });

  app.post("/api/photos", authenticate, async (req: any, res) => {
    const { url, caption } = req.body;
    const [wRows]: any = await pool.execute("SELECT id FROM weddings WHERE user_id = ?", [req.user.id]);
    const wedding = wRows[0];
    await pool.execute(
      "INSERT INTO photos (wedding_id, url, caption, is_guest_photo) VALUES (?, ?, ?, 0)",
      [wedding.id, url, caption || null]
    );
    res.json({ success: true });
  });

  app.delete("/api/photos/:id", authenticate, async (req: any, res) => {
    const [wRows]: any = await pool.execute("SELECT id FROM weddings WHERE user_id = ?", [req.user.id]);
    const wedding = wRows[0];
    await pool.execute("DELETE FROM photos WHERE id = ? AND wedding_id = ?", [req.params.id, wedding.id]);
    res.json({ success: true });
  });

  // Public Guest Photo Upload
  app.post("/api/public/photos/:slug", upload.single("image"), async (req: any, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const [wRows]: any = await pool.execute("SELECT id FROM weddings WHERE slug = ?", [req.params.slug]);
    const wedding = wRows[0];
    if (!wedding) return res.status(404).json({ error: "Wedding not found" });
    
    const url = `/uploads/${req.file.filename}`;
    await pool.execute(
      "INSERT INTO photos (wedding_id, url, is_guest_photo) VALUES (?, ?, 1)",
      [wedding.id, url]
    );
    res.json({ success: true, url });
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
