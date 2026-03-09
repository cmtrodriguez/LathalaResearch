import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Handle database path for Vercel (ephemeral /tmp)
const isVercel = process.env.VERCEL === "1";
const dbPath = isVercel ? path.join("/tmp", "research_system.db") : path.join(__dirname, "research_system.db");

// If on Vercel, copy the initial database to /tmp if it doesn't exist
if (isVercel && !fs.existsSync(dbPath)) {
  const initialDbPath = path.join(process.cwd(), "research_system.db");
  if (fs.existsSync(initialDbPath)) {
    fs.copyFileSync(initialDbPath, dbPath);
  }
}

console.log(`Initializing database at ${dbPath}...`);
const db = new Database(dbPath);

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone TEXT,
    department TEXT,
    position TEXT,
    role TEXT CHECK(role IN ('admin', 'researcher', 'evaluator')) NOT NULL,
    type TEXT CHECK(type IN ('internal', 'external')) DEFAULT 'internal'
  );

  CREATE TABLE IF NOT EXISTS research (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hru_number TEXT UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    hra_alignment TEXT,
    department TEXT,
    researcher_id INTEGER,
    status_trb TEXT DEFAULT 'Pending',
    status_rec TEXT DEFAULT 'Pending',
    FOREIGN KEY (researcher_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS co_authors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    research_id INTEGER,
    name TEXT NOT NULL,
    FOREIGN KEY (research_id) REFERENCES research(id)
  );

  CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    research_id INTEGER,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    category TEXT,
    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (research_id) REFERENCES research(id)
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    research_id INTEGER,
    reviewer_id INTEGER,
    review_type TEXT CHECK(review_type IN ('TRB', 'REC')),
    comments TEXT,
    status TEXT,
    review_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (research_id) REFERENCES research(id),
    FOREIGN KEY (reviewer_id) REFERENCES users(id)
  );
`);

// Seed Admin if not exists
const adminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").get() as { count: number };
if (adminCount.count === 0) {
  db.prepare("INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)").run(
    "System Admin",
    "admin@lathala.edu",
    "admin123",
    "admin"
  );
}

// Seed Evaluators
const evalCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'evaluator'").get() as { count: number };
if (evalCount.count === 0) {
  const stmt = db.prepare("INSERT INTO users (full_name, email, password, role, department) VALUES (?, ?, ?, ?, ?)");
  stmt.run("Dr. Alice Smith", "alice@lathala.edu", "eval123", "evaluator", "Medicine");
  stmt.run("Prof. Bob Jones", "bob@lathala.edu", "eval123", "evaluator", "Public Health");
}

const app = express();
app.use(express.json());

// Auth API
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  console.log(`Login attempt: ${email}`);
  const user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password);
  if (user) {
    console.log(`Login success: ${email}`);
    res.json(user);
  } else {
    console.log(`Login failed: ${email}`);
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// User Management API
app.get("/api/users", (req, res) => {
  const users = db.prepare("SELECT id, full_name, email, role, department, position, type FROM users").all();
  res.json(users);
});

app.post("/api/register", (req, res) => {
  const { full_name, email, password, phone, department, position, role, type } = req.body;
  try {
    const result = db.prepare(`
      INSERT INTO users (full_name, email, password, phone, department, position, role, type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(full_name, email, password, phone, department, position, role, type || 'internal');
    res.json({ id: result.lastInsertRowid });
  } catch (e) {
    res.status(400).json({ error: "Email already exists" });
  }
});

// Research API
app.get("/api/research", (req, res) => {
  const { userId, role } = req.query;
  let query = "SELECT * FROM research";
  let params: any[] = [];
  
  if (role === 'researcher') {
    query += " WHERE researcher_id = ?";
    params.push(userId);
  }
  
  const research = db.prepare(query).all(...params);
  res.json(research);
});

app.post("/api/research", (req, res) => {
  const { title, description, hra_alignment, department, researcher_id, co_authors } = req.body;
  
  const hru_number = `HRU-${Date.now()}`; // Option B: Generated immediately
  
  const result = db.prepare(`
    INSERT INTO research (hru_number, title, description, hra_alignment, department, researcher_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(hru_number, title, description, hra_alignment, department, researcher_id);
  
  const researchId = result.lastInsertRowid;
  
  if (co_authors && Array.isArray(co_authors)) {
    const stmt = db.prepare("INSERT INTO co_authors (research_id, name) VALUES (?, ?)");
    co_authors.forEach(name => stmt.run(researchId, name));
  }
  
  res.json({ id: researchId, hru_number });
});

// Analytics API
app.get("/api/analytics", (req, res) => {
  const stats = {
    total: db.prepare("SELECT COUNT(*) as count FROM research").get() as any,
    approved: db.prepare("SELECT COUNT(*) as count FROM research WHERE status_trb = 'Approved' AND status_rec = 'Approved'").get() as any,
    pending: db.prepare("SELECT COUNT(*) as count FROM research WHERE status_trb = 'Pending' OR status_rec = 'Pending'").get() as any,
    rejected: db.prepare("SELECT COUNT(*) as count FROM research WHERE status_trb = 'Rejected' OR status_rec = 'Rejected'").get() as any,
    under_review: db.prepare("SELECT COUNT(*) as count FROM research WHERE status_trb = 'Under Review' OR status_rec = 'Under Review'").get() as any,
  };
  
  const monthly = db.prepare(`
    SELECT strftime('%Y-%m', registration_date) as month, COUNT(*) as count 
    FROM research 
    GROUP BY month 
    ORDER BY month DESC 
    LIMIT 6
  `).all();

  res.json({ stats, monthly });
});

// Review API
app.post("/api/reviews", (req, res) => {
  const { research_id, reviewer_id, review_type, comments, status } = req.body;
  
  db.transaction(() => {
    db.prepare(`
      INSERT INTO reviews (research_id, reviewer_id, review_type, comments, status)
      VALUES (?, ?, ?, ?, ?)
    `).run(research_id, reviewer_id, review_type, comments, status);
    
    const column = review_type === 'TRB' ? 'status_trb' : 'status_rec';
    db.prepare(`UPDATE research SET ${column} = ? WHERE id = ?`).run(status, research_id);
  })();
  
  res.json({ success: true });
});

export default app;

async function startServer() {
  const PORT = 3000;
  
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
