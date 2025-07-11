#!/bin/bash

# Setup script for Fung's Accounting Backend

echo "🚀 Setting up Fung's Accounting Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v)
echo "✅ Node.js version: $NODE_VERSION"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment file
if [ ! -f .env ]; then
    echo "⚙️ Creating environment file..."
    cp .env.example .env
    echo "✅ Created .env file - please update it with your settings"
else
    echo "✅ Environment file already exists"
fi

# Create logs directory
mkdir -p logs
echo "✅ Created logs directory"

# Initialize database
echo "🗄️ Setting up database..."
node -e "
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./accounting.db');
console.log('✅ Database file created: accounting.db');
db.close();
"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update .env file with your configuration"
echo "2. Start the server: npm start"
echo "3. Visit: http://localhost:3001/api/health"
echo ""
echo "🔧 Development mode: npm run dev"
echo "📚 View logs: tail -f logs/app.log"