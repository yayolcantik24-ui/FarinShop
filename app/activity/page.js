'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function ActivityPage() {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) router.push('/');
    else {
      const u = JSON.parse(stored);
      setUser(u);
      fetch(`/api/user-orders?userId=${u.id}`).then(res => res.json()).then(setOrders);
      fetch(`/api/user-deposits?userId=${u.id}`).then(res => res.json()).then(setDeposits);
    }
  }, []);

  if (!user) return null;

  const styles = {
    container: { maxWidth: 1000, margin: '50px auto', background: 'white', padding: 30, borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: 20 },
    th: { textAlign: 'left', padding: 10, borderBottom: '1px solid #ddd', background: '#f5f5f5' },
    td: { padding: 10, borderBottom: '1px solid #eee' }
  };

  return (
    <div>
      <Sidebar />
      <div style={styles.container}>
        <h1>Activity</h1>
        <h2>Riwayat Pembelian OTP</h2>
        {orders.length === 0 ? <p>Belum ada pembelian</p> : (
          <table style={styles.table}>
            <thead><tr><th style={styles.th}>Tanggal</th><th style={styles.th}>Harga</th><th style={styles.th}>Status</th><th style={styles.th}>OTP</th></tr></thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id}><td style={styles.td}>{new Date(o.created_at).toLocaleString()}</td><td style={styles.td}>Rp {o.our_price?.toLocaleString()}</td><td style={styles.td}>{o.status}</td><td style={styles.td}>{o.otp_code || '-'}</td></tr>
              ))}
            </tbody>
          </table>
        )}
        <h2>Riwayat Deposit</h2>
        {deposits.length === 0 ? <p>Belum ada deposit</p> : (
          <table style={styles.table}>
            <thead><tr><th style={styles.th}>Tanggal</th><th style={styles.th}>Jumlah Diminta</th><th style={styles.th}>Total Dibayar</th><th style={styles.th}>Status</th></tr></thead>
            <tbody>
              {deposits.map(d => (
                <tr key={d.id}><td style={styles.td}>{new Date(d.created_at).toLocaleString()}</td><td style={styles.td}>Rp {d.requested_amount?.toLocaleString()}</td><td style={styles.td}>Rp {d.total_payment?.toLocaleString()}</td><td style={styles.td}>{d.status}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}