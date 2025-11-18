# 🎯 START HERE - Deploy Kaido AI in 3 Steps

## 📍 You Are Here

Your Kaido AI application is ready to deploy to:
- **Server**: 13.60.163.124
- **Domain**: https://kaidobnb.xyz

## ⚡ Quick Deploy (3 Steps)

### Step 1️⃣: Prepare SSH Key

```bash
# Make sure you're in the project directory
cd /path/to/kaido

# Copy your SSH key here (if not already present)
# The key should be named: blockcens.pem

# Set correct permissions
chmod 400 blockcens.pem
```

### Step 2️⃣: Test Connection (Optional but Recommended)

```bash
./test-connection.sh
```

This will verify:
- ✅ SSH key is present and has correct permissions
- ✅ DNS is configured correctly
- ✅ Server is accessible
- ✅ Server is ready for deployment

### Step 3️⃣: Deploy!

```bash
./deploy-production.sh
```

**That's it!** The script will:
1. Copy setup script to server
2. Install all dependencies
3. Build and deploy your application
4. Configure Nginx and SSL
5. Start the application

**Time**: ~10-15 minutes

---

## 🔄 Alternative: Manual Deployment

If you prefer to run commands manually:

```bash
# 1. Copy setup script to server
scp -i blockcens.pem server-setup.sh ubuntu@13.60.163.124:~/

# 2. SSH into server
ssh -i blockcens.pem ubuntu@13.60.163.124

# 3. Run setup script
chmod +x server-setup.sh
./server-setup.sh
```

---

## ✅ After Deployment

### Verify It's Working

1. **Open your website**: https://kaidobnb.xyz
2. **Check services**:
   ```bash
   ssh -i blockcens.pem ubuntu@13.60.163.124 'pm2 status'
   ```
3. **View logs**:
   ```bash
   ssh -i blockcens.pem ubuntu@13.60.163.124 'pm2 logs kaido-backend'
   ```

### Expected Results

✅ Website loads at https://kaidobnb.xyz
✅ SSL certificate is valid (green padlock)
✅ Backend shows "online" in PM2
✅ No errors in logs

---

## 📚 Need More Info?

- **Quick Guide**: Read `DEPLOY_NOW.md`
- **Complete Guide**: Read `PRODUCTION_DEPLOYMENT.md`
- **Checklist**: Read `DEPLOYMENT_CHECKLIST.md`
- **Summary**: Read `DEPLOYMENT_SUMMARY.md`

---

## 🆘 Troubleshooting

### SSH Key Not Found

```bash
# Copy your SSH key to the project directory
cp /path/to/blockcens.pem /Users/charlpagne/Documents/solymarket/
chmod 400 blockcens.pem
```

### Can't Connect to Server

```bash
# Test SSH connection manually
ssh -i blockcens.pem ubuntu@13.60.163.124

# If this works, run the deployment script again
```

### Deployment Failed

1. Check the error message
2. SSH into server: `ssh -i blockcens.pem ubuntu@13.60.163.124`
3. Check logs: `pm2 logs kaido-backend`
4. Review `DEPLOYMENT_CHECKLIST.md` for solutions

---

## 🎯 What Happens During Deployment?

```
┌─────────────────────────────────────────────────────────┐
│  1. System Update                                       │
│     └─ Update Ubuntu packages                           │
├─────────────────────────────────────────────────────────┤
│  2. Install Dependencies                                │
│     ├─ Node.js 18                                       │
│     ├─ MongoDB 7.0                                      │
│     ├─ Nginx                                            │
│     ├─ PM2                                              │
│     └─ TypeScript & ts-node                             │
├─────────────────────────────────────────────────────────┤
│  3. Clone Repository                                    │
│     └─ Clone from GitHub                                │
├─────────────────────────────────────────────────────────┤
│  4. Setup Backend                                       │
│     ├─ Install npm packages                             │
│     ├─ Create .env file                                 │
│     └─ Build TypeScript                                 │
├─────────────────────────────────────────────────────────┤
│  5. Setup Frontend                                      │
│     ├─ Install npm packages                             │
│     ├─ Create .env file                                 │
│     └─ Build production bundle                          │
├─────────────────────────────────────────────────────────┤
│  6. Configure Nginx                                     │
│     ├─ Setup reverse proxy                              │
│     └─ Configure static file serving                    │
├─────────────────────────────────────────────────────────┤
│  7. Setup SSL                                           │
│     └─ Install Let's Encrypt certificate                │
├─────────────────────────────────────────────────────────┤
│  8. Start Application                                   │
│     ├─ Start backend with PM2                           │
│     └─ Configure auto-restart                           │
├─────────────────────────────────────────────────────────┤
│  9. Seed Data                                           │
│     └─ Create initial predictions                       │
└─────────────────────────────────────────────────────────┘
```

---

## 🎉 Ready to Deploy?

**Run this command now:**

```bash
cd /Users/charlpagne/Documents/solymarket && ./deploy-production.sh
```

---

## 📞 Quick Reference

### Server Info
- **IP**: 13.60.163.124
- **User**: ubuntu
- **SSH Key**: blockcens.pem
- **Domain**: kaidobnb.xyz

### Useful Commands

```bash
# Check status
ssh -i blockcens.pem ubuntu@13.60.163.124 'pm2 status'

# View logs
ssh -i blockcens.pem ubuntu@13.60.163.124 'pm2 logs'

# Restart app
ssh -i blockcens.pem ubuntu@13.60.163.124 'pm2 restart all'

# SSH into server
ssh -i blockcens.pem ubuntu@13.60.163.124
```

---

## 🚀 Let's Go!

Everything is ready. Just run:

```bash
./deploy-production.sh
```

Good luck! 🎉

