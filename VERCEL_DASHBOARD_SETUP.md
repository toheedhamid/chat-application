# Vercel Dashboard Configuration Guide

## ⚠️ IMPORTANT: Root Directory Setting

**DO NOT set Root Directory to `react-chat-app`** if you want API routes to work!

If you set Root Directory to `react-chat-app`:
- ✅ React app will work
- ❌ API routes in `/api/` will NOT work (they're in the root, not in react-chat-app)

## Recommended Configuration

### Option 1: Keep Root Directory Empty (Recommended)

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **General**
2. **Root Directory**: Leave it **EMPTY** (or set to `.`)
3. This allows both API routes and React app to work

### Option 2: If You Must Set Root Directory

If you set Root Directory to `react-chat-app`, you'll need to:
- Move `api/` folder to `react-chat-app/api/`
- Update `vercel.json` routes accordingly
- This is more complex and not recommended

## Build Settings (Optional - vercel.json handles this)

The `vercel.json` file already configures builds, but you can also set these in Dashboard:

1. Go to **Settings** → **General** → **Build & Development Settings**
2. **Framework Preset**: Create React App (or leave as "Other")
3. **Build Command**: `cd react-chat-app && npm run build` (if not using vercel.json builds)
4. **Output Directory**: `react-chat-app/build` (if not using vercel.json builds)
5. **Install Command**: `cd react-chat-app && npm install` (if not using vercel.json builds)

**Note**: Since we're using `builds` in `vercel.json`, these Dashboard settings won't apply (that's the warning you saw). This is fine - the `vercel.json` configuration takes precedence.

## Environment Variables

Make sure to set these in **Settings** → **Environment Variables**:

```
REDIS_URL=redis://default:YOUR_PASSWORD@YOUR_ENDPOINT:6379
REDIS_PASSWORD=YOUR_PASSWORD
```

## Current Configuration Status

✅ **vercel.json** - Configured correctly
✅ **react-chat-app/package.json** - Has build script
✅ **API routes** - Configured in vercel.json

## Testing After Deployment

1. Check root URL: `https://your-app.vercel.app/`
2. Check API status: `https://your-app.vercel.app/api/status`
3. Check API chat: `https://your-app.vercel.app/api/chat-memory`
4. Open browser console (F12) to check for errors

## Troubleshooting

### If page is still blank:

1. **Check Build Logs**:
   - Vercel Dashboard → Deployments → Latest → Build Logs
   - Verify React app built successfully
   - Look for `react-chat-app/build/index.html`

2. **Check Browser Console**:
   - Open DevTools (F12) → Console
   - Look for 404 errors or JavaScript errors

3. **Check Network Tab**:
   - DevTools → Network
   - Reload page
   - Verify `index.html`, JS, and CSS files load

4. **Verify File Structure**:
   - In Vercel Dashboard → Deployments → Latest → Source
   - Check that `react-chat-app/build/` exists with `index.html` inside
