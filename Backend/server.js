const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();
const path = require('path');

const app = express();

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  const { password, ...safeUser } = user;
  return safeUser;
}


// middleware

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'Frontend')));


// test connection

app.get('/test', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    console.error("DB TEST ERROR:", err.message);
    res.status(500).json({ error: 'Database error' });
  }
});


// register user

app.post('/register', async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }

  try {
    const newUser = await pool.query(
      `INSERT INTO users (name, email, password, role, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, email, password, 'user', phone || null]
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: sanitizeUser(newUser.rows[0]),
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err.message);

    if (err.code === '23505') {
      return res.status(400).json({ error: 'Email already exists' });
    }

    res.status(500).json({ error: 'Server error' });
  }
});


// get user profile

app.get('/users/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1 LIMIT 1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: sanitizeUser(result.rows[0]),
    });
  } catch (err) {
    console.error('USER FETCH ERROR:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});


// update user profile

app.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, password } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  try {
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE id = $1 LIMIT 1',
      [id]
    );

    if (existingUser.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentUser = existingUser.rows[0];
    const nextPassword = password && password.trim() ? password : currentUser.password;

    const result = await pool.query(
      `UPDATE users
       SET name = $1, email = $2, phone = $3, password = $4
       WHERE id = $5
       RETURNING *`,
      [name, email, phone || null, nextPassword, id]
    );

    res.json({
      message: 'Profile updated successfully',
      user: sanitizeUser(result.rows[0]),
    });
  } catch (err) {
    console.error('USER UPDATE ERROR:', err.message);

    if (err.code === '23505') {
      return res.status(400).json({ error: 'Email already exists' });
    }

    res.status(500).json({ error: 'Server error' });
  }
});


// get user booking and payment history

app.get('/users/:id/history', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT
          b.id AS booking_id,
          b.service_id,
          b.date,
          b.time,
          b.status AS booking_status,
          p.id AS payment_id,
          p.amount,
          p.status AS payment_status
       FROM bookings b
       LEFT JOIN payments p ON p.booking_id = b.id
       WHERE b.user_id = $1
       ORDER BY b.date DESC, b.time DESC, b.id DESC`,
      [id]
    );

    res.json({ history: result.rows });
  } catch (err) {
    console.error('USER HISTORY ERROR:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});


// login user

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND password = $2 LIMIT 1',
      [email, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json({
      message: 'Login successful',
      user: sanitizeUser(result.rows[0]),
    });
  } catch (err) {
    console.error('LOGIN ERROR:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});


// services

app.get('/services', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM services');
    res.json(result.rows);
  } catch (err) {
    console.error("SERVICES ERROR:", err.message);
    res.status(500).json({ error: 'Error fetching services' });
  }
});


// create booking

app.post('/book', async (req, res) => {
  const { user_id, service_id, date, time } = req.body;

  if (!user_id || !service_id || !date || !time) {
    return res.status(400).json({ error: "Missing booking fields" });
  }

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
    console.error("BOOK ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


// payment

app.post('/payment', async (req, res) => {
  const { booking_id, amount } = req.body;

  
  if (!booking_id || !amount) {
    return res.status(400).json({ error: "Missing booking_id or amount" });
  }

  try {
    // check if booking exist
    const booking = await pool.query(
      "SELECT user_id, service_id FROM bookings WHERE id = $1",
      [booking_id]
    );

    if (booking.rows.length === 0) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const { user_id, service_id } = booking.rows[0];

    // payment
    const payment = await pool.query(
      `INSERT INTO payments (user_id, booking_id, service_id, amount, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user_id, booking_id, service_id, amount, 'confirmed']
    );

    // update booking status
    await pool.query(
      "UPDATE bookings SET status = 'confirmed' WHERE id = $1",
      [booking_id]
    );

    res.status(201).json({
      message: "Payment successful",
      payment: payment.rows[0]
    });

  } catch (err) {
    console.error("PAYMENT ERROR:", err);
    res.status(500).json({ error: "Payment failed" });
  }
});


// start server

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
