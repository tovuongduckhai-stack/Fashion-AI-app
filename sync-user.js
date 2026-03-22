const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jvsnvllauayliiasgdze.supabase.co';
const SUPABASE_SECRET_KEY = process.env.SECRET_KEY;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { email, user_code, name } = JSON.parse(event.body || '{}');
    if (!email) return { statusCode: 400, headers, body: JSON.stringify({ error: 'missing email' }) };

    const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

    // Tìm user
    let { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    // Nếu chưa có → tạo mới
    if (!user) {
      const { data: newUser } = await supabase
        .from('users')
        .insert({ email, name, user_code, credits: 0, plan: 'free' })
        .select()
        .single();
      user = newUser;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        credits: user?.credits || 0,
        plan: user?.plan || 'free',
        user_code: user?.user_code || user_code,
      }),
    };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
