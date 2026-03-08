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

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CONFIGURAÇÃO DO BANCO DE DADOS ---
const isProduction = process.env.NODE_ENV === "production" || process.env.DB_HOST;
let pool: any;
let sqliteDb: any;

async function initDb() {
  console.log("Iniciando banco de dados...");
  // Se DB_HOST estiver presente, tentamos MySQL. Se não, usamos SQLite.
  const hasMysqlConfig = !!process.env.DB_HOST;
  
  if (hasMysqlConfig) {
    console.log(`Tentando MySQL em ${process.env.DB_HOST}...`);
    try {
      pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "iwedding_db",
        connectTimeout: 15000, // Aumentado para 15s para conexões remotas
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000
      });
      
      const connection = await pool.getConnection();
      console.log("Conexão MySQL estabelecida com sucesso.");
      
      try {
        // Test query
        await connection.query("SELECT 1");
        
        // Initialize tables
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
        console.log("Tabelas MySQL verificadas/criadas.");
      } finally {
        connection.release();
      }
      return; // Sucesso
    } catch (err) {
      console.error("Falha ao conectar ou inicializar MySQL. Usando SQLite como fallback.", err);
      pool = null;
    }
  } else {
    console.log("Configuração MySQL (DB_HOST) não encontrada. Usando SQLite.");
  }
  
  setupSqlite();
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
  console.log("Banco de dados SQLite inicializado.");
}

// Helper to execute queries on either MySQL or SQLite
async function executeQuery(sql: string, params: any[] = []) {
  let timeoutId: any;
  const timeoutPromise = new Promise((_, reject) => 
    timeoutId = setTimeout(() => reject(new Error("Query timeout")), 10000)
  );

  const queryPromise = (async () => {
    try {
      if (pool) {
        // Usar .query em vez de .execute para maior compatibilidade com diferentes versões/configs de MySQL
        const [rows] = await pool.query(sql, params);
        return rows;
      } else if (sqliteDb) {
        if (sql.trim().toUpperCase().startsWith("SELECT")) {
          return sqliteDb.prepare(sql).all(...params);
        } else {
          const result = sqliteDb.prepare(sql).run(...params);
          return { insertId: result.lastInsertRowid, affectedRows: result.changes };
        }
      } else {
        throw new Error("Banco de dados não inicializado.");
      }
    } finally {
      clearTimeout(timeoutId);
    }
  })();

  return Promise.race([queryPromise, timeoutPromise]);
}

const JWT_SECRET = process.env.JWT_SECRET || "wedding-secret-key";

// Async wrapper to catch errors in routes
const asyncHandler = (fn: any) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Start listening immediately to avoid 502 errors
  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });

  app.get("/ping", (req, res) => res.send("pong"));

  // Initialize DB in background
  initDb().then(() => {
    console.log("Database initialization complete.");
  }).catch(err => {
    console.error("Database initialization failed:", err);
  });
  
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  app.use(express.json({ limit: '10mb' }));
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

  app.get("/api/health", (req, res) => res.json({ 
    status: "ok", 
    port: PORT,
    db: pool ? "mysql" : (sqliteDb ? "sqlite" : "not_initialized")
  }));

  // Auth
  app.post("/api/auth/register", asyncHandler(async (req: any, res: any) => {
    const { name, email, password } = req.body;
    console.log(`Tentativa de registro: ${email}`);
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      const result: any = await executeQuery(
        "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
        [name, email, hashedPassword]
      );
      const token = jwt.sign({ id: result.insertId, email }, JWT_SECRET);
      res.json({ token, user: { id: result.insertId, name, email } });
    } catch (e) {
      console.error("Erro no registro:", e);
      res.status(400).json({ error: "Email already exists" });
    }
  }));

  app.post("/api/auth/login", asyncHandler(async (req: any, res: any) => {
    const { email, password } = req.body;
    console.log(`Tentativa de login: ${email}`);
    try {
      const rows: any = await executeQuery("SELECT * FROM users WHERE email = ?", [email]);
      const user = rows[0];
      if (user && await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ id: user.id, email }, JWT_SECRET);
        res.json({ token, user: { id: user.id, name: user.name, email } });
      } else {
        res.status(401).json({ error: "Invalid credentials" });
      }
    } catch (e) {
      console.error("Erro no login:", e);
      res.status(500).json({ error: "Internal server error during login" });
    }
  }));

