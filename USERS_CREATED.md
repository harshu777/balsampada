# Created User Accounts

## ✅ Successfully Created and Tested

### Teachers
1. **Sonal Sharma** (As requested)
   - Email: `sonal@teacher.com`
   - Password: `sonal123`
   - Role: Teacher
   - ID: 68afe6f9a3638bc8f3d2121d

2. **Priya Patel**
   - Email: `priya@teacher.com`
   - Password: `priya123`
   - Role: Teacher

### Students
1. **Harsh Baviskar** (As requested)
   - Email: `harsh@student.com`
   - Password: `harsh123`
   - Role: Student
   - ID: 68afe6f9a3638bc8f3d21221

2. **Rahul Kumar**
   - Email: `rahul@student.com`
   - Password: `rahul123`
   - Role: Student

3. **Amit Singh**
   - Email: `amit@student.com`
   - Password: `amit123`
   - Role: Student

### Additional Test Accounts (Created Earlier)
- **Test Student**: `student@test.com` / `password123`
- **Test Teacher**: `teacher@test.com` / `password123`

## 🚀 How to Login

### Via Web Browser:
1. Open: http://localhost:3000
2. Click "Login" button
3. Enter credentials from above
4. You'll be redirected to the appropriate dashboard

### Via API (Command Line):
```bash
# Login as Teacher Sonal
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sonal@teacher.com","password":"sonal123"}'

# Login as Student Harsh
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"harsh@student.com","password":"harsh123"}'
```

## 📁 Scripts Created

### 1. Bash Script: `scripts/register-and-test.sh`
- Quick registration and testing
- Run with: `./scripts/register-and-test.sh`

### 2. Node.js Script: `scripts/create-users.js`
- More detailed user creation with axios
- Run with: `node scripts/create-users.js`

## 🎯 Quick Test

Test the main accounts you requested:
```bash
# Test Teacher Sonal's login
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sonal@teacher.com","password":"sonal123"}' | python3 -m json.tool

# Test Student Harsh's login
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"harsh@student.com","password":"harsh123"}' | python3 -m json.tool
```

## ✅ All users are created and tested successfully!