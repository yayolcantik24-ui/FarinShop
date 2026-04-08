'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function DepositPage() {
  const [user, setUser] = useState(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [deposit, setDeposit] = useState(null);
  const [status, setStatus] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) router.push('/');
    else setUser(JSON.parse(stored));
  }, []);

  const handleCreate = async () => {
    const nominal = parseInt(amount);
    if (nominal < 10000) return alert('Minimal Rp 10.000');
    setLoading(true);
    const res = await fetch('/api/deposit-create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, amount: nominal })
    });
    const data = await res.json();
    if (res.ok) {
      setDeposit(data);
      const interval = setInterval(async () => {
        const statusRes = await fetch(`/api/deposit-status?depositId=${data.depositId}`);
        const statusData = await statusRes.json();
        setStatus(statusData.status);
        if (statusData.status === 'success') {
          clearInterval(interval);
          alert('Deposit berhasil! Saldo bertambah.');
          const stored = localStorage.getItem('user');
          const freshUser = JSON.parse(stored);
          freshUser.balance += data.requestedAmount;
          localStorage.setItem('user', JSON.stringify(freshUser));
          setUser(freshUser);
          setDeposit(null);
        } else if (statusData.status === 'canceled' || statusData.status === 'expired') {
          clearInterval(interval);
          alert('Deposit gagal/kadaluarsa.');
          setDeposit(null);
        }
      }, 5000);
    } else {
      alert(data.error);
    }
    setLoading(false);
  };

  const cancelDeposit = async () => {
    const res = await fetch('/api/deposit-cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ depositId: deposit.depositId })
    });
    const data = await res.json();
    if (res.ok) {
      alert('Deposit dibatalkan');
      setDeposit(null);
    } else {
      alert(data.error);
    }
  };

  if (!user) return null;

  const styles = {
    container: { maxWidth: 500, margin: '50px auto', background: 'white', padding: 30, borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
    input: { width: '100%', padding: 12, margin: '10px 0', borderRadius: 8, border: '1px solid #ddd' },
    button: { width: '100%', padding: 12, background: '#28a745', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' },
    cancelBtn: { background: '#dc3545', marginTop: 10 }
  };

  return (
    <div>
      <Sidebar />
      <div style={styles.container}>
        <h1>Deposit Saldo</h1>
        {!deposit ? (
          <>
            <p>Saldo saat ini: Rp {user.balance?.toLocaleString() || 0}</p>
            <input type="number" placeholder="Jumlah (min 10.000)" style={styles.input} value={amount} onChange={e => setAmount(e.target.value)} />
            <button style={styles.button} onClick={handleCreate} disabled={loading}>{loading ? 'Memproses...' : 'Buat QRIS Deposit'}</button>
            <p style={{ fontSize: 12, marginTop: 15 }}>Biaya admin 20%. Contoh: deposit 10.000 bayar 12.000.</p>
          </>
        ) : (
          <div>
            <img src={deposit.qrCode} alt="QRIS" style={{ width: 200, margin: '20px auto', display: 'block' }} />
            <p>Total bayar: Rp {deposit.totalPayment?.toLocaleString()}</p>
            <p>Saldo masuk: Rp {deposit.requestedAmount?.toLocaleString()}</p>
            <p>Status: {status || 'pending'}</p>
            <button style={{ ...styles.button, ...styles.cancelBtn }} onClick={cancelDeposit}>Batalkan Deposit (setelah 5 menit)</button>
            <p style={{ fontSize: 12, marginTop: 15 }}>QRIS kadaluarsa 17 menit.</p>
          </div>
        )}
      </div>
    </div>
  );
}