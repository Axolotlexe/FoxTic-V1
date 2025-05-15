#!/bin/bash

# FoxTic Installation Script
# This script installs FoxTic monitoring system and configures it as a service

# Colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
ORANGE='\033[0;33m'    # Using yellow for orange since bash has limited colors
CYAN='\033[0;36m'      # For the turquoise elements
BOLD='\033[1m'
NC='\033[0m' # No Color

# FoxTic ASCII logo
cat << EOF
${ORANGE}                       ,-.
                      /   \\
                     /     \\
                    /       \\
          |\\___/|  /   .-.   \\
         /o  o  \\ /   (   )   \\
        ( ==  == )     \`-'     \\
         )      (               )
        (        )     ,---.   /
        ( ======= )   /     \\ /
        (         ) ,'       \`.
        (         ),(           )
        ( ======= ) \`._________,'${NC}
        ${BOLD}[  ${GREEN}F${BLUE}O${GREEN}X${BLUE}T${GREEN}I${BLUE}C${NC}${BOLD} ]${NC}
         ${YELLOW}^^^^^^^^^${NC}
     ${BLUE}/\\  |||||||||  /\\
    /  \\ |||||||||/  \\
   /    \\||||||||/    \\
  /      \\|||||/      \\
 /        \`---'        \\
/     ,===========.     \\
|    /==============\\    |
\\   \`================\`   /
 \`.                    ,'
   \`.                ,'
     \`.            ,'
       \`.________,'${NC}
EOF

echo -e "\n${BOLD}${GREEN}FoxTic Monitoring System Installation${NC}\n"
echo -e "${YELLOW}This script will install FoxTic and configure it as a service.${NC}\n"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root or with sudo${NC}"
  exit 1
fi

# Installation directory
INSTALL_DIR="/opt/foxtic"
CONFIG_DIR="/etc/foxtic"
SERVICE_USER="foxtic"
GIT_REPO="https://github.com/your-repo/foxtic.git"

# Function to show progress
show_progress() {
  echo -e "\n${BLUE}>> $1...${NC}"
}

# Function to check success
check_success() {
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Success!${NC}"
  else
    echo -e "${RED}✗ Failed!${NC}"
    echo -e "${RED}Installation aborted. Please check the error above.${NC}"
    exit 1
  fi
}

# Welcome Message
show_progress "Welcome to FoxTic Installation"
echo -e "This script will install the following:"
echo -e "  - Node.js 22.x"
echo -e "  - FoxTic Monitoring System"
echo -e "  - Create foxtic service user"
echo -e "  - Configure systemd service"
echo

# Confirm installation
read -p "Do you want to continue with the installation? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}Installation cancelled by user.${NC}"
  exit 0
fi

# Install dependencies
show_progress "Updating package lists"
apt-get update
check_success

show_progress "Installing prerequisites"
apt-get install -y curl git build-essential
check_success

# Install Node.js
show_progress "Installing Node.js 22.x"
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
check_success

show_progress "Installing Node.js packages"
apt-get install -y nodejs
check_success

# Verify Node.js installation
NODE_VERSION=$(node -v)
echo -e "${GREEN}Node.js ${NODE_VERSION} installed successfully.${NC}"

# Create service user
show_progress "Creating service user: ${SERVICE_USER}"
id -u ${SERVICE_USER} &>/dev/null || useradd -r -m -d ${INSTALL_DIR} -s /bin/bash ${SERVICE_USER}
check_success

# Create installation directory
show_progress "Creating installation directory"
mkdir -p ${INSTALL_DIR}
mkdir -p ${CONFIG_DIR}
check_success

# Clone the repository
show_progress "Downloading FoxTic"
echo -e "${YELLOW}Note: You can replace this section with a wget or curl command to download a release archive.${NC}"

if [ -d "${INSTALL_DIR}/.git" ]; then
  echo "Git repository already exists. Updating..."
  cd ${INSTALL_DIR} && git pull
else
  # This is a placeholder. For real installation, download a release package or clone from actual repo
  echo -e "${YELLOW}NOTE: In a real installation, you would clone from: ${GIT_REPO}${NC}"
  # git clone ${GIT_REPO} ${INSTALL_DIR}
  
  # For demo purpose, we'll copy the current files to the install directory
  echo "Copying current directory to ${INSTALL_DIR}..."
  cp -r $(pwd)/* ${INSTALL_DIR}/
fi
check_success

# Create config directory and configuration
show_progress "Setting up configuration"

# Create default config if it doesn't exist
if [ ! -f "${CONFIG_DIR}/foxtic.env" ]; then
  cat > ${CONFIG_DIR}/foxtic.env << EOF
# FoxTic environment configuration
PORT=3001
FOXTIC_HIDE_LOG=false
NODE_ENV=production
# Add other environment variables here
EOF
fi
check_success

# Install dependencies
show_progress "Installing FoxTic dependencies"
cd ${INSTALL_DIR} && npm install --production
check_success

# Create systemd service
show_progress "Creating systemd service"
cat > /etc/systemd/system/foxtic.service << EOF
[Unit]
Description=FoxTic Monitoring System
After=network.target

[Service]
Type=simple
User=${SERVICE_USER}
Group=${SERVICE_USER}
WorkingDirectory=${INSTALL_DIR}
EnvironmentFile=${CONFIG_DIR}/foxtic.env
ExecStart=$(which node) ${INSTALL_DIR}/server/server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=foxtic

[Install]
WantedBy=multi-user.target
EOF
check_success

# Set permissions
show_progress "Setting permissions"
chown -R ${SERVICE_USER}:${SERVICE_USER} ${INSTALL_DIR}
chown -R ${SERVICE_USER}:${SERVICE_USER} ${CONFIG_DIR}
chmod 644 /etc/systemd/system/foxtic.service
check_success

# Start the service
show_progress "Enabling and starting FoxTic service"
systemctl daemon-reload
systemctl enable foxtic.service
systemctl start foxtic.service
check_success

# Check if service is running
if systemctl is-active --quiet foxtic.service; then
  echo -e "\n${GREEN}FoxTic service is now running!${NC}"
else
  echo -e "\n${RED}Service failed to start. Please check the logs with: journalctl -u foxtic.service${NC}"
  exit 1
fi

# Installation complete
echo -e "\n${BOLD}${GREEN}FoxTic installation complete!${NC}"
echo -e "\n${BLUE}You can access FoxTic at: http://$(hostname -I | awk '{print $1}'):3001${NC}"
echo -e "\n${YELLOW}Configuration file: ${CONFIG_DIR}/foxtic.env${NC}"
echo -e "${YELLOW}Installation directory: ${INSTALL_DIR}${NC}"
echo -e "${YELLOW}Service management commands:${NC}"
echo -e "  ${BLUE}sudo systemctl status foxtic${NC}   - Check service status"
echo -e "  ${BLUE}sudo systemctl start foxtic${NC}    - Start the service"
echo -e "  ${BLUE}sudo systemctl stop foxtic${NC}     - Stop the service"
echo -e "  ${BLUE}sudo systemctl restart foxtic${NC}  - Restart the service"
echo -e "  ${BLUE}sudo journalctl -u foxtic -f${NC}   - View logs"

echo -e "\n${GREEN}Thank you for installing FoxTic!${NC}\n"