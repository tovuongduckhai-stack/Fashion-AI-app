import streamlit as st
import google.generativeai as genai
from PIL import Image

# --- CẤU HÌNH GIAO DIỆN ---
st.set_page_config(page_title="AI Fashion Strategy", page_icon="👗", layout="centered")

st.markdown("<h1 style='text-align: center; color: #FF4B4B;'>👗 AI Fashion Content Pro</h1>", unsafe_allow_html=True)
st.write("---")

# --- NHẬP CHÌA KHÓA (API KEY) ---
api_key = st.sidebar.text_input("🔑 Nhập Gemini API Key:", type="password")

if api_key:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-flash')

    # --- BƯỚC 1: UP ẢNH ---
    uploaded_file = st.file_uploader("📸 Quăng ảnh sản phẩm vào đây...", type=["jpg", "jpeg", "png"])

    if uploaded_file:
        image = Image.open(uploaded_file)
        st.image(image, caption='Sản phẩm cần lên bài', use_container_width=True)

        # --- BƯỚC 2: AI TỰ ĐỀ XUẤT CÁC HƯỚNG VIẾT BÀI (SHOW PROMPT) ---
        st.subheader("🤖 AI Đề Xuất Chiến Lược Nội Dung:")
        
        with st.spinner('AI đang nghiên cứu mẫu mã...'):
            # Câu lệnh bắt AI tự "nghĩ" ra các hướng viết bài
            prompt_goi_y = """
            Nhìn ảnh này và đưa ra 3 hướng tiếp cận Marketing khác nhau. 
            Mỗi hướng chỉ ghi 1 dòng ngắn gọn theo cấu trúc: 
            [Tên phong cách]: [Mô tả ngắn gọn hướng viết].
            Ví dụ: 
            - Phong cách Nàng thơ: Tập trung vào sự dịu dàng, bay bổng.
            - Phong cách Boss Lady: Tập trung vào sự sang trọng, quyền lực.
            """
            suggestion_res = model.generate_content([prompt_goi_y, image])
            options = suggestion_res.text.strip().split('\n')
            
        # Hiển thị các lựa chọn cho người dùng
        choice = st.radio("Ông chủ muốn viết theo hướng nào?", options)

        # --- BƯỚC 3: XUẤT BÀI VIẾT CHI TIẾT ---
        if st.button('🚀 XUẤT BÀI VIẾT NGAY'):
            with st.spinner('Đang múa bút tạo bài viết đỉnh cao...'):
                final_prompt = f"""
                Dựa trên hình ảnh sản phẩm và hướng tiếp cận: '{choice}'.
                Hãy viết một bài đăng Facebook bán hàng cực kỳ chuyên nghiệp. 
                Yêu cầu: 
                - Tiêu đề giật gân.
                - Nội dung có chiều sâu, dùng từ chuyên ngành thời trang (vibe, form, chất liệu).
                - Có lời kêu gọi hành động (CTA) và bộ Hashtag xịn.
                """
                final_res = model.generate_content([final_prompt, image])
                
                st.success("BÀI VIẾT HOÀN CHỈNH ĐÂY BRO:")
                st.markdown("---")
                st.markdown(final_res.text)
                st.balloons() # Hiệu ứng chúc mừng cho sướng mắt

else:
    st.warning("👈 Ông chủ nhập API Key bên trái để 'nạp xăng' cho AI nhé!")
    st.info("Link lấy API miễn phí: https://aistudio.google.com/app/apikey")

st.sidebar.write("---")
st.sidebar.caption("Sản phẩm của: Chuyên gia AI Fashion (Cấp độ 2)")
