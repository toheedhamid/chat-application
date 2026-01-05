# Gmail App Password Setup for n8n

## Why App Password?

Gmail requires an "App Password" (not your regular password) for SMTP authentication when using 2-factor authentication. This is more secure than using your regular password.

## Step-by-Step Guide

### Step 1: Enable 2-Factor Authentication

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", click "2-Step Verification"
3. Follow the prompts to enable 2FA (if not already enabled)

### Step 2: Generate App Password

1. Go back to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", click "App passwords"
3. You may need to sign in again
4. Select "Mail" as the app
5. Select "Other (Custom name)" as the device
6. Enter a name like "n8n Railway" or "n8n SMTP"
7. Click "Generate"
8. **Copy the 16-character password** (it will look like: `abcd efgh ijkl mnop`)

### Step 3: Use in Railway

1. Go to Railway Dashboard → Your Project → Variables
2. Add these variables:

```bash
N8N_SMTP_HOST=smtp.gmail.com
N8N_SMTP_PORT=587
N8N_SMTP_USER=toheedhamid9@gmail.com
N8N_SMTP_PASS=your-16-character-app-password-here
N8N_SMTP_SENDER=toheedhamid9@gmail.com
N8N_SMTP_SSL=false
```

**Important**: 
- Use the 16-character app password (remove spaces if any)
- Do NOT use your regular Gmail password
- The app password is different from your account password

### Step 4: Test Email

After setting up, test email functionality in n8n:
1. Create a test workflow with "Send Email" node
2. Configure it to use SMTP
3. Send a test email to yourself
4. Check if it arrives

## Troubleshooting

### Issue: "Invalid credentials"
- **Solution**: Make sure you're using the App Password, not your regular password
- Verify 2FA is enabled on your Google account
- Regenerate the app password if needed

### Issue: "Connection timeout"
- **Solution**: Check firewall settings
- Verify `N8N_SMTP_PORT=587` (not 465)
- Try `N8N_SMTP_SSL=false` (for port 587)

### Issue: "Authentication failed"
- **Solution**: 
  - Double-check the app password (no spaces)
  - Verify email address is correct: `toheedhamid9@gmail.com`
  - Make sure "Less secure app access" is not needed (use App Password instead)

## Security Notes

✅ **DO**:
- Use App Passwords for SMTP
- Keep app passwords secure
- Rotate app passwords regularly
- Use different app passwords for different services

❌ **DON'T**:
- Use your regular Gmail password
- Share app passwords
- Commit app passwords to Git
- Use the same app password for multiple services

## Alternative: Use Gmail OAuth2

For more advanced setups, you can use OAuth2 instead of App Passwords:
1. Create OAuth2 credentials in Google Cloud Console
2. Configure in n8n using OAuth2 authentication
3. More secure but more complex setup

For most use cases, App Passwords are sufficient and easier to set up.
