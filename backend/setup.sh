#!/bin/bash

# Orange Farm Backend - Quick Setup Script
# This script automates the initial setup of Firebase Cloud Functions

set -e  # Exit on error

echo "🍊 Orange Farm Backend - Quick Setup"
echo "===================================="
echo ""

# Check Node.js version
echo "📋 Checking prerequisites..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Error: Node.js 18+ required. Current version: $(node -v)"
    exit 1
fi
echo "✅ Node.js version: $(node -v)"

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found"
    echo "📦 Installing Firebase CLI..."
    npm install -g firebase-tools
fi
echo "✅ Firebase CLI: $(firebase --version)"

# Navigate to functions directory
cd "$(dirname "$0")/functions"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo ""
    echo "⚙️  Creating .env file from template..."
    cp .env.example .env
    echo "✅ Created .env file"
    echo ""
    echo "⚠️  IMPORTANT: Please update .env with your configuration:"
    echo "   1. Add contract addresses from smart contract deployment"
    echo "   2. Set SOMNIA_RPC_URL"
    echo "   3. Generate JWT_SECRET (see below)"
    echo "   4. Configure ADMIN_PRIVATE_KEY and ADMIN_WALLET_ADDRESS"
    echo "   5. Update ALLOWED_ORIGINS for production"
    echo ""
else
    echo "✅ .env file already exists"
fi

# Generate JWT secret suggestion
echo "🔐 Generating JWT_SECRET suggestion..."
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "   Suggested JWT_SECRET: $JWT_SECRET"
echo "   Add this to your .env file!"
echo ""

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Success message
echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Update backend/functions/.env with your configuration"
echo "   2. Start emulators: npm run serve"
echo "   3. Visit http://localhost:4000 for Emulator UI"
echo "   4. Deploy when ready: firebase deploy --only functions"
echo ""
echo "📚 Documentation:"
echo "   - Quick Start: backend/README.md"
echo "   - Setup Guide: backend/FIREBASE_BACKEND_SETUP.md"
echo "   - Implementation: backend/IMPLEMENTATION_TODO.md"
echo ""
echo "🚀 Happy coding! 🍊"
