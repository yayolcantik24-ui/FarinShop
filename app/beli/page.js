'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function BeliPage() {
  const [user, setUser] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [operators, setOperators] = useState([]);
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) router.push('/');
    else setUser(JSON.parse(stored));
    fetch('/api/services').then(res => res.json()).then(setServices);
  }, []);

  const fetchCountries = async (serviceId) => {
    const res = await fetch(`/api/countries?serviceId=${serviceId}`);
    const data = await res.json();
    setCountries(data);
  };

  const fetchOperators = async (country, providerId) => {
    const res = await fetch(`/api/operators?country=${country}&providerId=${providerId}`);
    const data = await res.json();
    setOperators(data);
  };

  const handleOrder = async () => {
    if (!selectedOperator) return alert('Pilih operator');
    setLoading(true);
    const res = await fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        numberId: selectedCountry.number_id,
        providerId: selectedCountry.pricelist[0].provider_id,
        operatorId: selectedOperator.id,
        basePrice: selectedCountry.pricelist[0].price
      })
    });
    const data = await res.json();
    if (res.ok) {
      setOrder(data);
      user.balance -= data.ourPrice;
      localStorage.setItem('user', JSON.stringify(user));
      setMessage(`Order dibuat! Order ID: ${data.orderId}. Tunggu OTP maksimal 17 menit.`);
    } else {
      alert(data.error);
    }
    setLoading(false);
  };

  const cancelOrder = async () => {
    const res = await fetch('/api/cancel-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order.orderId })
    });
    const data = await res.json();
    if (res.ok) {
      alert('Order dibatalkan, saldo dikembalikan');
      setOrder(null);
      const stored = localStorage.getItem('user');
      setUser(JSON.parse(stored));
    } else {
      alert(data.error);
    }
  };

  if (!user) return null;

  const styles = {
    container: { maxWidth: 600, margin: '50px auto', background: 'white', padding: 30, borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
    select: { width: '100%', padding: 12, margin: '10px 0', borderRadius: 8, border: '1px solid #ddd' },
    button: { width: '100%', padding: 12, background: '#28a745', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', marginTop: 10 },
    cancelBtn: { background: '#dc3545', marginTop: 10 }
  };

  return (
    <div>
      <Sidebar />
      <div style={styles.container}>
        <h1>Beli OTP</h1>
        {!order ? (
          <>
            <select style={styles.select} onChange={e => { const s = services.find(s => s.service_code == e.target.value); setSelectedService(s); fetchCountries(s.service_code); }}>
              <option value="">Pilih Layanan</option>
              {services.map(s => <option key={s.service_code} value={s.service_code}>{s.service_name} - Rp {s.price + 1000}</option>)}
            </select>
            {selectedService && <select style={styles.select} onChange={e => { const c = countries.find(c => c.number_id == e.target.value); setSelectedCountry(c); fetchOperators(c.name, c.pricelist[0].provider_id); }}>
              <option value="">Pilih Negara</option>
              {countries.map(c => <option key={c.number_id} value={c.number_id}>{c.name} - Rp {c.pricelist[0].price_format}</option>)}
            </select>}
            {selectedCountry && <select style={styles.select} onChange={e => setSelectedOperator(operators.find(o => o.id == e.target.value))}>
              <option value="">Pilih Operator</option>
              {operators.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>}
            <button style={styles.button} onClick={handleOrder} disabled={loading}>{loading ? 'Memproses...' : 'Beli'}</button>
          </>
        ) : (
          <div>
            <p>Order ID: {order.orderId}</p>
            <p>Status: Menunggu OTP (maksimal 17 menit)</p>
            <p>Harga: Rp {order.ourPrice}</p>
            <button style={{ ...styles.button, ...styles.cancelBtn }} onClick={cancelOrder}>Batalkan Order (setelah 5 menit)</button>
            <p style={{ fontSize: 12, marginTop: 20 }}>{message}</p>
          </div>
        )}
      </div>
    </div>
  );
    }
