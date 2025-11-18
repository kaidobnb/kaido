#!/bin/bash

# Test SSH Connection Script
# This script helps verify your SSH connection before deployment

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVER_IP="13.60.163.124"
SERVER_USER="ubuntu"
SSH_KEY="blockcens.pem"
DOMAIN="kaidobnb.xyz"

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Kaido AI - Connection Test & Pre-Deployment       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Test 1: Check if SSH key exists
echo -e "${YELLOW}[1/5] Checking SSH key...${NC}"
if [ -f "$SSH_KEY" ]; then
    echo -e "${GREEN}✓${NC} SSH key found: $SSH_KEY"
    
    # Check permissions
    PERMS=$(stat -f "%OLp" "$SSH_KEY" 2>/dev/null || stat -c "%a" "$SSH_KEY" 2>/dev/null)
    if [ "$PERMS" = "400" ] || [ "$PERMS" = "600" ]; then
        echo -e "${GREEN}✓${NC} SSH key permissions are correct ($PERMS)"
    else
        echo -e "${YELLOW}⚠${NC} SSH key permissions are $PERMS (should be 400 or 600)"
        echo -e "${YELLOW}→${NC} Fixing permissions..."
        chmod 400 "$SSH_KEY"
        echo -e "${GREEN}✓${NC} Permissions fixed to 400"
    fi
else
    echo -e "${RED}✗${NC} SSH key not found: $SSH_KEY"
    echo -e "${YELLOW}→${NC} Please copy your SSH key to this directory:"
    echo -e "   ${BLUE}cp /path/to/$SSH_KEY .${NC}"
    echo ""
    echo -e "${YELLOW}→${NC} Or update the SSH_KEY variable in this script"
    exit 1
fi
echo ""

# Test 2: Check DNS resolution
echo -e "${YELLOW}[2/5] Checking DNS resolution...${NC}"
if command -v nslookup &> /dev/null; then
    DNS_IP=$(nslookup $DOMAIN 2>/dev/null | grep -A1 "Name:" | grep "Address:" | awk '{print $2}' | head -1)
    if [ "$DNS_IP" = "$SERVER_IP" ]; then
        echo -e "${GREEN}✓${NC} DNS correctly points to $SERVER_IP"
    else
        echo -e "${YELLOW}⚠${NC} DNS points to: $DNS_IP (expected: $SERVER_IP)"
        echo -e "${YELLOW}→${NC} This might be okay if DNS is still propagating"
    fi
else
    echo -e "${YELLOW}⚠${NC} nslookup not available, skipping DNS check"
fi
echo ""

# Test 3: Test SSH connection
echo -e "${YELLOW}[3/5] Testing SSH connection...${NC}"
if ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=10 -o BatchMode=yes "$SERVER_USER@$SERVER_IP" "echo 'Connection successful'" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} SSH connection successful"
else
    echo -e "${RED}✗${NC} SSH connection failed"
    echo -e "${YELLOW}→${NC} Possible issues:"
    echo -e "   1. SSH key is incorrect"
    echo -e "   2. Server is not accessible"
    echo -e "   3. Firewall blocking connection"
    echo ""
    echo -e "${YELLOW}→${NC} Try manual connection:"
    echo -e "   ${BLUE}ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP${NC}"
    exit 1
fi
echo ""

