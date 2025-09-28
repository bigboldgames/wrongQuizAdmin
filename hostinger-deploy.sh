#!/bin/bash

echo "🚀 Hostinger VPS Deployment Script"
echo "=================================="

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
echo "🔧 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install Git (if not already installed)
echo "📦 Installing Git..."
sudo apt install git -y

# Create project directory
echo "📁 Creating project directory..."
sudo mkdir -p /var/www/admin-panel
sudo chown -R $USER:$USER /var/www/admin-panel
cd /var/www/admin-panel

# Clone your repository
echo "📥 Cloning repository..."
git clone https://github.com/your-username/your-repo.git .

# Install dependencies
echo "📦 Installing dependencies..."
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..

# Build client for production
echo "🏗️ Building client for production..."
cd client && npm run build && cd ..

# Create PM2 ecosystem file
echo "⚙️ Creating PM2 configuration..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'admin-panel-api',
    script: 'server/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000,
      JWT_SECRET: 'your-super-secret-jwt-key-for-production-2024'
    }
  }]
};
EOF

# Start application with PM2
echo "🔄 Starting application with PM2..."
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup

# Install and configure Nginx
echo "🌐 Installing and configuring Nginx..."
sudo apt install nginx -y

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/admin-panel << 'EOF'
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable the site
sudo ln -s /etc/nginx/sites-available/admin-panel /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

echo "✅ Deployment completed successfully!"
echo "🌐 Your application is now running at: http://your-domain.com"
echo "📊 Monitor with: pm2 monit"
echo "📝 View logs: pm2 logs admin-panel-api"


