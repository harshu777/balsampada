# Balsampada LMS API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### Register
- **POST** `/auth/register`
- Body: `{ name, email, password, role, phone }`
- Returns: User object and JWT token

#### Login
- **POST** `/auth/login`
- Body: `{ email, password }`
- Returns: User object and JWT token

#### Get Current User
- **GET** `/auth/me`
- Headers: Authorization required
- Returns: Current user profile

### Courses

#### Get All Courses
- **GET** `/courses`
- Query params: `category, level, search, minPrice, maxPrice, status, page, limit, sort`
- Returns: Array of courses with pagination

#### Get Single Course
- **GET** `/courses/:id`
- Returns: Course details with enrollment status

#### Create Course (Teacher/Admin)
- **POST** `/courses`
- Headers: Authorization required
- Body: `{ title, description, category, price, duration, ... }`
- Returns: Created course

#### Update Course (Teacher/Admin)
- **PUT** `/courses/:id`
- Headers: Authorization required
- Body: Course fields to update
- Returns: Updated course

#### Publish Course (Teacher/Admin)
- **PUT** `/courses/:id/publish`
- Headers: Authorization required
- Returns: Published course

### Enrollments

#### Enroll in Course
- **POST** `/enrollments/courses/:courseId/enroll`
- Headers: Authorization required
- Returns: Enrollment object

#### Get My Enrollments
- **GET** `/enrollments/my-enrollments`
- Headers: Authorization required
- Returns: Array of enrollments

#### Update Progress
- **PUT** `/enrollments/courses/:courseId/progress`
- Headers: Authorization required
- Body: `{ lessonId, timeSpent }`
- Returns: Updated enrollment

#### Get Certificate
- **POST** `/enrollments/courses/:courseId/certificate`
- Headers: Authorization required
- Returns: Certificate details

### Assignments

#### Get Course Assignments
- **GET** `/assignments/courses/:courseId/assignments`
- Headers: Authorization required
- Returns: Array of assignments

#### Create Assignment (Teacher/Admin)
- **POST** `/assignments/courses/:courseId/assignments`
- Headers: Authorization required
- Body: Assignment details
- Returns: Created assignment

#### Submit Assignment (Student)
- **POST** `/assignments/:id/submit`
- Headers: Authorization required
- Body: `{ content, files }`
- Returns: Success message

#### Grade Assignment (Teacher/Admin)
- **POST** `/assignments/:id/grade`
- Headers: Authorization required
- Body: `{ studentId, score, feedback, rubricScores }`
- Returns: Success message

### Payments

#### Create Payment Order
- **POST** `/payments/create-order`
- Headers: Authorization required
- Body: `{ courseId }`
- Returns: Razorpay order details

#### Verify Payment
- **POST** `/payments/verify`
- Headers: Authorization required
- Body: `{ razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId }`
- Returns: Success message

#### Get Payment History
- **GET** `/payments/history`
- Headers: Authorization required
- Returns: Array of payments

### File Upload

#### Upload Single File
- **POST** `/upload/local`
- Headers: Authorization required
- Body: multipart/form-data with 'file' field
- Returns: File URL and details

#### Upload to S3
- **POST** `/upload/s3`
- Headers: Authorization required
- Body: multipart/form-data with 'file' field
- Returns: S3 URL and details

#### Upload to Cloudinary
- **POST** `/upload/cloudinary`
- Headers: Authorization required
- Body: multipart/form-data with 'file' field
- Returns: Cloudinary URL and details

### Admin

#### Dashboard Statistics
- **GET** `/admin/dashboard`
- Headers: Authorization required (Admin only)
- Returns: Platform statistics

#### Get All Users
- **GET** `/admin/users`
- Headers: Authorization required (Admin only)
- Query params: `role, status, search, page, limit, sort`
- Returns: Array of users with pagination

#### Update User Status
- **PUT** `/admin/users/:userId/status`
- Headers: Authorization required (Admin only)
- Body: `{ isActive }`
- Returns: Updated user

#### Approve Course
- **PUT** `/admin/courses/:courseId/approve`
- Headers: Authorization required (Admin only)
- Body: `{ status, feedback }`
- Returns: Updated course

#### Generate Reports
- **GET** `/admin/reports`
- Headers: Authorization required (Admin only)
- Query params: `type, startDate, endDate`
- Returns: Report data

### User

#### Get Profile
- **GET** `/users/profile/:id?`
- Headers: Authorization required
- Returns: User profile

#### Update Profile
- **PUT** `/users/profile`
- Headers: Authorization required
- Body: Profile fields to update
- Returns: Updated profile

#### Upload Avatar
- **POST** `/users/avatar`
- Headers: Authorization required
- Body: multipart/form-data with 'file' field
- Returns: Updated user with avatar URL

#### Student Dashboard
- **GET** `/users/student/dashboard`
- Headers: Authorization required (Student)
- Returns: Dashboard data

#### Teacher Dashboard
- **GET** `/users/teacher/dashboard`
- Headers: Authorization required (Teacher)
- Returns: Dashboard data

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // Optional validation errors
}
```

## Status Codes

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error