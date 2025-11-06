// Backend Implementation (Node.js/Express)
// Install dependencies: npm install express axios dotenv cors
// Use .env for keys
const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
// CORS configuration - allow requests from production domain
app.use(cors({
  origin: ['https://sitesorbit.io', 'null'],
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SitesOrbit Backend API is running' });
});

// Unsplash Search Endpoint (Proxy)
app.get('/api/unsplash/search', async (req, res) => {
  const { query, page = 1, per_page = 10 } = req.query;
  
  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    const response = await axios.get('https://api.unsplash.com/search/photos', {
      params: { query, page, per_page },
      headers: { 
        Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` 
      }
    });
    
    res.json({
      success: true,
      results: response.data.results.map(photo => ({
        id: photo.id,
        url: photo.urls.regular,
        thumb: photo.urls.thumb,
        full: photo.urls.full,
        alt: photo.alt_description || photo.description || 'Unsplash image',
        link: photo.links.html,
        photographer: photo.user.name,
        photographerUrl: photo.user.links.html
      })),
      total: response.data.total,
      totalPages: response.data.total_pages
    });
  } catch (error) {
    console.error('Unsplash API error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch Unsplash images',
      details: error.response?.data?.errors?.[0] || error.message
    });
  }
});

// Pexels Search Endpoint (Proxy)
app.get('/api/pexels/search', async (req, res) => {
  const { query, page = 1, per_page = 10 } = req.query;
  
  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    const response = await axios.get('https://api.pexels.com/v1/search', {
      params: { query, page, per_page },
      headers: { 
        Authorization: process.env.PEXELS_KEY 
      }
    });
    
    res.json({
      success: true,
      results: response.data.photos.map(photo => ({
        id: photo.id,
        url: photo.src.medium,
        thumb: photo.src.small,
        full: photo.src.large,
        alt: photo.alt || 'Pexels image',
        link: photo.url,
        photographer: photo.photographer,
        photographerUrl: photo.photographer_url
      })),
      total: response.data.total_results,
      totalPages: Math.ceil(response.data.total_results / per_page)
    });
  } catch (error) {
    console.error('Pexels API error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch Pexels images',
      details: error.response?.data || error.message
    });
  }
});

// Pixabay Search Endpoint (Proxy)
app.get('/api/pixabay/search', async (req, res) => {
  const { query, page = 1, per_page = 10 } = req.query;
  
  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    const response = await axios.get('https://pixabay.com/api/', {
      params: {
        key: process.env.PIXABAY_KEY,
        q: query,
        page,
        per_page,
        image_type: 'photo',
        safesearch: 'true'
      }
    });
    
    res.json({
      success: true,
      results: response.data.hits.map(hit => ({
        id: hit.id,
        url: hit.webformatURL,
        thumb: hit.previewURL,
        full: hit.largeImageURL || hit.webformatURL,
        alt: hit.tags || 'Pixabay image',
        link: hit.pageURL,
        views: hit.views,
        downloads: hit.downloads,
        likes: hit.likes
      })),
      total: response.data.totalHits,
      totalPages: Math.ceil(response.data.totalHits / per_page)
    });
  } catch (error) {
    console.error('Pixabay API error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch Pixabay images',
      details: error.response?.data || error.message
    });
  }
});

// Wikipedia Image Search Endpoint (Proxy)
app.get('/api/wikipedia/search', async (req, res) => {
  const { query } = req.query;
  
  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    const response = await axios.get('https://en.wikipedia.org/w/api.php', {
      params: {
        action: 'query',
        generator: 'search',
        gsrsearch: query,
        gsrlimit: 6,
        prop: 'pageimages|info',
        inprop: 'url',
        pithumbsize: 400,
        format: 'json',
        pilicense: 'free',
        origin: '*'
      }
    });
    
    const pages = response.data.query?.pages;
    if (!pages) {
      return res.json({ success: true, results: [] });
    }
    
    const results = Object.values(pages)
      .filter(page => page.thumbnail && page.thumbnail.source)
      .map(page => ({
        id: page.pageid,
        url: page.thumbnail.source,
        thumb: page.thumbnail.source,
        full: page.thumbnail.source.replace(/\/\d+px-/, '/800px-'),
        alt: page.title,
        link: page.fullurl
      }));
    
    res.json({ success: true, results });
  } catch (error) {
    console.error('Wikipedia API error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch Wikipedia images',
      details: error.message
    });
  }
});

// ===== AI Image Generation Endpoint =====

// Generate AI Image - uses sitesorbit-image-api
app.post('/api/ai-image/generate', async (req, res) => {
  const { prompt } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const response = await axios.post(
      process.env.AI_IMAGE_API_URL || 'https://sitesorbit-image-api.power-mvs.workers.dev/',
      { prompt: prompt },
      {
        headers: {
          'Authorization': `Bearer ${process.env.AI_IMAGE_API_TOKEN || 'your-ai-image-api-token'}`,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer', // Get image as binary data
        timeout: 120000 // 2 minute timeout as image generation can take time
      }
    );

    // Convert image to base64 for easy transmission
    const base64Image = Buffer.from(response.data, 'binary').toString('base64');
    const contentType = response.headers['content-type'] || 'image/png';
    const dataUrl = `data:${contentType};base64,${base64Image}`;

    res.json({
      success: true,
      imageUrl: dataUrl,
      prompt: prompt,
      format: contentType
    });
  } catch (error) {
    console.error('AI Image generation error:', error.response?.status, error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to generate AI image',
      details: error.response?.data ? Buffer.from(error.response.data).toString() : error.message
    });
  }
});

// Get available AI models (for future use)
app.get('/api/ai-image/models', (req, res) => {
  res.json({
    success: true,
    models: [
      { 
        id: 'default', 
        name: 'Default Model', 
        description: 'SitesOrbit AI Image Generation' 
      }
    ]
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 SitesOrbit Backend API running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔍 Available endpoints:`);
  console.log(`   - GET  /api/unsplash/search?query=...`);
  console.log(`   - GET  /api/pexels/search?query=...`);
  console.log(`   - GET  /api/pixabay/search?query=...`);
  console.log(`   - GET  /api/wikipedia/search?query=...`);
  console.log(`   - POST /api/ai-image/generate`);
});

