# Railway Deployment Guide for n8n

## Overview
This guide helps you deploy n8n workflows to Railway while keeping your Vercel deployment for the frontend and API.

## Architecture
- **Railway**: Hosts n8n workflows (with automatic workflow import)
- **Vercel**: Hosts React frontend + API serverless functions

## Automatic Workflow Deployment

All workflows from `n8n_workflows/` are automatically imported when n8n starts:
- ✅ 12 workflows automatically imported
- ✅ AnswerQuery2 automatically activated
- ✅ No manual steps required

## Step 1: Railway Project Setup

### 1.1 Create Railway Project
1. Go to [Railway](https://railway.app/)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository: `toheedhamid/hexaa-chatbot`

### 1.2 Configure Build Settings
Railway will automatically detect:
- **Builder**: NIXPACKS (configured in `railway.json`)
- **Start Command**: `npx n8n start` (from `railway.json`)

## Step 2: Environment Variables

Go to Railway Dashboard → Your Project → Variables tab and add:

**📋 See `RAILWAY_ENV_VARIABLES.md` for complete environment variables documentation.**

**Quick Reference:**

### Required n8n Variables:
```bash
# Basic Auth (REQUIRED for production)
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=your_secure_password

# Server Configuration
N8N_HOST=0.0.0.0
N8N_PORT=5678
N8N_PROTOCOL=https
N8N_EDITOR_BASE_URL=https://your-app-name.up.railway.app/

# Webhook URL (Use Railway template variable)
WEBHOOK_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}/

# Encryption Key (REQUIRED - Generate a random 32-character string)
N8N_ENCRYPTION_KEY=your-random-32-character-encryption-key

# Database (Optional - uses SQLite by default)
# For production, consider PostgreSQL:
# DB_TYPE=postgresdb
# DB_POSTGRESDB_HOST=your-postgres-host
# DB_POSTGRESDB_PORT=5432
# DB_POSTGRESDB_DATABASE=n8n
# DB_POSTGRESDB_USER=your-user
# DB_POSTGRESDB_PASSWORD=your-password
```

### Redis Configuration (for Queue):
```bash
QUEUE_BULL_REDIS_HOST=your-redis-host.railway.app
QUEUE_BULL_REDIS_PORT=6379
QUEUE_BULL_REDIS_DB=0
QUEUE_BULL_REDIS_USER=default
QUEUE_BULL_REDIS_PASSWORD=your-redis-password

# Queue Mode
EXECUTIONS_MODE=queue
QUEUE_HEALTH_CHECK_ACTIVE=true
```

### OpenAI API (Optional):
```bash
N8N_OPENAI_API_KEY=sk-proj-your-openai-api-key
```

### SMTP Email Configuration (Optional - Gmail):
```bash
N8N_SMTP_HOST=smtp.gmail.com
N8N_SMTP_PORT=587
N8N_SMTP_USER=toheedhamid9@gmail.com
N8N_SMTP_PASS=your-app-specific-password
N8N_SMTP_SENDER=toheedhamid9@gmail.com
N8N_SMTP_SSL=false
```

**Note**: You need to generate a Gmail App Password (not your regular password). See `GMAIL_APP_PASSWORD_SETUP.md` for instructions.

### Optional n8n Variables:
```bash
# Encryption (Required for production)
N8N_ENCRYPTION_KEY=your-32-character-encryption-key

# Timezone
TZ=UTC

# Execution Settings
EXECUTIONS_PROCESS=main
EXECUTIONS_DATA_SAVE_ON_ERROR=all
EXECUTIONS_DATA_SAVE_ON_SUCCESS=all
EXECUTIONS_DATA_MAX_AGE=336

# Logging
N8N_LOG_LEVEL=info
N8N_LOG_OUTPUT=console
```

## Step 3: Deploy

### 3.1 Automatic Deployment
Railway will automatically deploy when you push to your main branch.

### 3.2 Manual Deployment
1. Railway Dashboard → Your Project
2. Click "Deploy" or trigger a new deployment

## Step 4: Get Your Webhook URL

After deployment:
1. Railway Dashboard → Your Project → Settings
2. Copy your Railway domain (e.g., `your-app.railway.app`)
3. Your webhook URL will be: `https://your-app.railway.app/webhook/`
4. Update `WEBHOOK_URL` environment variable with this URL

## Step 5: Access n8n Interface

1. Go to your Railway app URL: `https://your-app.railway.app`
2. You'll be prompted for basic auth (if enabled)
3. Login with your credentials
4. Import your workflows from `n8n_workflows/` folder

## Step 6: Update Frontend to Use Railway Webhooks

Update your React app to use Railway webhook URLs:

### Option A: Environment Variable
In Vercel Dashboard → Environment Variables:
```
REACT_APP_N8N_BASE_URL=https://your-railway-app.railway.app
```

### Option B: Update Frontend Code
Update `react-chat-app/src/ChatInput.js`:
```javascript
const API_BASE_URL = process.env.REACT_APP_N8N_BASE_URL || 
                     process.env.REACT_APP_API_BASE_URL || 
                     '/api';
```

## Step 7: Automatic Workflow Import

**✅ Workflows are automatically imported on deployment!**

When n8n starts on Railway, all workflows from the `n8n_workflows/` folder are automatically imported:
- All 12 workflows are imported automatically
- AnswerQuery2 is automatically activated (main workflow)
- Existing workflows are updated if they already exist
- No manual import needed!

### Workflows Auto-Imported:
1. **AnswerQuery2** (main - automatically activated)
2. chat-memory-workflow.json
3. Conversation Summarization.json
4. EstimateBallpark.json
5. GetCaseStudies.json
6. kb-status-workflow.json
7. load-test-workflow.json
8. Navigate.json
9. NightlyIngest.json
10. predict.json
11. reindex-now-workflow.json
12. Typing Indicator.json

### Verify Workflows Are Imported:
1. Access n8n interface at your Railway URL
2. Go to Workflows page
3. You should see all 12 workflows listed
4. Verify AnswerQuery2 is active (green toggle)

### Manual Re-Import (if needed):
If you need to re-import workflows manually:
1. SSH into Railway container (if available)
2. Run: `node /data/scripts/import-workflows.js`
3. Or use n8n UI: Workflows → Import from File

## Step 8: Configure Workflow Webhooks

After importing workflows:
1. Open each workflow in n8n
2. Check the Webhook node settings
3. The webhook URL should automatically use your Railway domain
4. Activate the workflows

## Troubleshooting

### Issue: n8n won't start
**Solution**: 
- Check Railway logs for errors
- Verify Node.js version (should be 18+)
- Check environment variables are set correctly

### Issue: Can't access n8n interface
**Solution**:
- Verify `N8N_PROTOCOL=https` is set
- Check Railway domain is correct
- Verify basic auth credentials

### Issue: Webhooks not working
**Solution**:
- Verify `WEBHOOK_URL` environment variable is set correctly
- Check workflow is activated in n8n
- Verify webhook path matches your workflow configuration

### Issue: Database errors
**Solution**:
- For production, use PostgreSQL instead of SQLite
- Set up Railway PostgreSQL addon
- Configure database environment variables

## Production Recommendations

1. **Use PostgreSQL**: Add Railway PostgreSQL addon for production
2. **Enable Encryption**: Set `N8N_ENCRYPTION_KEY` (32 characters)
3. **Enable Basic Auth**: Always use authentication in production
4. **Set up Monitoring**: Use Railway's built-in monitoring
5. **Backup Workflows**: Export workflows regularly
6. **Use Environment Variables**: Never hardcode secrets

## Cost Optimization

- Railway free tier: $5 credit/month
- n8n is lightweight, should run on free tier
- Monitor usage in Railway dashboard
- Consider Railway Pro for production workloads

## Next Steps

1. ✅ Deploy to Railway
2. ✅ Set environment variables
3. ✅ Import workflows
4. ✅ Update frontend to use Railway webhooks
5. ✅ Test all workflows
6. ✅ Monitor Railway logs

## Support

- Railway Docs: https://docs.railway.app/
- n8n Docs: https://docs.n8n.io/
- Railway Discord: https://discord.gg/railway
