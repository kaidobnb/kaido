#!/bin/bash

# Kaido AI Prediction Markets - Google Cloud Deployment Script
# Instance: instace2 (35.192.15.69)
# Domain: https://kaidobnb.xyz

set -e

# Configuration
INSTANCE_NAME="instace2"
ZONE="us-central1-c"
PROJECT_ID="spry-sequence-466613-n3"
DOMAIN="kaidobnb.xyz"
GITHUB_REPO="https://github.com/bitsportgaming/solymarket.git"
GITHUB_TOKEN="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"

echo "🚀 Starting deployment to Google Cloud instance: $INSTANCE_NAME"
echo "📍 IP Address: 35.192.15.69"
echo "🌐 Domain: https://$DOMAIN"
echo ""

# Function to run commands on the remote instance
run_remote() {
    gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command="$1"
}

# Function to copy files to the remote instance
copy_to_remote() {
    gcloud compute scp "$1" $INSTANCE_NAME:~/"$2" --zone=$ZONE
}

echo "📦 Step 1: Updating system and installing dependencies..."
run_remote "
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
"

echo "🗄️ Step 2: Installing and configuring MongoDB..."
run_remote "
# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo 'deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse' | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
"

echo "📥 Step 3: Cloning repository..."
run_remote "
# Remove existing directory if it exists
rm -rf solymarket

# Clone the repository with authentication
git clone https://$GITHUB_TOKEN@github.com/bitsportgaming/solymarket.git
cd solymarket
"

echo "🔧 Step 4: Setting up backend environment..."
run_remote "
cd solymarket/backend
npm install

# Create production .env file
cat > .env << 'EOF'
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

# Crypto API Keys (for price data)
CRYPTOCOMPARE_API_KEY=119743999dc3511671942642b60722bb47ad36e7ac25bfff5fc532e0cf68d270
COINGECKO_API_KEY=
COINMARKETCAP_API_KEY=2b240803-0390-49bd-8c4f-5f77c8c5016c

# Default API Provider
DEFAULT_CRYPTO_API_PROVIDER=cryptocompare
EOF

# Build backend
npm run build || echo 'No build script found, continuing...'
"

echo "🎨 Step 5: Setting up frontend environment..."
run_remote "
cd solymarket/project
npm install

# Create production .env file
cat > .env << 'EOF'
VITE_API_URL=https://$DOMAIN/api
VITE_APP_NAME=Kaido AI
VITE_BNB_CHAIN_ID=56
VITE_BNB_RPC_URL=https://bsc-dataseed1.binance.org/
EOF

# Build frontend
npm run build
"

echo "🔄 Step 6: Setting up PM2 processes..."
run_remote "
cd solymarket

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
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
EOF

# Create logs directory
mkdir -p logs

# Install ts-node globally for PM2
sudo npm install -g ts-node typescript

# Start backend with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
"

echo "🌐 Step 7: Configuring Nginx..."
run_remote "
# Create Nginx configuration
sudo tee /etc/nginx/sites-available/$DOMAIN << 'EOF'
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;

    # SSL Configuration (will be updated by certbot)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection \"1; mode=block\";
    add_header Strict-Transport-Security \"max-age=31536000; includeSubDomains\" always;

    # Serve frontend static files
    location / {
        root /home/\$USER/solymarket/project/dist;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control \"public, immutable\";
        }
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # WebSocket support for development
    location /socket.io/ {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \"upgrade\";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
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
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t
"

echo "🔒 Step 8: Setting up SSL with Let's Encrypt..."
run_remote "
# Stop Nginx temporarily for certbot
sudo systemctl stop nginx

# Get SSL certificate
sudo certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Set up auto-renewal
sudo crontab -l | { cat; echo '0 12 * * * /usr/bin/certbot renew --quiet'; } | sudo crontab -
"

echo "🎯 Step 9: Final setup and verification..."
run_remote "
cd solymarket/backend

# Enable auto-predictions and create initial predictions
npx ts-node src/scripts/enableAutoPredictions.ts

# Check PM2 status
pm2 status

# Check Nginx status
sudo systemctl status nginx --no-pager

echo '✅ Deployment completed successfully!'
echo '🌐 Your application is now live at: https://$DOMAIN'
echo '📊 Backend API: https://$DOMAIN/api'
echo '🤖 Auto-predictions: Enabled'
echo ''
echo 'PM2 Commands:'
echo '  pm2 status          - Check process status'
echo '  pm2 logs            - View logs'
echo '  pm2 restart all     - Restart all processes'
echo '  pm2 stop all        - Stop all processes'
echo ''
echo 'Nginx Commands:'
echo '  sudo systemctl status nginx    - Check Nginx status'
echo '  sudo systemctl reload nginx    - Reload Nginx config'
echo '  sudo nginx -t                  - Test Nginx config'
"

echo ""
echo "🎉 Deployment script completed!"
echo "📍 Instance IP: 35.192.15.69"
echo "🌐 Domain: https://$DOMAIN"
echo "⚡ Your Kaido AI Prediction Markets platform is now live!"
