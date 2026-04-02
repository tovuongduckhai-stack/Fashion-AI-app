import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jvsnvllauayliiasgzdze.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const PLAN_CREDITS = {
  199000: { credits: 30,  plan: 'Starter' },
  499000: { credits: 100, plan: 'Pro' },
  15000:  { credits: 1,   plan: 'Credit lẻ' },
};

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
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
      console.log(`TX [${txId}] | Amount: ${amount} | Desc: ${description}`);
      if (txId) {
        const { data: existing } = await supabase.from('processed_transactions').select('id').eq('tx_id', txId).single();
        if (existing) { console.log(`Bỏ qua TX trùng: ${txId}`); continue; }
      }
      const planInfo = PLAN_CREDITS[amount];
      if (!planInfo) { console.log('Không khớp tier:', amount); continue; }
      let user = null;
      const emailMatch = description.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
      if (emailMatch) {
        const { data } = await supabase.from('users').select('*').eq('email', emailMatch[0].toLowerCase()).single();
        if (data) user = data;
      }
      if (!user) {
        const codeMatch = description.match(/STY-?[A-Z0-9]{5,8}/);
        if (codeMatch) {
          let userCode = codeMatch[0];
          if (!userCode.includes('-')) userCode = userCode.slice(0, 3) + '-' + userCode.slice(3);
          console.log('Tìm user theo mã:', userCode);
          const { data } = await supabase.from('users').select('*').eq('user_code', userCode).single();
          if (data) user = data;
        }
      }
      if (!user) { console.log('Không tìm thấy user:', description); continue; }
      const newCredits = (user.credits || 0) + planInfo.credits;
      const { error } = await supabase.from('users').update({ credits: newCredits, plan: planInfo.plan, updated_at: new Date().toISOString() }).eq('id', user.id);
      if (error) { console.log('Lỗi update:', error.message); continue; }
      if (txId) await supabase.from('processed_transactions').insert({ tx_id: txId });
      console.log(`✅ Cộng ${planInfo.credits} credits cho ${user.email}. Tổng: ${newCredits}`);
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    console.log('Lỗi webhook:', err.message);
    return res.status(500).json({ error: err.message });
  }
}