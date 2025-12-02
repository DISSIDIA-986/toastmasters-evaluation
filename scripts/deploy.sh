#!/bin/bash

# Toastmasters Evaluation - One-click Deploy Script
# This script pushes to GitHub and triggers Vercel deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Toastmasters Evaluation Deployment${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}Error: GitHub CLI (gh) is not installed.${NC}"
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

# Check if logged into gh
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}Not logged into GitHub CLI. Running gh auth login...${NC}"
    gh auth login
fi

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

echo -e "${GREEN}Working directory: $PROJECT_ROOT${NC}"
echo ""

# Repository name
REPO_NAME="toastmasters-evaluation"

# Check if remote origin exists
if git remote get-url origin &> /dev/null; then
    echo -e "${GREEN}Git remote already configured.${NC}"
else
    echo -e "${YELLOW}Setting up GitHub repository...${NC}"

    # Check if repo exists on GitHub
    if gh repo view "$REPO_NAME" &> /dev/null; then
        echo -e "${GREEN}Repository exists on GitHub. Adding remote...${NC}"
        gh repo clone "$REPO_NAME" --repo "$(gh api user --jq .login)/$REPO_NAME" || true
        git remote add origin "https://github.com/$(gh api user --jq .login)/$REPO_NAME.git" 2>/dev/null || true
    else
        echo -e "${YELLOW}Creating new GitHub repository...${NC}"
        gh repo create "$REPO_NAME" --public --source=. --remote=origin --push
        echo -e "${GREEN}Repository created successfully!${NC}"
    fi
fi

# Add all changes
echo -e "${YELLOW}Staging changes...${NC}"
git add .

# Check if there are changes to commit
if git diff --cached --quiet; then
    echo -e "${GREEN}No changes to commit.${NC}"
else
    # Commit with timestamp
    TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
    echo -e "${YELLOW}Committing changes...${NC}"
    git commit -m "Deploy: $TIMESTAMP"
fi

# Push to GitHub
echo -e "${YELLOW}Pushing to GitHub...${NC}"
git push -u origin main 2>/dev/null || git push -u origin master 2>/dev/null || {
    # If push fails, try setting upstream
    BRANCH=$(git branch --show-current)
    git push -u origin "$BRANCH"
}

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "GitHub Repository: ${BLUE}https://github.com/$(gh api user --jq .login)/$REPO_NAME${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Go to https://vercel.com/new"
echo "2. Import your GitHub repository: $REPO_NAME"
echo "3. Add Vercel Postgres from Storage tab"
echo "4. Deploy!"
echo ""
echo -e "${YELLOW}Or if already connected:${NC}"
echo "Vercel will automatically deploy from the GitHub push."
echo ""
