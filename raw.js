// Backend Implementation (Node.js/Express) - app.js or routes file
// Install dependencies: npm install express axios dotenv
// Use .env for keys: UNSPLASH_KEY=key, PEXELS_KEY=key, PIXABAY_KEY=key
const express = require('express');
const axios = require('axios');
require('dotenv').config();
const app = express();
app.use(express.json());

// Unsplash Search Endpoint (Proxy)
app.get('/api/unsplash/search', async (req, res) => {
  const { query, page = 1, per_page = 10 } = req.query;
  try {
    const response = await axios.get('https://api.unsplash.com/search/photos', {
      params: { query, page, per_page },
      headers: { Authorization: `Client-ID ${process.env.UNSPLASH_KEY}` }
    });
    res.json(response.data.results.map(photo => ({
      url: photo.urls.regular,
      alt: photo.alt_description,
      link: photo.links.html
    })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Unsplash images' });
  }
});

// Pexels Search Endpoint (Proxy)
app.get('/api/pexels/search', async (req, res) => {
  const { query, page = 1, per_page = 10 } = req.query;
  try {
    const response = await axios.get('https://api.pexels.com/v1/search', {
      params: { query, page, per_page },
      headers: { Authorization: process.env.PEXELS_KEY }
    });
    res.json(response.data.photos.map(photo => ({
      url: photo.src.medium,
      alt: photo.alt,
      link: photo.url
    })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Pexels images' });
  }
});

// Pixabay Search Endpoint (Proxy)
app.get('/api/pixabay/search', async (req, res) => {
  const { query, page = 1, per_page = 10 } = req.query;
  try {
    const response = await axios.get('https://pixabay.com/api/', {
      params: {
        key: process.env.PIXABAY_KEY,
        q: query,
        page,
        per_page
      }
    });
    res.json(response.data.hits.map(hit => ({
      url: hit.webformatURL,
      alt: hit.tags,
      link: hit.pageURL
    })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Pixabay images' });
  }
});

// Wikipedia Image Search Endpoint (Proxy)
app.get('/api/wikipedia/search', async (req, res) => {
  const { query } = req.query;
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
        pilicense: 'free'
      }
    });
    const pages = response.data.query?.pages;
    if (!pages) {
      return res.json([]);
    }
    const results = Object.values(pages)
      .filter(page => page.thumbnail && page.thumbnail.source)
      .map(page => ({
        url: page.thumbnail.source,
        alt: page.title,
        link: page.fullurl
      }));
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Wikipedia images' });
  }
});

// ===== NEW: AI Image Generation Endpoints =====

// Generate AI Image - uses free-image-generation-api
app.post('/api/ai-image/generate', async (req, res) => {
  const { prompt, model = 'flux' } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    // Using the free-image-generation-api
    // Available models: flux, flux-pro, flux-realism, any-dark, turbo
    const response = await axios.post(
      'https://free-image-generation-api.onrender.com/generate',
      {
        prompt: prompt,
        model: model
      },
      {
        timeout: 60000, // 60 second timeout as image generation can take time
        responseType: 'arraybuffer' // Get image as binary data
      }
    );

    // Convert image to base64 for easy transmission
    const base64Image = Buffer.from(response.data, 'binary').toString('base64');
    const dataUrl = `data:image/png;base64,${base64Image}`;

    res.json({
      success: true,
      imageUrl: dataUrl,
      prompt: prompt,
      model: model
    });
  } catch (error) {
    console.error('AI Image generation error:', error.message);
    res.status(500).json({ 
      error: 'Failed to generate AI image',
      details: error.message 
    });
  }
});

// Get available AI models
app.get('/api/ai-image/models', (req, res) => {
  res.json({
    models: [
      { id: 'flux', name: 'Flux (Default)', description: 'Balanced quality and speed' },
      { id: 'flux-pro', name: 'Flux Pro', description: 'Higher quality, slower' },
      { id: 'flux-realism', name: 'Flux Realism', description: 'Realistic images' },
      { id: 'any-dark', name: 'Any Dark', description: 'Dark themed images' },
      { id: 'turbo', name: 'Turbo', description: 'Fastest generation' }
    ]
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));