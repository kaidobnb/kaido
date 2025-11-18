#!/bin/bash

# Kaido AI Prediction Markets - Cloud Init Deployment Script
# This script will be executed on the Google Cloud instance

set -e

# Configuration
DOMAIN="kaidobnb.xyz"
GITHUB_REPO="https://github.com/bitsportgaming/solymarket.git"
GITHUB_TOKEN="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"

# Log everything
exec > >(tee -a /var/log/kaido-deployment.log)
exec 2>&1

echo "🚀 Starting Kaido AI Deployment at $(date)"
echo "📍 Instance: $(hostname)"
echo "🌐 Domain: $DOMAIN"

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Node.js 18
echo "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install other dependencies
echo "📦 Installing dependencies..."
apt install -y curl wget git nginx certbot python3-certbot-nginx build-essential

# Install PM2 globally
echo "📦 Installing PM2..."
npm install -g pm2

# Install MongoDB
echo "🗄️ Installing MongoDB..."
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list
apt update
apt install -y mongodb-org

# Start and enable MongoDB
systemctl start mongod
systemctl enable mongod

# Create application user
echo "👤 Creating application user..."
useradd -m -s /bin/bash kaido || echo "User already exists"

# Switch to application user for app setup
echo "📥 Setting up application..."
sudo -u kaido bash << 'EOF'
cd /home/kaido

# Clone repository
echo "📥 Cloning repository..."
rm -rf solymarket
git clone https://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@github.com/bitsportgaming/solymarket.git

cd solymarket

# Setup backend
echo "🔧 Setting up backend..."
cd backend
npm install

# Create production .env file
cat > .env << 'ENVEOF'
PORT=5001
MONGODB_URI=mongodb://localhost:27017/kaido
JWT_SECRET=kaido_production_jwt_secret_2024_secure_key_change_this
NODE_ENV=production

# BNB Smart Chain Configuration (Mainnet)
BNB_RPC_URL=https://bsc-dataseed1.binance.org/
BNB_NETWORK=mainnet
BNB_CHAIN_ID=56

# Admin Configuration
ADMIN_WALLET_ADDRESS=0xac01Ee787F54FB1A2D8a08bA597c4b0a75Da83eb
ADMIN_PRIVATE_KEY=813e665d742f54015fb0a5bc0f7a459fab06cc63ae758516bffb16d0afb9cdd6

# Crypto API Keys
CRYPTOCOMPARE_API_KEY=119743999dc3511671942642b60722bb47ad36e7ac25bfff5fc532e0cf68d270
COINGECKO_API_KEY=
COINMARKETCAP_API_KEY=2b240803-0390-49bd-8c4f-5f77c8c5016c
DEFAULT_CRYPTO_API_PROVIDER=cryptocompare
ENVEOF

# Setup frontend
echo "🎨 Setting up frontend..."
cd ../project
npm install

# Create production .env file
cat > .env << 'ENVEOF'
VITE_API_URL=https://kaidobnb.xyz/api
VITE_APP_NAME=Kaido AI
VITE_BNB_CHAIN_ID=56
VITE_BNB_RPC_URL=https://bsc-dataseed1.binance.org/
ENVEOF

# Build frontend
npm run build

# Create PM2 ecosystem file
cd /home/kaido/solymarket
cat > ecosystem.config.js << 'ECOEOF'
module.exports = {
  apps: [
    {
      name: 'kaido-backend',
      script: './backend/src/index.ts',
      interpreter: 'node',
      interpreter_args: '--loader ts-node/esm',
      cwd: './backend',
      env: {
        NODE_ENV: 'production',
        PORT: 5001
      },
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true
    }
  ]
};
ECOEOF

# Create logs directory
mkdir -p logs

EOF

# Install TypeScript and ts-node globally
echo "📦 Installing TypeScript globally..."
npm install -g typescript ts-node

# Configure Nginx
echo "🌐 Configuring Nginx..."
cat > /etc/nginx/sites-available/$DOMAIN << 'NGINXEOF'
server {
    listen 80;
    server_name kaidobnb.xyz www.kaidobnb.xyz;

    # Serve frontend static files
    location / {
        root /home/kaido/solymarket/project/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
}
NGINXEOF

# Enable the site
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Start Nginx
systemctl start nginx
systemctl enable nginx

# Start the application with PM2 as kaido user
echo "🚀 Starting application..."
sudo -u kaido bash << 'EOF'
cd /home/kaido/solymarket

# Start backend with PM2
pm2 start ecosystem.config.js
pm2 save

# Enable auto-predictions and create initial predictions
cd backend
npx ts-node src/scripts/enableAutoPredictions.ts || echo "Auto-prediction setup will be done later"

EOF

# Setup PM2 startup script
sudo -u kaido pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u kaido --hp /home/kaido

echo "✅ Deployment completed successfully!"
echo "🌐 Application should be accessible at: http://$DOMAIN"
echo "📊 Backend API: http://$DOMAIN/api"
echo ""
echo "Next steps:"
echo "1. Point your domain $DOMAIN to this server's IP"
echo "2. Set up SSL with: certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo ""
echo "Logs location: /var/log/kaido-deployment.log"
echo "Application logs: /home/kaido/solymarket/logs/"

# Create a status check script
cat > /home/kaido/check-status.sh << 'EOF'
#!/bin/bash
echo "=== Kaido AI Status Check ==="
echo "Date: $(date)"
echo ""
echo "=== PM2 Status ==="
sudo -u kaido pm2 status
echo ""
echo "=== Nginx Status ==="
systemctl status nginx --no-pager
echo ""
echo "=== MongoDB Status ==="
systemctl status mongod --no-pager
echo ""
echo "=== Application Logs (last 20 lines) ==="
sudo -u kaido tail -20 /home/kaido/solymarket/logs/backend-combined.log
EOF

chmod +x /home/kaido/check-status.sh

echo "🎉 Deployment script completed at $(date)"
echo "📋 Run '/home/kaido/check-status.sh' to check application status"
