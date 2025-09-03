# 🔒 Balsampada LMS - Production Security Checklist

## 🚨 CRITICAL SECURITY ISSUES TO FIX BEFORE PRODUCTION

### 1. ❌ **CORS Configuration (HIGH PRIORITY)**
**Issue**: CORS is allowing all origins in production
```javascript
// Current: backend/src/server.js line 61
callback(null, true); // For development, allow all origins
```

**Fix Required**:
```javascript
// In backend/src/server.js
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    
    if (process.env.NODE_ENV === 'production') {
      // Only allow your domain in production
      const allowedOrigins = [
        'https://balsampada.com',
        'https://www.balsampada.com'
      ];
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      // Development mode
      callback(null, true);
    }
  },
  credentials: true
}));
```

### 2. ❌ **Session Secret (HIGH PRIORITY)**
**Issue**: Using fallback secret in production
```javascript
// Current: backend/src/server.js line 69
secret: process.env.SESSION_SECRET || 'fallback-secret-key',
```

**Fix Required**:
```javascript
// Remove fallback in production
if (!process.env.SESSION_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('SESSION_SECRET must be set in production');
}
```

### 3. ⚠️ **Rate Limiting (MEDIUM PRIORITY)**
**Current**: 100 requests per 15 minutes in production
**Recommendation**: Implement different limits for different endpoints

**Add to backend**:
```javascript
// Create backend/src/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window for auth
  message: 'Too many login attempts, please try again later'
});

exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100 // General API limit
});
```

### 4. ❌ **MongoDB Security (HIGH PRIORITY)**
**Issue**: No authentication on MongoDB connection

**Fix Required**:
1. Enable MongoDB authentication:
```bash
# On your server
mongosh
use admin
db.createUser({
  user: "balsampada_admin",
  pwd: "STRONG_PASSWORD_HERE",
  roles: [{ role: "root", db: "admin" }]
})

use balsampada-lms
db.createUser({
  user: "balsampada_user",
  pwd: "ANOTHER_STRONG_PASSWORD",
  roles: [{ role: "readWrite", db: "balsampada-lms" }]
})
```

2. Update connection string in `.env`:
```
MONGODB_URI=mongodb://balsampada_user:PASSWORD@localhost:27017/balsampada-lms?authSource=balsampada-lms
```

### 5. ⚠️ **File Upload Security (MEDIUM PRIORITY)**
**Issue**: Static file serving without validation

**Add validation**:
```javascript
// Create backend/src/middleware/uploadSecurity.js
const path = require('path');

exports.validateFileAccess = (req, res, next) => {
  const filePath = req.path;
  const ext = path.extname(filePath).toLowerCase();
  
  // Only allow specific file types
  const allowedExts = ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx'];
  
  if (!allowedExts.includes(ext)) {
    return res.status(403).json({ error: 'File type not allowed' });
  }
  
  next();
};
```

### 6. ❌ **Input Validation (HIGH PRIORITY)**
**Issue**: Missing input sanitization

**Install and configure**:
```bash
npm install express-validator express-mongo-sanitize xss
```

```javascript
// Add to backend/src/server.js
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

app.use(mongoSanitize()); // Prevent MongoDB injection
app.use(xss()); // Clean user input from malicious HTML
```

### 7. ⚠️ **JWT Security (MEDIUM PRIORITY)**
**Current Issues**:
- JWT secret might be weak
- No token refresh mechanism
- Tokens valid for 7 days

**Recommendations**:
```javascript
// Generate strong JWT secret
// Run: openssl rand -base64 64
// Use the output as JWT_SECRET in .env
```

### 8. ❌ **HTTP Security Headers (HIGH PRIORITY)**
**Current**: Basic helmet configuration

