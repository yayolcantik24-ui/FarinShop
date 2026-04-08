'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [captchaValid, setCaptchaValid] = useState(false);
  const [num1, setNum1] = useState(Math.floor(Math.random() * 10) + 1);
  const [num2, setNum2] = useState(Math.floor(Math.random() * 10) + 1);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const router = useRouter();

  const checkCaptcha = () => {
    if (parseInt(captchaAnswer) === num1 + num2) {
      setCaptchaValid(true);
      setError('');
    } else {
      setCaptchaValid(false);
      setError('Captcha salah');
      setNum1(Math.floor(Math.random() * 10) + 1);
      setNum2(Math.floor(Math.random() * 10) + 1);
      setCaptchaAnswer('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!captchaValid) return setError('Verifikasi captcha dulu');
    const action = isLogin ? 'login' : 'register';
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, username, password })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/dashboard');
    } else {
      setError(data.error);
    }
  };

  const styles = {
    container: { minHeight: '100vh', background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    card: { background: 'white', borderRadius: 16, padding: 30, width: 380, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
    tab: { display: 'flex', gap: 20, marginBottom: 20, borderBottom: '1px solid #ddd', paddingBottom: 10 },
    activeTab: { color: '#667eea', fontWeight: 'bold', borderBottom: '2px solid #667eea', paddingBottom: 8 },
    input: { width: '100%', padding: 12, margin: '8px 0', border: '1px solid #ddd', borderRadius: 8 },
    button: { width: '100%', padding: 12, background: '#667eea', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <Link href="/" style={{ textDecoration: 'none', color: '#667eea', fontSize: 14 }}>← Beranda</Link>
        <div style={styles.tab}>
          <div style={isLogin ? styles.activeTab : {}} onClick={() => setIsLogin(true)}>Login</div>
          <div style={!isLogin ? styles.activeTab : {}} onClick={() => setIsLogin(false)}>Daftar</div>
        </div>
        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="Username" style={styles.input} value={username} onChange={e => setUsername(e.target.value)} required />
          <input type="password" placeholder="Password" style={styles.input} value={password} onChange={e => setPassword(e.target.value)} required />
          <div style={{ margin: '15px 0' }}>
            <p>{num1} + {num2} = ?</p>
            <input type="number" style={styles.input} value={captchaAnswer} onChange={e => setCaptchaAnswer(e.target.value)} />
            <button type="button" onClick={checkCaptcha} style={{ ...styles.button, background: '#666', marginTop: 5 }}>Verifikasi</button>
          </div>
          {error && <p style={{ color: 'red', fontSize: 14 }}>{error}</p>}
          <button type="submit" style={styles.button}>{isLogin ? 'Masuk' : 'Daftar'}</button>
        </form>
      </div>
    </div>
  );
}