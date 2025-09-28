@echo off
echo 🚀 Deploying Admin Panel to Production...

REM Install PM2 globally if not installed
where pm2 >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Installing PM2...
    npm install -g pm2
)

REM Install dependencies
echo 📦 Installing dependencies...
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..

REM Build client for production
echo 🏗️ Building client for production...
cd client && npm run build && cd ..

REM Start server with PM2
echo 🔄 Starting server with PM2...
cd server && pm2 start ecosystem.config.js --env production

REM Save PM2 configuration
pm2 save
pm2 startup

echo ✅ Deployment completed!
echo 🌐 Server is running on: http://your-domain.com:5000
echo 📊 Monitor with: pm2 monit
echo 📝 Logs: pm2 logs admin-panel-api
pause


