# 🚀 Cloudflare R2 Setup Guide for Balsampada LMS

## 📋 Why Cloudflare R2?

### Cost Comparison
| Service | Storage | Egress | Free Tier | Best For |
|---------|---------|--------|-----------|----------|
| **Cloudflare R2** | $0.015/GB | **$0 FREE** | 10GB forever | ✅ **LMS with lots of videos/PDFs** |
| AWS S3 | $0.023/GB | $0.09/GB | 5GB (12 months) | General use |
| Local Storage | Free | Free | Limited by server | Small projects |

### Key Benefits for Your LMS:
- 📚 **Study Materials**: Store unlimited PDFs, documents
- 🎥 **Video Lectures**: No bandwidth costs for streaming
- 📸 **Profile Pictures**: Fast global delivery
- 📝 **Assignments**: Secure student submissions
- 💰 **Cost Effective**: Save 65% vs AWS S3

---

## 🔧 Step 1: Create Cloudflare Account

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Sign up for free account
3. Navigate to **R2** in sidebar

---

## 🪣 Step 2: Create R2 Bucket

### In Cloudflare Dashboard:
1. Click **R2** → **Create Bucket**
2. Configure:
   ```
   Bucket name: balsampada-lms
   Region: Automatic
   ```
3. Click **Create Bucket**

### Bucket Structure:
```
balsampada-lms/
├── profiles/        # User profile pictures
├── assignments/     # Student submissions
├── study-materials/ # Course materials
├── certificates/    # Completion certificates
└── general/        # Other files
```

---

## 🔑 Step 3: Generate API Credentials

### Create R2 API Token:
1. Go to **R2** → **Manage R2 API Tokens**
2. Click **Create API Token**
3. Configure:
   ```
   Token name: balsampada-lms-api
   Permissions: Object Read & Write
   Bucket: balsampada-lms (or all buckets)
   TTL: Forever
   ```
4. Click **Create API Token**
5. **SAVE THESE** (shown only once):
   ```
   Access Key ID: [your-access-key]
   Secret Access Key: [your-secret-key]
   Endpoint: https://[account-id].r2.cloudflarestorage.com
   ```

---

## ⚙️ Step 4: Configure Your Application

### Update Backend `.env`:
```env
# Cloudflare R2 Configuration
USE_R2=true
USE_LOCAL_STORAGE=false

R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET_NAME=balsampada-lms

# Optional: Custom domain for public access
R2_PUBLIC_URL=https://cdn.yourdomain.com
```

### Install Required Packages:
```bash
cd backend
npm install @aws-sdk/client-s3 @aws-sdk/lib-storage @aws-sdk/s3-request-presigner
```

---

## 🌐 Step 5: Configure Public Access (Optional)

### Option A: R2.dev Subdomain (Free)
1. Go to bucket settings
2. Enable **R2.dev subdomain**
3. Your files will be available at:
   ```
   https://pub-[random].r2.dev/[file-key]
   ```

### Option B: Custom Domain (Recommended)
1. Go to bucket settings → **Custom Domains**
2. Add domain: `cdn.yourdomain.com`
3. Cloudflare will handle SSL automatically
4. Update DNS records as instructed

---

## 📁 Step 6: Set CORS Policy

### Add CORS rules to bucket:
```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://yourdomain.com"
    ],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

---

## 🔄 Step 7: Update Upload Routes

### Backend Routes (`upload.routes.js`):
```javascript
const express = require('express');
const router = express.Router();
const { upload, uploadController } = require('../controllers/upload.controller');
const { protect } = require('../middleware/auth');

// Single file upload (R2 or local)
router.post('/single', 
  protect, 
  upload.single('file'), 
  uploadController.uploadSingle
);

// Multiple files upload
router.post('/multiple', 
  protect, 
  upload.array('files', 10), 
  uploadController.uploadMultiple
);

// Profile picture
router.post('/profile-picture', 
  protect, 
  upload.single('image'), 
  uploadController.uploadProfilePicture
);

// Assignment submission
router.post('/assignment', 
  protect, 
  upload.single('file'), 
  uploadController.uploadAssignment
);

// Study material
router.post('/study-material', 
  protect, 
  upload.single('file'), 
  uploadController.uploadStudyMaterial
);

// Get signed URL (R2 only)
router.get('/signed-url/:key', 
  protect, 
  uploadController.getSignedUrl
);

// Delete file
router.delete('/file', 
  protect, 
  uploadController.deleteFile
);

