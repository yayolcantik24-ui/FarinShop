'use client';
import { useState } from 'react';

export default function CustomerService() {
  const [isOpen, setIsOpen] = useState(false);
  const whatsappNumber = "6281234567890"; // Ganti dengan nomor admin
  const telegramUsername = "farinadmin"; // Ganti dengan username admin

  const styles = {
    floatingBtn: { position: 'fixed', bottom: 20, right: 20, background: '#25D366', color: 'white', width: 50, height: 50, borderRadius: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.2)', zIndex: 1000 },
    popup: { position: 'fixed', bottom: 80, right: 20, background: 'white', borderRadius: 12, padding: 15, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', zIndex: 1001, width: 220 },
    btnWA: { display: 'block', background: '#25D366', color: 'white', padding: '8px 12px', borderRadius: 8, textDecoration: 'none', marginBottom: 8, textAlign: 'center' },
    btnTG: { display: 'block', background: '#0088cc', color: 'white', padding: '8px 12px', borderRadius: 8, textDecoration: 'none', textAlign: 'center' }
  };

  return (
    <>
      <div style={styles.floatingBtn} onClick={() => setIsOpen(!isOpen)}>💬</div>
      {isOpen && (
        <div style={styles.popup}>
          <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" style={styles.btnWA}>WhatsApp</a>
          <a href={`https://t.me/${telegramUsername}`} target="_blank" rel="noopener noreferrer" style={styles.btnTG}>Telegram</a>
        </div>
      )}
    </>
  );
}