// Wedding
  app.get("/api/wedding/me", authenticate, asyncHandler(async (req: any, res: any) => {
    const rows: any = await executeQuery("SELECT * FROM weddings WHERE user_id = ?", [req.user.id]);
    res.json(rows[0] || null);
  }));

  app.post("/api/wedding", authenticate, asyncHandler(async (req: any, res: any) => {
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
  }));

  app.put("/api/wedding", authenticate, asyncHandler(async (req: any, res: any) => {
    try {
      const fields = [
        'couple_names', 'wedding_date', 'rsvp_deadline', 'story', 'location', 
        'theme_color', 'invitation_template_id', 'invitation_text', 
        'smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from'
      ];

      const updates: string[] = [];
      const values: any[] = [];

      fields.forEach(field => {
        if (req.body[field] !== undefined) {
          updates.push(`${field} = ?`);
          const val = req.body[field] === "" ? null : req.body[field];
          values.push(val);
        }
      });

      if (updates.length === 0) {
        return res.json({ success: true, message: "No fields to update" });
      }

      values.push(req.user.id);
      await executeQuery(
        `UPDATE weddings SET ${updates.join(', ')} WHERE user_id = ?`,
        values
      );
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating wedding:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }));

  app.post("/api/guests/:id/send-email", authenticate, asyncHandler(async (req: any, res: any) => {
    try {
      const wRows: any = await executeQuery("SELECT * FROM weddings WHERE user_id = ?", [req.user.id]);
      const wedding = wRows[0];
      if (!wedding || !wedding.smtp_host) return res.status(400).json({ error: "Configuração de e-mail incompleta" });

      const gRows: any = await executeQuery("SELECT * FROM guests WHERE id = ? AND wedding_id = ?", [req.params.id, wedding.id]);
      const guest = gRows[0];
      if (!guest || !guest.email) return res.status(400).json({ error: "Convidado sem e-mail" });

      const transporter = nodemailer.createTransport({
        host: wedding.smtp_host,
        port: wedding.smtp_port,
        secure: wedding.smtp_port === 465,
        auth: {
          user: wedding.smtp_user,
          pass: wedding.smtp_pass,
        },
      });

      const inviteUrl = `${process.env.APP_URL || 'http://localhost:3000'}/w/${wedding.slug}`;
      
      await transporter.sendMail({
        from: wedding.smtp_from || wedding.smtp_user,
        to: guest.email,
        subject: `Convite de Casamento: ${wedding.couple_names}`,
        html: `
          <div style="font-family: serif; text-align: center; padding: 40px; background: #fafafa;">
            <h1 style="color: #e11d48;">${wedding.couple_names}</h1>
            <p style="font-size: 18px;">Você foi convidado para o nosso casamento!</p>
            <p>Data: ${wedding.wedding_date || 'A definir'}</p>
            <p>Seu código de acesso: <strong>${guest.token}</strong></p>
            <a href="${inviteUrl}" style="display: inline-block; padding: 12px 24px; background: #e11d48; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px;">Ver Convite Online</a>
          </div>
        `,
      });

      res.json({ success: true });
    } catch (err: any) {
      console.error("Erro ao enviar e-mail:", err);
      res.status(500).json({ error: err.message });
    }
  }));

  // Public Wedding Page
  app.get("/api/public/wedding/:slug", asyncHandler(async (req: any, res: any) => {
    const wRows: any = await executeQuery("SELECT * FROM weddings WHERE slug = ?", [req.params.slug]);
    const wedding = wRows[0];
    if (!wedding) return res.status(404).json({ error: "Wedding not found" });
    const gRows: any = await executeQuery("SELECT * FROM gifts WHERE wedding_id = ?", [wedding.id]);
    const pRows: any = await executeQuery("SELECT * FROM photos WHERE wedding_id = ? ORDER BY created_at DESC", [wedding.id]);
    res.json({ wedding, gifts: gRows, photos: pRows });
  }));

  // Guests (RSVP)
  app.get("/api/guests", authenticate, asyncHandler(async (req: any, res: any) => {
    const wRows: any = await executeQuery("SELECT id FROM weddings WHERE user_id = ?", [req.user.id]);
    const wedding = wRows[0];
    if (!wedding) return res.json([]);
    const gRows: any = await executeQuery("SELECT * FROM guests WHERE wedding_id = ? ORDER BY id DESC", [wedding.id]);
    res.json(gRows);
  }));

  app.post("/api/guests", authenticate, asyncHandler(async (req: any, res: any) => {
    const { name, email, phone } = req.body;
    const wRows: any = await executeQuery("SELECT id FROM weddings WHERE user_id = ?", [req.user.id]);
    const wedding = wRows[0];
    if (!wedding) return res.status(404).json({ error: "Wedding not found" });

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
  }));

  app.post("/api/public/rsvp/:slug", asyncHandler(async (req: any, res: any) => {
    const { name, email, phone, status, token } = req.body;
    const wRows: any = await executeQuery("SELECT id FROM weddings WHERE slug = ?", [req.params.slug]);
    const wedding = wRows[0];
    if (!wedding) return res.status(404).json({ error: "Wedding not found" });

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
  }));

  // Gifts
  app.get("/api/gifts", authenticate, asyncHandler(async (req: any, res: any) => {
    const wRows: any = await executeQuery("SELECT id FROM weddings WHERE user_id = ?", [req.user.id]);
    const wedding = wRows[0];
    if (!wedding) return res.json([]);
    const gRows: any = await executeQuery("SELECT * FROM gifts WHERE wedding_id = ?", [wedding.id]);
    res.json(gRows);
  }));

  app.post("/api/gifts", authenticate, asyncHandler(async (req: any, res: any) => {
    const { name, description, price, image_url } = req.body;
    const wRows: any = await executeQuery("SELECT id FROM weddings WHERE user_id = ?", [req.user.id]);
    const wedding = wRows[0];
    await executeQuery(
      "INSERT INTO gifts (wedding_id, name, description, price, image_url) VALUES (?, ?, ?, ?, ?)",
      [wedding.id, name, description || null, price || 0, image_url || null]
    );
    res.json({ success: true });
  }));

  // Photos
  app.get("/api/photos", authenticate, asyncHandler(async (req: any, res: any) => {
    const wRows: any = await executeQuery("SELECT id FROM weddings WHERE user_id = ?", [req.user.id]);
    const wedding = wRows[0];
    if (!wedding) return res.json([]);
    const pRows: any = await executeQuery("SELECT * FROM photos WHERE wedding_id = ? ORDER BY created_at DESC", [wedding.id]);
    res.json(pRows);
  }));

  app.post("/api/photos", authenticate, asyncHandler(async (req: any, res: any) => {
    const { url, caption } = req.body;
    const wRows: any = await executeQuery("SELECT id FROM weddings WHERE user_id = ?", [req.user.id]);
    const wedding = wRows[0];
    await executeQuery(
      "INSERT INTO photos (wedding_id, url, caption, is_guest_photo) VALUES (?, ?, ?, 0)",
      [wedding.id, url, caption || null]
    );
    res.json({ success: true });
  }));

  app.delete("/api/photos/:id", authenticate, asyncHandler(async (req: any, res: any) => {
    const wRows: any = await executeQuery("SELECT id FROM weddings WHERE user_id = ?", [req.user.id]);
    const wedding = wRows[0];
    await executeQuery("DELETE FROM photos WHERE id = ? AND wedding_id = ?", [req.params.id, wedding.id]);
    res.json({ success: true });
  }));

  // Public Guest Photo Upload
  app.post("/api/public/photos/:slug", upload.single("image"), asyncHandler(async (req: any, res: any) => {
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
  }));

  // Image Upload
  app.post("/api/upload", authenticate, upload.single("image"), (req: any, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    res.json({ url: `/uploads/${req.file.filename}` });
  });

  // Vite middleware for development
  const distPath = path.join(__dirname, "dist");
  try {
    if (process.env.NODE_ENV !== "production" || !fs.existsSync(distPath)) {
      console.log("Usando Vite middleware (desenvolvimento ou dist ausente)...");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      console.log("Servindo arquivos estáticos de dist (produção)...");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  } catch (viteError) {
    console.error("Erro ao iniciar Vite middleware:", viteError);
    // Fallback if vite fails
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  }

  // Global Error Handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("Global Error Handler:", err);
    res.status(500).json({ 
      error: "Internal Server Error", 
      message: err.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack 
    });
  });
}

startServer();
