const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'tasks'
});

db.connect(err => {
  if (err) {
    console.error('DB connection failed:', err);
    return;
  }
  console.log('✅ Connected to MySQL');
});

// ---------------- SIGNUP (store hashed password) ----------------



// inside your signup route
app.post("/signup", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username and password required" });
    }

    // ✅ hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ store hashed password in DB
    db.query(
      "INSERT INTO users (username, password) VALUES (?, ?)",
      [username, hashedPassword],
      (err, result) => {
        if (err) {
          console.error("DB Error:", err);
          return res.status(500).json({ success: false, message: "Database error" });
        }
        res.json({ success: true, message: "User registered successfully" });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});



// ---------------- LOGIN (verify with bcrypt) ----------------
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.query("SELECT * FROM users WHERE username = ?", [username], async (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Database error" });
    }

    if (results.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid username or password" });
    }

    const user = results[0];

    // ✅ compare hashed password
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ success: false, message: "Invalid username or password" });
    }

    res.json({ success: true, message: "Login successful" });
  });
});


// ---------------- SOFTWARE DASHBOARD ----------------
app.get('/dashboard', (req, res) => {
  db.query('SELECT * FROM software_dashboard', (err, results) => {
    if (err) {
      console.error('DB Fetch Error:', err);
      return res.status(500).json({ error: 'Database fetch error' });
    }
    res.json(results);
  });
});

app.post('/dashboard', (req, res) => {
  const { app_name, version, status, open_issues, resolved_tickets } = req.body;

  if (!app_name || !version) {
    return res.status(400).json({ error: 'App name and version are required' });
  }

  db.query(
    'INSERT INTO software_dashboard (app_name, version, status, open_issues, resolved_tickets) VALUES (?, ?, ?, ?, ?)',
    [app_name, version, status || 'Running', open_issues || 0, resolved_tickets || 0],
    (err, result) => {
      if (err) {
        console.error('DB Insert Error:', err);
        return res.status(500).json({ error: 'Database insert error' });
      }
      res.json({ success: true, id: result.insertId });
    }
  );
});

app.delete("/dashboard/:id", (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM software_dashboard WHERE id = ?", [id], (err, result) => {
    if (err) {
      console.error("DB Delete Error:", err);
      return res.status(500).json({ error: "Database delete error" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Record not found" });
    }

    res.json({ success: true, message: "Software deleted" });
  });
});


app.listen(3000, () => console.log('🚀 Server running on http://localhost:3000'));
