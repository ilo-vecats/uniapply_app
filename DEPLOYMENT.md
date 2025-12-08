# Deployment Guide

## 🔧 Issues Fixed

### 1. Frontend API URL Configuration
- **Problem**: Frontend was defaulting to `localhost:3001/api` instead of the deployed backend URL
- **Fix**: Updated `frontend/lib/api.ts` and `frontend/next.config.js` to use `https://uniapply-app.onrender.com/api` as the default in production
- **Auto-detection**: The frontend now automatically detects if it's running in production and uses the deployed backend URL

### 2. CORS Configuration
- **Problem**: Backend CORS was too restrictive, blocking requests from deployed frontend
- **Fix**: Updated `backend/server.js` to allow requests from all origins in production while maintaining security in development
- **Configuration**: You can still specify allowed origins via `FRONTEND_URL` environment variable (comma-separated)

### 3. Error Handling
- **Problem**: Login errors weren't providing clear feedback
- **Fix**: Improved error handling in `frontend/app/auth/login/page.tsx` to show detailed error messages
- **Enhanced**: Added better error logging in API interceptors for debugging

## 📝 Environment Variables Setup

### Backend (Render)
Set these in your Render dashboard under **Environment Variables**:

```bash
PORT=3001
NODE_ENV=production
DB_URL=your_postgresql_connection_string
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-frontend-domain.com
```

**Important**: Make sure `DB_URL` is correctly set with your PostgreSQL connection string.

### Frontend (Vercel/Netlify/Other)
Set this in your frontend deployment platform:

```bash
NEXT_PUBLIC_API_URL=https://uniapply-app.onrender.com/api
```

**Note**: If you don't set this, the frontend will auto-detect production and use the deployed backend URL automatically.

## 🚀 How to Update Files on GitHub

### Option 1: Using Git Command Line

1. **Check current status**:
   ```bash
   git status
   ```

2. **Add all changes**:
   ```bash
   git add .
   ```

3. **Commit changes**:
   ```bash
   git commit -m "Fix: Update API URL configuration and CORS settings for deployment"
   ```

4. **Push to GitHub**:
   ```bash
   git push origin main
   ```
   (Replace `main` with your branch name if different, e.g., `master`)

### Option 2: Using GitHub Desktop

1. Open GitHub Desktop
2. Review the changes in the left panel
3. Add a commit message: "Fix: Update API URL configuration and CORS settings for deployment"
4. Click **Commit to main** (or your branch name)
5. Click **Push origin** to upload to GitHub

### Option 3: Using VS Code Git Integration

1. Open the Source Control panel (Ctrl+Shift+G / Cmd+Shift+G)
2. Stage all changes (+ icon)
3. Enter commit message: "Fix: Update API URL configuration and CORS settings for deployment"
4. Click ✓ to commit
5. Click the sync icon or "Push" to upload to GitHub

## ✅ Files Modified

The following files have been updated:

1. **frontend/lib/api.ts**
   - Updated API URL configuration with auto-detection
   - Enhanced error handling and logging

2. **frontend/next.config.js**
   - Updated default API URL to deployed backend

3. **frontend/app/auth/login/page.tsx**
   - Improved error handling and user feedback

4. **backend/server.js**
   - Fixed CORS configuration to allow production frontend

## 🔍 Testing the Fixes

### Test Login Locally
1. Make sure backend is running on `http://localhost:3001`
2. Start frontend: `cd frontend && npm run dev`
3. Try logging in - should work with local backend

### Test Login in Production
1. Ensure backend is deployed and running on Render
2. Ensure frontend is deployed with correct environment variables
3. Try logging in with test credentials
4. Check browser console for any errors
5. Check backend logs on Render for request details

### Verify API Connection
Test the backend health endpoint:
```bash
curl https://uniapply-app.onrender.com/api/health
```

Should return: `{"status":"ok","message":"UniApply API is running"}`

## 🐛 Troubleshooting

### If login still fails with 500 error:

1. **Check Backend Logs** (Render Dashboard):
   - Look for database connection errors
   - Check if JWT_SECRET is set
   - Verify DB_URL is correct

2. **Check Frontend Console**:
   - Open browser DevTools (F12)
   - Check Network tab for failed requests
   - Look at Console for error messages

3. **Verify Environment Variables**:
   - Backend: Ensure all required vars are set in Render
   - Frontend: Ensure `NEXT_PUBLIC_API_URL` is set (or let it auto-detect)

4. **Test Backend Directly**:
   ```bash
   curl -X POST https://uniapply-app.onrender.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123"}'
   ```

5. **Database Issues**:
   - Ensure PostgreSQL database is running and accessible
   - Verify connection string format
   - Check if tables are created (run migrations if needed)

## 📞 Additional Notes

- The frontend will automatically use the deployed backend URL when running in production (not localhost)
- CORS is now configured to allow all origins in production for flexibility
- You can restrict CORS by setting `FRONTEND_URL` environment variable on backend
- All API errors are now logged to console for easier debugging

