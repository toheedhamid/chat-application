# Railway Environment Variables Configuration

## ⚠️ IMPORTANT: Security Notes

1. **Never commit actual secrets to Git**
2. **Set these in Railway Dashboard → Variables tab**
3. **Replace placeholder values with your actual credentials**
4. **Generate new encryption key for production**

## Required Environment Variables

### 0. Critical: Disable Problematic Features

```bash
# Disable community packages (fixes module loading errors)
N8N_COMMUNITY_PACKAGES_ENABLED=false

# Disable diagnostics (optional, reduces overhead)
N8N_DIAGNOSTICS_ENABLED=false

# Production settings
NODE_ENV=production
N8N_LOG_LEVEL=info
```

**⚠️ IMPORTANT**: Add these FIRST before other variables to prevent module loading errors.

### 1. Basic n8n Configuration

```bash
# Protocol and Host
N8N_PROTOCOL=https
N8N_HOST=0.0.0.0
N8N_PORT=5678
N8N_EDITOR_BASE_URL=https://n8n-main-instance-production-0ed4.up.railway.app/

# Webhook URL (Railway will provide the domain)
WEBHOOK_URL=https://n8n-main-instance-production-0ed4.up.railway.app/

# Basic Authentication (REQUIRED for production)
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=your_secure_password_here

# Encryption Key (REQUIRED - Generate a random 32-character string)
N8N_ENCRYPTION_KEY=your-random-32-character-encryption-key-here
```

### 2. Redis Configuration (for Queue)

```bash
# Redis Connection Details
QUEUE_BULL_REDIS_HOST=your-redis-host.railway.app
QUEUE_BULL_REDIS_PORT=6379
QUEUE_BULL_REDIS_DB=0
QUEUE_BULL_REDIS_USER=default
QUEUE_BULL_REDIS_PASSWORD=your-redis-password-here

# Alternative: Use Redis URL format (use ONE of the above OR this)
# QUEUE_BULL_REDIS_URL=redis://default:password@host:6379/0

# Queue Configuration
EXECUTIONS_MODE=queue
QUEUE_HEALTH_CHECK_ACTIVE=true
```

### 3. OpenAI API Configuration

```bash
# OpenAI API Key (for AI workflows)
N8N_OPENAI_API_KEY=sk-proj-your-openai-api-key-here
```

**Note**: You can also configure OpenAI credentials in n8n UI after deployment.

### 4. SMTP Email Configuration (Gmail)

```bash
# Gmail SMTP Settings
N8N_SMTP_HOST=smtp.gmail.com
N8N_SMTP_PORT=587
N8N_SMTP_USER=toheedhamid9@gmail.com
N8N_SMTP_PASS=your-app-specific-password-here
N8N_SMTP_SENDER=toheedhamid9@gmail.com
N8N_SMTP_SSL=false
```

**Note**: For Gmail, you need to:
1. Enable 2-factor authentication
2. Generate an "App Password" (not your regular password)
3. Use the app password in `N8N_SMTP_PASS`

### 5. Optional: PostgreSQL Database

```bash
# Only if using PostgreSQL instead of SQLite
DB_TYPE=postgresdb
DB_POSTGRESDB_HOST=your-postgres-host.railway.app
DB_POSTGRESDB_PORT=5432
DB_POSTGRESDB_DATABASE=n8n
DB_POSTGRESDB_USER=postgres
DB_POSTGRESDB_PASSWORD=your-postgres-password-here
```

**Note**: SQLite (default) works fine for most use cases. PostgreSQL is recommended for production with high traffic.

## Quick Setup Guide

### Step 1: Generate Encryption Key

```bash
# Generate a random 32-character string
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

Or use an online generator: https://randomkeygen.com/

### Step 2: Get Railway Domain

After deploying to Railway:
1. Go to Railway Dashboard → Your Project → Settings
2. Copy your Railway domain (e.g., `your-app-name.up.railway.app`)
3. Use it in `N8N_HOST`, `N8N_EDITOR_BASE_URL`, and `WEBHOOK_URL`

### Step 3: Set Variables in Railway

1. Go to Railway Dashboard → Your Project
2. Click "Variables" tab
3. Add each variable one by one
4. Or use Railway CLI to bulk import

### Step 4: Deploy

Railway will automatically use these environment variables when deploying.

## Variable Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `N8N_PROTOCOL` | Yes | Protocol (https for production) |
| `N8N_HOST` | Yes | Host (0.0.0.0 for Railway) |
| `N8N_PORT` | Yes | Port (5678 default) |
| `N8N_EDITOR_BASE_URL` | Yes | Full URL to n8n editor |
| `WEBHOOK_URL` | Yes | Base URL for webhooks |
| `N8N_BASIC_AUTH_ACTIVE` | Yes | Enable basic auth |
| `N8N_BASIC_AUTH_USER` | Yes | Username for basic auth |
| `N8N_BASIC_AUTH_PASSWORD` | Yes | Password for basic auth |
| `N8N_ENCRYPTION_KEY` | Yes | 32-char encryption key |
| `QUEUE_BULL_REDIS_HOST` | Optional | Redis host for queue |
| `QUEUE_BULL_REDIS_PASSWORD` | Optional | Redis password |
| `EXECUTIONS_MODE` | Optional | Set to "queue" if using Redis |
| `N8N_OPENAI_API_KEY` | Optional | OpenAI API key |
| `N8N_SMTP_*` | Optional | SMTP email settings |

## Railway-Specific Variables

Railway automatically provides:
- `RAILWAY_PUBLIC_DOMAIN` - Your Railway domain
- `PORT` - Port Railway assigns (usually 5678)

You can use Railway's template variables:
```bash
WEBHOOK_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}/
N8N_EDITOR_BASE_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}/
```

## Security Best Practices

1. ✅ **Use strong passwords** for basic auth
2. ✅ **Generate unique encryption key** (don't reuse)
3. ✅ **Use Railway secrets** (encrypted environment variables)
4. ✅ **Rotate keys regularly** (every 90 days)
5. ✅ **Never commit secrets** to Git
6. ✅ **Use app-specific passwords** for Gmail SMTP
7. ✅ **Enable 2FA** on all external services

## Troubleshooting

### Issue: n8n won't start
- Check all required variables are set
- Verify `N8N_ENCRYPTION_KEY` is exactly 32 characters
- Check Railway logs for specific errors

### Issue: Can't access n8n
- Verify `N8N_PROTOCOL=https`
- Check `N8N_EDITOR_BASE_URL` matches Railway domain
- Verify basic auth credentials are correct

### Issue: Redis connection fails
- Verify Redis host and password
- Check Redis is accessible from Railway
- Test connection manually

### Issue: Webhooks not working
- Verify `WEBHOOK_URL` is set correctly
- Check Railway domain matches
- Ensure workflow is activated in n8n

## Example: Minimal Configuration

For a quick start, you only need:

```bash
N8N_PROTOCOL=https
N8N_HOST=0.0.0.0
N8N_PORT=5678
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=secure_password
N8N_ENCRYPTION_KEY=your-32-char-key-here
WEBHOOK_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}/
N8N_EDITOR_BASE_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}/
```

Add other variables as needed for your workflows.
