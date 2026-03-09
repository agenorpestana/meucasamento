import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";
import sqlite3 from "better-sqlite3";
import multer from "multer";
import fs from "fs";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CONFIGURAÇÃO DO BANCO DE DADOS ---
const isProduction = process.env.NODE_ENV === "production" || process.env.DB_HOST;
let pool: any;
let sqliteDb: any;

async function initDb() {
  if (isProduction) {
    try {
      pool = mysql.createPool({
        host: process.env.DB_HOST || "localhost",
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "iwedding_db",
      });
      
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
            rsvp_deadline DATE,
            story TEXT,
            location VARCHAR(255),
            theme_color VARCHAR(7) DEFAULT '#F27D26',
            banner_url VARCHAR(255),
            invitation_template_id INT DEFAULT 1,
            invitation_text TEXT,
            smtp_host VARCHAR(255),
            smtp_port INT,
            smtp_user VARCHAR(255),
            smtp_pass VARCHAR(255),
            smtp_from VARCHAR(255),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          ) ENGINE=InnoDB;
        `);

        try { await connection.query("ALTER TABLE weddings ADD COLUMN rsvp_deadline DATE AFTER wedding_date"); } catch (e) {}
        try { await connection.query("ALTER TABLE weddings ADD COLUMN invitation_template_id INT DEFAULT 1"); } catch (e) {}
        try { await connection.query("ALTER TABLE weddings ADD COLUMN invitation_text TEXT AFTER invitation_template_id"); } catch (e) {}
        try { await connection.query("ALTER TABLE weddings ADD COLUMN smtp_host VARCHAR(255)"); } catch (e) {}
        try { await connection.query("ALTER TABLE weddings ADD COLUMN smtp_port INT"); } catch (e) {}
        try { await connection.query("ALTER TABLE weddings ADD COLUMN smtp_user VARCHAR(255)"); } catch (e) {}
        try { await connection.query("ALTER TABLE weddings ADD COLUMN smtp_pass VARCHAR(255)"); } catch (e) {}
        try { await connection.query("ALTER TABLE weddings ADD COLUMN smtp_from VARCHAR(255)"); } catch (e) {}

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

        try { await connection.query("ALTER TABLE guests ADD COLUMN token VARCHAR(10) UNIQUE AFTER phone"); } catch (e) {}

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
      } finally {
        connection.release();
      }
      console.log("Banco de dados MySQL inicializado.");
    } catch (err) {
      console.error("Erro MySQL, tentando SQLite fallback...", err);
      setupSqlite();
    }
  } else {
    setupSqlite();
  }
}

function setupSqlite() {
  sqliteDb = new sqlite3("wedding.db");
  sqliteDb.exec(`
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
      rsvp_deadline TEXT,
      story TEXT,
      location TEXT,
      theme_color TEXT DEFAULT '#F27D26',
      banner_url TEXT,
      invitation_template_id INTEGER DEFAULT 1,
      invitation_text TEXT,
      smtp_host TEXT,
      smtp_port INTEGER,
      smtp_user TEXT,
      smtp_pass TEXT,
      smtp_from TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS guests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wedding_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      token TEXT UNIQUE,
      status TEXT DEFAULT 'pending',
      FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS gifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wedding_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      price REAL,
      image_url TEXT,
      is_purchased INTEGER DEFAULT 0,
      FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wedding_id INTEGER NOT NULL,
      url TEXT NOT NULL,
      caption TEXT,
      is_guest_photo INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (wedding_id) REFERENCES weddings(id) ON DELETE CASCADE
    );
  `);

  // Ensure SQLite columns exist for existing databases
  const columns = [
    { table: 'weddings', col: 'rsvp_deadline', type: 'TEXT' },
    { table: 'weddings', col: 'invitation_template_id', type: 'INTEGER DEFAULT 1' },
    { table: 'weddings', col: 'invitation_text', type: 'TEXT' },
    { table: 'weddings', col: 'smtp_host', type: 'TEXT' },
    { table: 'weddings', col: 'smtp_port', type: 'INTEGER' },
    { table: 'weddings', col: 'smtp_user', type: 'TEXT' },
    { table: 'weddings', col: 'smtp_pass', type: 'TEXT' },
    { table: 'weddings', col: 'smtp_from', type: 'TEXT' },
    { table: 'guests', col: 'token', type: 'TEXT UNIQUE' }
  ];

  for (const c of columns) {
    try {
      sqliteDb.prepare(`ALTER TABLE ${c.table} ADD COLUMN ${c.col} ${c.type}`).run();
    } catch (e) {
      // Column probably already exists
    }
  }

  console.log("Banco de dados SQLite inicializado.");
}

// Helper to execute queries on either MySQL or SQLite
async function executeQuery(sql: string, params: any[] = []) {
  if (pool) {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } else {
    // Convert MySQL ? to SQLite ? (they are the same)
    if (sql.trim().toUpperCase().startsWith("SELECT")) {
      return sqliteDb.prepare(sql).all(...params);
    } else {
      const result = sqliteDb.prepare(sql).run(...params);
      return { insertId: result.lastInsertRowid, affectedRows: result.changes };
    }
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
      const result: any = await executeQuery(
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
    const rows: any = await executeQuery("SELECT * FROM users WHERE email = ?", [email]);
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
    const rows: any = await executeQuery("SELECT * FROM weddings WHERE user_id = ?", [req.user.id]);
    res.json(rows[0] || null);
  });

  app.post("/api/wedding", authenticate, async (req: any, res) => {
    const { slug, couple_names, wedding_date, rsvp_deadline, story, location } = req.body;
    try {
      const result: any = await executeQuery(
        "INSERT INTO weddings (user_id, slug, couple_names, wedding_date, rsvp_deadline, story, location) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [req.user.id, slug, couple_names, wedding_date || null, rsvp_deadline || null, story || null, location || null]
      );
      res.json({ id: result.insertId });
    } catch (e) {
      res.status(400).json({ error: "Slug already taken" });
    }
  });

  app.put("/api/wedding", authenticate, async (req: any, res) => {
    try {
      const { 
        couple_names, wedding_date, rsvp_deadline, story, location, theme_color,
        invitation_template_id, invitation_text, smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from
      } = req.body;

      // Fetch current wedding to preserve fields not sent in the request
      const rows: any = await executeQuery("SELECT * FROM weddings WHERE user_id = ?", [req.user.id]);
      const current = rows[0];

      if (!current) return res.status(404).json({ error: "Wedding not found" });

      await executeQuery(
        `UPDATE weddings SET 
          couple_names = ?, wedding_date = ?, rsvp_deadline = ?, story = ?, 
          location = ?, theme_color = ?, invitation_template_id = ?, invitation_text = ?,
          smtp_host = ?, smtp_port = ?, smtp_user = ?, smtp_pass = ?, smtp_from = ?
        WHERE user_id = ?`,
        [
          couple_names !== undefined ? couple_names : current.couple_names,
          wedding_date !== undefined ? (wedding_date || null) : current.wedding_date,
          rsvp_deadline !== undefined ? (rsvp_deadline || null) : current.rsvp_deadline,
          story !== undefined ? (story || null) : current.story,
          location !== undefined ? (location || null) : current.location,
          theme_color !== undefined ? (theme_color || '#F27D26') : current.theme_color,
          invitation_template_id !== undefined ? invitation_template_id : current.invitation_template_id,
          invitation_text !== undefined ? (invitation_text || null) : current.invitation_text,
          smtp_host !== undefined ? (smtp_host || null) : current.smtp_host,
          smtp_port !== undefined ? (smtp_port || null) : current.smtp_port,
          smtp_user !== undefined ? (smtp_user || null) : current.smtp_user,
          smtp_pass !== undefined ? (smtp_pass || null) : current.smtp_pass,
          smtp_from !== undefined ? (smtp_from || null) : current.smtp_from,
          req.user.id
        ]
      );
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error updating wedding:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/guests/:id/send-email", authenticate, async (req: any, res) => {
    try {
      const wRows: any = await executeQuery("SELECT * FROM weddings WHERE user_id = ?", [req.user.id]);
      const wedding = wRows[0];
      if (!wedding || !wedding.smtp_host) return res.status(400).json({ error: "Configuração de e-mail incompleta" });

      const gRows: any = await executeQuery("SELECT * FROM guests WHERE id = ? AND wedding_id = ?", [req.params.id, wedding.id]);
      const guest = gRows[0];
      if (!guest || !guest.email) return res.status(400).json({ error: "Convidado sem e-mail" });

      const transporter = nodemailer.createTransport({
        host: wedding.smtp_host,
        port: Number(wedding.smtp_port),
        secure: Number(wedding.smtp_port) === 465,
        auth: {
          user: wedding.smtp_user,
          pass: wedding.smtp_pass,
        },
        tls: {
          // Do not fail on invalid certs
          rejectUnauthorized: false
        }
      });

      // Use APP_URL from env if available, otherwise try to infer or fallback
      const baseUrl = process.env.APP_URL || `http://localhost:${PORT}`;
      const inviteUrl = `${baseUrl}/w/${wedding.slug}`;
      
      console.log(`Enviando e-mail para ${guest.email} via ${wedding.smtp_host}:${wedding.smtp_port}`);

      const info = await transporter.sendMail({
        from: wedding.smtp_from || wedding.smtp_user,
        to: guest.email,
        subject: `Convite de Casamento: ${wedding.couple_names}`,
        html: `
          <div style="font-family: serif; text-align: center; padding: 40px; background: #fafafa; border-radius: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #eee;">
            <h1 style="color: #e11d48; font-size: 32px; margin-bottom: 10px;">${wedding.couple_names}</h1>
            <div style="width: 40px; height: 2px; background: #e11d48; margin: 20px auto;"></div>
            <p style="font-size: 18px; color: #444;">Você foi convidado para o nosso casamento!</p>
            <p style="font-size: 16px; color: #666;">Data: <strong>${wedding.wedding_date ? new Date(wedding.wedding_date).toLocaleDateString('pt-BR') : 'A definir'}</strong></p>
            <div style="background: #fff; padding: 20px; border-radius: 10px; margin: 30px 0; border: 1px solid #f0f0f0;">
              <p style="margin: 0; color: #888; text-transform: uppercase; font-size: 12px; letter-spacing: 2px;">Seu código de acesso</p>
              <p style="margin: 10px 0 0 0; font-size: 24px; color: #e11d48; font-weight: bold; letter-spacing: 4px;">${guest.token}</p>
            </div>
            <a href="${inviteUrl}" style="display: inline-block; padding: 16px 32px; background: #e11d48; color: white; text-decoration: none; border-radius: 50px; font-weight: bold; margin-top: 10px; box-shadow: 0 4px 12px rgba(225, 29, 72, 0.2);">Ver Convite Online</a>
            <p style="margin-top: 30px; font-size: 12px; color: #aaa;">Este é um convite digital enviado por MeuCasamento.</p>
          </div>
        `,
      });

      console.log("E-mail enviado com sucesso:", info.messageId);
      res.json({ success: true, messageId: info.messageId });
    } catch (err: any) {
      console.error("Erro ao enviar e-mail:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Public Wedding Page
  app.get("/api/public/wedding/:slug", async (req, res) => {
    const wRows: any = await executeQuery("SELECT * FROM weddings WHERE slug = ?", [req.params.slug]);
    const wedding = wRows[0];
    if (!wedding) return res.status(404).json({ error: "Wedding not found" });
    const gRows: any = await executeQuery("SELECT * FROM gifts WHERE wedding_id = ?", [wedding.id]);
    const pRows: any = await executeQuery("SELECT * FROM photos WHERE wedding_id = ? ORDER BY created_at DESC", [wedding.id]);
    res.json({ wedding, gifts: gRows, photos: pRows });
  });

  // Guests (RSVP)
  app.get("/api/guests", authenticate, async (req: any, res) => {
    const wRows: any = await executeQuery("SELECT id FROM weddings WHERE user_id = ?", [req.user.id]);
    const wedding = wRows[0];
    if (!wedding) return res.json([]);
    const gRows: any = await executeQuery("SELECT * FROM guests WHERE wedding_id = ? ORDER BY id DESC", [wedding.id]);
    res.json(gRows);
  });

  app.post("/api/guests", authenticate, async (req: any, res) => {
    const { name, email, phone } = req.body;
    const wRows: any = await executeQuery("SELECT id FROM weddings WHERE user_id = ?", [req.user.id]);
    const wedding = wRows[0];
    if (!wedding) return res.status(404).json({ error: "Wedding not found" });

    // Generate a unique 6-character token
    const token = Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
      await executeQuery(
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
    const wRows: any = await executeQuery("SELECT id FROM weddings WHERE slug = ?", [req.params.slug]);
    const wedding = wRows[0];
    if (!wedding) return res.status(404).json({ error: "Wedding not found" });

    // Validate token
    const gRows: any = await executeQuery(
      "SELECT id FROM guests WHERE wedding_id = ? AND token = ?",
      [wedding.id, token]
    );
    const guest = gRows[0];

    if (!guest) {
      return res.status(400).json({ error: "Token de convidado inválido ou não encontrado." });
    }

    await executeQuery(
      "UPDATE guests SET name = ?, email = ?, phone = ?, status = ? WHERE id = ?",
      [name, email || null, phone || null, status, guest.id]
    );
    res.json({ success: true });
  });

  // Gifts
  app.get("/api/gifts", authenticate, async (req: any, res) => {
    const wRows: any = await executeQuery("SELECT id FROM weddings WHERE user_id = ?", [req.user.id]);
    const wedding = wRows[0];
    if (!wedding) return res.json([]);
    const gRows: any = await executeQuery("SELECT * FROM gifts WHERE wedding_id = ?", [wedding.id]);
    res.json(gRows);
  });

  app.post("/api/gifts", authenticate, async (req: any, res) => {
    const { name, description, price, image_url } = req.body;
    const wRows: any = await executeQuery("SELECT id FROM weddings WHERE user_id = ?", [req.user.id]);
    const wedding = wRows[0];
    await executeQuery(
      "INSERT INTO gifts (wedding_id, name, description, price, image_url) VALUES (?, ?, ?, ?, ?)",
      [wedding.id, name, description || null, price || 0, image_url || null]
    );
    res.json({ success: true });
  });

  // Photos
  app.get("/api/photos", authenticate, async (req: any, res) => {
    const wRows: any = await executeQuery("SELECT id FROM weddings WHERE user_id = ?", [req.user.id]);
    const wedding = wRows[0];
    if (!wedding) return res.json([]);
    const pRows: any = await executeQuery("SELECT * FROM photos WHERE wedding_id = ? ORDER BY created_at DESC", [wedding.id]);
    res.json(pRows);
  });

  app.post("/api/photos", authenticate, async (req: any, res) => {
    const { url, caption } = req.body;
    const wRows: any = await executeQuery("SELECT id FROM weddings WHERE user_id = ?", [req.user.id]);
    const wedding = wRows[0];
    await executeQuery(
      "INSERT INTO photos (wedding_id, url, caption, is_guest_photo) VALUES (?, ?, ?, 0)",
      [wedding.id, url, caption || null]
    );
    res.json({ success: true });
  });

  app.delete("/api/photos/:id", authenticate, async (req: any, res) => {
    const wRows: any = await executeQuery("SELECT id FROM weddings WHERE user_id = ?", [req.user.id]);
    const wedding = wRows[0];
    await executeQuery("DELETE FROM photos WHERE id = ? AND wedding_id = ?", [req.params.id, wedding.id]);
    res.json({ success: true });
  });

  // Public Guest Photo Upload
  app.post("/api/public/photos/:slug", upload.single("image"), async (req: any, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const wRows: any = await executeQuery("SELECT id FROM weddings WHERE slug = ?", [req.params.slug]);
    const wedding = wRows[0];
    if (!wedding) return res.status(404).json({ error: "Wedding not found" });
    
    const url = `/uploads/${req.file.filename}`;
    await executeQuery(
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
