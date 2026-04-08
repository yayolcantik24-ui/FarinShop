'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) router.push('/');
    else setUser(JSON.parse(stored));
  }, []);

  const changePassword = async () => {
    if (!newPassword) return alert('Masukkan password baru');
    const res = await fetch('/api/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, newPassword })
    });
    const data = await res.json();
    if (res.ok) {
      setMessage('Password berhasil diubah');
      setNewPassword('');
    } else {
      alert(data.error);
    }
  };

  if (!user) return null;

  const styles = {
    container: { maxWidth: 600, margin: '50px auto', background: 'white', padding: 30, borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
    input: { width: '100%', padding: 12, margin: '10px 0', borderRadius: 8, border: '1px solid #ddd' },
    button: { padding: '10px 20px', background: '#667eea', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }
  };

  return (
    <div>
      <Sidebar />
      <div style={styles.container}>
        <h1>Profil Saya</h1>
        <p><strong>Username:</strong> {user.username}</p>
        <p><strong>Saldo:</strong> Rp {user.balance?.toLocaleString() || 0}</p>
        <p><strong>User ID:</strong> {user.id}</p>
        <h3>Ganti Password</h3>
        <input type="password" placeholder="Password baru" style={styles.input} value={newPassword} onChange={e => setNewPassword(e.target.value)} />
        <button style={styles.button} onClick={changePassword}>Ubah Password</button>
        {message && <p style={{ color: 'green', marginTop: 10 }}>{message}</p>}
      </div>
    </div>
  );
}