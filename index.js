
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

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Mobile API is running!'
  });
});

app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, created_at FROM users ORDER BY id'
    );

    res.json({
      users: result.rows,
      count: result.rowCount
    });
  } catch (err) {
    console.error('Database query error:', err.message);
    res.status(500).json({
      error: 'Database query failed'
    });
  }
});


app.post('/api/users', async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        error: 'Name and email are required'
      });
    }

    const result = await pool.query(
      'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id, name, email, created_at',
      [name, email]
    );

    res.status(201).json({
      message: 'User created successfully',
      user: result.rows[0]
    });
  } catch (err) {
    console.error('Database query error:', err.message);

    if (err.code === '23505') {
      return res.status(409).json({
        error: 'Email already exists'
      });
    }

    res.status(500).json({
      error: 'Database query failed'
    });
  }
});

// Изменение данных пользователя
app.put('/api/users/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, email } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: 'Invalid user ID'
      });
    }

    if (!name || !email) {
      return res.status(400).json({
        error: 'Name and email are required'
      });
    }

    const result = await pool.query(
      `UPDATE users
       SET name = $1, email = $2
       WHERE id = $3
       RETURNING id, name, email, created_at`,
      [name, email, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json({
      message: 'User updated successfully',
      user: result.rows[0]
    });
  } catch (err) {
    console.error('Database query error:', err.message);

    if (err.code === '23505') {
      return res.status(409).json({
        error: 'Email already exists'
      });
    }

    res.status(500).json({
      error: 'Database query failed'
    });
  }
});

// Удаление пользователя
app.delete('/api/users/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: 'Invalid user ID'
      });
    }

    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id, name, email',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json({
      message: 'User deleted successfully',
      user: result.rows[0]
    });
  } catch (err) {
    console.error('Database query error:', err.message);

    res.status(500).json({
      error: 'Database query failed'
    });
  }
});

app.listen(port, () => {
  console.log(`Mobile API listening on port ${port}`);
});