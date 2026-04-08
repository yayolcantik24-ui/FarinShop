'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) router.push('/');
    else setUser(JSON.parse(stored));
  }, []);

  if (!user) return null;

  const styles = {
    container: { padding: 20, maxWidth: 800, margin: '0 auto' },
    card: { background: 'white', borderRadius: 16, padding: 30, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', textAlign: 'center' },
    balance: { fontSize: 32, fontWeight: 'bold', margin: '20px 0' },
    btnGroup: { display: 'flex', gap: 15, justifyContent: 'center', marginTop: 20 },
    btn: { padding: '12px 24px', borderRadius: 8, textDecoration: 'none', color: 'white' }
  };

  return (
    <div>
      <Sidebar />
      <div style={styles.container}>
        <div style={styles.card}>
          <h1>Dashboard Farin Shop</h1>
          <p>Selamat datang, {user.username}!</p>
          <div style={styles.balance}>Rp {user.balance?.toLocaleString() || 0}</div>
          <div style={styles.btnGroup}>
            <Link href="/beli" style={{ ...styles.btn, background: '#28a745' }}>🛒 Beli OTP</Link>
            <Link href="/deposit" style={{ ...styles.btn, background: '#007bff' }}>💰 Deposit</Link>
          </div>
        </div>
      </div>
    </div>
  );
    }
