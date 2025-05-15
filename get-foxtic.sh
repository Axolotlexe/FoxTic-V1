#!/bin/bash

# FoxTic Installation Script for Remote Deployment
# This script downloads and runs the FoxTic installer

# Colors for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
ORANGE='\033[0;33m'    # Using yellow for orange since bash has limited colors
CYAN='\033[0;36m'      # For the turquoise elements
BOLD='\033[1m'
NC='\033[0m' # No Color

# Show FoxTic ASCII Logo
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
     ${CYAN}/\\  |||||||||  /\\
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

echo -e "\n${BOLD}${GREEN}FoxTic Monitoring System${NC}\n"
echo -e "${BLUE}Downloading FoxTic installer...${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root${NC}"
  exit 1
fi

# Install dependencies
echo -e "${BLUE}Installing required dependencies...${NC}"
apt-get update > /dev/null
apt-get install -y curl wget git > /dev/null

# Choose installation method (latest release or specific version)
RELEASE_URL="https://github.com/your-repo/foxtic/releases/latest/download/foxtic-install.tar.gz"
INSTALL_DIR="/tmp/foxtic-install"

# Ensure installation directory exists
mkdir -p ${INSTALL_DIR}

# Download the installer package
echo -e "${BLUE}Downloading FoxTic...${NC}"
# In a real deployment, you would download from actual URL
# wget -q ${RELEASE_URL} -O ${INSTALL_DIR}/foxtic-install.tar.gz

# For demonstration, we'll use the existing install.sh
echo -e "${YELLOW}Note: This is a demo script. In production, it would download the latest release.${NC}"
cp $(pwd)/install.sh ${INSTALL_DIR}/install.sh
chmod +x ${INSTALL_DIR}/install.sh

# Run the installer
echo -e "${GREEN}Starting installation...${NC}"
${INSTALL_DIR}/install.sh

# Cleanup
rm -rf ${INSTALL_DIR}

echo -e "\n${GREEN}Done! Installer has been executed.${NC}"