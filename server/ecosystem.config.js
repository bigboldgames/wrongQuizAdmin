module.exports = {
  apps: [{
    name: 'admin-panel-api',
    script: 'index.js',
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
