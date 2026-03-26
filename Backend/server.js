const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

/*
Check Database Connection (Naitik)
*/
app.get('/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Database error' });
  }
});

/*
Register User (Naitik)
*/
app.post('/register', async (req, res) => {
  const { name, email, password, phone } = req.body;

  try {
    const newUser = await pool.query(
      `INSERT INTO users (name, email, password, role, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, email, password, 'user', phone]
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: newUser.rows[0],
    });
  } catch (err) {
    console.error(err.message);

    if (err.code === '23505') {
      return res.status(400).json({ error: 'Email already exists' });
    }

    res.status(500).json({ error: 'Server error' });
  }
});

/*
Get Services (Naitik)
*/
app.get('/services', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM services');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error fetching services' });
  }
});

/*
Create Booking (Naitik)
*/
app.post('/book', async (req, res) => {
  const { user_id, service_id, date, time } = req.body;

  try {
    const booking = await pool.query(
      `INSERT INTO bookings (user_id, service_id, date, time, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user_id, service_id, date, time, 'pending']
    );

    res.status(201).json({
      message: 'Booking created',
      booking: booking.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Booking failed' });
  }
});

/*
Start Server (Naitik)
*/
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});