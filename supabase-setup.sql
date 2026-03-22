-- Chạy SQL này trong Supabase → SQL Editor

-- Bảng users
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  user_code TEXT UNIQUE,
  credits INTEGER DEFAULT 0,
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMP DEFAULT NOW()
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

-- Cho phép đọc/ghi (tắt RLS cho đơn giản)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
