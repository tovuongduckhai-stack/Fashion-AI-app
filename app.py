import streamlit as st
import google.generativeai as genai
import requests
from PIL import Image

st.title("🚀 Hệ thống AI Agent Đa Năng")

# --- KÉT SẮT BẢO MẬT ---
# Sau này ông dán mã vào mục Secrets của Streamlit nhé, giờ để test thì nhập tạm ở đây
gemini_key = st.sidebar.text_input("Nhập Gemini Key mới:", type="password")
deepseek_key = st.sidebar.text_input("Nhập DeepSeek Key mới:", type="password")

if gemini_key and deepseek_key:
    up_anh = st.file_uploader("📸 Up ảnh sản phẩm cần bán", type=["jpg", "png"])
    
    if up_anh:
        img = Image.open(up_anh)
        st.image(img, width=300)
        
        if st.button("KÍCH HOẠT ĐỘI NGŨ AGENT"):
            # 1. Gọi Gemini soi ảnh
            genai.configure(api_key=gemini_key)
            model_gemini = genai.GenerativeModel('gemini-1.5-flash')
            mo_ta = model_gemini.generate_content(["Mô tả màu sắc, kiểu dáng, chất liệu món này để viết bài bán hàng.", img]).text
            st.write("🕵️ **Agent Soi Ảnh:** " + mo_ta)

            # 2. Gọi DeepSeek viết bài
            headers = {"Authorization": f"Bearer {deepseek_key}", "Content-Type": "application/json"}
            payload = {
                "model": "deepseek-chat",
                "messages": [
                    {"role": "system", "content": "Bạn là chuyên gia marketing thời trang Việt Nam."},
                    {"role": "user", "content": f"Dựa trên mô tả: {mo_ta}, hãy viết bài chốt đơn cực cháy!"}
                ]
            }
            res = requests.post("https://api.deepseek.com/chat/completions", json=payload, headers=headers)
            bai_viet = res.json()['choices'][0]['message']['content']
            
            st.success("📝 **BÀI VIẾT TỪ AGENT MARKETING:**")
            st.write(bai_viet)
            
