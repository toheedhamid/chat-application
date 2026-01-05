# Vercel Deployment Checklist

## Pre-Deployment Setup

### 1. Redis Configuration

**Option A: Upstash Redis (Recommended for Vercel)**
1. Go to [Upstash Console](https://console.upstash.com/)
2. Create a new Redis database
3. Choose a region close to your Vercel deployment region
4. Copy the REST URL and password from the dashboard
5. Format: `REDIS_URL=redis://default:YOUR_PASSWORD@YOUR_ENDPOINT:6379`

**Option B: Redis Cloud**
1. Go to [Redis Cloud](https://redis.com/try-free/)
2. Create a free account and database
3. Get connection details from the dashboard
4. Format: `REDIS_URL=redis://:YOUR_PASSWORD@YOUR_HOST:6379`

**Important Notes:**
- For Upstash, you may need to use the REST API endpoint instead of direct Redis connection
- If using Upstash REST API, you'll need to modify the Redis client initialization
- Ensure your Redis instance allows connections from Vercel's IP ranges

### 2. Environment Variables in Vercel

Go to your Vercel project dashboard:
1. Navigate to **Settings** > **Environment Variables**
2. Add the following variables:

```
REDIS_URL=redis://default:YOUR_PASSWORD@YOUR_ENDPOINT:6379
REDIS_PASSWORD=YOUR_PASSWORD
```

**For Production:**
- Set these variables for **Production** environment
- Optionally set different values for **Preview** and **Development**

### 3. Verify API Dependencies

Ensure `api/package.json` includes:
```json
{
  "dependencies": {
    "ioredis": "^5.3.2"
  }
}
```

### 4. Build Configuration

Verify `vercel.json` is configured correctly:
- API routes are built with `@vercel/node`
- React app is built with `@vercel/static-build`
- Routes are properly configured

## Deployment Steps

### Step 1: Install Vercel CLI (if not already installed)
```bash
npm i -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Link Your Project (if not already linked)
```bash
vercel link
```

### Step 4: Deploy to Preview
```bash
vercel
```

### Step 5: Test Preview Deployment
1. Check API endpoints:
   - `https://your-preview-url.vercel.app/api/status`
   - `https://your-preview-url.vercel.app/api/chat-memory`
2. Test chat functionality
3. Verify Redis connection is working

### Step 6: Deploy to Production
```bash
vercel --prod
```

## Post-Deployment Verification

### 1. Test API Endpoints

**Status Endpoint:**
```bash
curl https://your-app.vercel.app/api/status
```

Expected response:
```json
{
  "status": "healthy",
  "lastUpdate": "2024-...",
  "version": "1.0.0",
  "service": "Vercel Chat API"
}
```

**Chat Endpoint:**
```bash
curl -X POST https://your-app.vercel.app/api/chat-memory \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello",
    "conversationId": "test_123",
    "action": "chat"
  }'
```

Expected response:
```json
{
  "conversationId": "test_123",
  "message": "...",
  "historyCount": 1,
  "timestamp": "..."
}
```

### 2. Verify Redis Storage

**Get History:**
```bash
curl -X POST https://your-app.vercel.app/api/chat-memory \
  -H "Content-Type: application/json" \
  -d '{
    "conversationId": "test_123",
    "action": "get"
  }'
```

Expected response should include the history array with your previous messages.

### 3. Test Frontend

1. Open your deployed frontend URL
2. Send a test message
3. Verify the bot responds
4. Send another message with the same conversationId
5. Verify the bot remembers the conversation (message count increases)

### 4. Check Vercel Logs

1. Go to Vercel dashboard
2. Navigate to **Deployments** > Select your deployment > **Functions** tab
3. Check logs for:
   - Redis connection success messages
   - Any error messages
   - API request/response logs

## Troubleshooting

### Issue: Redis Connection Fails

**Symptoms:**
- API returns 503 error
- Logs show "Redis service unavailable"

**Solutions:**
1. Verify `REDIS_URL` and `REDIS_PASSWORD` are set correctly in Vercel
2. Check Redis instance is running and accessible
3. For Upstash, ensure you're using the correct endpoint format
4. Check if Redis requires SSL/TLS (some providers do)
5. Verify network connectivity from Vercel to Redis

### Issue: Conversations Not Saving

**Symptoms:**
- Chat works but history is lost between requests
- `historyCount` always returns 1

**Solutions:**
1. Check Vercel function logs for Redis save errors
2. Verify Redis `SET` operation is successful
3. Check if Redis key expiration is too short
4. Verify conversationId is consistent across requests

### Issue: CORS Errors

**Symptoms:**
- Browser console shows CORS errors
- API requests fail in browser

**Solutions:**
1. Verify CORS headers are set in API functions
2. Check if frontend URL is allowed in CORS configuration
3. Ensure `Access-Control-Allow-Origin` header is present

### Issue: Build Failures

**Symptoms:**
- Deployment fails during build
- Error messages about missing dependencies

**Solutions:**
1. Verify `api/package.json` exists and has correct dependencies
2. Check `react-chat-app/package.json` has build script
3. Ensure Node.js version is compatible (18.x or higher)
4. Check for syntax errors in API files

## Redis Configuration Notes

### Upstash Redis Specific

If using Upstash REST API (instead of direct Redis connection):
- You may need to use `@upstash/redis` package instead of `ioredis`
- Connection format differs: `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
- Update `chat-memory.js` to use Upstash client if needed

### Redis Connection String Formats

**Standard Redis:**
```
redis://:password@host:port
redis://default:password@host:port
```

**Redis with SSL:**
```
rediss://:password@host:port
```

**Upstash:**
```
redis://default:password@endpoint.upstash.io:6379
```

## Monitoring

### Vercel Analytics
- Enable Vercel Analytics in dashboard
- Monitor API function execution times
- Track error rates

### Redis Monitoring
- Use Redis provider's dashboard
- Monitor memory usage
- Check connection counts
- Set up alerts for high memory usage

## Security Checklist

- [ ] Environment variables are set in Vercel (not in code)
- [ ] Redis password is strong and secure
- [ ] CORS is configured correctly
- [ ] API endpoints validate input
- [ ] No sensitive data in logs
- [ ] Redis instance is not publicly accessible (if possible)

## Next Steps After Deployment

1. Set up custom domain (optional)
2. Configure monitoring and alerts
3. Set up CI/CD for automatic deployments
4. Implement rate limiting (if needed)
5. Add authentication (if required)
6. Set up backup strategy for Redis data
