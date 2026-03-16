import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isVercel = process.env.VERCEL === "1";
const useSupabase = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

// --- Database Initialization ---
let db: any = null;
let supabase: any = null;

async function initDatabase() {
  if (useSupabase) {
    console.log("Using Supabase as the database...");
    supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  } else {
    console.log("Using SQLite as the database...");
    try {
      // Dynamic import to prevent crash on environments where better-sqlite3 is not supported
      const { default: Database } = await import("better-sqlite3");
      const dbPath = isVercel ? path.join("/tmp", "research_system.db") : path.join(__dirname, "research_system.db");
      
      if (isVercel && !fs.existsSync(dbPath)) {
        try {
          const initialDbPath = path.join(process.cwd(), "research_system.db");
          if (fs.existsSync(initialDbPath)) {
            fs.copyFileSync(initialDbPath, dbPath);
          }
        } catch (err) {
          console.error("Failed to copy initial database:", err);
        }
      }

      db = new Database(dbPath);
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
          status_rec TEXT DEFAULT 'Pending'
        );
        CREATE TABLE IF NOT EXISTS co_authors (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          research_id INTEGER,
          name TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS reviews (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          research_id INTEGER,
          reviewer_id INTEGER,
          review_type TEXT CHECK(review_type IN ('TRB', 'REC')),
          comments TEXT,
          status TEXT,
          review_date DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Seed Admin
      const adminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'").get() as { count: number };
      if (adminCount.count === 0) {
        db.prepare("INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)").run(
          "System Admin", "admin@lathala.edu", "admin123", "admin"
        );
      }
    } catch (err) {
      console.error("Database initialization failed:", err);
      if (isVercel) {
        console.error("Note: SQLite is not recommended on Vercel. Please configure Supabase.");
      }
    }
  }
}

// Ensure database is initialized before handling requests
const initPromise = initDatabase();

const app = express();
app.use(express.json());

// Middleware to wait for DB initialization
app.use(async (req, res, next) => {
  await initPromise;
  next();
});

// --- Auth API ---
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`Login attempt: ${email}`);

    if (useSupabase) {
      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .eq("password", password)
        .single();

      if (error || !user) {
        console.log(`Login failed for ${email}: ${error?.message || "User not found"}`);
        return res.status(401).json({ error: "Invalid credentials" });
      }
      return res.json(user);
    } else {
      if (!db) return res.status(500).json({ error: "Database not initialized. Please check server logs." });
      const user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password);
      if (user) {
        res.json(user);
      } else {
        res.status(401).json({ error: "Invalid credentials" });
      }
    }
  } catch (err: any) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// --- User Management API ---
