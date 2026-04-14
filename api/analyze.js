const AI_PROMPT = `You are a professional fashion marketing expert for global e-commerce. Analyze this clothing product image and return ONLY a valid JSON object. No markdown, no explanation, no text outside JSON. Use double quotes only. Do not use special characters inside string values.
Return this exact JSON structure:
{"product_name":"catchy product name in English","short_caption":"one punchy caption sentence","detailed_description":"3-4 sentences about material style and fit","hashtags":["#fashion","#ootd","#style","#outfit","#fyp","#fashionista"],"size_chart":[{"size":"S","waist":"24-25in","hips":"34-35in","length":"38in"},{"size":"M","waist":"26-27in","hips":"36-37in","length":"39in"},{"size":"L","waist":"28-29in","hips":"38-39in","length":"40in"},{"size":"XL","waist":"30-32in","hips":"40-42in","length":"41in"}],"video_script":"Scene 1: describe opening shot. Text: hook line. Scene 2: describe mid shot. Text: key selling point. Scene 3: closing shot. Text: call to action","suggested_price":"$25 - $65 USD","color":"main color of product","material":"predicted fabric material","selling_points":["Selling point 1","Selling point 2","Selling point 3"]}`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { imageBase64, imageMime } = req.body;
  if (!imageBase64 || !imageMime) {
    return res.status(400).json({ error: 'Missing imageBase64 or imageMime' });
  }

  const apiKey = process.env.OPENAI_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
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
