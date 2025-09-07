const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',      
  password: 'root',      
  database: 'task' 
});

db.connect(err => {
  if (err) {
    console.error('DB connection failed:', err);
    return;
  }
  console.log('✅ Connected to MySQL');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  db.query(
    'SELECT * FROM users WHERE username = ? AND password = ?',
    [username, password],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (results.length > 0) {
        res.json({ success: true, message: 'Login successful' });
      } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
    }
  );
});

// Fetch all software records
app.get('/dashboard', (req, res) => {
  db.query('SELECT * FROM software_dashboard', (err, results) => {
    if (err) {
      console.error('DB Fetch Error:', err);
      return res.status(500).json({ error: 'Database fetch error' });
    }
    res.json(results); // ✅ send existing records
  });
});

// Insert new software record
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
      res.json({ success: true, id: result.insertId }); // ✅ return new record ID
    }
  );
});



app.listen(3000, () => console.log('🚀 Server running on http://localhost:3000'));
