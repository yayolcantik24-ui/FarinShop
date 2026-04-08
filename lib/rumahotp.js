const API_KEY = process.env.RUMAHOTP_API_KEY;
const BASE_URL = 'https://www.rumahotp.io/api';

const headers = {
  'x-apikey': API_KEY,
  'Accept': 'application/json'
};

export async function getServices() {
  const res = await fetch(`${BASE_URL}/v2/services`, { headers });
  const json = await res.json();
  if (!json.success) throw new Error('Gagal ambil layanan');
  return json.data;
}

export async function getCountries(serviceId) {
  const res = await fetch(`${BASE_URL}/v2/countries?service_id=${serviceId}`, { headers });
  const json = await res.json();
  if (!json.success) throw new Error('Gagal ambil negara');
  return json.data;
}

export async function getOperators(country, providerId) {
  const res = await fetch(`${BASE_URL}/v2/operators?country=${country}&provider_id=${providerId}`, { headers });
  const json = await res.json();
  if (!json.success) throw new Error('Gagal ambil operator');
  return json.data;
}

export async function orderNumber(numberId, providerId, operatorId) {
  const res = await fetch(`${BASE_URL}/v2/orders?number_id=${numberId}&provider_id=${providerId}&operator_id=${operatorId}`, { headers });
  const json = await res.json();
  if (!json.success) throw new Error('Gagal order nomor');
  return json.data;
}

export async function getOrderStatus(orderId) {
  const res = await fetch(`${BASE_URL}/v1/orders/get_status?order_id=${orderId}`, { headers });
  const json = await res.json();
  if (!json.success) throw new Error('Gagal cek status');
  return json.data;
}

export async function cancelOrder(orderId) {
  const res = await fetch(`${BASE_URL}/v1/orders/set_status?order_id=${orderId}&status=cancel`, { headers });
  const json = await res.json();
  return json.success;
}

export async function confirmOrder(orderId) {
  const res = await fetch(`${BASE_URL}/v1/orders/set_status?order_id=${orderId}&status=done`, { headers });
  const json = await res.json();
  return json.success;
}

export async function createDeposit(amount) {
  const res = await fetch(`${BASE_URL}/v1/deposit/create?amount=${amount}&payment_id=qris`, { headers });
  const json = await res.json();
  if (!json.success) throw new Error('Gagal buat deposit');
  return json.data;
}

export async function getDepositStatus(depositId) {
  const res = await fetch(`${BASE_URL}/v1/deposit/get_status?deposit_id=${depositId}`, { headers });
  const json = await res.json();
  if (!json.success) throw new Error('Gagal cek status deposit');
  return json.data;
}

export async function cancelDeposit(depositId) {
  const res = await fetch(`${BASE_URL}/v1/deposit/cancel?deposit_id=${depositId}`, { headers });
  const json = await res.json();
  return json.success;
}