const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = 3000;

const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 5432,
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Mobile API is running!'
  });
});

app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as time');
    res.json({
      users: [],
      server_time: result.rows[0].time
    });
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({ error: 'Database query failed' });
  }
});

app.listen(port, () => {
  console.log(`Mobile API listening on port ${port}`);
});
