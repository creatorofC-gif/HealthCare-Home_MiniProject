const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();


// middleware

app.use(cors());
app.use(express.json());


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

  if (!name || !email || !password || !phone) {
    return res.status(400).json({ error: "All fields are required" });
  }

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
    console.error("REGISTER ERROR:", err.message);

    if (err.code === '23505') {
      return res.status(400).json({ error: 'Email already exists' });
    }

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