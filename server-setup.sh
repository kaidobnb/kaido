#!/bin/bash

# Kaido AI - Server Setup Script
# Run this script directly on the server after SSH'ing in

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="kaidobnb.xyz"
GITHUB_REPO="https://github.com/bitsportgaming/solymarket.git"
GITHUB_TOKEN="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"
APP_DIR="/home/ubuntu/solymarket"

# Function to print colored messages
print_message() {
    echo -e "${GREEN}==>${NC} $1"
}

print_error() {
    echo -e "${RED}ERROR:${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}WARNING:${NC} $1"
}

print_message "🚀 Starting Kaido AI Server Setup"
print_message "🌐 Domain: $DOMAIN"
echo ""

# Step 1: Update system
print_message "Step 1: Updating system packages..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential

# Step 2: Install Node.js 18
print_message "Step 2: Installing Node.js 18..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
fi
print_message "Node.js version: $(node --version)"
print_message "npm version: $(npm --version)"

# Step 3: Install MongoDB
print_message "Step 3: Installing MongoDB..."
if ! command -v mongod &> /dev/null; then
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg --dearmor -o /usr/share/keyrings/mongodb-server-7.0.gpg
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    sudo apt update
    sudo apt install -y mongodb-org
    sudo systemctl start mongod
    sudo systemctl enable mongod
fi
print_message "MongoDB status:"
sudo systemctl status mongod --no-pager | head -n 5

# Step 4: Install Nginx
print_message "Step 4: Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
fi
print_message "Nginx status:"
sudo systemctl status nginx --no-pager | head -n 5

# Step 5: Install PM2
print_message "Step 5: Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi
print_message "PM2 version: $(pm2 --version)"

# Step 6: Install TypeScript and ts-node globally
print_message "Step 6: Installing TypeScript and ts-node..."
sudo npm install -g typescript ts-node

# Step 7: Clone repository
print_message "Step 7: Cloning repository..."
cd /home/ubuntu
rm -rf solymarket
git clone https://$GITHUB_TOKEN@github.com/bitsportgaming/solymarket.git
cd solymarket
print_message "Repository cloned successfully"

# Step 8: Setup backend
print_message "Step 8: Setting up backend..."
cd $APP_DIR/backend
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

# Crypto API Keys
CRYPTOCOMPARE_API_KEY=119743999dc3511671942642b60722bb47ad36e7ac25bfff5fc532e0cf68d270
COINGECKO_API_KEY=
COINMARKETCAP_API_KEY=2b240803-0390-49bd-8c4f-5f77c8c5016c
DEFAULT_CRYPTO_API_PROVIDER=cryptocompare

# Sports API Keys
SPORTRADAR_API_KEY=your_sportradar_api_key_here
FOOTBALL_DATA_API_KEY=your_football_data_api_key_here
EOF

print_message "Building backend..."
npm run build

# Step 9: Setup frontend
print_message "Step 9: Setting up frontend..."
cd $APP_DIR/project
npm install

# Create production .env file
cat > .env << EOF
VITE_API_URL=https://$DOMAIN/api
VITE_APP_NAME=Kaido AI
VITE_BNB_CHAIN_ID=56
VITE_BNB_RPC_URL=https://bsc-dataseed1.binance.org/
EOF

print_message "Building frontend..."
npm run build

# Step 10: Create PM2 ecosystem file
print_message "Step 10: Creating PM2 ecosystem configuration..."
cd $APP_DIR
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'kaido-backend',
      script: './backend/dist/index.js',
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

# Step 11: Configure Nginx
print_message "Step 11: Configuring Nginx..."
sudo tee /etc/nginx/sites-available/$DOMAIN > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    # Frontend - serve static files
    location / {
        root $APP_DIR/project/dist;
        try_files \$uri \$uri/ /index.html;
        add_header Cache-Control 'no-cache, must-revalidate, proxy-revalidate, max-age=0';
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # WebSocket support
    location /socket.io {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
print_message "Testing Nginx configuration..."
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Step 12: Install and configure SSL with Certbot
print_message "Step 12: Installing SSL certificate..."
sudo apt install -y certbot python3-certbot-nginx
print_warning "About to request SSL certificate. Make sure your domain DNS is pointing to this server!"
read -p "Press Enter to continue or Ctrl+C to cancel..."
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN --redirect || print_warning "SSL setup failed. You can run 'sudo certbot --nginx -d $DOMAIN' manually later."

# Step 13: Start application with PM2
print_message "Step 13: Starting application with PM2..."
cd $APP_DIR
pm2 delete all || true
pm2 start ecosystem.config.js
pm2 save

# Setup PM2 startup script
print_message "Setting up PM2 to start on boot..."
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu

# Step 14: Seed initial data
print_message "Step 14: Seeding initial data..."
cd $APP_DIR/backend
npx ts-node src/scripts/enableAutoPredictions.ts || print_warning "Auto-prediction setup will be done later"

print_message "✅ Server setup completed successfully!"
echo ""
print_message "🌐 Your application should now be accessible at:"
print_message "   https://$DOMAIN"
echo ""
print_message "📊 To check application status:"
print_message "   pm2 status"
echo ""
print_message "📝 To view logs:"
print_message "   pm2 logs kaido-backend"
echo ""
print_message "🔄 To restart the application:"
print_message "   pm2 restart kaido-backend"
echo ""
print_message "🔧 Useful commands:"
print_message "   pm2 monit          - Monitor processes"
print_message "   pm2 logs           - View all logs"
print_message "   pm2 restart all    - Restart all processes"
print_message "   pm2 stop all       - Stop all processes"

