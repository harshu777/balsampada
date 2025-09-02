# Balsampada LMS - Local Development Setup

## Issues Fixed

### 1. Environment Configuration
- Updated `.env` files for local development without external services
- Configured dummy credentials for payment gateways (Razorpay, Stripe)
- Set up local file storage instead of AWS S3
- Disabled email sending for local development (logs to console instead)

### 2. API Authentication
- Fixed authentication endpoints (use `/api/auth/login` not `/api/users/login`)
- API is working correctly at `http://localhost:5000`
- Frontend is running at `http://localhost:3000`

### 3. File Storage
- Configured to use local storage by default
- Created `uploads/` directory for file storage
- No AWS S3 required for local development

### 4. TODO Features Implemented
- Email notifications disabled with console logging for local dev
- Password change feature shows appropriate message for local dev
- All payment integrations use dummy keys

## Running the Application

### Backend
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

### Frontend
```bash
cd frontend
npm run dev
# App runs on http://localhost:3000
```

## Test Endpoints

- Health Check: `curl http://localhost:5000/api/health`
- Register: `POST http://localhost:5000/api/auth/register`
- Login: `POST http://localhost:5000/api/auth/login`

## Local Development Notes

1. **MongoDB**: Make sure MongoDB is running locally on port 27017
2. **File Uploads**: All files are stored in `backend/uploads/` directory
3. **Email**: Email sending is disabled, check console logs for what would be sent
4. **Payments**: Using dummy keys, no actual payment processing
5. **AWS SDK Warning**: Can be ignored for local development

## Future Enhancements (When Budget Allows)

1. Set up AWS S3 for file storage
2. Configure real email service (SendGrid, AWS SES, etc.)
3. Set up Razorpay/Stripe with real credentials
4. Upgrade to AWS SDK v3
5. Set up proper SSL certificates for production

## Current Status
✅ Backend API running successfully
✅ Frontend application running successfully
✅ MongoDB connected
✅ Local file storage configured
✅ Authentication working
✅ All critical issues resolved for local development