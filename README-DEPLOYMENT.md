# 🚀 Admin Panel Deployment Guide

## Production Deployment Options

### Option 1: PM2 (Recommended for VPS/Server)

#### Prerequisites:
- Node.js 18+ installed
- Git installed
- Domain name (optional)

#### Steps:

1. **Clone/Upload your project to server:**
```bash
git clone your-repo-url
cd admin-panel
```

2. **Install PM2 globally:**
```bash
npm install -g pm2
```

3. **Run deployment script:**
```bash
# For Linux/Mac
./deploy.sh

# For Windows
deploy.bat
```

4. **Your server will be running on:**
- `http://your-server-ip:5000`
- `http://your-domain.com:5000` (if domain configured)

### Option 2: Docker (Recommended for Cloud)

#### Prerequisites:
- Docker installed
- Docker Compose installed

#### Steps:

1. **Build and run with Docker:**
```bash
docker-compose up -d
```

2. **Your server will be running on:**
- `http://localhost:5000`

### Option 3: Manual Deployment

#### Steps:

1. **Install dependencies:**
```bash
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
```

2. **Build client:**
```bash
cd client && npm run build && cd ..
```

3. **Start server:**
```bash
cd server && NODE_ENV=production npm start
```

## 🌐 Domain Configuration

### For Custom Domain:

1. **Point your domain to server IP**
2. **Configure reverse proxy (Nginx):**

```nginx
server {
    listen 80;
    server_name your-domain.com;

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

## 📊 Monitoring & Management

### PM2 Commands:
```bash
pm2 monit          # Monitor dashboard
pm2 logs           # View logs
pm2 restart all    # Restart all apps
pm2 stop all       # Stop all apps
pm2 delete all     # Delete all apps
```

### Docker Commands:
```bash
docker-compose logs -f    # View logs
docker-compose restart   # Restart services
docker-compose down      # Stop services
```

## 🔒 Security Considerations

1. **Change JWT_SECRET** in production
2. **Use HTTPS** with SSL certificate
3. **Configure firewall** to allow only port 80/443
4. **Regular backups** of database
5. **Update dependencies** regularly

## 🌍 Popular Hosting Options

### Free Options:
- **Vercel** (for frontend)
- **Railway** (full-stack)
- **Render** (full-stack)
- **Heroku** (with credit card)

### Paid Options:
- **DigitalOcean** ($5/month)
- **AWS EC2** (pay-as-you-go)
- **Google Cloud** (free tier available)
- **Azure** (free tier available)

## 📱 API Endpoints (Production)

Your APIs will be available at:
- `https://your-domain.com/api/content/simple`
- `https://your-domain.com/api/content/simple/en`
- `https://your-domain.com/api/content/simple/hi`
- `https://your-domain.com/api/content/simple/ur`

## 🆘 Troubleshooting

### Common Issues:

1. **Port already in use:**
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

2. **Permission denied:**
```bash
chmod +x deploy.sh
```

3. **PM2 not found:**
```bash
npm install -g pm2
```

4. **Database not found:**
- Check if `server/database/admin.db` exists
- Run the server once to create database

## 📞 Support

If you face any issues, check:
1. Server logs: `pm2 logs admin-panel-api`
2. Port availability: `netstat -tulpn | grep :5000`
3. Node.js version: `node --version`
4. PM2 status: `pm2 status`


