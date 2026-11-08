import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Product {
  id: number;
  name: string;
  price: number;
  unit?: string;
}

interface AdminUser {
  id: number;
  username: string;
  nama_lengkap?: string;
  role?: string;
  last_login?: string;
}

const UNIT_OPTIONS = [
  { label: '/ kg (Kilogram)', value: 'kg' },
  { label: '/ pcs (Buah / Potong)', value: 'pcs' },
  { label: '/ pasang (Sepatu / Sandal)', value: 'pasang' },
  { label: '/ m² (Meter Persegi)', value: 'm²' },
];

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [products, setProducts] = useState<Product[]>([]);
  const [userList, setUserList] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('kg');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // State untuk Form Tambah Staf Baru
  const [newAdminUser, setNewAdminUser] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminRole, setNewAdminRole] = useState('kasir');

  // State untuk Edit Role User langsung di Tabel (Khusus Owner)
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [selectedUserRole, setSelectedUserRole] = useState<string>('kasir');

  // State Tab Aktif untuk Panel Owner ('kpi', 'staff', 'logs')
  const [ownerActiveTab, setOwnerActiveTab] = useState<'kpi' | 'staff' | 'logs'>('kpi');

  // State untuk Pop-up Notifikasi & Konfirmasi Hapus
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3000/api/auth/login', {
        username: loginUsername,
        password: loginPassword
      });
      if (response.data.success) {
        setIsLoggedIn(true);
        setCurrentUser(response.data.user);
        setLoginError('');
      }
    } catch (err: any) {
      setLoginError(err.response?.data?.message || 'Username Atau Password Salah!');
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3000/api/products');
      const productData = Array.isArray(response.data) ? response.data : response.data.data || [];
      setProducts(productData);
      setError(null);
    } catch (err: any) {
      console.error("Gagal Mengambil Data:", err);
      setError("Gagal Terhubung ke Server");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/auth/users');
      setUserList(response.data.data || []);
    } catch (err) {
      console.error("Gagal Mengambil Data Pengguna:", err);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchProducts();
      if (currentUser?.role === 'owner') {
        fetchUsers();
      }
    }
  }, [isLoggedIn, currentUser]);

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) {
      setNotification({ message: 'Nama Layanan dan Harga Harus Diisi!', type: 'error' });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: name.trim(),
        price: Number(price),
        unit
      };

      if (editingId !== null) {
        await axios.put(`http://localhost:3000/api/products/${editingId}`, payload);
        setNotification({ message: 'Layanan Berhasil Diperbarui!', type: 'success' });
      } else {
        await axios.post('http://localhost:3000/api/products', payload);
        setNotification({ message: 'Layanan Baru Berhasil Ditambahkan!', type: 'success' });
      }

      setName('');
      setPrice('');
      setUnit('kg');
      setEditingId(null);
      fetchProducts();
    } catch (err) {
      console.error("Gagal Menyimpan Produk:", err);
      setNotification({ message: 'Gagal Menyimpan Data', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminUser || !newAdminPass) {
      setNotification({ message: 'Username dan Password wajib diisi!', type: 'error' });
      return;
    }

    try {
      await axios.post('http://localhost:3000/api/auth/users', {
        username: newAdminUser.trim(),
        password: newAdminPass,
        nama_lengkap: newAdminName.trim() || 'Staf Kasir',
        role: newAdminRole
      });
      setNotification({ message: 'Pengguna Staf Baru Berhasil Ditambahkan!', type: 'success' });
      setNewAdminUser('');
      setNewAdminPass('');
      setNewAdminName('');
      setNewAdminRole('kasir');
      fetchUsers();
    } catch (err: any) {
      setNotification({ message: err.response?.data?.message || 'Gagal membuat pengguna baru', type: 'error' });
    }
  };

  const handleUpdateRole = async (userId: number) => {
    try {
      await axios.put(`http://localhost:3000/api/auth/users/${userId}/role`, {
        role: selectedUserRole
      });
      setNotification({ message: 'Role pengguna berhasil diperbarui!', type: 'success' });
      setEditingUserId(null);
      fetchUsers();
    } catch (err: any) {
      setNotification({ message: err.response?.data?.message || 'Gagal memperbarui role', type: 'error' });
    }
  };

  const handleEditClick = (product: Product) => {
    setEditingId(product.id);
    setName(product.name);
    setPrice(product.price ? product.price.toString() : '');
    setUnit(product.unit || 'kg');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName('');
    setPrice('');
    setUnit('kg');
  };

  const confirmDelete = async () => {
    if (deleteId === null) return;

    try {
      await axios.delete(`http://localhost:3000/api/products/${deleteId}`);
      setDeleteId(null);
      setNotification({ message: 'Layanan Berhasil Dihapus.', type: 'success' });
      fetchProducts();
    } catch (err) {
      console.error("Gagal Menghapus:", err);
      setDeleteId(null);
      setNotification({ message: 'Gagal Menghapus Data.', type: 'error' });
    }
  };

  const totalLayanan = products.length;
  const rataRataHarga = totalLayanan > 0 
    ? Math.round(products.reduce((acc, curr) => acc + curr.price, 0) / totalLayanan) 
    : 0;

  // Statistik tambahan untuk Owner
  const totalStaf = userList.length;
  const totalOwner = userList.filter(u => u.role === 'owner').length;
  const totalAdminStaf = userList.filter(u => u.role === 'admin').length;
  const totalKasirStaf = userList.filter(u => u.role === 'kasir' || !u.role).length;

  if (!isLoggedIn) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f9ff', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <form onSubmit={handleLogin} style={{ backgroundColor: '#ffffff', padding: '32px', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 180, 216, 0.1)', width: '380px', border: '1px solid #bae6fd' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <img 
              src="/logo.png" 
              alt="Logo Cleanova" 
              style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '12px', marginBottom: '12px' }} 
            />
            <h2 style={{ margin: '0 0 6px 0', fontSize: '20px', color: '#03045e', textTransform: 'uppercase' }}>Cleanova Laundry</h2>
          </div>
          
          {loginError && <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '16px', textAlign: 'center' }}>{loginError}</div>}
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>Username</label>
            <input 
              type="text" 
              value={loginUsername} 
              onChange={(e) => setLoginUsername(e.target.value)} 
              placeholder="Masukkan Username" 
              style={{ width: '100%', padding: '10px 12px', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none' , color: '#0f172a' , textAlign: 'center'}}
              required 
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', marginBottom: '6px' }}>Password</label>
            <input 
              type="password" 
              value={loginPassword} 
              onChange={(e) => setLoginPassword(e.target.value)} 
              placeholder="Masukkan Kata Sandi" 
              style={{ width: '100%', padding: '10px 12px', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none' ,color: '#0f172a' , textAlign: 'center'}}
              required 
            />
          </div>

          <button type="submit" style={{ width: '100%', background: 'linear-gradient(135deg, #00b4d8 0%, #0077b6 100%)', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '14px', boxShadow: '0 4px 10px rgba(0, 180, 216, 0.3)' }}>
            Masuk ke Dashboard
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f9ff', color: '#0f172a', fontFamily: 'Inter, system-ui, -apple-system, sans-serif', position: 'relative' }}>
      
      {/* MODAL NOTIFIKASI */}
      {notification && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
        }}>
          <div style={{
            backgroundColor: '#ffffff', padding: '28px 32px', borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', width: '380px',
            textAlign: 'center', border: '1px solid #e0f2fe'
          }}>
            <div style={{
              width: '50px', height: '50px', borderRadius: '50%',
              backgroundColor: notification.type === 'success' ? '#dcfce7' : '#fee2e2',
              color: notification.type === 'success' ? '#15803d' : '#dc2626',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '24px', fontWeight: 'bold', marginBottom: '16px'
            }}>
              {notification.type === 'success' ? '✓' : '✕'}
            </div>
            
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#03045e' }}>
              {notification.type === 'success' ? 'Berhasil!' : 'Perhatian'}
            </h3>
            
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#475569', lineHeight: '1.5' }}>
              {notification.message}
            </p>

            <button
              onClick={() => setNotification(null)}
              style={{
                width: '100%', background: 'linear-gradient(135deg, #00b4d8 0%, #0077b6 100%)',
                color: 'white', border: 'none', padding: '12px', borderRadius: '8px',
                fontWeight: '600', cursor: 'pointer', fontSize: '14px', boxShadow: '0 4px 10px rgba(0, 180, 216, 0.3)'
              }}
            >
              OK, Mengerti
            </button>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS */}
      {deleteId !== null && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
        }}>
          <div style={{
            backgroundColor: '#ffffff', padding: '28px 32px', borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', width: '380px',
            textAlign: 'center', border: '1px solid #fed7d7'
          }}>
            <div style={{
              width: '50px', height: '50px', borderRadius: '50%',
              backgroundColor: '#fee2e2', color: '#dc2626',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '24px', fontWeight: 'bold', marginBottom: '16px'
            }}>
              ⚠️
            </div>
            
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', textTransform: 'uppercase', fontWeight: '700', color: '#03045e' }}>
              !Konfirmasi Hapus!
            </h3>
            
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', textTransform: 'uppercase', color: '#475569', lineHeight: '1.5' }}>
              Apakah Anda yakin ingin menghapus layanan ini? Tindakan ini tidak dapat dibatalkan
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setDeleteId(null)}
                style={{
                  flex: 1, backgroundColor: '#e2e8f0', color: '#475569',
                  border: 'none', padding: '12px', borderRadius: '8px',
                  fontWeight: '600', cursor: 'pointer', fontSize: '14px'
                }}
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  flex: 1, background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white', border: 'none', padding: '12px', borderRadius: '8px',
                  fontWeight: '600', cursor: 'pointer', fontSize: '14px',
                  boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3)'
                }}
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav style={{ backgroundColor: '#ffffff', borderBottom: '2px solid #e0f2fe', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0, 180, 216, 0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <img 
            src="/logo.png" 
            alt="Logo Cleanova" 
            style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0, 180, 216, 0.3)' }} 
          />
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#03045e', textTransform: 'uppercase', letterSpacing: '1px' }}>Cleanova Laundry</h1>
            <p style={{ margin: 0, fontSize: '11px', color: '#0077b6', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Sentuhan Profesional untuk Pakaian Anda</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#e0f2fe', padding: '6px 14px', borderRadius: '20px', border: '1px solid #bae6fd', fontSize: '12px' }}>
            <span style={{ width: '8px', height: '8px', backgroundColor: '#0284c7', borderRadius: '50%', display: 'inline-block' }}></span>
            <span style={{ color: '#0369a1', fontWeight: '600', textTransform: 'uppercase' }}>
              {currentUser?.nama_lengkap || 'Admin'} ({currentUser?.role || 'kasir'})
            </span>
          </div>
          <button 
            onClick={() => { setIsLoggedIn(false); setCurrentUser(null); }}
            style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
          >
            Keluar (Logout)
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <main style={{ maxWidth: '1200px', margin: '32px auto', padding: '0 24px' }}>
        
        {/* Stat Cards Umum & Ringkasan Staf */}
        <div style={{ display: 'grid', gridTemplateColumns: currentUser?.role === 'owner' ? 'repeat(auto-fit, minmax(220px, 1fr))' : 'repeat(2, 1fr)', gap: '20px', marginBottom: '32px' }}>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #bae6fd', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0, 180, 216, 0.05)' }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '600' , textTransform: 'uppercase' }}>Total Jenis Layanan</p>
            <h3 style={{ margin: '8px 0 0 0', fontSize: '28px', fontWeight: '700', color: '#0077b6' }}>{totalLayanan} <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#64748b' }}>Paket</span></h3>
          </div>
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #bae6fd', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0, 180, 216, 0.05)' }}>
            <p style={{ margin: 0, fontSize: '13px' , textTransform: 'uppercase', color: '#64748b', fontWeight: '600' }}>Rata-rata Tarif Layanan</p>
            <h3 style={{ margin: '8px 0 0 0', fontSize: '28px', fontWeight: '700', color: '#0e9f6e' }}>Rp {rataRataHarga.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
          </div>

          {currentUser?.role === 'owner' && (
            <>
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #bae6fd', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0, 180, 216, 0.05)' }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '600' , textTransform: 'uppercase' }}>Total Staf Terdaftar</p>
                <h3 style={{ margin: '8px 0 0 0', fontSize: '28px', fontWeight: '700', color: '#7e22ce' }}>{totalStaf} <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#64748b' }}>Akun</span></h3>
              </div>
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #bae6fd', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(0, 180, 216, 0.05)' }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b', fontWeight: '600' , textTransform: 'uppercase' }}>Komposisi Role Staf</p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px', fontSize: '11px', fontWeight: '700' }}>
                  <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '4px 8px', borderRadius: '6px' }}>Owner: {totalOwner}</span>
                  <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '4px 8px', borderRadius: '6px' }}>Admin: {totalAdminStaf}</span>
                  <span style={{ backgroundColor: '#f3e8ff', color: '#7e22ce', padding: '4px 8px', borderRadius: '6px' }}>Kasir: {totalKasirStaf}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Content Layout Katalog (Form Input disembunyikan untuk Owner & Kasir sesuai aturan role) */}
        <div style={{ display: 'grid', gridTemplateColumns: (currentUser?.role === 'kasir' || currentUser?.role === 'owner') ? '1fr' : '360px 1fr', gap: '24px', alignItems: 'start' }}>
          
          {/* Form Tambah/Edit Layanan: HANYA untuk Admin (Owner dan Kasir tidak tampil form ini) */}
          {currentUser?.role === 'admin' ? (
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #bae6fd', borderRadius: '12px', padding: '24px', boxShadow: '0 10px 15px -3px rgba(0, 180, 216, 0.05)' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', textTransform: 'uppercase', fontWeight: '600', color: '#03045e', borderBottom: '2px solid #f0f9ff', paddingBottom: '12px' }}>
                {editingId !== null ? '✏️ Edit Layanan' : '➕ TAMBAH LAYANAN BARU'}
              </h3>
              
              <form onSubmit={handleSubmitProduct}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Nama Layanan</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="Nama Layanan Baru" 
                    style={{ width: '100%', padding: '10px 12px', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', fontSize: '14px', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: '12px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Harga</label>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      backgroundColor: '#f8fafc', 
                      border: '1px solid #cbd5e1', 
                      borderRadius: '8px', 
                      paddingLeft: '12px',
                      overflow: 'hidden'
                    }}>
                      <span style={{ color: '#64748b', fontSize: '14px', fontWeight: '600', marginRight: '4px' }}>Rp</span>
                      <input 
                        type="text" 
                        value={price ? Number(price).toLocaleString('id-ID') : ''} 
                        onChange={(e) => {
                          const rawValue = e.target.value.replace(/[^0-9]/g, '');
                          setPrice(rawValue);
                        }} 
                        placeholder="0" 
                        style={{ 
                          width: '100%', 
                          padding: '10px 12px 10px 0', 
                          boxSizing: 'border-box', 
                          backgroundColor: 'transparent', 
                          border: 'none', 
                          color: '#0f172a', 
                          fontSize: '15px', 
                          fontWeight: '700',
                          textAlign: 'right', 
                          outline: 'none' 
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Satuan</label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      style={{ width: '100%', padding: '10px 8px', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', color: '#0f172a', fontSize: '13px', fontWeight: '600', outline: 'none', cursor: 'pointer' }}
                    >
                      {UNIT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          /{opt.value}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    type="submit" 
                    disabled={submitting} 
                    style={{ flex: 1, background: editingId !== null ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'linear-gradient(135deg, #00b4d8 0%, #0077b6 100%)', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '14px', boxShadow: '0 4px 10px rgba(0, 180, 216, 0.3)' }}
                  >
                    {submitting ? 'Menyimpan...' : (editingId !== null ? 'Perbarui Data' : 'Simpan Layanan')}
                  </button>

                  {editingId !== null && (
                    <button 
                      type="button"
                      onClick={handleCancelEdit}
                      style={{ backgroundColor: '#e2e8f0', color: '#475569', border: 'none', padding: '12px 16px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}
                    >
                      Batal
                    </button>
                  )}
                </div>
              </form>
            </div>
          ) : null}

          {/* Tabel Katalog */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #bae6fd', borderRadius: '12px', padding: '24px', boxShadow: '0 10px 15px -3px rgba(0, 180, 216, 0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #f0f9ff', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', textTransform: 'uppercase', fontWeight: '600', color: '#03045e' }}>📋 Katalog Paket & Layanan</h3>
              <button onClick={fetchProducts} style={{ backgroundColor: '#e0f2fe', color: '#0284c7', border: '1px solid #bae6fd', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                🔄 Muat Ulang
              </button>
            </div>

            {loading && <p style={{ color: '#64748b', textAlign: 'center', padding: '40px 0' }}>Sedang menyinkronkan data dari server...</p>}
            {error && <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>{error}</div>}

            {!loading && !error && products.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                <p style={{ margin: 0, fontSize: '15px' }}>Belum ada data layanan</p>
                <p style={{ margin: '5px 0 0 0', fontSize: '13px' }}>Silakan tambahkan data melalui akun Admin.</p>
              </div>
            )}

            {!loading && !error && products.length > 0 && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <th style={{ padding: '12px', width: '10%' }}>ID</th>
                      <th style={{ padding: '12px', width: currentUser?.role === 'admin' ? '40%' : '60%' }}>Nama Layanan</th>
                      <th style={{ padding: '12px', width: '30%', textAlign: 'right' }}>Tarif / Satuan</th>
                      {currentUser?.role === 'admin' && <th style={{ padding: '12px', width: '20%', textAlign: 'center' }}>Aksi</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 12px', color: '#64748b', fontFamily: 'monospace' }}>#{product.id}</td>
                        <td style={{ padding: '14px 12px', fontWeight: '600', color: '#0f172a' }}>{product.name}</td>
                        
                        <td style={{ padding: '14px 12px', color: '#059669', fontWeight: '700', textAlign: 'right' }}>
                          Rp {product.price.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500', marginLeft: '4px' }}>
                            / {product.unit || 'kg'}
                          </span>
                        </td>

                        {currentUser?.role === 'admin' && (
                          <td style={{ padding: '14px 12px', textAlign: 'center', display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button 
                              onClick={() => handleEditClick(product)}
                              style={{ backgroundColor: '#fef3c7', color: '#d97706', border: '1px solid #fde68a', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => setDeleteId(product.id)}
                              style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                            >
                              Hapus
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* PANEL KHUSUS OWNER DENGAN SISTEM TAB NAVIGASI & KPI KEUANGAN */}
        {currentUser?.role === 'owner' ? (
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #bae6fd', borderRadius: '12px', padding: '24px', marginTop: '32px', boxShadow: '0 10px 15px -3px rgba(0, 180, 216, 0.05)' }}>
            
            {/* Header Panel Owner & Tab Switcher */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '2px solid #f0f9ff', paddingBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', textTransform: 'uppercase', fontWeight: '600', color: '#03045e' }}>
                🔒 Panel Eksklusif Owner: Kontrol Manajemen & Finansial
              </h3>
              
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => setOwnerActiveTab('kpi')}
                  style={{ backgroundColor: ownerActiveTab === 'kpi' ? '#0284c7' : '#e0f2fe', color: ownerActiveTab === 'kpi' ? '#fff' : '#0284c7', border: '1px solid #bae6fd', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                >
                  📈 Ringkasan Keuangan & KPI
                </button>
                <button 
                  onClick={() => setOwnerActiveTab('staff')}
                  style={{ backgroundColor: ownerActiveTab === 'staff' ? '#0284c7' : '#e0f2fe', color: ownerActiveTab === 'staff' ? '#fff' : '#0284c7', border: '1px solid #bae6fd', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                >
                  👥 Manajemen Staf & Role
                </button>
                <button 
                  onClick={() => setOwnerActiveTab('logs')}
                  style={{ backgroundColor: ownerActiveTab === 'logs' ? '#0284c7' : '#e0f2fe', color: ownerActiveTab === 'logs' ? '#fff' : '#0284c7', border: '1px solid #bae6fd', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                >
                  📊 Log Aktivitas & Akses
                </button>
                <button onClick={() => { fetchUsers(); fetchProducts(); }} style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }} title="Muat Ulang Data">
                  🔄
                </button>
              </div>
            </div>

            {/* TAB 1: RINGKASAN KEUANGAN & PERFORMA BISNIS (FINANCIAL & PERFORMANCE KPI) */}
            {ownerActiveTab === 'kpi' && (
              <div>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
                  Analisis kesehatan finansial usaha, volume transaksi, laporan laba/rugi ringkas, serta tren paket layanan terlaris Cleanova Laundry:
                </p>

                {/* Sub-Grid KPI Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                  
                  {/* Omzet / Pemasukan */}
                  <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Total Pemasukan / Omzet</span>
                      <span style={{ fontSize: '11px', backgroundColor: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>Bulanan</span>
                    </div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '22px', color: '#0f172a', fontWeight: '700' }}>Rp 12.450.000</h4>
                    <p style={{ margin: 0, fontSize: '11px', color: '#059669', fontWeight: '600' }}>↑ 15% dari bulan lalu</p>
                  </div>

                  {/* Volume Transaksi */}
                  <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Volume Transaksi</span>
                      <span style={{ fontSize: '11px', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>Selesai</span>
                    </div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '22px', color: '#0f172a', fontWeight: '700' }}>348 <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#64748b' }}>Pesanan</span></h4>
                    <p style={{ margin: 0, fontSize: '11px', color: '#0284c7', fontWeight: '600' }}>12 pesanan sedang diproses</p>
                  </div>

                  {/* Laporan Laba/Rugi Ringkas */}
                  <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>Estimasi Laba Bersih</span>
                      <span style={{ fontSize: '11px', backgroundColor: '#f3e8ff', color: '#7e22ce', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>Net Profit</span>
                    </div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '22px', color: '#059669', fontWeight: '700' }}>Rp 8.120.000</h4>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Setelah potong operasional (40%)</p>
                  </div>

                </div>

                {/* Section Analisis Layanan Terlaris & Grafik Ringkas */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  
                  {/* Layanan Terlaris */}
                  <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '18px' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', textTransform: 'uppercase', color: '#0f172a', fontWeight: '700' }}>🔥 Layanan Paling Diminati</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <span>1. Cuci Komplit (Kg-an)</span>
                        <strong style={{ color: '#0284c7' }}>180 Transaksi</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <span>2. Cuci Sepatu (Sneakers)</span>
                        <strong style={{ color: '#0284c7' }}>94 Transaksi</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <span>3. Setrika Saja / Express</span>
                        <strong style={{ color: '#0284c7' }}>74 Transaksi</strong>
                      </div>
                    </div>
                  </div>

                  {/* Ringkasan Pemasukan per Periode */}
                  <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '18px' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', textTransform: 'uppercase', color: '#0f172a', fontWeight: '700' }}>📅 Statistik Tren Pemasukan</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <span>Hari Ini</span>
                        <strong style={{ color: '#059669' }}>Rp 480.000</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <span>Mingguan (7 Hari Terakhir)</span>
                        <strong style={{ color: '#059669' }}>Rp 3.250.000</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <span>Bulanan (Bulan Berjalan)</span>
                        <strong style={{ color: '#059669' }}>Rp 12.450.000</strong>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* TAB 2: MANAJEMEN STAF & EDIT ROLE */}
            {ownerActiveTab === 'staff' && (
              <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }}>
                
                {/* Form Tambah Staf Baru */}
                <form onSubmit={handleCreateUser} style={{ backgroundColor: '#f8fafc', padding: '18px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 14px 0', fontSize: '14px', textTransform: 'uppercase', color: '#0f172a', fontWeight: '700' }}>➕ Tambah Staf Baru</h4>
                  
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px', textTransform: 'uppercase' }}>Nama Lengkap</label>
                    <input 
                      type="text" 
                      value={newAdminName} 
                      onChange={(e) => setNewAdminName(e.target.value)} 
                      placeholder="Nama Staf" 
                      style={{ width: '100%', padding: '9px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '13px' }} 
                    />
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px', textTransform: 'uppercase' }}>Username</label>
                    <input 
                      type="text" 
                      value={newAdminUser} 
                      onChange={(e) => setNewAdminUser(e.target.value)} 
                      placeholder="Username" 
                      style={{ width: '100%', padding: '9px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '13px' }} 
                      required 
                    />
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px', textTransform: 'uppercase' }}>Password</label>
                    <input 
                      type="password" 
                      value={newAdminPass} 
                      onChange={(e) => setNewAdminPass(e.target.value)} 
                      placeholder="Kata Sandi" 
                      style={{ width: '100%', padding: '9px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: '13px' }} 
                      required 
                    />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '4px', textTransform: 'uppercase' }}>Hak Akses (Role)</label>
                    <select 
                      value={newAdminRole} 
                      onChange={(e) => setNewAdminRole(e.target.value)}
                      style={{ 
                        width: '100%', 
                        padding: '9px 10px', 
                        borderRadius: '6px', 
                        border: '1px solid #cbd5e1', 
                        boxSizing: 'border-box', 
                        fontSize: '13px', 
                        backgroundColor: '#fff',
                        color: '#0f172a'
                      }}
                    >
                      <option value="kasir">Kasir</option>
                      <option value="admin">Admin</option>
                      <option value="owner">Owner</option>
                    </select>
                  </div>

                  <button type="submit" style={{ width: '100%', background: 'linear-gradient(135deg, #00b4d8 0%, #0077b6 100%)', color: 'white', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '13px', boxShadow: '0 4px 10px rgba(0, 180, 216, 0.3)' }}>
                    Simpan Staf Baru
                  </button>
                </form>

                {/* Tabel Daftar Pengguna & Fitur Edit Role Langsung */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase' }}>
                        <th style={{ padding: '10px' }}>ID</th>
                        <th style={{ padding: '10px' }}>Nama / Username</th>
                        <th style={{ padding: '10px' }}>Role (Hak Akses)</th>
                        <th style={{ padding: '10px', textAlign: 'right' }}>Login Terakhir</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userList.map((u) => (
                        <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 10px', fontFamily: 'monospace', color: '#64748b' }}>#{u.id}</td>
                          <td style={{ padding: '12px 10px' }}>
                            <strong style={{ color: '#0f172a' }}>{u.nama_lengkap || 'Staf Laundry'}</strong>
                            <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: '600' }}>@{u.username}</div>
                          </td>
                          
                          <td style={{ padding: '12px 10px' }}>
                            {editingUserId === u.id ? (
                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <select
                                  value={selectedUserRole}
                                  onChange={(e) => setSelectedUserRole(e.target.value)}
                                  style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px', color: '#0f172a', backgroundColor: '#fff' }}
                                >
                                  <option value="kasir">Kasir</option>
                                  <option value="admin">Admin</option>
                                  <option value="owner">Owner</option>
                                </select>
                                <button
                                  onClick={() => handleUpdateRole(u.id)}
                                  style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                                >
                                  Simpan
                                </button>
                                <button
                                  onClick={() => setEditingUserId(null)}
                                  style={{ backgroundColor: '#cbd5e1', color: '#334155', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}
                                >
                                  Batal
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ 
                                  backgroundColor: u.role === 'owner' ? '#dcfce7' : u.role === 'admin' ? '#e0f2fe' : '#f3e8ff', 
                                  color: u.role === 'owner' ? '#15803d' : u.role === 'admin' ? '#0369a1' : '#7e22ce', 
                                  padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' 
                                }}>
                                  {u.role || 'kasir'}
                                </span>
                                <button
                                  onClick={() => {
                                    setEditingUserId(u.id);
                                    setSelectedUserRole(u.role || 'kasir');
                                  }}
                                  style={{ backgroundColor: '#fef3c7', color: '#d97706', border: '1px solid #fde68a', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}
                                >
                                  Edit Role
                                </button>
                              </div>
                            )}
                          </td>

                          <td style={{ padding: '12px 10px', textAlign: 'right', color: u.last_login ? '#059669' : '#94a3b8', fontWeight: '600' }}>
                            {u.last_login ? new Date(u.last_login).toLocaleString('id-ID') : 'Belum Pernah Login'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

            {/* TAB 3: LOG AKTIVITAS & AUDIT AKSES */}
            {ownerActiveTab === 'logs' && (
              <div>
                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                  Berikut adalah rekapitulasi waktu aktivitas masuk (*login*) terakhir dari seluruh staf operasional Cleanova Laundry:
                </p>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#475569', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase' }}>
                        <th style={{ padding: '10px' }}>ID Staf</th>
                        <th style={{ padding: '10px' }}>Nama Lengkap</th>
                        <th style={{ padding: '10px' }}>Username</th>
                        <th style={{ padding: '10px' }}>Hak Akses</th>
                        <th style={{ padding: '10px', textAlign: 'right' }}>Aktivitas Login Terakhir</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userList.map((u) => (
                        <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 10px', fontFamily: 'monospace', color: '#64748b' }}>#{u.id}</td>
                          <td style={{ padding: '12px 10px', fontWeight: '600', color: '#0f172a' }}>{u.nama_lengkap || 'Staf Laundry'}</td>
                          <td style={{ padding: '12px 10px', color: '#0284c7' }}>@{u.username}</td>
                          <td style={{ padding: '12px 10px', textTransform: 'uppercase', fontWeight: '700', fontSize: '12px', color: '#334155' }}>{u.role || 'kasir'}</td>
                          <td style={{ padding: '12px 10px', textAlign: 'right', color: u.last_login ? '#059669' : '#94a3b8', fontWeight: '600' }}>
                            {u.last_login ? new Date(u.last_login).toLocaleString('id-ID') : 'Belum Pernah Login'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        ) : currentUser?.role === 'admin' ? (
          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '20px', marginTop: '32px', textAlign: 'center', color: '#475569' }}>
            <p style={{ margin: '0 0 4px 0', fontWeight: '700', fontSize: '14px' }}>🛡️ Pembatasan Hak Akses (Role-Based Access Control)</p>
            <p style={{ margin: 0, fontSize: '13px' }}>
              Anda masuk sebagai <strong>Admin Staf</strong>. Panel Manajemen Staf, Log Aktivitas, dan Laporan KPI Finansial hanya dapat dibuka oleh akun dengan level <strong>Owner</strong>.
            </p>
          </div>
        ) : (
          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '20px', marginTop: '32px', textAlign: 'center', color: '#475569' }}>
            <p style={{ margin: '0 0 4px 0', fontWeight: '700', fontSize: '14px' }}>🛡️ Pembatasan Hak Akses (Role-Based Access Control)</p>
            <p style={{ margin: 0, fontSize: '13px' }}>
              Anda masuk sebagai <strong>Kasir</strong>. Anda hanya dapat melihat katalog tarif layanan untuk kebutuhan transaksi.
            </p>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;