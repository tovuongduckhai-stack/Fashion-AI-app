import streamlit as st
import google.generativeai as genai
from PIL import Image

# 1. Cấu hình giao diện (Cực kỳ quan trọng để ghi điểm chuyên nghiệp)
st.set_page_config(
    page_title="AI Fashion Content Pro 2026",
    page_icon="👗",
    layout="centered"
)

# Giao diện chính
st.title("👗 AI Fashion Content Generator")
st.markdown("---")
st.subheader("Trợ lý ảo tạo bài viết bán hàng thông minh")

# 2. Thanh bên (Sidebar) để nhập API Key - Bảo mật và gọn gàng
with st.sidebar:
    st.header("Cấu hình hệ thống")
    api_key = st.text_input("Nhập Gemini API Key:", type="password", help="Lấy key tại Google AI Studio")
    st.info("Ứng dụng sử dụng mô hình Gemini 1.5 Flash để tối ưu tốc độ và độ chính xác.")

# 3. Logic xử lý chính
if api_key:
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-pro')
        
        # Ô tải ảnh lên
        uploaded_file = st.file_uploader("Tải ảnh sản phẩm thời trang lên đây...", type=["jpg", "jpeg", "png"])

        if uploaded_file is not None:
            image = Image.open(uploaded_file)
            st.image(image, caption='Sản phẩm của bạn', use_container_width=True)
            
            # Nút bấm kích hoạt AI
            if st.button('✨ Tạo Content Ngay', use_container_width=True):
                with st.spinner('Đang phân tích mẫu mã và xu hướng thời trang...'):
                    # Prompt "xịn" để ra bài viết chất lượng
                    prompt = """
                    Bạn là một chuyên gia Content Marketing hàng đầu trong ngành thời trang. 
                    Dựa trên hình ảnh này, hãy viết một bài đăng Facebook thu hút khách hàng bao gồm:
                    1. Tiêu đề gây chú ý.
                    2. Mô tả chi tiết về kiểu dáng, chất liệu (dự đoán).
                    3. Gợi ý phối đồ (mix & match).
                    4. Các hashtag hot trend năm 2026.
                    Giọng văn: Sang chảnh, hiện đại, thuyết phục.
                    """
                    response = model.generate_content([prompt, image])
                    
                    st.success("Đã tạo xong content!")
                    st.markdown("### Kết quả gợi ý:")
                    st.write(response.text)
                    st.divider()
                    st.caption("Mẹo: Bạn có thể copy nội dung này để đăng lên Fanpage hoặc Shopee.")
    except Exception as e:
        st.error(f"Có lỗi xảy ra: {e}")
else:
    st.warning("⚠️ Vui lòng nhập API Key ở thanh bên trái để bắt đầu sử dụng ứng dụng.")