import streamlit as st
import google.generativeai as genai
from PIL import Image

# Cấu hình trang
st.set_page_config(page_title="AI Fashion Pro", page_icon="👗")

st.title("👗 Hệ Thống AI Content Thời Trang")
st.subheader("Giải pháp thông minh cho chủ Shop")

# Nhập API Key
api_key = st.sidebar.text_input("Nhập Gemini API Key của bạn:", type="password")

if api_key:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-flash')

    uploaded_file = st.file_uploader("Chọn ảnh sản phẩm...", type=["jpg", "jpeg", "png"])

    if uploaded_file is not None:
        image = Image.open(uploaded_file)
        st.image(image, caption='Ảnh đã tải lên', use_container_width=True)

        if st.button('Tạo Content Bán Hàng'):
            with st.spinner('AI đang phân tích mẫu mã...'):
                prompt = "Bạn là chuyên gia marketing thời trang. Hãy viết bài bán hàng thu hút cho sản phẩm này."
                response = model.generate_content([prompt, image])
                st.success("Xong rồi!")
                st.markdown(response.text)
else:
    st.info("Vui lòng nhập API Key ở thanh bên trái để bắt đầu.")