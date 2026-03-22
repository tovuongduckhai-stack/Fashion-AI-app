const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jvsnvllauayliiasgdze.supabase.co';
const SUPABASE_SECRET_KEY = process.env.SECRET_KEY;
const SEPAY_SECRET = process.env.SEPAY_SECRET; // lấy từ Sepay khi tạo webhook

const PLAN_CREDITS = {
  'STARTER': 30,
  'PRO': 100,
  'CREDIT': 1,
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body);
    console.log('Sepay webhook:', JSON.stringify(body));

    // Kiểm tra chữ ký từ Sepay (nếu có)
    // const signature = event.headers['x-sepay-signature'];

    const content = body.content || body.description || '';
    const amount = body.transferAmount || body.amount || 0;

    // Parse nội dung: "STYLAIR PRO STY-XXXXX"
    const match = content.toUpperCase().match(/STYLAIR\s+(STARTER|PRO|CREDIT\s*L[EẺ]|CREDIT)\s+(STY[-]?[A-Z0-9]+)/);
    if (!match) {
      console.log('Không match nội dung:', content);
      return { statusCode: 200, body: JSON.stringify({ success: false, reason: 'no_match' }) };
    }

    const planRaw = match[1].trim().replace(/\s+/g, '_');
    const userCode = match[2].trim();
    const plan = planRaw === 'CREDIT_LẺ' ? 'CREDIT' : planRaw;
    const creditsToAdd = PLAN_CREDITS[plan] || 0;

    if (creditsToAdd === 0) {
      return { statusCode: 200, body: JSON.stringify({ success: false, reason: 'invalid_plan' }) };
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

    // Tìm user theo code
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('user_code', userCode)
      .single();

    if (findError || !user) {
      console.log('Không tìm thấy user:', userCode);
      return { statusCode: 200, body: JSON.stringify({ success: false, reason: 'user_not_found' }) };
    }

    // Cộng credits
    const newCredits = (user.credits || 0) + creditsToAdd;
    const { error: updateError } = await supabase
      .from('users')
      .update({ credits: newCredits, plan: plan.toLowerCase() })
      .eq('user_code', userCode);

    if (updateError) {
      console.error('Lỗi update:', updateError);
      return { statusCode: 500, body: JSON.stringify({ success: false, reason: 'update_failed' }) };
    }

    // Lưu lịch sử giao dịch
    await supabase.from('transactions').insert({
      user_code: userCode,
      email: user.email,
      plan: plan.toLowerCase(),
      credits_added: creditsToAdd,
      amount: amount,
      content: content,
    });

    console.log(`✅ Cộng ${creditsToAdd} credits cho ${userCode} (${user.email})`);
    return { statusCode: 200, body: JSON.stringify({ success: true, credits_added: creditsToAdd }) };

  } catch (err) {
    console.error('Webhook error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
