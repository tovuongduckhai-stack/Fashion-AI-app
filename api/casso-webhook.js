import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jvsnvllauayliiasgzdze.supabase.co';
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

const PLAN_CREDITS = {
  199000: { credits: 30,  plan: 'Starter' },
  499000: { credits: 100, plan: 'Pro' },
  15000:  { credits: 1,   plan: 'Credit láº»' },
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
    const body = req.body; const amount = body.data[0].amount;
    if (!body || (!body.data && !Array.isArray(body))) {
      return res.status(400).json({ error: 'Invalid request body' });
    }
    console.log('Casso webhook:', JSON.stringify(body));

    // Casso V2 gá»­i single object hoáº·c array
    const transactions = Array.isArray(body.data) ? body.data : (body.data ? [body.data] : [body]);

    for (const tx of transactions) {
      const amount = parseInt(tx.amount || 0);
      const description = (tx.description || '').toUpperCase();
      console.log('Amount:', amount, '| Description:', description);

      const planInfo = PLAN_CREDITS[amount];
      if (!planInfo) {
        console.log('Sá»‘ tiá»n khÃ´ng khá»›p:', amount);
        continue;
      }

      const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
      let user = null;

      // TÃ¬m theo email
      const emailMatch = description.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
      if (emailMatch) {
        const email = emailMatch[0].toLowerCase();
        const { data } = await supabase.from('users').select('*').eq('email', email).single();
        if (data) user = data;
      }

      // TÃ¬m theo mÃ£ STY-XXXXX
      if (!user) {
        const codeMatch = description.match(/STY-?[A-Z0-9]{5,8}/);
        if (codeMatch) {
          const rawCode = codeMatch[0].replace(/-/g, '');`n          const userCode = rawCode.slice(0, 3) + '-' + rawCode.slice(3);
          console.log('TÃ¬m user theo mÃ£:', userCode);
          const { data } = await supabase.from('users').select('*').eq('user_code', userCode).single();
          if (data) user = data;
        }
      }

      if (!user) {
        console.log('KhÃ´ng tÃ¬m tháº¥y user! Description:', description);
        continue;
      }

      const newCredits = (user.credits || 0) + planInfo.credits;
      
      // Sá»­ dá»¥ng transaction Ä‘á»ƒ Ä‘áº£m báº£o cáº£ 2 thao tÃ¡c cÃ¹ng thÃ nh cÃ´ng hay cÃ¹ng tháº¥t báº¡i
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
        console.log('Lá»—i transaction:', transactionError.message);
        continue;
      }

      console.log(`âœ… ÄÃ£ cá»™ng ${planInfo.credits} credits ($${amount}) cho ${user.email}. Tá»•ng: ${newCredits}`);
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.log('Lá»—i webhook:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
`nhandler({method:"POST", headers:{"content-type":"application/json"}, body:{data:[{amount:199000, description:"NAP TIEN TEST"}]}}, {status: (code) => ({json: (msg) => console.log("K?T QU?: " + code, msg)})});