module.exports = router;
```

---

## 🎯 Step 8: Frontend Integration

### Upload Component Example:
```typescript
// components/FileUpload.tsx
import { useState } from 'react';
import api from '@/lib/api';

export function FileUpload({ onUploadComplete }) {
  const [uploading, setUploading] = useState(false);
  
  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'study-materials');
    
    try {
      const response = await api.post('/upload/single', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      onUploadComplete(response.data.data);
      toast.success('File uploaded successfully!');
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <input 
      type="file" 
      onChange={handleUpload} 
      disabled={uploading}
    />
  );
}
```

---

## 📊 Step 9: Monitor Usage

### Check R2 Dashboard:
- Storage used
- Number of objects
- Class A/B operations
- Bandwidth (always $0!)

### Set Alerts:
1. Go to **Notifications**
2. Set up alerts for:
   - Storage > 9GB (approaching free limit)
   - Unusual activity

---

## 💰 Cost Calculation

### For Typical LMS (1000 students):
| Content | Size | Monthly Cost |
|---------|------|--------------|
| Profile pics (1000 × 200KB) | 200MB | $0.003 |
| Study materials (500 PDFs × 2MB) | 1GB | $0.015 |
| Video lectures (50 × 100MB) | 5GB | $0.075 |
| Assignments (5000 × 500KB) | 2.5GB | $0.038 |
| **Total Storage** | **8.7GB** | **$0.13/month** |
| **Bandwidth** | Unlimited | **$0 FREE** |
| **Total Cost** | | **$0.13/month** |

### Compare with AWS S3:
- Storage: $0.20/month
- Bandwidth (50GB): $4.50/month
- **Total S3**: $4.70/month
- **You Save: 97%!** 💰

---

## 🚨 Troubleshooting

### Issue: "Access Denied"
```bash
# Check credentials in .env
R2_ACCESS_KEY_ID=correct-key
R2_SECRET_ACCESS_KEY=correct-secret
```

### Issue: "Bucket not found"
```bash
# Verify bucket name matches exactly
R2_BUCKET_NAME=balsampada-lms  # Case sensitive!
```

### Issue: CORS errors
- Add your frontend URL to CORS policy
- Clear browser cache
- Check network tab for actual error

### Issue: Large file uploads fail
```javascript
// Increase timeout in nginx.conf
client_max_body_size 500M;
proxy_read_timeout 300;
```

---

## 🔒 Security Best Practices

1. **Never expose credentials**:
   ```javascript
   // Bad ❌
   const key = "abc123";
   
   // Good ✅
   const key = process.env.R2_ACCESS_KEY_ID;
   ```

2. **Use signed URLs for sensitive files**:
   ```javascript
   // Generate temporary access URL
   const signedUrl = await r2Storage.getSignedUrl(key, 3600);
   ```

3. **Validate file types**:
   ```javascript
   const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
   if (!allowedTypes.includes(file.mimetype)) {
     throw new Error('Invalid file type');
   }
   ```

4. **Organize with folders**:
   ```
   profiles/userId/timestamp-filename.jpg
   assignments/classId/studentId/timestamp-filename.pdf
   ```

---

## ✅ Testing Checklist

- [ ] Upload profile picture
- [ ] Upload assignment (PDF)
- [ ] Upload study material
- [ ] View uploaded files
- [ ] Delete a file
- [ ] Generate signed URL
- [ ] Test CORS with frontend
- [ ] Check file size limits
- [ ] Verify folder structure

---

## 🎉 Success Indicators

Your R2 setup is working when:
1. ✅ Files upload without errors
2. ✅ Images load quickly globally
3. ✅ PDFs download properly
4. ✅ No bandwidth charges appear
5. ✅ Dashboard shows object count
6. ✅ Custom domain works (if configured)

---

## 📚 Resources

- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [AWS SDK for JavaScript](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [R2 Pricing Calculator](https://r2-calculator.cloudflare.com/)
- [Migration from S3](https://developers.cloudflare.com/r2/migration/s3/)

---

## 🚀 Next Steps

1. **Enable caching**: Use Cloudflare CDN for static files
2. **Image optimization**: Use Cloudflare Images for automatic resizing
3. **Video streaming**: Consider Cloudflare Stream for videos
4. **Backup strategy**: Set up lifecycle rules
5. **Analytics**: Track file access patterns

---

**Your LMS is now powered by Cloudflare R2! 🎊**
- Zero egress fees
- Global performance
- Simple S3-compatible API
- Massive cost savings

**Happy Teaching & Learning! 📚**