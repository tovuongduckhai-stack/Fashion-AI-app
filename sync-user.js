const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vltlchbdghdiatsousxu.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const { email, user_code, name } = req.body;
    if (!email) return res.status(400).json({ error: 'missing email' });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    let { data: user } = await supabase.from('users').select('*').eq('email', email).single();

    if (!user) {
      const { data: newUser } = await supabase.from('users').insert({ email, name, user_code, credits: 0, plan: 'free' }).select().single();
      user = newUser;
    }

    return res.status(200).json({
      credits: user?.credits || 0,
      plan: user?.plan || 'free',
      user_code: user?.user_code || user_code,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};