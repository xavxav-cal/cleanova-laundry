const { db } = require('../config/database');

// Login Admin & Catat Waktu Login
const login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username dan password harus diisi!' });
  }

  db.get('SELECT * FROM admins WHERE username = ? AND password = ?', [username, password], (err, row) => {
    if (err) return res.status(500).json({ success: false, message: 'Kesalahan database.' });
    if (!row) return res.status(401).json({ success: false, message: 'Username atau password salah!' });

    const now = new Date().toISOString();
    db.run('UPDATE admins SET last_login = ? WHERE id = ?', [now, row.id]);

    res.json({
      success: true,
      message: 'Login berhasil!',
      user: { 
        id: row.id, 
        username: row.username, 
        nama_lengkap: row.nama_lengkap,
        role: row.role || 'admin'
      }
    });
  });
};

// Ambil Semua Daftar Pengguna Admin & Riwayat Login
const getAllUsers = (req, res) => {
  db.all('SELECT id, username, nama_lengkap, role, last_login FROM admins ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ success: false, message: 'Gagal mengambil data pengguna.' });
    res.json({ success: true, data: rows });
  });
};

// Tambah Pengguna Baru (Owner, Admin, Kasir)
const createUser = (req, res) => {
  const { username, password, nama_lengkap, role } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username dan password wajib diisi!' });
  }

  // Validasi role yang diperbolehkan
  const validRoles = ['owner', 'admin', 'kasir'];
  const userRole = validRoles.includes(role) ? role : 'kasir';

  db.run(
    'INSERT INTO admins (username, password, nama_lengkap, role) VALUES (?, ?, ?, ?)',
    [username.trim(), password, nama_lengkap || 'Staf Kasir', userRole],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ success: false, message: 'Username sudah digunakan!' });
        }
        return res.status(500).json({ success: false, message: 'Gagal membuat pengguna baru.' });
      }
      res.json({ success: true, message: `Pengguna baru (${userRole}) berhasil ditambahkan!` });
    }
  );
};

// Memperbarui Role Pengguna
const updateUserRole = (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  const validRoles = ['owner', 'admin', 'kasir'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ success: false, message: 'Role tidak valid!' });
  }

  db.run('UPDATE admins SET role = ? WHERE id = ?', [role, id], function (err) {
    if (err) {
      return res.status(500).json({ success: false, message: 'Gagal memperbarui role pengguna.' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
    }
    res.json({ success: true, message: 'Role pengguna berhasil diperbarui!' });
  });
};

// Pastikan fungsi ini ikut diekspor di baris paling bawah:
module.exports = { login, getAllUsers, createUser, updateUserRole };