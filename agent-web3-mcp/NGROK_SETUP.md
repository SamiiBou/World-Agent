# 🌐 Ngrok Configuration Guide

## Current Setup

This application uses ngrok to expose local development servers to the internet for testing with World App.

### Active Tunnels

- **Frontend**: `https://77789bb5180a.ngrok.app` → `http://localhost:5173`
- **Backend**: `https://37b2a30b1f1c.ngrok.app` → `http://localhost:3001`

## Configuration

### Backend URL Configuration

The backend URL is configured in `src/config/environment.ts`:

```typescript
backend: {
  baseUrl: process.env.REACT_APP_BACKEND_URL || 'https://37b2a30b1f1c.ngrok.app',
},
```

### Environment Variables

Create a `.env` file in the frontend root with:

```bash
# Backend URL (ngrok tunnel)
REACT_APP_BACKEND_URL=https://37b2a30b1f1c.ngrok.app

# Other environment variables...
REACT_APP_OPENAI_API_KEY=your_openai_api_key
REACT_APP_WORLDCHAIN_ALCHEMY_API_KEY=your_alchemy_api_key
```

## 🔄 Updating Ngrok URLs

When your ngrok URLs change, you need to update:

1. **Frontend configuration** (this file updates automatically via env var)
2. **Backend CORS settings** (if needed)
3. **World App mini-app configuration** (use the frontend URL)

## 📱 Testing with World App

1. Open World App on your device
2. Navigate to the mini-app using the frontend URL: `https://77789bb5180a.ngrok.app`
3. The app will authenticate using the backend URL: `https://37b2a30b1f1c.ngrok.app`

## 🐛 Troubleshooting

### Common Issues

1. **"DOMException" errors**: Usually means the frontend is trying to call the wrong backend URL
2. **Network errors**: Check if both ngrok tunnels are running
3. **CORS errors**: Make sure the backend allows requests from the frontend ngrok URL

### Debug Steps

1. Check the browser console for the actual URLs being called
2. Verify both servers are running:
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:3001`
3. Test backend endpoints directly:
   ```bash
   curl https://37b2a30b1f1c.ngrok.app/api/nonce
   ```

## 🚀 Starting the Development Environment

1. **Start the backend**:
   ```bash
   cd backend
   npm start
   ```

2. **Start the frontend**:
   ```bash
   npm start
   ```

3. **Start ngrok tunnels**:
   ```bash
   # Terminal 1 - Frontend tunnel
   ngrok http 5173

   # Terminal 2 - Backend tunnel  
   ngrok http 3001
   ```

4. **Update URLs** in this file and environment variables as needed

## 📋 Quick Checklist

- [ ] Backend server running on port 3001
- [ ] Frontend server running on port 5173
- [ ] Ngrok tunnels active for both ports
- [ ] Environment variables updated with current ngrok URLs
- [ ] World App configured with frontend ngrok URL
- [ ] Test authentication flow works end-to-end 