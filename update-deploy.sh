#!/bin/bash

echo "🔄 Updating Admin Panel on Hostinger VPS"
echo "========================================"

# Navigate to project directory
cd /var/www/admin-panel

# Pull latest changes from Git
echo "📥 Pulling latest changes from Git..."
git pull origin main

# Install/update dependencies
echo "📦 Installing/updating dependencies..."
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..

# Build client for production
echo "🏗️ Building client for production..."
cd client && npm run build && cd ..

# Restart PM2 application
echo "🔄 Restarting PM2 application..."
pm2 restart admin-panel-api

echo "✅ Update completed successfully!"
echo "🌐 Your application is now updated and running"
echo "📊 Check status: pm2 status"
echo "📝 View logs: pm2 logs admin-panel-api"


