#!/bin/bash

echo "🚀 Setting up Balsampada LMS..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if MongoDB is installed
if ! command -v mongod &> /dev/null; then
    echo "📦 Installing MongoDB..."
    brew tap mongodb/brew
    brew install mongodb-community
fi

# Start MongoDB
echo "🔄 Starting MongoDB..."
brew services start mongodb-community

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB to start..."
sleep 5

# Setup Backend
echo "🔧 Setting up Backend..."
cd backend

# Install dependencies
npm install

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Created .env file. Please update it with your settings."
fi

# Create admin user
echo "👤 Creating admin user..."
node setup.js

echo "✅ Backend setup complete!"

# Setup Frontend
echo "🔧 Setting up Frontend..."
cd ../frontend

# Install dependencies
npm install

echo "✅ Frontend setup complete!"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the application:"
echo "1. Backend: cd backend && npm run dev"
echo "2. Frontend: cd frontend && npm run dev"
echo ""
echo "Default admin login:"
echo "Email: admin@balsampada.com"
echo "Password: Admin@123"