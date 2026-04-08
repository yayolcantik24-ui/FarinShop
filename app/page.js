'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const styles = {
    container: { minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', flexDirection: 'column' },
    main: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
    card: { background: 'white', borderRadius: 16, padding: 40, width: '100%', maxWidth: 450, textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' },
    btn: { display: 'inline-block', background: '#667eea', color: 'white', padding: '12px 24px', borderRadius: 30, textDecoration: 'none', marginTop: 20 }
  };

  return (
    <div style={styles.container}>
      <div style={styles.main}>
        <div style={styles.card}>
          <h1 style={{ fontSize: 32, marginBottom: 16 }}>Farin Shop</h1>
          {user ? (
            <>
              <p>Selamat datang kembali, <strong>{user.username}</strong>!</p>
              <p style={{ fontSize: 24, margin: '20px 0' }}>Saldo: Rp {user.balance?.toLocaleString() || 0}</p>
              <Link href="/dashboard" style={styles.btn}>Ke Dashboard →</Link>
            </>
          ) : (
            <>
              <p>Tempat jual beli OTP terpercaya & cepat</p>
              <Link href="/login" style={styles.btn}>Mulai Sekarang →</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}