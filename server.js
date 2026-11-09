require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./src/config/database');
const testRoutes = require('./src/routes/test');
const productRoutes = require('./src/routes/productRoutes');
const authRoutes = require('./src/routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

/* Middleware */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* Root route */
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Cleanova Laundry API is running',
  });
});

/* Routes */
app.use('/api/test', testRoutes);
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);

/* ========================================== */
/* TAMBAHKAN ENDPOINT LOG AKTIVITAS DI SINI  */
/* ========================================== */

// Endpoint untuk mengambil riwayat log aktivitas
app.get('/api/logs', (req, res) => {
  // Perbaiki path menjadi ./src/config/database
  const { db } = require('./src/config/database'); 
  
  const query = `
    SELECT id, activity, timestamp 
    FROM activity_logs 
    ORDER BY id DESC 
    LIMIT 50
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("Gagal ambil log:", err);
      return res.status(500).json({ success: false, message: 'Gagal mengambil data log.' });
    }
    res.json({ success: true, data: rows });
  });
});

/* ========================================== */

/* 404 */
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' });
});

/* Start */
(async () => {
  await initializeDatabase();
  app.listen(PORT, () => {
    console.log(`🚀 Server: http://localhost:${PORT}`);
  });
})();