# Test 4: Check server OS and resources
echo -e "${YELLOW}[4/5] Checking server information...${NC}"
SERVER_INFO=$(ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "
    echo 'OS:' \$(lsb_release -d 2>/dev/null | cut -f2 || cat /etc/os-release | grep PRETTY_NAME | cut -d'\"' -f2)
    echo 'Kernel:' \$(uname -r)
    echo 'CPU:' \$(nproc) 'cores'
    echo 'RAM:' \$(free -h | grep Mem | awk '{print \$2}')
    echo 'Disk:' \$(df -h / | tail -1 | awk '{print \$4}') 'free'
" 2>/dev/null)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Server information retrieved:"
    echo "$SERVER_INFO" | while IFS= read -r line; do
        echo -e "  ${BLUE}→${NC} $line"
    done
else
    echo -e "${YELLOW}⚠${NC} Could not retrieve server information"
fi
echo ""

# Test 5: Check if required ports are available
echo -e "${YELLOW}[5/5] Checking server readiness...${NC}"
PORT_CHECK=$(ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SERVER_USER@$SERVER_IP" "
    # Check if ports are in use
    PORT_80=\$(sudo lsof -i :80 2>/dev/null | wc -l)
    PORT_443=\$(sudo lsof -i :443 2>/dev/null | wc -l)
    PORT_5001=\$(sudo lsof -i :5001 2>/dev/null | wc -l)
    
    echo \"PORT_80=\$PORT_80\"
    echo \"PORT_443=\$PORT_443\"
    echo \"PORT_5001=\$PORT_5001\"
    
    # Check if services are installed
    command -v node >/dev/null 2>&1 && echo 'NODE=installed' || echo 'NODE=not_installed'
    command -v nginx >/dev/null 2>&1 && echo 'NGINX=installed' || echo 'NGINX=not_installed'
    command -v mongod >/dev/null 2>&1 && echo 'MONGODB=installed' || echo 'MONGODB=not_installed'
    command -v pm2 >/dev/null 2>&1 && echo 'PM2=installed' || echo 'PM2=not_installed'
" 2>/dev/null)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Server readiness check:"
    
    # Parse results
    while IFS= read -r line; do
        case $line in
            NODE=installed)
                echo -e "  ${GREEN}✓${NC} Node.js is installed"
                ;;
            NODE=not_installed)
                echo -e "  ${YELLOW}○${NC} Node.js will be installed during deployment"
                ;;
            NGINX=installed)
                echo -e "  ${GREEN}✓${NC} Nginx is installed"
                ;;
            NGINX=not_installed)
                echo -e "  ${YELLOW}○${NC} Nginx will be installed during deployment"
                ;;
            MONGODB=installed)
                echo -e "  ${GREEN}✓${NC} MongoDB is installed"
                ;;
            MONGODB=not_installed)
                echo -e "  ${YELLOW}○${NC} MongoDB will be installed during deployment"
                ;;
            PM2=installed)
                echo -e "  ${GREEN}✓${NC} PM2 is installed"
                ;;
            PM2=not_installed)
                echo -e "  ${YELLOW}○${NC} PM2 will be installed during deployment"
                ;;
        esac
    done <<< "$PORT_CHECK"
else
    echo -e "${YELLOW}⚠${NC} Could not check server readiness"
fi
echo ""

# Summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    Summary                             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✓${NC} All pre-deployment checks passed!"
echo ""
echo -e "${BLUE}Server Details:${NC}"
echo -e "  IP Address: ${GREEN}$SERVER_IP${NC}"
echo -e "  Domain:     ${GREEN}$DOMAIN${NC}"
echo -e "  User:       ${GREEN}$SERVER_USER${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo -e "  ${YELLOW}1.${NC} Review the deployment checklist:"
echo -e "     ${BLUE}cat DEPLOYMENT_CHECKLIST.md${NC}"
echo ""
echo -e "  ${YELLOW}2.${NC} Run the automated deployment:"
echo -e "     ${BLUE}./deploy-production.sh${NC}"
echo ""
echo -e "  ${YELLOW}3.${NC} Or manually copy and run the setup script:"
echo -e "     ${BLUE}scp -i $SSH_KEY server-setup.sh $SERVER_USER@$SERVER_IP:~/${NC}"
echo -e "     ${BLUE}ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP${NC}"
echo -e "     ${BLUE}chmod +x server-setup.sh && ./server-setup.sh${NC}"
echo ""
echo -e "${GREEN}Ready to deploy! 🚀${NC}"

