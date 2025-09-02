# Test User Credentials

## Created Test Accounts

### 1. Student Account
- **Email**: `student@test.com`
- **Password**: `password123`
- **Role**: Student
- **Status**: ✅ Created and verified

### 2. Teacher Account
- **Email**: `teacher@test.com`
- **Password**: `password123`
- **Role**: Teacher
- **Status**: ✅ Created and verified

### 3. Admin Account
- **Note**: Admin role is not available through registration. You'll need to manually update a user's role in MongoDB to create an admin.

## How to Login

### Via Web Interface:
1. Open browser to `http://localhost:3000`
2. Click "Login" button
3. Enter email and password
4. You'll be redirected to the appropriate dashboard based on role

### Via API (for testing):
```bash
# Login as student
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "student@test.com", "password": "password123"}'

# Login as teacher
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "teacher@test.com", "password": "password123"}'
```

## Create Admin User (MongoDB)

To create an admin user, connect to MongoDB and update a user's role:

```javascript
// In MongoDB shell or Compass
db.users.updateOne(
  { email: "teacher@test.com" },
  { $set: { role: "admin" } }
)
```

## Additional Test Users

You can create more users using the registration endpoint:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Your Name",
    "email": "your.email@test.com",
    "password": "your_password",
    "role": "student" // or "teacher"
  }'
```

## Notes
- All test accounts are created with `password123` for easy testing
- Email verification is disabled for local development
- Passwords are hashed using bcrypt before storage
- JWT tokens are generated upon successful login