**Enhanced configuration**:
```javascript
// backend/src/server.js
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

## 📋 PRODUCTION DEPLOYMENT SECURITY CHECKLIST

### Environment Variables
- [ ] Strong JWT_SECRET (min 64 characters)
- [ ] Strong SESSION_SECRET (min 64 characters)
- [ ] MongoDB connection with authentication
- [ ] NODE_ENV=production
- [ ] Remove all default/test credentials

### Server Security
- [ ] UFW firewall enabled (only 22, 80, 443)
- [ ] Fail2ban installed for SSH protection
- [ ] Non-root user for application
- [ ] SSH key-only authentication (no passwords)
- [ ] Regular security updates enabled

### SSL/TLS
- [ ] SSL certificate installed (Let's Encrypt)
- [ ] Force HTTPS redirect
- [ ] HSTS header enabled
- [ ] SSL rating A+ on SSL Labs

### MongoDB Security
- [ ] Authentication enabled
- [ ] Network binding to localhost only
- [ ] Regular automated backups
- [ ] Encryption at rest (if sensitive data)

### Application Security
- [ ] CORS restricted to your domain only
- [ ] Rate limiting on all endpoints
- [ ] Input validation and sanitization
- [ ] XSS protection enabled
- [ ] CSRF protection for state-changing operations
- [ ] SQL/NoSQL injection prevention
- [ ] File upload restrictions and validation

### Monitoring & Logging
- [ ] Error logging configured (but not exposing sensitive data)
- [ ] Access logs enabled
- [ ] Monitor for suspicious activities
- [ ] Set up alerts for failures

### Sensitive Data
- [ ] Passwords hashed with bcrypt (✅ Already implemented)
- [ ] No sensitive data in logs
- [ ] No sensitive data in error messages
- [ ] PII data encrypted if stored

## 🔧 IMMEDIATE ACTIONS REQUIRED

1. **Update backend/src/server.js** with production CORS settings
2. **Set strong secrets** in production .env:
   ```bash
   JWT_SECRET=$(openssl rand -base64 64)
   SESSION_SECRET=$(openssl rand -base64 64)
   ```
3. **Enable MongoDB authentication**
4. **Install security packages**:
   ```bash
   cd backend
   npm install express-mongo-sanitize xss-clean express-validator
   ```
5. **Configure nginx for security headers**:
   ```nginx
   # Add to nginx config
   add_header X-Frame-Options "SAMEORIGIN" always;
   add_header X-Content-Type-Options "nosniff" always;
   add_header X-XSS-Protection "1; mode=block" always;
   add_header Referrer-Policy "strict-origin-when-cross-origin" always;
   ```

## 🚀 DEPLOYMENT SCRIPT WITH SECURITY

```bash
#!/bin/bash
# Run on your AWS server

# 1. Set secure environment variables
cd /var/www/balsampada/backend
cat >> .env << EOF
JWT_SECRET=$(openssl rand -base64 64)
SESSION_SECRET=$(openssl rand -base64 64)
NODE_ENV=production
EOF

# 2. Set correct permissions
chmod 600 .env
chmod 600 frontend/.env.local

# 3. Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# 4. Install fail2ban
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# 5. Secure MongoDB
# Follow the MongoDB security steps above

# 6. Restart with security updates
pm2 restart all
```

## ⚠️ NEVER DO IN PRODUCTION

1. ❌ Never commit .env files
2. ❌ Never use default passwords
3. ❌ Never disable HTTPS
4. ❌ Never allow all CORS origins
5. ❌ Never expose database directly to internet
6. ❌ Never run applications as root
7. ❌ Never ignore security updates
8. ❌ Never log sensitive information

## 📊 Security Testing

After deployment, test your security:

1. **SSL Test**: https://www.ssllabs.com/ssltest/
2. **Security Headers**: https://securityheaders.com/
3. **OWASP ZAP**: Vulnerability scanning
4. **Rate Limit Testing**: Try multiple rapid requests

## 🆘 If Compromised

1. Immediately rotate all secrets
2. Check access logs for suspicious activity
3. Restore from clean backup
4. Implement additional monitoring
5. Consider professional security audit

---

**Priority**: Fix all HIGH PRIORITY items before going live!
**Timeline**: Complete all items within 24 hours of deployment
**Responsibility**: DevOps/Backend team must verify each item