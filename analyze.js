// /api/analyze.js — Vercel Serverless Function
// ✅ OPENAI_KEY nằm ở đây, browser không bao giờ thấy được

const AI_PROMPT = `You are a Vietnamese fashion marketing expert. Analyze this clothing product image and return ONLY a JSON object. No markdown, no text outside JSON.
IMPORTANT: You MUST include ALL fields especially "kich_thuoc" array with exactly 4 sizes.
Return this exact JSON structure:
{"ten_san_pham":"tên sản phẩm hấp dẫn bằng tiếng Việt","mo_ta_ngan":"caption 1 câu ngắn gọn","mo_ta_chi_tiet":"mô tả 3-4 câu về chất liệu và kiểu dáng","hashtag":["#thờitrang","#ootd","#fashion","#style","#outfit","#fyp"],"kich_thuoc":[{"size":"S","vong_eo":"60-64cm","vong_mong":"86-90cm","dai":"98cm"},{"size":"M","vong_eo":"65-69cm","vong_mong":"91-95cm","dai":"99cm"},{"size":"L","vong_eo":"70-74cm","vong_mong":"96-100cm","dai":"100cm"},{"size":"XL","vong_eo":"75-80cm","vong_mong":"101-106cm","dai":"101cm"}],"script_video":"[Cảnh quay 1] mô tả cảnh đầu. [Text] câu hook. [Cảnh quay 2] mô tả tiếp. [Text] điểm nổi bật. [Cảnh quay 3] cảnh kết. [Text] call to action mua ngay","gia_de_xuat":"150.000 - 350.000 VNĐ","mau_sac":"màu chính của sản phẩm","chat_lieu":"chất liệu dự đoán","diem_ban":["Điểm nổi bật 1","Điểm nổi bật 2","Điểm nổi bật 3"]}`;

export default async function handler(req, res) {
  // Chỉ cho phép POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { imageBase64, imageMime } = req.body;

  if (!imageBase64 || !imageMime) {
    return res.status(400).json({ error: 'Thiếu imageBase64 hoặc imageMime' });
  }

  const apiKey = process.env.OPENAI_KEY; // ✅ Lấy từ Vercel Environment Variables
  if (!apiKey) {
    return res.status(500).json({ error: 'Server chưa cấu hình API key' });
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
        'HTTP-Referer': 'https://fashion-ai-app-six.vercel.app',
        'X-Title': 'STYLAIR'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-lite-001',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: AI_PROMPT },
              { type: 'image_url', image_url: { url: 'data:' + imageMime + ';base64,' + imageBase64 } }
            ]
          }
        ]
      })
    });

    const data = await response.json();
    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: { message: err.message } });
  }
}
