# Frontend-Backend Connection Guide

## Overview

Your frontend is deployed on **Vercel** at: https://hexaa-chatbot-aymz.vercel.app/
Your backend (n8n workflows) is deployed on **Railway**.

## Architecture

```
Frontend (Vercel) → Railway n8n Backend → AnswerQuery2 Workflow
```

## Configuration Steps

### Step 1: Get Your Railway Backend URL

1. Go to Railway Dashboard
2. Select your n8n project
3. Go to Settings → Networking
4. Copy your Railway domain (e.g., `your-app.up.railway.app` or `your-app.railway.app`)
5. Your full backend URL will be: `https://your-railway-domain.railway.app`

### Step 2: Set Environment Variable in Vercel

1. Go to Vercel Dashboard: https://vercel.com/dashboard
2. Select your project: `hexaa-chatbot`
3. Go to **Settings** → **Environment Variables**
4. Add the following variable:

```
REACT_APP_N8N_BASE_URL=https://your-railway-domain.railway.app
```

**Important:**
- Replace `your-railway-domain.railway.app` with your actual Railway domain
- Select **Production**, **Preview**, and **Development** environments
- Click **Save**

### Step 3: Redeploy Frontend

After setting the environment variable:

1. Go to Vercel Dashboard → Your Project → **Deployments**
2. Click the **"..."** menu on the latest deployment
3. Select **"Redeploy"**
4. Or push a new commit to trigger automatic redeploy

### Step 4: Verify Connection

1. Open your frontend: https://hexaa-chatbot-aymz.vercel.app/
2. Open browser DevTools (F12) → **Console** tab
3. Send a test message
4. Check console logs:
   - Should show: `Sending message: [your message]`
   - Should show: `Chat API response data: {...}`
   - Should NOT show CORS errors

## How It Works

### Request Flow

1. **User sends message** in frontend
2. **Frontend** sends POST request to Railway n8n:
   ```
   POST https://your-railway-domain.railway.app/webhook/answer
   Body: { text: "user message", conversationId: "conv_123" }
   ```
3. **Railway n8n** receives request at `/webhook/answer`
4. **AnswerQuery2 workflow** processes the request
5. **Response** sent back to frontend:
   ```
   { answer: "bot response", conversationId: "conv_123", ... }
   ```
6. **Frontend** displays the response

### Endpoints Used

| Component | Endpoint | Purpose |
|-----------|----------|---------|
| ChatInput | `/webhook/answer` | Main chat (AnswerQuery2 workflow) |
| ChatDrawer | `/webhook/answer` | Chat messages |
| ChatDrawer | `/api/status` | Status check (Vercel API) |

## Environment Variables Reference

### Vercel Environment Variables

```bash
# Required: Railway n8n backend URL
REACT_APP_N8N_BASE_URL=https://your-railway-domain.railway.app

# Optional: Fallback to Vercel API if Railway is unavailable
REACT_APP_API_BASE_URL=/api
```

### Railway Environment Variables

Make sure these are set in Railway (for n8n to work):

```bash
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=your_password
N8N_PROTOCOL=https
WEBHOOK_URL=https://n8n-main-instance-production-0ed4.up.railway.app/
```

## Troubleshooting

### Issue: CORS Errors

**Symptoms:**
- Browser console shows: `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**Solution:**
1. Check Railway n8n is running
2. Verify `N8N_PROTOCOL=https` is set in Railway
3. Check if Railway domain is correct
4. Ensure AnswerQuery2 workflow is activated in n8n

### Issue: 404 Not Found

**Symptoms:**
- Console shows: `404 Not Found` when sending messages

**Solution:**
1. Verify AnswerQuery2 workflow is imported and activated in Railway n8n
2. Check webhook path is `/webhook/answer` (not `/webhook/chat-memory`)
3. Verify Railway domain is correct in Vercel environment variables
4. Check Railway logs for errors

### Issue: 401 Unauthorized

**Symptoms:**
- Console shows: `401 Unauthorized`

**Solution:**
1. Check if basic auth is enabled in Railway
2. If using basic auth, you may need to add credentials to requests
3. Or disable basic auth for webhook endpoints (not recommended for production)

### Issue: Messages Not Sending

**Symptoms:**
- No response from backend
- Console shows network errors

**Solution:**
1. Check Railway n8n is running (visit Railway dashboard)
2. Verify `REACT_APP_N8N_BASE_URL` is set correctly in Vercel
3. Check browser console for specific error messages
4. Verify AnswerQuery2 workflow is active in n8n UI

## Testing the Connection

### Test 1: Check Environment Variable

Open browser console on your Vercel site and run:
```javascript
console.log('N8N URL:', process.env.REACT_APP_N8N_BASE_URL);
```

Should show your Railway URL.

### Test 2: Test Webhook Directly

```bash
curl -X POST https://n8n-main-instance-production-0ed4.up.railway.app/workflow/baDvL8rKKuvg04bvQfm1m \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello","conversationId":"test123"}'
```

Should return a response from AnswerQuery2 workflow.

### Test 3: Test from Frontend

1. Open https://hexaa-chatbot-aymz.vercel.app/
2. Open DevTools → Network tab
3. Send a message
4. Look for request to `/webhook/answer`
5. Check response status (should be 200)

## Code Changes Made

### ChatInput.js
- Updated to use Railway n8n webhook `/webhook/answer`
- Changed request format to match AnswerQuery2 (`text` instead of `message`)
- Handles both n8n and Vercel API responses

### ChatDrawer.js
- Updated API endpoints to use Railway n8n when available
- Falls back to Vercel API if Railway URL not set

## Next Steps

1. ✅ Set `REACT_APP_N8N_BASE_URL` in Vercel
2. ✅ Redeploy frontend
3. ✅ Test connection
4. ✅ Verify AnswerQuery2 workflow is active in Railway
5. ✅ Test end-to-end chat functionality

## Support

If you encounter issues:
1. Check Railway logs for n8n errors
2. Check Vercel function logs for API errors
3. Check browser console for frontend errors
4. Verify all environment variables are set correctly
