# Deployment Guide

This guide will help you deploy the SitesOrbit Backend API to various free hosting platforms.

## 🚀 Quick Deploy to Render (Recommended)

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Step 2: Deploy on Render

1. Go to [https://render.com](https://render.com) and sign up/login
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account and select your repository
4. Configure the service:
   - **Name**: `sitesorbit-backend` (or any name you prefer)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Select **Free**

5. **Add Environment Variables** (click "Advanced" → "Add Environment Variable"):
   ```
   NODE_ENV=production
   PORT=10000
   UNSPLASH_ACCESS_KEY=your-unsplash-access-key
   UNSPLASH_SECRET_KEY=your-unsplash-secret-key
   UNSPLASH_APP_ID=639586
   PEXELS_KEY=your-pexels-api-key
   PIXABAY_KEY=your-pixabay-api-key
   AI_IMAGE_API_URL=https://sitesorbit-image-api.power-mvs.workers.dev/
   AI_IMAGE_API_TOKEN=your-ai-image-api-token
   ```

6. Click **"Create Web Service"**
7. Wait for deployment (usually 2-3 minutes)
8. Your API will be available at: `https://sitesorbit-backend.onrender.com` (or your custom name)

---

## 🚂 Deploy to Railway

### Option 1: Using Railway CLI
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize and deploy
railway init
railway up
```

### Option 2: Using Railway Dashboard
1. Go to [https://railway.app](https://railway.app)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your repository
4. Add environment variables in the **Variables** tab
5. Railway will auto-detect Node.js and deploy

---

## ✈️ Deploy to Fly.io

```bash
# Install Fly CLI
# Windows: powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"

# Login
fly auth login

# Initialize
fly launch

# Deploy
fly deploy
```

---

## 🔄 Deploy to Cyclic

1. Go to [https://cyclic.sh](https://cyclic.sh)
2. Sign up with GitHub
3. Click **"Deploy Now"**
4. Select your repository
5. Add environment variables
6. Deploy!

---

## 📝 Environment Variables

Make sure to set these environment variables on your hosting platform:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | (auto-set by platform, or use `10000` for Render) |
| `UNSPLASH_ACCESS_KEY` | `your-unsplash-access-key` |
| `UNSPLASH_SECRET_KEY` | `your-unsplash-secret-key` |
| `UNSPLASH_APP_ID` | `639586` |
| `PEXELS_KEY` | `your-pexels-api-key` |
| `PIXABAY_KEY` | `your-pixabay-api-key` |
| `AI_IMAGE_API_URL` | `https://sitesorbit-image-api.power-mvs.workers.dev/` |
| `AI_IMAGE_API_TOKEN` | `your-ai-image-api-token` |

---

## 🧪 Test Your Deployment

Once deployed, test your API:

```bash
# Health check
curl https://your-app-url.onrender.com/api/health

# Test Unsplash search
curl "https://your-app-url.onrender.com/api/unsplash/search?query=nature&per_page=5"

# Test AI image generation
curl -X POST https://your-app-url.onrender.com/api/ai-image/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A beautiful sunset"}'
```

---

## 📌 Important Notes

- **Free tier limitations**: 
  - Render: Services spin down after 15 minutes of inactivity (first request may be slow)
  - Railway: $5 free credit per month
  - Fly.io: 3 shared VMs free

- **Keep-alive**: For Render free tier, consider using a service like [UptimeRobot](https://uptimerobot.com) to ping your API every 5 minutes to keep it awake.

- **CORS**: The API already has CORS enabled, so it will work with frontend apps from any domain.

---

## 🔗 API Endpoints

Once deployed, your API will have these endpoints:

- `GET /api/health` - Health check
- `GET /api/unsplash/search?query=...&page=1&per_page=10` - Search Unsplash
- `GET /api/pexels/search?query=...&page=1&per_page=10` - Search Pexels
- `GET /api/pixabay/search?query=...&page=1&per_page=10` - Search Pixabay
- `GET /api/wikipedia/search?query=...` - Search Wikipedia
- `POST /api/ai-image/generate` - Generate AI images
- `GET /api/ai-image/models` - Get available models

---

## 🆘 Troubleshooting

**Build fails:**
- Check Node.js version (should be 18+)
- Verify all dependencies in `package.json`

**API returns 500 errors:**
- Check environment variables are set correctly
- Check logs in your hosting platform dashboard
- Verify API keys are valid

**CORS errors:**
- CORS is already enabled in the code
- Make sure you're using the correct API URL

---

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Environment variables added to hosting platform
- [ ] Build command: `npm install`
- [ ] Start command: `npm start`
- [ ] Health check endpoint works
- [ ] Test at least one API endpoint
- [ ] Update frontend with new API URL

