import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jvsnvllauayliiasgzdze.supabase.co';
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

const PLAN_CREDITS = {
  199000: { credits: 30,  plan: 'Starter' },
  499000: { credits: 100, plan: 'Pro' },
  15000:  { credits: 1,   plan: 'Credit lẻ' },
};

export default async function handler(req, res) {
  // Validate request method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Validate content type
  if (!req.headers['content-type']?.includes('application/json')) {
    return res.status(400).json({ error: 'Invalid Content-Type' });
  }

  try {
    const body = req.body;
    if (!body || (!body.data && !Array.isArray(body))) {
      return res.status(400).json({ error: 'Invalid request body' });
    }
    console.log('Casso webhook:', JSON.stringify(body));

    // Casso V2 gửi single object hoặc array
    const transactions = Array.isArray(body.data) ? body.data : (body.data ? [body.data] : [body]);

    for (const tx of transactions) {
      const amount = parseInt(tx.amount || 0);
      const description = (tx.description || '').toUpperCase();
      console.log('Amount:', amount, '| Description:', description);

      const planInfo = PLAN_CREDITS[amount];
      if (!planInfo) {
        console.log('Số tiền không khớp:', amount);
        continue;
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
          let userCode = codeMatch[0];
          if (!userCode.includes('-')) {
            userCode = userCode.slice(0, 3) + '-' + userCode.slice(3);
          }
          console.log('Tìm user theo mã:', userCode);
          const { data } = await supabase.from('users').select('*').eq('user_code', userCode).single();
          if (data) user = data;
        }
      }

      if (!user) {
        console.log('Không tìm thấy user! Description:', description);
        continue;
      }

      const newCredits = (user.credits || 0) + planInfo.credits;
      
      // Sử dụng transaction để đảm bảo cả 2 thao tác cùng thành công hay cùng thất bại
      const { error: transactionError } = await supabase.rpc('handle_payment', {
        user_id: user.id,
        new_credits: newCredits,
        plan_name: planInfo.plan,
        tx_amount: amount,
        tx_content: description,
        user_email: user.email,
        credits_added: planInfo.credits
      });

      if (transactionError) {
        console.log('Lỗi transaction:', transactionError.message);
        continue;
      }

      console.log(`✅ Đã cộng ${planInfo.credits} credits ($${amount}) cho ${user.email}. Tổng: ${newCredits}`);
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.log('Lỗi webhook:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
