# SitesOrbit Backend API

A Node.js/Express backend API for searching images from multiple sources (Unsplash, Pexels, Pixabay, Wikipedia) and generating AI images.

## 🚀 Features

- **Image Search APIs:**
  - Unsplash image search
  - Pexels image search
  - Pixabay image search
  - Wikipedia image search

- **AI Image Generation:**
  - Generate images from text prompts using SitesOrbit AI API

- **CORS Enabled:** Ready to work with frontend applications

## 📦 Installation

```bash
# Install dependencies
npm install
```

## 🔧 Configuration

Create a `.env` file in the root directory:

```env
UNSPLASH_ACCESS_KEY=your_key_here
UNSPLASH_SECRET_KEY=your_secret_here
UNSPLASH_APP_ID=your_app_id_here
PEXELS_KEY=your_key_here
PIXABAY_KEY=your_key_here
AI_IMAGE_API_URL=https://sitesorbit-image-api.power-mvs.workers.dev/
AI_IMAGE_API_TOKEN=your_token_here
PORT=3000
```

## 🏃 Running Locally

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The server will run on `http://localhost:3000`

## 📡 API Endpoints

### Health Check
```
GET /api/health
```

### Image Search
```
GET /api/unsplash/search?query=nature&page=1&per_page=10
GET /api/pexels/search?query=nature&page=1&per_page=10
GET /api/pixabay/search?query=nature&page=1&per_page=10
GET /api/wikipedia/search?query=nature
```

### AI Image Generation
```
POST /api/ai-image/generate
Content-Type: application/json

{
  "prompt": "A futuristic city in the clouds"
}
```

## 🌐 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions to:
- Render (Recommended)
- Railway
- Fly.io
- Cyclic

## 📝 License

ISC

