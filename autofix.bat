@echo off
cd C:\Users\Dell\Fashion-AI-app
echo Dang fix vercel.json...
(
echo {
echo   "version": 2,
echo   "builds": [
echo     { "src": "api/*.js", "use": "@vercel/node" },
echo     { "src": "index.html", "use": "@vercel/static" }
echo   ],
echo   "routes": [
echo     { "src": "/api/sepay-webhook", "dest": "/api/sepay-webhook.js" },
echo     { "src": "/api/analyze", "dest": "/api/analyze.js" },
echo     { "src": "/(.*)", "dest": "/index.html" }
echo   ]
echo }
) > vercel.json
echo Dang push len GitHub...
git add .
git commit -m "fix: sepay route"
git push
echo Hoan thanh! Cho Vercel deploy 1 phut...
timeout /t 60
echo Dang test webhook...
curl -v -X POST https://fashion-ai-app-six.vercel.app/api/sepay-webhook -H "Content-Type: application/json" -d "{\"id\":\"test999\",\"transferAmount\":15000,\"content\":\"STYQEQJY\"}"
pause