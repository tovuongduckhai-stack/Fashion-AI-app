const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Credits tương ứng với từng variant_id trên Lemon Squeezy
// Vào LS dashboard → sản phẩm → Variants → copy variant ID paste vào đây
const VARIANT_CREDITS = {
  [process.env.LS_VARIANT_STARTER]:    { credits: 30,  plan: 'Starter' },
  [process.env.LS_VARIANT_PRO]:        { credits: 100, plan: 'Pro' },
  [process.env.LS_VARIANT_PAYPERUSE]:  { credits: 1,   plan: 'Pay-per-use' },
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Verify chữ ký từ Lemon Squeezy ──
  const secret = process.env.LS_WEBHOOK_SECRET;
  const signature = req.headers['x-signature'];

  if (!secret || !signature) {
    console.error('[LS Webhook] Missing secret or signature');
    return res.status(400).json({ error: 'Missing signature' });
  }

  const rawBody = JSON.stringify(req.body);
  const hmac = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  if (hmac !== signature) {
    console.error('[LS Webhook] Invalid signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // ── Chỉ xử lý event order_created ──
  const eventName = req.headers['x-event-name'];
  if (eventName !== 'order_created') {
    return res.status(200).json({ message: 'Event ignored: ' + eventName });
  }

  try {
    const data = req.body?.data;
    const orderId   = data?.id;
    const status    = data?.attributes?.status;          // "paid"
    const variantId = String(data?.attributes?.first_order_item?.variant_id || '');
    const userCode  = data?.attributes?.custom_data?.user_code;  // STY-XXXXX

    console.log('[LS Webhook] order_id:', orderId, '| status:', status, '| variant:', variantId, '| user_code:', userCode);

    // Chỉ xử lý khi đã thanh toán thành công
    if (status !== 'paid') {
      return res.status(200).json({ message: 'Order not paid yet' });
    }

    if (!userCode) {
      console.error('[LS Webhook] No user_code in custom_data');
      return res.status(200).json({ error: 'No user_code' });
    }

    // ── Chống duplicate: kiểm tra order đã xử lý chưa ──
    const { data: existing } = await supabase
      .from('processed_transactions')
      .select('id')
      .eq('transaction_id', String(orderId))
      .single();

    if (existing) {
      console.log('[LS Webhook] Order already processed:', orderId);
      return res.status(200).json({ message: 'Already processed' });
    }

    // ── Xác định số credit dựa theo variant ──
    const planInfo = VARIANT_CREDITS[variantId];
    if (!planInfo) {
      console.error('[LS Webhook] Unknown variant_id:', variantId);
      return res.status(200).json({ error: 'Unknown variant' });
    }

    const { credits, plan } = planInfo;

    // ── Tìm user theo user_code ──
    const { data: userRow, error: userErr } = await supabase
      .from('users')
      .select('id, email, credits')
      .eq('user_code', userCode)
      .single();

    if (userErr || !userRow) {
      console.error('[LS Webhook] User not found for code:', userCode);
      return res.status(200).json({ error: 'User not found' });
    }

    // ── Cộng credit + cập nhật plan ──
    const newCredits = (userRow.credits || 0) + credits;
    const { error: updateErr } = await supabase
      .from('users')
      .update({ credits: newCredits, plan })
      .eq('user_code', userCode);

    if (updateErr) {
      console.error('[LS Webhook] Update error:', updateErr);
      return res.status(500).json({ error: 'DB update failed' });
    }

    // ── Ghi nhận transaction đã xử lý ──
    await supabase.from('processed_transactions').insert({
      transaction_id: String(orderId),
      user_code: userCode,
      amount: credits,
      note: `LS order ${orderId} — ${plan}`
    });

    console.log(`[LS Webhook] ✅ +${credits} credits → ${userCode} (${userRow.email})`);
    return res.status(200).json({ success: true, user_code: userCode, credits_added: credits });

  } catch (err) {
    console.error('[LS Webhook] Unexpected error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};
