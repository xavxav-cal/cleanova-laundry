CREATE TABLE IF NOT EXISTS test_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO test_logs DEFAULT VALUES;

CREATE TABLE IF NOT EXISTS products (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT    NOT NULL,
    price        REAL    NOT NULL,
    stock        INTEGER DEFAULT 0,
    category     TEXT,
    description  TEXT,
    is_available INTEGER DEFAULT 1,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  nama_lengkap TEXT,
  role TEXT DEFAULT 'admin',
  last_login DATETIME
);

INSERT OR IGNORE INTO admins (id, username, password, nama_lengkap, role) 
VALUES (1, 'admin', '12345', 'Administrator Utama', 'owner');