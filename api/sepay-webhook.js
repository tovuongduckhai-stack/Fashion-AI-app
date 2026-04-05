const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = 'https://jvsnvllauayliiasgzdze.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const PLAN_CREDITS = { 199000: { credits: 30, plan: 'Starter' }, 499000: { credits: 100, plan: 'Pro' }, 15000: { credits: 1, plan: 'Credit le' } };
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  try {
    const tx = req.body;
    const txId = String(tx.id || '');
    const amount = parseInt(tx.transferAmount || tx.amount || 0);
    const description = (tx.content || tx.description || '').toUpperCase();
    console.log('TX:', txId, 'Amount:', amount, 'Desc:', description);
    console.log('KEY exists:', !!SUPABASE_SERVICE_KEY);
    const planInfo = PLAN_CREDITS[amount];
    if (!planInfo) { console.log('Khong khop tier:', amount); return res.status(200).json({ success: true }); }
    let user = null;
    const codeMatch = description.match(/STY-?[A-Z0-9]{3,8}/);
    if (codeMatch) {
      const raw = codeMatch[0].replace(/-/g, '');
      const withDash = 'STY-' + raw.slice(3);
      console.log('Tim user withDash:', withDash);
      const { data: d1, error: e1 } = await supabase.from('users').select('*').eq('user_code', withDash).single();
      console.log('Ket qua query:', JSON.stringify(d1), 'Error:', JSON.stringify(e1));
      if (d1) user = d1;
    }
    if (!user) { console.log('Khong tim thay user:', description); return res.status(200).json({ success: true }); }
    const newCredits = (user.credits || 0) + planInfo.credits;
    const { error: ue } = await supabase.from('users').update({ credits: newCredits, plan: planInfo.plan, updated_at: new Date().toISOString() }).eq('id', user.id);
    if (ue) { console.log('Loi update:', ue.message); return res.status(200).json({ success: true }); }
    console.log('Cong', planInfo.credits, 'credits cho', user.email, 'Tong:', newCredits);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.log('Loi:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
