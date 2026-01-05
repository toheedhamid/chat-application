# Deployment Checklist

## ✅ Railway Deployment (n8n)

### Pre-Deployment
- [x] `package-lock.json` generated in root
- [x] `railway.json` configured
- [x] `nixpacks.toml` created (alternative)
- [x] Root `package.json` has n8n dependency

### Railway Dashboard Setup
- [ ] Create Railway project from GitHub repo
- [ ] Set environment variables:
  ```
  N8N_BASIC_AUTH_ACTIVE=true
  N8N_BASIC_AUTH_USER=admin
  N8N_BASIC_AUTH_PASSWORD=your_secure_password
  N8N_HOST=0.0.0.0
  N8N_PORT=5678
  N8N_PROTOCOL=https
  WEBHOOK_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}/
  NODE_ENV=production
  ```
- [ ] Deploy and wait for completion
- [ ] Get Railway public domain URL
- [ ] Update `WEBHOOK_URL` with actual domain

### Post-Deployment
- [ ] Access n8n at `https://your-railway-app.railway.app`
- [ ] Login with basic auth credentials
- [ ] Import workflows from `n8n_workflows/` folder
- [ ] Activate workflows
- [ ] Test webhook endpoints

## ✅ Vercel Deployment (Frontend + API)

### Pre-Deployment
- [x] `vercel.json` updated with buildCommand and installCommand
- [x] `react-chat-app/package.json` has build script
- [x] API functions use CommonJS (module.exports)
- [x] Routing configured correctly

### Vercel Dashboard Setup
- [ ] Go to Project Settings → General
- [ ] **Root Directory**: Leave EMPTY (blank)
- [ ] **Framework Preset**: Other
- [ ] **Build Command**: `cd react-chat-app && npm run build`
- [ ] **Output Directory**: `react-chat-app/build`
- [ ] **Install Command**: `npm install --prefix react-chat-app && npm install --prefix api`

### Environment Variables
- [ ] Set in Vercel Dashboard → Environment Variables:
  ```
  REDIS_URL=redis://default:password@host:port
  REDIS_PASSWORD=your-redis-password
  REACT_APP_N8N_BASE_URL=https://your-railway-app.railway.app (optional)
  ```

### Optional: Vercel KV (Alternative to Redis)
- [ ] Go to Vercel Dashboard → Storage
- [ ] Create KV Database
- [ ] Connect to project
- [ ] Environment variables added automatically:
  - `KV_REST_API_URL`
  - `KV_REST_API_TOKEN`
- [ ] Update API functions to use `@vercel/kv` instead of `ioredis`

### Post-Deployment
- [ ] Test root URL: `https://your-app.vercel.app/`
- [ ] Test API status: `https://your-app.vercel.app/api/status`
- [ ] Test API chat: `https://your-app.vercel.app/api/chat-memory`
- [ ] Check browser console for errors
- [ ] Verify static assets load correctly

## 🔗 Connect Railway and Vercel

### Update Frontend
- [ ] Set `REACT_APP_N8N_BASE_URL` in Vercel environment variables
- [ ] Or update frontend code to use Railway webhook URLs
- [ ] Test frontend → Railway webhook communication

## 🧪 Testing

### Railway Tests
```bash
# Health check
curl https://your-railway-app.railway.app/healthz

# Test webhook (after importing workflow)
curl -X POST https://your-railway-app.railway.app/webhook/chat-memory \
  -H "Content-Type: application/json" \
  -d '{"message":"test","conversationId":"test","action":"chat"}'
```

### Vercel Tests
```bash
# API status
curl https://your-app.vercel.app/api/status

# API chat
curl -X POST https://your-app.vercel.app/api/chat-memory \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","conversationId":"test","action":"chat"}'
```

## 🐛 Troubleshooting

### Railway Issues
- **npm ci fails**: Check `package-lock.json` exists and is committed
- **n8n won't start**: Check environment variables, especially `N8N_HOST=0.0.0.0`
- **Can't access n8n**: Verify `N8N_PROTOCOL=https` and Railway domain

### Vercel Issues
- **Blank page**: Check browser console, verify routing in `vercel.json`
- **API 404**: Verify API routes in `vercel.json`, check function logs
- **Build fails**: Check build logs, verify `react-chat-app/package.json` has build script
- **Redis connection fails**: Verify `REDIS_URL` and `REDIS_PASSWORD` are set

## 📝 Notes

- Railway uses `package-lock.json` for deterministic builds
- Vercel uses `buildCommand` and `installCommand` from `vercel.json`
- Both deployments are independent - can deploy separately
- Railway webhook URL should be set in Vercel environment variables for frontend
