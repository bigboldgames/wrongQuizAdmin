#!/bin/bash

# Hostinger VPS Deployment Script
echo "🚀 Starting Hostinger VPS Deployment..."

# Update system
echo "📦 Updating system..."
apt update && apt upgrade -y

# Install Node.js
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install PM2
echo "📦 Installing PM2..."
npm install -g pm2

# Install Git
echo "📦 Installing Git..."
apt install git -y

# Install Nginx
echo "📦 Installing Nginx..."
apt install nginx -y

# Setup Firewall
echo "🔥 Setting up firewall..."
ufw allow 22
ufw allow 80
ufw allow 443
ufw allow 5003
ufw allow 3003
ufw --force enable

# Create project directory
echo "📁 Creating project directory..."
mkdir -p /var/www
cd /var/www

# Clone repository (replace with your actual repo URL)
echo "📥 Cloning repository..."
git clone https://github.com/yourusername/your-repo.git
cd your-repo

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm install

# Install client dependencies and build
echo "📦 Installing client dependencies and building..."
cd ../client
npm install
npm run build

# Start with PM2
echo "🚀 Starting application with PM2..."
cd /var/www/your-repo
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Setup Nginx
echo "🌐 Setting up Nginx..."
cp nginx-config.conf /etc/nginx/sites-available/wrongquizadmin
ln -s /etc/nginx/sites-available/wrongquizadmin /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

echo "✅ Deployment completed successfully!"
echo "🌐 Your app should be available at: http://wrongquizadmin.greatinternetwisdom.com"
echo "📊 Check PM2 status: pm2 status"
echo "📝 Check logs: pm2 logs"