app.get("/api/users", async (req, res) => {
  try {
    if (useSupabase) {
      const { data: users, error } = await supabase.from("users").select("id, full_name, email, role, department, position, type");
      if (error) throw error;
      res.json(users);
    } else {
      const users = db!.prepare("SELECT id, full_name, email, role, department, position, type FROM users").all();
      res.json(users);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/register", async (req, res) => {
  try {
    const { full_name, email, password, phone, department, position, role, type } = req.body;
    if (useSupabase) {
      const { data, error } = await supabase.from("users").insert([{
        full_name, email, password, phone, department, position, role, type: type || 'internal'
      }]).select().single();
      if (error) throw error;
      res.json({ id: data.id });
    } else {
      const result = db!.prepare(`
        INSERT INTO users (full_name, email, password, phone, department, position, role, type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(full_name, email, password, phone, department, position, role, type || 'internal');
      res.json({ id: result.lastInsertRowid });
    }
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Registration failed" });
  }
});

// --- Research API ---
app.get("/api/research", async (req, res) => {
  try {
    const { userId, role } = req.query;
    if (useSupabase) {
      let query = supabase.from("research").select("*");
      if (role === 'researcher') {
        query = query.eq("researcher_id", userId);
      }
      const { data, error } = await query;
      if (error) throw error;
      res.json(data);
    } else {
      let query = "SELECT * FROM research";
      let params: any[] = [];
      if (role === 'researcher') {
        query += " WHERE researcher_id = ?";
        params.push(userId);
      }
      const research = db!.prepare(query).all(...params);
      res.json(research);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/research", async (req, res) => {
  try {
    const { title, description, hra_alignment, department, researcher_id, co_authors } = req.body;
    const hru_number = `HRU-${Date.now()}`;

    if (useSupabase) {
      const { data: research, error: rError } = await supabase.from("research").insert([{
        hru_number, title, description, hra_alignment, department, researcher_id
      }]).select().single();
      if (rError) throw rError;

      if (co_authors && Array.isArray(co_authors)) {
        const authors = co_authors.map(name => ({ research_id: research.id, name }));
        const { error: aError } = await supabase.from("co_authors").insert(authors);
        if (aError) throw aError;
      }
      res.json({ id: research.id, hru_number });
    } else {
      const result = db!.prepare(`
        INSERT INTO research (hru_number, title, description, hra_alignment, department, researcher_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(hru_number, title, description, hra_alignment, department, researcher_id);
      
      const researchId = result.lastInsertRowid;
      if (co_authors && Array.isArray(co_authors)) {
        const stmt = db!.prepare("INSERT INTO co_authors (research_id, name) VALUES (?, ?)");
        co_authors.forEach(name => stmt.run(researchId, name));
      }
      res.json({ id: researchId, hru_number });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Analytics API ---
app.get("/api/analytics", async (req, res) => {
  try {
    if (useSupabase) {
      const { data: research, error } = await supabase.from("research").select("status_trb, status_rec, registration_date");
      if (error) throw error;

      const stats = {
        total: { count: research.length },
        approved: { count: research.filter((r: any) => r.status_trb === 'Approved' && r.status_rec === 'Approved').length },
        pending: { count: research.filter((r: any) => r.status_trb === 'Pending' || r.status_rec === 'Pending').length },
        rejected: { count: research.filter((r: any) => r.status_trb === 'Rejected' || r.status_rec === 'Rejected').length },
        under_review: { count: research.filter((r: any) => r.status_trb === 'Under Review' || r.status_rec === 'Under Review').length },
      };

      res.json({ stats, monthly: [] }); // Monthly logic simplified for Supabase example
    } else {
      const stats = {
        total: db!.prepare("SELECT COUNT(*) as count FROM research").get() as any,
        approved: db!.prepare("SELECT COUNT(*) as count FROM research WHERE status_trb = 'Approved' AND status_rec = 'Approved'").get() as any,
        pending: db!.prepare("SELECT COUNT(*) as count FROM research WHERE status_trb = 'Pending' OR status_rec = 'Pending'").get() as any,
        rejected: db!.prepare("SELECT COUNT(*) as count FROM research WHERE status_trb = 'Rejected' OR status_rec = 'Rejected'").get() as any,
        under_review: db!.prepare("SELECT COUNT(*) as count FROM research WHERE status_trb = 'Under Review' OR status_rec = 'Under Review'").get() as any,
      };
      res.json({ stats, monthly: [] });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/reviews", async (req, res) => {
  try {
    const { research_id, reviewer_id, review_type, comments, status } = req.body;
    if (useSupabase) {
      const { error: revError } = await supabase.from("reviews").insert([{
        research_id, reviewer_id, review_type, comments, status
      }]);
      if (revError) throw revError;

      const column = review_type === 'TRB' ? 'status_trb' : 'status_rec';
      const { error: resError } = await supabase.from("research").update({ [column]: status }).eq("id", research_id);
      if (resError) throw resError;

      res.json({ success: true });
    } else {
      db!.transaction(() => {
        db!.prepare(`INSERT INTO reviews (research_id, reviewer_id, review_type, comments, status) VALUES (?, ?, ?, ?, ?)`).run(research_id, reviewer_id, review_type, comments, status);
        const column = review_type === 'TRB' ? 'status_trb' : 'status_rec';
        db!.prepare(`UPDATE research SET ${column} = ? WHERE id = ?`).run(status, research_id);
      })();
      res.json({ success: true });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default app;

async function startServer() {
  const PORT = 3000;
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => res.sendFile(path.join(process.cwd(), "dist", "index.html")));
  }
  app.listen(PORT, "0.0.0.0", () => console.log(`Server running on http://localhost:${PORT}`));
}

if (!isVercel) startServer();
