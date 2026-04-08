'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const logout = () => {
    localStorage.removeItem('user');
    router.push('/');
  };

  const styles = {
    menuBtn: { position: 'fixed', top: 20, right: 20, zIndex: 1000, background: '#667eea', color: 'white', border: 'none', fontSize: 24, padding: '8px 12px', borderRadius: 8, cursor: 'pointer' },
    overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', zIndex: 999 },
    sidebar: { position: 'fixed', top: 0, right: 0, width: 260, height: '100%', background: 'white', boxShadow: '-2px 0 10px rgba(0,0,0,0.1)', zIndex: 1000, transform: 'translateX(100%)', transition: 'transform 0.3s', padding: 20 },
    sidebarOpen: { transform: 'translateX(0)' },
    link: { display: 'block', padding: '12px 0', color: '#333', textDecoration: 'none', borderBottom: '1px solid #eee' }
  };

  return (
    <>
      <button style={styles.menuBtn} onClick={() => setIsOpen(true)}>☰</button>
      {isOpen && <div style={styles.overlay} onClick={() => setIsOpen(false)}></div>}
      <div style={{ ...styles.sidebar, ...(isOpen ? styles.sidebarOpen : {}) }}>
        <h3 style={{ marginBottom: 20 }}>Menu Farin Shop</h3>
        <Link href="/dashboard" style={styles.link} onClick={() => setIsOpen(false)}>🏠 Dashboard</Link>
        <Link href="/beli" style={styles.link} onClick={() => setIsOpen(false)}>🛒 Beli OTP</Link>
        <Link href="/deposit" style={styles.link} onClick={() => setIsOpen(false)}>💰 Deposit</Link>
        <Link href="/profile" style={styles.link} onClick={() => setIsOpen(false)}>👤 Profil</Link>
        <Link href="/activity" style={styles.link} onClick={() => setIsOpen(false)}>📋 Activity</Link>
        <button onClick={logout} style={{ ...styles.link, color: 'red', width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}>🚪 Logout</button>
      </div>
    </>
  );
}