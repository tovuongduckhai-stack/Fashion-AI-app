import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jvsnvllauayliiasgzdze.supabase.co';
const SUPABASE_SECRET_KEY = process.env.SECRET_KEY;
const SEPAY_API_KEY = process.env.SEPAY_API_KEY; // thêm vào Vercel env

const PLAN_CREDITS = {
  199000: { credits: 30,  plan: 'Starter' },
  499000: { credits: 100, plan: 'Pro' },
  15000:  { credits: 1,   plan: 'Credit lẻ' },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // ✅ Verify API Key từ SePay
  const authHeader = req.headers['authorization'] || '';
  if (SEPAY_API_KEY && authHeader !== `Apikey ${SEPAY_API_KEY}`) {
    console.log('Unauthorized webhook call');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const body = req.body;
    console.log('Sepay webhook:', JSON.stringify(body));

    const amount = parseInt(body.transferAmount || body.amount || 0);
    const description = (body.content || body.description || '').toUpperCase();
    console.log('Amount:', amount, '| Description:', description);

    const planInfo = PLAN_CREDITS[amount];
    if (!planInfo) {
      console.log('Số tiền không khớp:', amount);
      return res.status(200).json({ message: 'Số tiền không hợp lệ' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
    let user = null;

    // Tìm theo email
    const emailMatch = description.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    if (emailMatch) {
      const email = emailMatch[0].toLowerCase();
      const { data } = await supabase.from('users').select('*').eq('email', email).single();
      if (data) user = data;
    }

    // Tìm theo mã STY-XXXXX
    if (!user) {
      const codeMatch = description.match(/STY-?[A-Z0-9]{5,8}/);
      if (codeMatch) {
        const { data } = await supabase.from('users').select('*').eq('user_code', codeMatch[0]).single();
        if (data) user = data;
      }
    }

    if (!user) {
      console.log('Không tìm thấy user! Description:', description);
      return res.status(200).json({ message: 'Không tìm thấy user' });
    }

    const newCredits = (user.credits || 0) + planInfo.credits;
    const { error: updateError } = await supabase
      .from('users')
      .update({
        credits: newCredits,
        plan: planInfo.plan,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.log('Lỗi update:', updateError.message);
      return res.status(500).json({ error: updateError.message });
    }

    console.log(`✅ Cộng ${planInfo.credits} credits cho ${user.email}. Tổng: ${newCredits}`);
    return res.status(200).json({
      success: true,
      email: user.email,
      creditsAdded: planInfo.credits,
      totalCredits: newCredits,
      plan: planInfo.plan,
    });

  } catch (err) {
    console.log('Lỗi webhook:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
