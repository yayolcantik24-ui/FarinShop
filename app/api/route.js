import { query } from '@/lib/supabase';
import bcrypt from 'bcryptjs';
import { 
  getServices, getCountries, getOperators, orderNumber, 
  getOrderStatus, confirmOrder, cancelOrder, 
  createDeposit, getDepositStatus, cancelDeposit 
} from '@/lib/rumahotp';

const MARKUP_PROFIT = 1000;   // keuntungan per order OTP
const ADMIN_FEE_PERCENT = 7; // biaya admin deposit (%)

// ========== HANDLER GET ==========
export async function GET(req) {
  const url = new URL(req.url);
  const path = url.pathname.replace('/api', '');
  const searchParams = url.searchParams;

  try {
    // GET /api/services
    if (path === '/services') {
      const services = await getServices();
      const withMarkup = services.map(s => ({
        ...s,
        our_price: (s.price || 0) + MARKUP_PROFIT
      }));
      return Response.json(withMarkup);
    }

    // GET /api/countries?serviceId=xxx
    if (path === '/countries') {
      const serviceId = searchParams.get('serviceId');
      if (!serviceId) return Response.json({ error: 'serviceId required' }, { status: 400 });
      const countries = await getCountries(serviceId);
      return Response.json(countries);
    }

    // GET /api/operators?country=xxx&providerId=xxx
    if (path === '/operators') {
      const country = searchParams.get('country');
      const providerId = searchParams.get('providerId');
      if (!country || !providerId) return Response.json({ error: 'country and providerId required' }, { status: 400 });
      const operators = await getOperators(country, providerId);
      return Response.json(operators);
    }

    // GET /api/order-status?orderId=xxx
    if (path === '/order-status') {
      const orderId = searchParams.get('orderId');
      if (!orderId) return Response.json({ error: 'orderId required' }, { status: 400 });
      const { rows } = await query('SELECT status, otp_code FROM orders WHERE id = $1', [orderId]);
      if (rows.length === 0) return Response.json({ error: 'Order not found' }, { status: 404 });
      return Response.json({ status: rows[0].status, otp_code: rows[0].otp_code });
    }

    // GET /api/deposit-status?depositId=xxx
    if (path === '/deposit-status') {
      const depositId = searchParams.get('depositId');
      if (!depositId) return Response.json({ error: 'depositId required' }, { status: 400 });
      const { rows } = await query('SELECT * FROM deposits WHERE id = $1', [depositId]);
      if (rows.length === 0) return Response.json({ error: 'Deposit not found' }, { status: 404 });
      let deposit = rows[0];
      
      if (deposit.status === 'pending') {
        const status = await getDepositStatus(deposit.deposit_id_rumahotp);
        if (status.status === 'success') {
          const userRes = await query('SELECT balance FROM users WHERE id = $1', [deposit.user_id]);
          const newBalance = userRes.rows[0].balance + deposit.requested_amount;
          await query('UPDATE users SET balance = $1 WHERE id = $2', [newBalance, deposit.user_id]);
          await query('UPDATE deposits SET status = $1 WHERE id = $2', ['success', depositId]);
          deposit.status = 'success';
        } else if (status.status === 'cancel') {
          await query('UPDATE deposits SET status = $1 WHERE id = $2', ['canceled', depositId]);
          deposit.status = 'canceled';
        }
      }
      return Response.json({ 
        status: deposit.status, 
        requestedAmount: deposit.requested_amount,
        createdAt: deposit.created_at
      });
    }

    // GET /api/user-orders?userId=xxx
    if (path === '/user-orders') {
      const userId = searchParams.get('userId');
      if (!userId) return Response.json({ error: 'userId required' }, { status: 400 });
      const { rows } = await query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
      return Response.json(rows || []);
    }

    // GET /api/user-deposits?userId=xxx
    if (path === '/user-deposits') {
      const userId = searchParams.get('userId');
      if (!userId) return Response.json({ error: 'userId required' }, { status: 400 });
      const { rows } = await query('SELECT * FROM deposits WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
      return Response.json(rows || []);
    }

    return Response.json({ error: 'Endpoint tidak ditemukan' }, { status: 404 });
  } catch (err) {
    console.error(err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// ========== HANDLER POST ==========
export async function POST(req) {
  const url = new URL(req.url);
  const path = url.pathname.replace('/api', '');
  const body = await req.json();

  try {
    // POST /api/auth (login & register)
    if (path === '/auth') {
      const { action, username, password } = body;
      if (action === 'register') {
        const { rows: existing } = await query('SELECT id FROM users WHERE username = $1', [username]);
        if (existing.length > 0) return Response.json({ error: 'Username sudah digunakan' }, { status: 400 });
        const hashedPassword = await bcrypt.hash(password, 10);
        const { rows: newUser } = await query(
          'INSERT INTO users (username, password, balance) VALUES ($1, $2, $3) RETURNING id, username, balance',
          [username, hashedPassword, 0]
        );
        return Response.json({ user: newUser[0] });
      } 
      else if (action === 'login') {
        const { rows: user } = await query('SELECT id, username, password, balance FROM users WHERE username = $1', [username]);
        if (user.length === 0) return Response.json({ error: 'Username salah' }, { status: 401 });
        const valid = await bcrypt.compare(password, user[0].password);
        if (!valid) return Response.json({ error: 'Password salah' }, { status: 401 });
        const { password: _, ...safeUser } = user[0];
        return Response.json({ user: safeUser });
      }
      return Response.json({ error: 'Action tidak dikenal' }, { status: 400 });
    }

    // POST /api/order
    if (path === '/order') {
      const { userId, numberId, providerId, operatorId, basePrice } = body;
      const userRes = await query('SELECT balance, username FROM users WHERE id = $1', [userId]);
      if (userRes.rows.length === 0) return Response.json({ error: 'User tidak ditemukan' }, { status: 404 });
      const user = userRes.rows[0];
      
      const ourPrice = basePrice + MARKUP_PROFIT;
      if (user.balance < ourPrice) return Response.json({ error: 'Saldo tidak cukup' }, { status: 400 });
      
      const orderResult = await orderNumber(numberId, providerId, operatorId);
      const orderIdRumahotp = orderResult.order_id;
      const newBalance = user.balance - ourPrice;
      await query('UPDATE users SET balance = $1 WHERE id = $2', [newBalance, userId]);
      
      const expiredAt = new Date(Date.now() + 17 * 60 * 1000);
      const { rows: savedOrder } = await query(
        `INSERT INTO orders (user_id, order_id_rumahotp, base_price, our_price, status, created_at, expired_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [userId, orderIdRumahotp, basePrice, ourPrice, 'waiting', new Date().toISOString(), expiredAt]
      );
      
      // Background polling status (tidak auto cancel dari kita, mengikuti rumahotp, tapi timeout 17 menit)
      (async () => {
        let otpCode = null;
        let attempts = 0;
        const maxAttempts = 102; // 17 menit / 10 detik
        while (attempts < maxAttempts && !otpCode) {
          await new Promise(r => setTimeout(r, 10000));
          const status = await getOrderStatus(orderIdRumahotp);
          if (status.status === 'completed') {
            otpCode = status.otp_code;
            await confirmOrder(orderIdRumahotp);
            await query('UPDATE orders SET status = $1, otp_code = $2 WHERE id = $3', ['completed', otpCode, savedOrder[0].id]);
          } else if (status.status === 'canceled') {
            await query('UPDATE users SET balance = balance + $1 WHERE id = $2', [ourPrice, userId]);
            await query('UPDATE orders SET status = $1 WHERE id = $2', ['canceled_by_system', savedOrder[0].id]);
            break;
          }
          attempts++;
        }
        if (!otpCode) {
          await cancelOrder(orderIdRumahotp);
          await query('UPDATE users SET balance = balance + $1 WHERE id = $2', [ourPrice, userId]);
          await query('UPDATE orders SET status = $1 WHERE id = $2', ['expired', savedOrder[0].id]);
        }
      })();
      
      return Response.json({ success: true, orderId: savedOrder[0].id, ourPrice, createdAt: savedOrder[0].created_at });
    }

    // POST /api/cancel-order (manual, harus tunggu 5 menit)
    if (path === '/cancel-order') {
      const { orderId } = body;
      const { rows: order } = await query('SELECT * FROM orders WHERE id = $1', [orderId]);
      if (order.length === 0) return Response.json({ error: 'Order tidak ditemukan' }, { status: 404 });
      if (order[0].status !== 'waiting') return Response.json({ error: 'Order sudah tidak bisa dibatalkan' }, { status: 400 });
      
      const createdAt = new Date(order[0].created_at);
      const diffMinutes = (new Date() - createdAt) / 60000;
      if (diffMinutes < 5) {
        const waitSeconds = Math.ceil((5 - diffMinutes) * 60);
        return Response.json({ error: `Harap tunggu ${waitSeconds} detik lagi` }, { status: 400 });
      }
      
      await cancelOrder(order[0].order_id_rumahotp);
      await query('UPDATE users SET balance = balance + $1 WHERE id = $2', [order[0].our_price, order[0].user_id]);
      await query('UPDATE orders SET status = $1 WHERE id = $2', ['canceled_by_user', orderId]);
      return Response.json({ success: true });
    }

    // POST /api/deposit-create
    if (path === '/deposit-create') {
      const { userId, amount } = body;
      if (amount < 10000) return Response.json({ error: 'Minimal Rp 10.000' }, { status: 400 });
      const adminFee = Math.ceil(amount * ADMIN_FEE_PERCENT / 100);
      const totalPayment = amount + adminFee;
      const depositResult = await createDeposit(totalPayment);
      
      const { rows: savedDeposit } = await query(
        `INSERT INTO deposits (user_id, deposit_id_rumahotp, requested_amount, admin_fee, total_payment, status, qr_code, created_at, expired_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [userId, depositResult.id, amount, adminFee, totalPayment, 'pending', depositResult.qr_code, new Date().toISOString(), new Date(Date.now() + 17 * 60 * 1000)]
      );
      
      // Background polling status & auto cancel 17 menit
      (async () => {
        let attempts = 0, maxAttempts = 102, isCompleted = false;
        while (attempts < maxAttempts && !isCompleted) {
          await new Promise(r => setTimeout(r, 10000));
          const status = await getDepositStatus(depositResult.id);
          if (status.status === 'success') {
            const userRes = await query('SELECT balance FROM users WHERE id = $1', [userId]);
            const newBalance = userRes.rows[0].balance + amount;
            await query('UPDATE users SET balance = $1 WHERE id = $2', [newBalance, userId]);
            await query('UPDATE deposits SET status = $1 WHERE id = $2', ['success', savedDeposit[0].id]);
            isCompleted = true;
          } else if (status.status === 'cancel') {
            await query('UPDATE deposits SET status = $1 WHERE id = $2', ['canceled', savedDeposit[0].id]);
            break;
          }
          attempts++;
        }
        if (!isCompleted) {
          await cancelDeposit(depositResult.id);
          await query('UPDATE deposits SET status = $1 WHERE id = $2', ['expired', savedDeposit[0].id]);
        }
      })();
      
      return Response.json({ 
        success: true, 
        depositId: savedDeposit[0].id, 
        qrCode: depositResult.qr_code, 
        totalPayment, 
        requestedAmount: amount, 
        adminFee,
        createdAt: savedDeposit[0].created_at 
      });
    }

    // POST /api/deposit-cancel (manual, harus tunggu 5 menit)
    if (path === '/deposit-cancel') {
      const { depositId } = body;
      const { rows: deposit } = await query('SELECT * FROM deposits WHERE id = $1', [depositId]);
      if (deposit.length === 0) return Response.json({ error: 'Deposit tidak ditemukan' }, { status: 404 });
      if (deposit[0].status !== 'pending') return Response.json({ error: 'Deposit sudah tidak bisa dibatalkan' }, { status: 400 });
      
      const diffMinutes = (new Date() - new Date(deposit[0].created_at)) / 60000;
      if (diffMinutes < 5) {
        const waitSeconds = Math.ceil((5 - diffMinutes) * 60);
        return Response.json({ error: `Harap tunggu ${waitSeconds} detik lagi` }, { status: 400 });
      }
      
      await cancelDeposit(deposit[0].deposit_id_rumahotp);
      await query('UPDATE deposits SET status = $1 WHERE id = $2', ['canceled_by_user', depositId]);
      return Response.json({ success: true });
    }

    // POST /api/change-password
    if (path === '/change-password') {
      const { userId, newPassword } = body;
      const hashed = await bcrypt.hash(newPassword, 10);
      await query('UPDATE users SET password = $1 WHERE id = $2', [hashed, userId]);
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Endpoint tidak ditemukan' }, { status: 404 });
  } catch (err) {
    console.error(err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
