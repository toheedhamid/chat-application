# Deployment Overview

## Architecture

This project uses a **dual-deployment** strategy:

1. **Railway** → Hosts n8n workflows
2. **Vercel** → Hosts React frontend + API serverless functions

## Why This Setup?

- **Railway**: Better for long-running processes like n8n
- **Vercel**: Optimized for static sites and serverless functions
- **Separation of Concerns**: Frontend/API separate from workflow automation

## Quick Start

### Railway (n8n)
1. Connect GitHub repo to Railway
2. Railway auto-detects `railway.json` and `package.json`
3. Set environment variables (see `RAILWAY_DEPLOYMENT.md`)
4. Deploy!

### Vercel (Frontend + API)
1. Connect GitHub repo to Vercel
2. Vercel auto-detects `vercel.json`
3. Set environment variables (Redis URL, etc.)
4. Deploy!

## Environment Variables

### Railway (n8n)
See `RAILWAY_DEPLOYMENT.md` for complete list.

Key variables:
- `N8N_BASIC_AUTH_ACTIVE=true`
- `N8N_BASIC_AUTH_USER=username`
- `N8N_BASIC_AUTH_PASSWORD=password`
- `WEBHOOK_URL=https://n8n-main-instance-production-0ed4.up.railway.app/`

### Vercel (Frontend + API)
- `REDIS_URL=redis://...`
- `REDIS_PASSWORD=...`
- `REACT_APP_N8N_BASE_URL=https://n8n-main-instance-production-0ed4.up.railway.app` (optional)

## File Structure

```
my-chat-project/
├── api/                    # Vercel serverless functions
│   ├── chat-memory.js
│   ├── status.js
│   └── package.json
├── react-chat-app/          # React frontend (Vercel)
│   ├── src/
│   ├── public/
│   └── package.json
├── n8n_workflows/           # n8n workflow exports
│   └── *.json
├── railway.json             # Railway configuration
├── package.json             # Railway n8n dependencies
├── vercel.json              # Vercel configuration
└── start.sh                 # Railway start script
```

## Deployment Flow

1. **Push to GitHub** → Triggers both deployments
2. **Railway** → Builds and starts n8n
3. **Vercel** → Builds React app and deploys API functions
4. **Connect** → Frontend calls Railway webhooks via n8n

## Testing

### Test Railway (n8n)
```bash
curl https://your-railway-app.railway.app/healthz
```

### Test Vercel API
```bash
curl https://your-vercel-app.vercel.app/api/status
```

### Test Frontend
Visit: `https://your-vercel-app.vercel.app/`

## Troubleshooting

### Railway Issues
- Check `RAILWAY_DEPLOYMENT.md`
- View Railway logs in dashboard
- Verify environment variables

### Vercel Issues
- Check `VERCEL_DASHBOARD_SETUP.md`
- View Vercel function logs
- Verify Redis connection

## Cost

- **Railway**: $5 free credit/month (usually enough for n8n)
- **Vercel**: Free tier (generous limits)
- **Total**: ~$0/month for small projects

## Next Steps

1. ✅ Deploy to Railway
2. ✅ Deploy to Vercel
3. ✅ Import workflows to n8n
4. ✅ Connect frontend to Railway webhooks
5. ✅ Test end-to-end
