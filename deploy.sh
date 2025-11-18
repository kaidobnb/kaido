#!/bin/bash

# SolyMarket Deployment Script
# This script deploys the SolyMarket application to solymarket.ai

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
SERVER_IP="146.190.153.61"
SERVER_USER="root"
SERVER_PASSWORD="tapTap123@a"
GITHUB_REPO="https://github.com/charlesgpt/solymarket.git"
GITHUB_TOKEN="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"
DOMAIN="solymarket.ai"
APP_DIR="/var/www/solymarket"
BRANCH="main"

# Check if sshpass is installed
if ! command -v sshpass &> /dev/null; then
    echo -e "${YELLOW}sshpass is not installed. Installing...${NC}"
    sudo apt-get update
    sudo apt-get install -y sshpass
fi

echo -e "${GREEN}=== Starting deployment to $DOMAIN ===${NC}"

# Function to run commands on the remote server
run_ssh_command() {
    sshpass -p "$SERVER_PASSWORD" ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "$1"
}

# 1. Connect to the server and install dependencies if needed
echo -e "${GREEN}=== Checking and installing dependencies on the server ===${NC}"
run_ssh_command "
    # Update package lists
    apt-get update

    # Install Node.js and npm if not already installed
    if ! command -v node &> /dev/null; then
        echo 'Installing Node.js and npm...'
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt-get install -y nodejs
    fi

    # Install Git if not already installed
    if ! command -v git &> /dev/null; then
        echo 'Installing Git...'
        apt-get install -y git
    fi

    # Install Nginx if not already installed
    if ! command -v nginx &> /dev/null; then
        echo 'Installing Nginx...'
        apt-get install -y nginx
    fi

    # Install PM2 if not already installed
    if ! command -v pm2 &> /dev/null; then
        echo 'Installing PM2...'
        npm install -g pm2
    fi

    # Install Certbot for SSL
    if ! command -v certbot &> /dev/null; then
        echo 'Installing Certbot...'
        apt-get install -y certbot python3-certbot-nginx
    fi
"

# 2. Set up the application directory
echo -e "${GREEN}=== Setting up application directory ===${NC}"
run_ssh_command "
    # Create app directory if it doesn't exist
    mkdir -p $APP_DIR

    # Set proper permissions
    chown -R $SERVER_USER:$SERVER_USER $APP_DIR
"

# 3. Clone or update the repository
echo -e "${GREEN}=== Cloning/updating repository ===${NC}"
run_ssh_command "
    if [ -d \"$APP_DIR/.git\" ]; then
        echo 'Repository exists, updating...'
        cd $APP_DIR
        git fetch
        git reset --hard origin/$BRANCH
    else
        echo 'Cloning repository...'
        git clone https://$GITHUB_TOKEN@github.com/charlesgpt/solymarket.git $APP_DIR
        cd $APP_DIR
        git checkout $BRANCH
    fi
"

# 4. Install dependencies and build the application
echo -e "${GREEN}=== Installing dependencies and building the application ===${NC}"
run_ssh_command "
    cd $APP_DIR
    
    # Install dependencies
    echo 'Installing dependencies...'
    npm install
    
    # Build the application
    echo 'Building the application...'
    npm run build
"

# 5. Configure Nginx
echo -e "${GREEN}=== Configuring Nginx ===${NC}"
run_ssh_command "
    # Create Nginx configuration file
    cat > /etc/nginx/sites-available/$DOMAIN << 'EOL'
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL

    # Enable the site
    ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
    
    # Test Nginx configuration
    nginx -t
    
    # Reload Nginx
    systemctl reload nginx
"

# 6. Set up SSL with Certbot
echo -e "${GREEN}=== Setting up SSL with Certbot ===${NC}"
run_ssh_command "
    # Obtain SSL certificate
    certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
"

# 7. Configure PM2 to run the application
echo -e "${GREEN}=== Configuring PM2 ===${NC}"
run_ssh_command "
    cd $APP_DIR
    
    # Start or restart the application with PM2
    if pm2 list | grep -q 'solymarket'; then
        echo 'Restarting application with PM2...'
        pm2 restart solymarket
    else
        echo 'Starting application with PM2...'
        pm2 start npm --name 'solymarket' -- start
        
        # Save PM2 configuration to restart on server reboot
        pm2 save
        pm2 startup
    fi
"

# 8. Final checks
echo -e "${GREEN}=== Performing final checks ===${NC}"
run_ssh_command "
    # Check if Nginx is running
    if systemctl is-active --quiet nginx; then
        echo 'Nginx is running.'
    else
        echo 'Nginx is not running. Starting Nginx...'
        systemctl start nginx
    fi
    
    # Check if the application is running
    if pm2 list | grep -q 'solymarket'; then
        echo 'Application is running with PM2.'
    else
        echo 'Application is not running with PM2. Please check the logs.'
    fi
"

echo -e "${GREEN}=== Deployment completed successfully! ===${NC}"
echo -e "${GREEN}=== Your application is now available at https://$DOMAIN ===${NC}"
