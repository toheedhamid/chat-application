# Production Setup Guide - Vercel Frontend + Railway Backend

## 🎯 Overview

This guide will help you connect your **Vercel frontend** (https://hexaa-chatbot.vercel.app/) to your **Railway n8n backend** (https://n8n-main-instance-production-0ed4.up.railway.app/).

## 📋 Architecture

```
Frontend (Vercel) → Railway n8n → AnswerQuery2 Workflow → Redis → Response
```

**Production URLs:**
- **Frontend**: https://hexaa-chatbot.vercel.app/
- **Backend**: https://n8n-main-instance-production-0ed4.up.railway.app/
- **Webhook**: https://n8n-main-instance-production-0ed4.up.railway.app/webhook/answer

---

## ✅ Step 1: Configure Railway (Backend)

### 1.1 Verify n8n is Running

1. Go to Railway Dashboard: https://railway.app/
2. Select your n8n project
3. Check **Deployments** tab - should show "Active"
4. Open your Railway URL: https://n8n-main-instance-production-0ed4.up.railway.app/
5. Login with your basic auth credentials

### 1.2 Verify AnswerQuery2 Workflow is Active

1. In n8n UI, go to **Workflows**
2. Find **AnswerQuery2** workflow
3. Ensure it's **ACTIVATED** (toggle switch should be ON)
4. Click on **AnswerQuery2** to open it
5. Check the **Webhook** node:
   - Path should be: `answer` (creates `/webhook/answer` endpoint)
   - Method: `POST`
   - Status: **Active** (green dot)

### 1.3 Set Railway Environment Variables

Go to Railway Dashboard → Your Project → **Variables** tab

**Required Variables:**

```bash
# Basic n8n Configuration
N8N_PROTOCOL=https
N8N_HOST=0.0.0.0
N8N_PORT=5678
N8N_EDITOR_BASE_URL=https://n8n-main-instance-production-0ed4.up.railway.app/
WEBHOOK_URL=https://n8n-main-instance-production-0ed4.up.railway.app/

# Basic Authentication (REQUIRED)
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=your_secure_password

# Encryption Key (REQUIRED - 32 characters)
N8N_ENCRYPTION_KEY=your-random-32-character-key

# Disable problematic features
N8N_COMMUNITY_PACKAGES_ENABLED=false
N8N_DIAGNOSTICS_ENABLED=false

# Redis Configuration (if using Redis)
QUEUE_BULL_REDIS_HOST=your-redis-host
QUEUE_BULL_REDIS_PORT=6379
QUEUE_BULL_REDIS_PASSWORD=your-redis-password
EXECUTIONS_MODE=queue

# OpenAI (if using OpenAI in workflows)
N8N_OPENAI_API_KEY=sk-proj-your-key-here
```

**📝 Note:** See `RAILWAY_ENV_VARIABLES.md` for complete list.

### 1.4 Enable CORS (if needed)

n8n webhooks should allow CORS by default. If you encounter CORS errors:

1. In Railway, add this variable:
   ```bash
   N8N_CORS_ORIGIN=https://hexaa-chatbot.vercel.app
   ```

2. Or allow all origins (less secure):
   ```bash
   N8N_CORS_ORIGIN=*
   ```

---

## ✅ Step 2: Configure Vercel (Frontend)

### 2.1 Set Environment Variable

1. Go to Vercel Dashboard: https://vercel.com/dashboard
2. Select your project: **hexaa-chatbot**
3. Go to **Settings** → **Environment Variables**
4. Add the following variable:

```bash
REACT_APP_N8N_BASE_URL=https://n8n-main-instance-production-0ed4.up.railway.app
```

**Important:**
- ✅ Select **Production**, **Preview**, and **Development** environments
- ✅ Click **Save**
- ❌ **DO NOT** include `/webhook/answer` in the URL (just the base URL)

### 2.2 Remove Old/Incorrect Variables

Check your Vercel environment variables and **remove** these if they exist:
- ❌ `REACT_APP_N8N_BASE_URL` pointing to `localhost`
- ❌ `REACT_APP_N8N_WEBHOOK_URL` pointing to `localhost`
- ❌ `REACT_APP_API_BASE_URL` pointing to `localhost`

**Keep only:**
- ✅ `REACT_APP_N8N_BASE_URL=https://n8n-main-instance-production-0ed4.up.railway.app`

### 2.3 Redeploy Frontend

After setting the environment variable:

1. Go to Vercel Dashboard → Your Project → **Deployments**
2. Click the **"..."** menu (three dots) on the latest deployment
3. Select **"Redeploy"**
4. Or push a new commit to trigger automatic redeploy

**Wait for deployment to complete** (usually 1-2 minutes)

---

## ✅ Step 3: Test the Connection

### 3.1 Test Railway Webhook Directly

Test your Railway backend using curl or Postman:

```bash
curl -X POST https://n8n-main-instance-production-0ed4.up.railway.app/webhook/answer \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, how are you?",
    "conversationId": "test123"
  }'
```

**Expected Response:**
```json
{
  "answer": "Hello! I'm doing well, thank you for asking...",
  "conversationId": "test123",
  ...
}
```

### 3.2 Test from Frontend

1. Open your frontend: https://hexaa-chatbot.vercel.app/
2. Open **Browser DevTools** (F12)
3. Go to **Console** tab
4. Send a test message: "Hello"
5. Check console logs:
   - ✅ Should show: `Using API URL: https://n8n-main-instance-production-0ed4.up.railway.app/webhook/answer`
   - ✅ Should show: `Chat API response data: {...}`
   - ❌ Should **NOT** show CORS errors
   - ❌ Should **NOT** show `localhost` URLs

### 3.3 Check Network Tab

1. In DevTools, go to **Network** tab
2. Send a message
3. Look for request to `/webhook/answer`
4. Check:
   - ✅ **Status**: 200 OK
   - ✅ **Request URL**: `https://n8n-main-instance-production-0ed4.up.railway.app/webhook/answer`
   - ✅ **Request Payload**: `{"text":"Hello","conversationId":"conv_..."}`
   - ✅ **Response**: Contains `answer` field

---

## 🔧 Troubleshooting

### Issue: Frontend still using localhost

**Symptoms:**
- Console shows requests to `localhost:5678`
- Environment variable not being read

**Solution:**
1. Verify `REACT_APP_N8N_BASE_URL` is set in Vercel (not just locally)
2. Make sure you **redeployed** after setting the variable
3. Check variable name spelling (case-sensitive: `REACT_APP_N8N_BASE_URL`)
4. Verify it's set for **Production** environment
5. Clear browser cache and hard refresh (Ctrl+Shift+R)

### Issue: CORS Errors

**Symptoms:**
```
Access to fetch at 'https://...' from origin 'https://hexaa-chatbot.vercel.app' 
has been blocked by CORS policy
```

**Solution:**
1. In Railway, add:
   ```bash
   N8N_CORS_ORIGIN=https://hexaa-chatbot.vercel.app
   ```
2. Redeploy Railway service
3. Verify `N8N_PROTOCOL=https` is set in Railway

### Issue: 404 Not Found

**Symptoms:**
- Network tab shows `404 Not Found` when sending messages

**Solution:**
1. Verify AnswerQuery2 workflow is **ACTIVATED** in n8n
2. Check webhook path is `/webhook/answer` (not `/webhook-test/answer`)
3. Verify Railway domain is correct: `n8n-main-instance-production-0ed4.up.railway.app`
4. Check n8n logs in Railway Dashboard → Deployments → View Logs

### Issue: 401 Unauthorized

**Symptoms:**
- Network tab shows `401 Unauthorized`

**Solution:**
1. Check if basic auth is enabled in Railway
2. Verify `N8N_BASIC_AUTH_ACTIVE=true` is set
3. Webhooks should work without auth, but check n8n settings

### Issue: No Response / Timeout

**Symptoms:**
- Request hangs or times out
- No response from backend

**Solution:**
1. Check Railway service is running (Dashboard → Deployments)
2. Check n8n execution logs (n8n UI → Executions)
3. Verify Redis connection (if using Redis)
4. Check Railway logs for errors

### Issue: Wrong Request Format

**Symptoms:**
- Backend receives request but workflow fails
- Error in n8n execution logs

**Solution:**
1. Verify request body format:
   ```json
   {
     "text": "user message",
     "conversationId": "conv_123"
   }
   ```
2. Check n8n workflow expects `body.text` and `body.conversationId`
3. Verify webhook node is configured correctly

---

## 📊 Verification Checklist

Use this checklist to verify everything is working:

### Railway (Backend)
- [ ] n8n service is running and healthy
- [ ] AnswerQuery2 workflow is imported and activated
- [ ] Webhook path is `/webhook/answer`
- [ ] All required environment variables are set
- [ ] Can access n8n UI at Railway URL
- [ ] Direct webhook test returns response

### Vercel (Frontend)
- [ ] `REACT_APP_N8N_BASE_URL` is set correctly
- [ ] No `localhost` URLs in environment variables
- [ ] Frontend is redeployed after setting env var
- [ ] Frontend loads without errors

### Connection
- [ ] Frontend sends requests to Railway URL (not localhost)
- [ ] Network tab shows 200 OK responses
- [ ] Console shows correct API URL
- [ ] Chat messages are sent and received
- [ ] No CORS errors in console
- [ ] Conversation history is stored (check Redis)

---

## 🚀 Quick Reference

### Frontend Code Changes

The frontend code has been updated to:
- ✅ Use `/webhook/answer` path for production
- ✅ Send correct request format: `{ text, conversationId }`
- ✅ Handle responses from n8n: `{ answer, conversationId, ... }`
- ✅ Filter out `localhost` URLs in production

### Key Files

- `react-chat-app/src/ChatInput.js` - Handles message sending
- `react-chat-app/src/ChatDrawer.js` - Main chat component
- `n8n_workflows/AnswerQuery2.json` - Main workflow

### Environment Variables Summary

**Vercel:**
```bash
REACT_APP_N8N_BASE_URL=https://n8n-main-instance-production-0ed4.up.railway.app
```

**Railway:**
```bash
N8N_PROTOCOL=https
N8N_EDITOR_BASE_URL=https://n8n-main-instance-production-0ed4.up.railway.app/
WEBHOOK_URL=https://n8n-main-instance-production-0ed4.up.railway.app/
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=your_password
N8N_ENCRYPTION_KEY=your-32-char-key
```

---

## 📞 Support

If you encounter issues:

1. Check Railway logs: Dashboard → Deployments → View Logs
2. Check n8n execution logs: n8n UI → Executions
3. Check browser console: F12 → Console tab
4. Check network requests: F12 → Network tab

---

## ✅ Success Indicators

You'll know everything is working when:

1. ✅ Frontend loads at https://hexaa-chatbot.vercel.app/
2. ✅ Chat drawer opens and sends messages
3. ✅ Messages are received and bot responds
4. ✅ Console shows Railway URL (not localhost)
5. ✅ Network tab shows 200 OK responses
6. ✅ Conversation history persists (Redis working)

**🎉 Congratulations! Your production setup is complete!**

