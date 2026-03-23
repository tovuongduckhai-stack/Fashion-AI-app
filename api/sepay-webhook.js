const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jvsnvllauayliiasgzdze.supabase.co';
const SUPABASE_SECRET_KEY = process.env.SECRET_KEY;
const SEPAY_SECRET = process.env.SEPAY_SECRET;

const PLAN_CREDITS = {
  199000: 30,
  499000: 100,
  15000: 1,
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
    // if (SEPAY_SECRET && signature !== SEPAY_SECRET) {
    //   return { statusCode: 401, body: 'Unauthorized' };
    // }

    // Lấy số tiền và nội dung chuyển khoản
    const amount = parseInt(body.transferAmount || body.amount || 0);
    const description = (body.content || body.description || '').toUpperCase();

    console.log('Amount:', amount, '| Description:', description);

    // Tìm số credit tương ứng
    const creditsToAdd = PLAN_CREDITS[amount];
    if (!creditsToAdd) {
      console.log('Số tiền không khớp với gói nào:', amount);
      return { statusCode: 200, body: JSON.stringify({ message: 'Số tiền không hợp lệ' }) };
    }

    // Tìm email từ nội dung chuyển khoản
    // Nội dung dạng: "STYLAIR PRO abc@gmail.com" hoặc "STYLAIR STY-XXXXX"
    const emailMatch = description.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
    const codeMatch = description.match(/STY-[A-Z0-9]{5}/);

    if (!emailMatch && !codeMatch) {
      console.log('Không tìm thấy email hoặc mã STY trong nội dung:', description);
      return { statusCode: 200, body: JSON.stringify({ message: 'Không tìm thấy thông tin user' }) };
    }

    // Khởi tạo Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

    let user = null;

    // Tìm user theo email
    if (emailMatch) {
      const email = emailMatch[0].toLowerCase();
      console.log('Tìm user theo email:', email);

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        console.log('Lỗi tìm user theo email:', error.message);
      } else {
        user = data;
      }
    }

    // Tìm user theo mã STY nếu không tìm được theo email
    if (!user && codeMatch) {
      const userCode = codeMatch[0];
      console.log('Tìm user theo mã:', userCode);

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_code', userCode)
        .single();

      if (error) {
        console.log('Lỗi tìm user theo mã:', error.message);
      } else {
        user = data;
      }
    }

    if (!user) {
      console.log('Không tìm thấy user!');
      return { statusCode: 200, body: JSON.stringify({ message: 'Không tìm thấy user' }) };
    }

    console.log('Tìm thấy user:', user.email, '| Credits hiện tại:', user.credits);

    // Xác định plan
    let plan = 'Credit lẻ';
    if (amount === 199000) plan = 'Starter';
    if (amount === 499000) plan = 'Pro';

    // Cộng credit vào Supabase
    const newCredits = (user.credits || 0) + creditsToAdd;

    const { error: updateError } = await supabase
      .from('users')
      .update({
        credits: newCredits,
        plan: plan,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.log('Lỗi update credits:', updateError.message);
      return { statusCode: 500, body: JSON.stringify({ error: updateError.message }) };
    }

    console.log(`✅ Cộng ${creditsToAdd} credits cho ${user.email}. Tổng: ${newCredits}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        email: user.email,
        creditsAdded: creditsToAdd,
        totalCredits: newCredits,
        plan: plan,
      }),
    };

  } catch (err) {
    console.log('Lỗi webhook:', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
