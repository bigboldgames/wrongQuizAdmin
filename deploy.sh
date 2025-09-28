#!/bin/bash

echo "🚀 Deploying Admin Panel to Production..."

# Install PM2 globally if not installed
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..

# Build client for production
echo "🏗️ Building client for production..."
cd client && npm run build && cd ..

# Start server with PM2
echo "🔄 Starting server with PM2..."
cd server && pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save
pm2 startup

echo "✅ Deployment completed!"
echo "🌐 Server is running on: http://your-domain.com:5000"
echo "📊 Monitor with: pm2 monit"
echo "📝 Logs: pm2 logs admin-panel-api"


