const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jvsnvllauayliiasgzdze.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const PLAN_CREDITS = {
  199000: { credits: 30, plan: 'Starter' },
  499000: { credits: 100, plan: 'Pro' },
  15000: { credits: 1, plan: 'Credit le' },
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  try {
    const body = req.body;
    const transactions = Array.isArray(body.data) ? body.data : body.data ? [body.data] : [body];
    for (const tx of transactions) {
      const txId = String(tx.id || '');
      const amount = parseInt(tx.amount || 0);
      const description = (tx.description || '').toUpperCase();
      console.log('TX:', txId, '| Amount:', amount, '| Desc:', description);
      if (txId) {
        const { data: existing } = await supabase.from('processed_transactions').select('id').eq('tx_id', txId).single();
        if (existing) { console.log('Bo qua TX trung:', txId); continue; }
      }
      const planInfo = PLAN_CREDITS[amount];
      if (!planInfo) { console.log('Khong khop tier:', amount); continue; }
      let user = null;
      const emailMatch = description.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
      if (emailMatch) {
        const { data } = await supabase.from('users').select('*').eq('email', emailMatch[0].toLowerCase()).single();
        if (data) user = data;
      }
      if (!user) {
        const codeMatch = description.match(/STY-?[A-Z0-9]{3,8}/);
        if (codeMatch) {
          const raw = codeMatch[0].replace(/-/g, '');
          const withDash = 'STY-' + raw.slice(3);
          console.log('Tim user, raw:', raw, '| withDash:', withDash);
          const { data: d1 } = await supabase.from('users').select('*').eq('user_code', withDash).single();
          if (d1) user = d1;
          if (!user) {
            const { data: d2 } = await supabase.from('users').select('*').eq('user_code', raw).single();
            if (d2) user = d2;
          }
        }
      }
      if (!user) { console.log('Khong tim thay user:', description); continue; }
      const newCredits = (user.credits || 0) + planInfo.credits;
      const { error } = await supabase.from('users').update({ credits: newCredits, plan: planInfo.plan, updated_at: new Date().toISOString() }).eq('id', user.id);
      if (error) { console.log('Loi update:', error.message); continue; }
      if (txId) await supabase.from('processed_transactions').insert({ tx_id: txId });
      console.log('Cong', planInfo.credits, 'credits cho', user.email, '| Tong:', newCredits);
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    console.log('Loi webhook:', err.message);
    return res.status(500).json({ error: err.message });
  }
};