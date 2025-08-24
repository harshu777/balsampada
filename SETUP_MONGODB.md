# MongoDB Setup Instructions

MongoDB is required to run the Balsampada LMS backend. Choose one of the following options:

## Option 1: Install MongoDB Locally (macOS)

### Using Homebrew:
```bash
# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Verify it's running
brew services list
```

### Using MongoDB installer:
1. Download from: https://www.mongodb.com/try/download/community
2. Follow the installation wizard
3. Start MongoDB

## Option 2: Use MongoDB Atlas (Cloud - Recommended for Quick Start)

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for a free account
3. Create a new cluster (free tier available)
4. Click "Connect" and choose "Connect your application"
5. Copy the connection string
6. Update your `.env` file:
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/balsampada-lms?retryWrites=true&w=majority
   ```

## Option 3: Use Docker

```bash
# Run MongoDB in Docker
docker run -d -p 27017:27017 --name mongodb-balsampada mongo:latest

# Verify it's running
docker ps
```

## After MongoDB is Set Up

1. The backend will automatically connect using the connection string in `.env`
2. Run the setup script to create admin user:
   ```bash
   cd backend
   node setup.js
   ```
3. Start the backend:
   ```bash
   npm run dev
   ```

## Troubleshooting

### Connection Refused Error
- Ensure MongoDB is running
- Check the connection string in `.env`
- For local MongoDB, use: `mongodb://localhost:27017/balsampada-lms`
- For Atlas, ensure your IP is whitelisted in the Atlas dashboard

### Authentication Failed
- Check username and password in connection string
- For local MongoDB, authentication might not be required

### Network Timeout
- If using Atlas, check your internet connection
- Ensure firewall isn't blocking the connection