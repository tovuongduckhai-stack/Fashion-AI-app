module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
  try {
    const tx = req.body;
    const txId = String(tx.id || '');
    const amount = parseInt(tx.transferAmount || tx.amount || 0);
    const description = (tx.content || tx.description || '').toUpperCase();
    console.log('TX:', txId, 'Amount:', amount, 'Desc:', description);

    const SUPABASE_URL = 'https://jvsnvllauayliiasgzdze.supabase.co';
    const KEY = process.env.SUPABASE_SERVICE_KEY;
    const headers = { 'Content-Type': 'application/json', 'apikey': KEY, 'Authorization': `Bearer ${KEY}` };

    const PLAN_CREDITS = { 199000: { credits: 30, plan: 'Starter' }, 499000: { credits: 100, plan: 'Pro' }, 15000: { credits: 1, plan: 'Credit le' } };
    const planInfo = PLAN_CREDITS[amount];
    if (!planInfo) { console.log('Khong khop tier:', amount); return res.status(200).json({ success: true }); }

    const codeMatch = description.match(/STY-?[A-Z0-9]{3,8}/);
    if (!codeMatch) { console.log('Khong co STY code'); return res.status(200).json({ success: true }); }

    const raw = codeMatch[0].replace(/-/g, '');
    const withDash = 'STY-' + raw.slice(3);
    console.log('Tim user:', withDash);

    const userRes = await fetch(`${SUPABASE_URL}/rest/v1/users?user_code=eq.${withDash}&select=*`, { headers });
    const users = await userRes.json();
    console.log('Users found:', JSON.stringify(users));

    if (!users || users.length === 0) { console.log('Khong tim thay user'); return res.status(200).json({ success: true }); }

    const user = users[0];
    const newCredits = (user.credits || 0) + planInfo.credits;

    await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${user.id}`, {
      method: 'PATCH',
      headers: { ...headers, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ credits: newCredits, plan: planInfo.plan, updated_at: new Date().toISOString() })
    });

    console.log('Cong', planInfo.credits, 'credits cho', user.email, 'Tong:', newCredits);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.log('Loi:', err.message);
    return res.status(500).json({ error: err.message });
  }
};