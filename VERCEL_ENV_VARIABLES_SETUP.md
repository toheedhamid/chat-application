# Vercel Environment Variables Setup Guide

## Current Issue

Your Vercel environment variables are pointing to `localhost`, which won't work in production. You need to update them to point to your Railway backend.

## Required Environment Variables

### Step 1: Get Your Railway Backend URL

1. Go to **Railway Dashboard**: https://railway.app/
2. Select your **n8n project**
3. Go to **Settings** → **Networking** (or **Deployments** → View your service)
4. Copy your **Railway domain** (e.g., `your-app.up.railway.app` or `your-app.railway.app`)
5. Your full Railway URL will be: `https://your-railway-domain.railway.app`

### Step 2: Update Vercel Environment Variables

Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

#### Remove or Update These (Currently pointing to localhost):

❌ **Remove or Update:**
- `REACT_APP_N8N_WEBHOOK_URL`: `http://localhost:5678/webhook/chat-memory` 
  - **Action**: Delete this (not needed)
  
- `REACT_APP_API_BASE_URL`: `http://localhost:5678`
  - **Action**: Update to `/api` (for Vercel API fallback) OR delete if not using Vercel API

#### Add This New Variable:

✅ **Add:**
```
REACT_APP_N8N_BASE_URL=https://n8n-main-instance-production-0ed4.up.railway.app
```

**Important:**
- Replace `your-railway-domain.railway.app` with your **actual Railway domain**
- Use `https://` (not `http://`)
- No trailing slash
- Select **Production**, **Preview**, and **Development** environments
- Click **Save**

### Step 3: Complete Environment Variables List

Here's what your Vercel environment variables should look like:

```bash
# Railway n8n Backend (REQUIRED for AnswerQuery2)
REACT_APP_N8N_BASE_URL=https://n8n-main-instance-production-0ed4.up.railway.app

# Vercel API Fallback (Optional - only if using Vercel API as backup)
REACT_APP_API_BASE_URL=/api

# App Info (Optional)
REACT_APP_APP_NAME=Chat Application
REACT_APP_VERSION=1.0.0
```

**Note:** You can remove these if not needed:
- `REACT_APP_N8N_WEBHOOK_URL` (not used by code)
- `REACT_APP_API_BASE_URL` pointing to localhost (update to `/api` or remove)

## How It Works

### With Railway Backend (Recommended):

```
Frontend → REACT_APP_N8N_BASE_URL/webhook/answer → Railway n8n → AnswerQuery2
```

**Example:**
- `REACT_APP_N8N_BASE_URL=https://my-app.up.railway.app`
- Frontend calls: `https://my-app.up.railway.app/webhook/answer`

### Without Railway (Fallback):

```
Frontend → /api/chat-memory → Vercel API → Redis
```

## Verification Steps

### 1. Check Environment Variable is Set

After redeploying, open browser console on your Vercel site and run:
```javascript
console.log('N8N Base URL:', process.env.REACT_APP_N8N_BASE_URL);
```

Should show your Railway URL (not `undefined` or `localhost`).

### 2. Test Railway Backend

Test your Railway backend directly:
```bash
curl -X POST https://your-railway-domain.railway.app/webhook/answer \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello","conversationId":"test123"}'
```

Should return a response from AnswerQuery2.

### 3. Test from Frontend

1. Visit: https://hexaa-chatbot-aymz.vercel.app/
2. Open **DevTools** (F12) → **Network** tab
3. Send a test message
4. Look for request to `/webhook/answer` on your Railway domain
5. Check response status (should be 200)

## Troubleshooting

### Issue: Still using localhost

**Symptoms:**
- Console shows requests to `localhost:5678`
- Environment variable not being read

**Solution:**
1. Verify `REACT_APP_N8N_BASE_URL` is set in Vercel (not just `REACT_APP_N8N_WEBHOOK_URL`)
2. Make sure you **redeployed** after setting the variable
3. Check variable name spelling (case-sensitive)
4. Verify it's set for **Production** environment

### Issue: CORS Errors

**Symptoms:**
- Browser console shows CORS policy errors

**Solution:**
1. Verify Railway n8n is running
2. Check `N8N_PROTOCOL=https` in Railway
3. Verify Railway domain is correct
4. Ensure AnswerQuery2 workflow is activated

### Issue: 404 Not Found

**Symptoms:**
- Console shows 404 when calling `/webhook/answer`

**Solution:**
1. Verify AnswerQuery2 workflow is imported and **activated** in Railway n8n
2. Check webhook path is `/webhook/answer` (not `/webhook/chat-memory`)
3. Verify Railway domain is correct
4. Check Railway logs for errors

## Quick Setup Checklist

- [ ] Get Railway domain from Railway Dashboard
- [ ] Add `REACT_APP_N8N_BASE_URL` in Vercel with Railway URL
- [ ] Remove or update `REACT_APP_N8N_WEBHOOK_URL` (not needed)
- [ ] Update `REACT_APP_API_BASE_URL` to `/api` or remove
- [ ] Select all environments (Production, Preview, Development)
- [ ] Save environment variables
- [ ] Redeploy frontend in Vercel
- [ ] Test connection from frontend
- [ ] Verify AnswerQuery2 workflow is active in Railway

## Example Configuration

**Before (Wrong):**
```
REACT_APP_N8N_WEBHOOK_URL=http://localhost:5678/webhook/chat-memory
REACT_APP_API_BASE_URL=http://localhost:5678
```

**After (Correct):**
```
REACT_APP_N8N_BASE_URL=https://hexaa-n8n.up.railway.app
REACT_APP_API_BASE_URL=/api
```

After making these changes and redeploying, your frontend will connect to Railway!
