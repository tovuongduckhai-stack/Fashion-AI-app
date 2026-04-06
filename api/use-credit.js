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
    const { email } = JSON.parse(event.body || '{}');
    if (!email) return { statusCode: 400, headers, body: JSON.stringify({ error: 'missing email' }) };

    const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

    const { data: user } = await supabase
      .from('users')
      .select('credits')
      .eq('email', email)
      .single();

    if (!user || user.credits <= 0) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'no_credits' }) };
    }

    await supabase
      .from('users')
      .update({ credits: user.credits - 1 })
      .eq('email', email);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, credits_left: user.credits - 1 }),
    };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
