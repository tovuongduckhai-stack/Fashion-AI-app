const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Tắt body parser của Vercel để lấy raw body
module.exports.config = { api: { bodyParser: false } };

function getPlanByTotal(total) {
  if (total <= 99)   return { credits: 1,   plan: 'Pay-per-use' };
  if (total <= 800)  return { credits: 30,  plan: 'Starter' };
  if (total <= 1900) return { credits: 100, plan: 'Pro' };
  return null;
}

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const secret = process.env.LS_WEBHOOK_SECRET;
  const signature = req.headers['x-signature'];
  if (!secret || !signature) return res.status(400).json({ error: 'Missing signature' });

  const rawBody = await getRawBody(req);
  const hmac = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  if (hmac !== signature) return res.status(401).json({ error: 'Invalid signature' });

  const body = JSON.parse(rawBody);
  const eventName = req.headers['x-event-name'];
  if (eventName !== 'order_created') return res.status(200).json({ message: 'Ignored' });

  try {
    const data = body?.data;
    const orderId  = data?.id;
    const status   = data?.attributes?.status;
    const total    = data?.attributes?.total;
    const userCode = body?.meta?.custom_data?.user_code;

    console.log('[LS] order:', orderId, '| status:', status, '| total:', total, '| code:', userCode);

    if (status !== 'paid') return res.status(200).json({ message: 'Not paid' });
    if (!userCode) return res.status(200).json({ error: 'No user_code' });

    const { data: existing } = await supabase
      .from('processed_transactions')
      .select('id')
      .eq('tx_id', 'LS_' + String(orderId))
      .single();
    if (existing) return res.status(200).json({ message: 'Already processed' });

    const planInfo = getPlanByTotal(total);
    if (!planInfo) return res.status(200).json({ error: 'Unknown amount: ' + total });

    const { credits, plan } = planInfo;

    const { data: userRow, error: userErr } = await supabase
      .from('users')
      .select('id, credits')
      .eq('user_code', userCode)
      .single();
    if (userErr || !userRow) return res.status(200).json({ error: 'User not found: ' + userCode });

    await supabase.from('users').update({ credits: (userRow.credits || 0) + credits, plan }).eq('user_code', userCode);

    await supabase.from('processed_transactions').insert({
      tx_id: 'LS_' + String(orderId),
      user_code: userCode,
      amount: credits,
      note: `LS ${plan} — order ${orderId}`
    });

    console.log(`[LS] ✅ +${credits} credits → ${userCode}`);
    return res.status(200).json({ success: true, credits_added: credits });

  } catch (err) {
    console.error('[LS] Error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};