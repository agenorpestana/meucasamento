#!/bin/bash

# iWedding SaaS Installation Script for Ubuntu 22.04
# Usage: sudo bash install.sh

echo "Starting iWedding installation..."

# 1. Update system
apt update && apt upgrade -y

# 2. Install Node.js (v20)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 3. Install Nginx
apt install -y nginx

# 4. Install PM2
npm install -g pm2

# 5. Setup Project Directory
mkdir -p /var/www/iwedding
# (Assuming files are uploaded to this directory)

# 6. Install dependencies
cd /var/www/iwedding
npm install

# 7. Build Frontend
npm run build

# 8. Setup Nginx (Config file provided separately)
# cp nginx.conf /etc/nginx/sites-available/iwedding
# ln -s /etc/nginx/sites-available/iwedding /etc/nginx/sites-enabled/
# nginx -t && systemctl restart nginx

echo "Installation complete! Please configure your .env file and Nginx."
