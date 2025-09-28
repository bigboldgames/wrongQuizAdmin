# 🚀 Hostinger VPS Deployment Guide

## Prerequisites
- Hostinger VPS with Ubuntu/Debian
- Domain name pointed to your VPS IP
- Git repository with your code

## Step-by-Step Deployment

### 1. Connect to VPS
```bash
ssh root@your-vps-ip
# or
ssh username@your-vps-ip
```

### 2. Run Deployment Script
```bash
# Download and run the deployment script
wget https://raw.githubusercontent.com/your-username/your-repo/main/hostinger-deploy.sh
chmod +x hostinger-deploy.sh
./hostinger-deploy.sh
```

### 3. Manual Setup (Alternative)

#### Install Node.js 18
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Install PM2
```bash
sudo npm install -g pm2
```

#### Clone Repository
```bash
cd /var/www
sudo mkdir admin-panel
sudo chown -R $USER:$USER admin-panel
cd admin-panel
git clone https://github.com/your-username/your-repo.git .
```

#### Install Dependencies
```bash
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
```

#### Build Client
```bash
cd client && npm run build && cd ..
```

#### Start with PM2
```bash
cd server
pm2 start index.js --name "admin-panel-api" --env production
pm2 save
pm2 startup
```

### 4. Configure Nginx

#### Install Nginx
```bash
sudo apt install nginx -y
```

#### Create Site Configuration
```bash
sudo nano /etc/nginx/sites-available/admin-panel
```

Add this configuration:
```nginx
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
```

#### Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/admin-panel /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. Configure Firewall
```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable
```

### 6. SSL Certificate (Optional but Recommended)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

## Management Commands

### PM2 Commands
```bash
pm2 monit                    # Monitor dashboard
pm2 logs admin-panel-api     # View logs
pm2 restart admin-panel-api  # Restart app
pm2 stop admin-panel-api     # Stop app
pm2 delete admin-panel-api   # Delete app
```

### Nginx Commands
```bash
sudo systemctl status nginx  # Check status
sudo systemctl restart nginx # Restart nginx
sudo nginx -t                # Test configuration
```

### Update Application
```bash
cd /var/www/admin-panel
git pull origin main
cd client && npm run build && cd ..
pm2 restart admin-panel-api
```

## Troubleshooting

### Check if services are running
```bash
pm2 status
sudo systemctl status nginx
```

### Check logs
```bash
pm2 logs admin-panel-api
sudo tail -f /var/log/nginx/error.log
```

### Check port usage
```bash
sudo netstat -tulpn | grep :5000
sudo netstat -tulpn | grep :80
```

### Test API endpoints
```bash
curl http://localhost:5000/api/health
curl http://your-domain.com/api/health
```

## Environment Variables

Create `.env` file in server directory:
```bash
cd /var/www/admin-panel/server
nano .env
```

Add:
```
NODE_ENV=production
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-for-production-2024
```

## Backup Database
```bash
cp /var/www/admin-panel/server/database/admin.db /var/www/admin-panel/server/database/admin.db.backup
```

## Security Tips
1. Change default SSH port
2. Use SSH keys instead of passwords
3. Keep system updated
4. Use strong JWT secret
5. Enable fail2ban
6. Regular backups


