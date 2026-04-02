import re 
content = open('C:/Users/Dell/Fashion-AI-app/api/casso-webhook.js', encoding='utf-8').read() 
old = "let userCode = codeMatch[0];" 
new_code = "const rawCode = codeMatch[0].replace(/-/g, ''); const userCode = rawCode.slice(0, 3) + '-' + rawCode.slice(3);" 
result = content.replace(old, new_code) 
open('C:/Users/Dell/Fashion-AI-app/api/casso-webhook.js', 'w', encoding='utf-8').write(result) 
print('XONG!' if 'rawCode' in result else 'KHONG TIM THAY!') 
