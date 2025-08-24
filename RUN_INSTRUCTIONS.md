# Balsampada LMS - Running Instructions

## Prerequisites
- Node.js (v18+ recommended)
- MongoDB (local or cloud instance)
- npm or yarn

## Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure `.env` file with your settings:
- Set MongoDB connection string
- Add JWT secret
- Configure email settings (optional)
- Add payment gateway keys (optional)

5. Create admin user:
```bash
node setup.js
```
This will create an admin user with:
- Email: admin@balsampada.com
- Password: Admin@123

6. Start the backend server:
```bash
npm run dev
```
The backend will run on http://localhost:5000

## Frontend Setup

1. Open a new terminal and navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```
The frontend will run on http://localhost:3000

## Default Login Credentials

### Admin Account
- Email: admin@balsampada.com
- Password: Admin@123

### Demo Accounts (create these manually or through registration)
- Student: student@demo.com / Demo@123
- Teacher: teacher@demo.com / Demo@123

## Features Available

### Student Portal
- Browse and enroll in courses
- View enrolled courses with progress tracking
- Submit assignments
- View grades and attendance
- Generate certificates
- Make payments for courses

### Teacher Portal
- Create and manage courses
- Add modules and lessons
- Create assignments and quizzes
- Grade student submissions
- Track student attendance
- View earnings and analytics

### Admin Portal
- User management (activate/deactivate, role changes)
- Course approval and management
- View platform analytics and reports
- Payment management
- System-wide announcements

## API Documentation
Full API documentation is available at `backend/API_DOCUMENTATION.md`

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check connection string in `.env`
- For local MongoDB: `mongodb://localhost:27017/balsampada-lms`

### Port Already in Use
- Backend: Change port in `.env` file (default: 5000)
- Frontend: Use `npm run dev -- -p 3001` for different port

### CORS Issues
- Ensure frontend URL is correctly set in backend `.env` as CLIENT_URL
- Default is http://localhost:3000

## Production Deployment

### Backend
1. Set NODE_ENV=production in `.env`
2. Use proper MongoDB Atlas or production database
3. Configure proper email service
4. Set up SSL certificates
5. Use PM2 or similar for process management

### Frontend
1. Build for production:
```bash
npm run build
```
2. Deploy to Vercel, Netlify, or your preferred hosting
3. Update API_URL in environment variables

## Support
For issues or questions, please check the documentation or create an issue in the project repository.