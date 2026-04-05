@echo off
cd C:\Users\Dell\Fashion-AI-app
echo Dang viet file webhook moi...
(
echo const { createClient } = require('@supabase/supabase-js'^);
echo const SUPABASE_URL = 'https://jvsnvllauayliiasgzdze.supabase.co';
echo const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
echo const PLAN_CREDITS = { 199000: { credits: 30, plan: 'Starter' }, 499000: { credits: 100, plan: 'Pro' }, 15000: { credits: 1, plan: 'Credit le' } };
echo const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY^);
echo module.exports = async function handler(req, res^) {
echo   if (req.method !== 'POST'^) return res.status(405^).json({ error: 'Method Not Allowed' }^);
echo   try {
echo     const tx = req.body;
echo     const txId = String(tx.id ^|^| ''^);
echo     const amount = parseInt(tx.transferAmount ^|^| tx.amount ^|^| 0^);
echo     const description = (tx.content ^|^| tx.description ^|^| ''^).toUpperCase(^);
echo     console.log('TX:', txId, 'Amount:', amount, 'Desc:', description^);
echo     console.log('KEY exists:', !!SUPABASE_SERVICE_KEY^);
echo     const planInfo = PLAN_CREDITS[amount];
echo     if (!planInfo^) { console.log('Khong khop tier:', amount^); return res.status(200^).json({ success: true }^); }
echo     let user = null;
echo     const codeMatch = description.match(/STY-?[A-Z0-9]{3,8}/^);
echo     if (codeMatch^) {
echo       const raw = codeMatch[0].replace(/-/g, ''^);
echo       const withDash = 'STY-' + raw.slice(3^);
echo       console.log('Tim user withDash:', withDash^);
echo       const { data: d1, error: e1 } = await supabase.from('users'^).select('*'^).eq('user_code', withDash^).single(^);
echo       console.log('Ket qua query:', JSON.stringify(d1^), 'Error:', JSON.stringify(e1^)^);
echo       if (d1^) user = d1;
echo     }
echo     if (!user^) { console.log('Khong tim thay user:', description^); return res.status(200^).json({ success: true }^); }
echo     const newCredits = (user.credits ^|^| 0^) + planInfo.credits;
echo     const { error: ue } = await supabase.from('users'^).update({ credits: newCredits, plan: planInfo.plan, updated_at: new Date(^).toISOString(^) }^).eq('id', user.id^);
echo     if (ue^) { console.log('Loi update:', ue.message^); return res.status(200^).json({ success: true }^); }
echo     console.log('Cong', planInfo.credits, 'credits cho', user.email, 'Tong:', newCredits^);
echo     return res.status(200^).json({ success: true }^);
echo   } catch (err^) {
echo     console.log('Loi:', err.message^);
echo     return res.status(500^).json({ error: err.message }^);
echo   }
echo };
) > api\sepay-webhook.js
echo Dang push...
git add .
git commit -m "fix: add debug logs"
git push
echo Cho 60 giay...
timeout /t 60
echo Dang test...
curl -X POST https://fashion-ai-app-six.vercel.app/api/sepay-webhook -H "Content-Type: application/json" -d "{\"id\":\"test888\",\"transferAmount\":15000,\"content\":\"STYQEQJY\"}"
echo Xong! Vao Vercel logs xem ket qua.
pause