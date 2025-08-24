# Balsampada LMS - Learning Management System

A comprehensive educational platform for online coaching with Student, Teacher, and Admin portals.

## Tech Stack

- **Frontend**: React, Next.js, TailwindCSS
- **Backend**: Node.js, Express, MongoDB
- **Authentication**: JWT with role-based access control
- **File Storage**: AWS S3 / Local storage
- **Payments**: Razorpay / Stripe

## Features

### Student Portal
- Course enrollment and progress tracking
- Video lectures and resource downloads
- Assignment submission and quiz attempts
- Grade checking and certificate generation
- Online fee payment

### Teacher Portal
- Course creation and management
- Video/PDF upload for lessons
- Assignment and quiz creation
- Student grading and attendance
- Performance analytics

### Admin Portal
- User management (students, teachers)
- Course approval and oversight
- Revenue tracking and reports
- System-wide announcements
- Platform analytics

## Project Structure

```
balsampada-lms/
├── backend/           # Node.js Express API
│   ├── src/
│   │   ├── models/    # Database models
│   │   ├── routes/    # API routes
│   │   ├── controllers/
│   │   ├── middleware/
│   │   └── utils/
│   └── package.json
│
└── frontend/          # React/Next.js app
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── context/
    │   └── utils/
    └── package.json
```

## Getting Started

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```