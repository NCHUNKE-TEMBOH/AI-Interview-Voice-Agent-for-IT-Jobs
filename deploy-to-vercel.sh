#!/bin/bash

# =============================================================================
# VERCEL DEPLOYMENT SCRIPT
# =============================================================================
# This script automates the deployment process to Vercel
# Run with: chmod +x deploy-to-vercel.sh && ./deploy-to-vercel.sh

echo "🚀 Starting Vercel deployment process..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    print_error "Vercel CLI is not installed"
    print_status "Installing Vercel CLI..."
    npm install -g vercel
    if [ $? -eq 0 ]; then
        print_success "Vercel CLI installed successfully"
    else
        print_error "Failed to install Vercel CLI"
        exit 1
    fi
fi

# Check if user is logged in to Vercel
print_status "Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
    print_warning "Not logged in to Vercel"
    print_status "Please log in to Vercel..."
    vercel login
fi

# Run optimization script
print_status "Running optimization script..."
if [ -f "optimize-for-vercel.js" ]; then
    node optimize-for-vercel.js
    print_success "Optimization completed"
else
    print_warning "Optimization script not found, skipping..."
fi

# Clean and install dependencies
print_status "Installing dependencies..."
npm ci
if [ $? -eq 0 ]; then
    print_success "Dependencies installed"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Run build to check for errors
print_status "Testing build..."
npm run build
if [ $? -eq 0 ]; then
    print_success "Build successful"
else
    print_error "Build failed - please fix errors before deploying"
    exit 1
fi

# Ask user for deployment type
echo ""
echo "Choose deployment type:"
echo "1) Production deployment"
echo "2) Preview deployment"
read -p "Enter your choice (1 or 2): " choice

case $choice in
    1)
        print_status "Deploying to production..."
        vercel --prod --confirm
        ;;
    2)
        print_status "Creating preview deployment..."
        vercel
        ;;
    *)
        print_error "Invalid choice. Exiting..."
        exit 1
        ;;
esac

if [ $? -eq 0 ]; then
    print_success "Deployment completed successfully!"
    echo ""
    print_status "Next steps:"
    echo "1. Check your deployment in the Vercel dashboard"
    echo "2. Test all features on the deployed site"
    echo "3. Configure custom domain if needed"
    echo "4. Set up monitoring and analytics"
else
    print_error "Deployment failed"
    echo ""
    print_status "Troubleshooting tips:"
    echo "1. Check environment variables in Vercel dashboard"
    echo "2. Review build logs for errors"
    echo "3. Ensure all dependencies are properly installed"
    echo "4. Check Vercel free tier limits"
fi

echo ""
print_status "Deployment script completed"
