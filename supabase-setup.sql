-- Chạy SQL này trong Supabase → SQL Editor

-- Bảng users
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  user_code TEXT UNIQUE,
  credits INTEGER DEFAULT 0,
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- Bảng transactions (lịch sử giao dịch)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_code TEXT,
  email TEXT,
  plan TEXT,
  credits_added INTEGER,
  amount BIGINT,
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tắt Row Level Security để đơn giản hóa truy cập API
-- Lưu ý: Trong môi trường production nên bật RLS và cấu hình policy phù hợp
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'users') THEN
    ALTER TABLE users DISABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'transactions') THEN
    ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
  END IF;
END
$$;

-- Tạo function xử lý thanh toán
CREATE OR REPLACE FUNCTION handle_payment(
  user_id UUID,
  new_credits INTEGER,
  plan_name TEXT,
  tx_amount BIGINT,
  tx_content TEXT,
  user_email TEXT,
  credits_added INTEGER
) RETURNS void AS $$
BEGIN
  -- Update user credits
  UPDATE users 
  SET 
    credits = new_credits,
    plan = plan_name,
    updated_at = NOW()
  WHERE id = user_id;

  -- Log transaction
  INSERT INTO transactions(
    user_code,
    email,
    plan,
    credits_added,
    amount,
    content
  ) VALUES (
    (SELECT user_code FROM users WHERE id = user_id),
    user_email,
    plan_name,
    credits_added,
    tx_amount,
    tx_content
  );
END;
$$ LANGUAGE plpgsql;
