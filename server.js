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
// Increase body size limit to handle large base64 images (50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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
      results: response.data.results.map(photo => {
        // Create resized URL with max 800x800 dimensions
        // Using raw URL with fit=max to maintain aspect ratio while limiting size
        const rawUrl = photo.urls.raw;
        const resizedUrl = rawUrl.includes('?') 
          ? `${rawUrl}&w=800&h=600&fit=max`
          : `${rawUrl}?w=800&h=600&fit=max`;
        
        return {
          id: photo.id,
          url: resizedUrl,
          thumb: photo.urls.thumb,
          full: resizedUrl, // Use resized for full as well to limit size
          alt: photo.alt_description || photo.description || 'Unsplash image',
          link: photo.links.html,
          photographer: photo.user.name,
          photographerUrl: photo.user.links.html
        };
      }),
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

// Pexels Videos Search Endpoint (Proxy)
app.get('/api/pexels/videos', async (req, res) => {
  const { query, page = 1, per_page = 12 } = req.query;
  
  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    const response = await axios.get('https://api.pexels.com/videos/search', {
      params: { query, page, per_page },
      headers: { 
        Authorization: process.env.PEXELS_KEY 
      }
    });
    
    res.json({
      success: true,
      videos: response.data.videos.map(video => ({
        id: video.id,
        width: video.width,
        height: video.height,
        duration: video.duration,
        image: video.image, // thumbnail
        url: video.url, // Pexels page URL
        video_files: video.video_files.map(file => ({
          id: file.id,
          quality: file.quality,
          file_type: file.file_type,
          width: file.width,
          height: file.height,
          link: file.link // direct video URL
        })),
        user: {
          id: video.user.id,
          name: video.user.name,
          url: video.user.url
        }
      })),
      total: response.data.total_results,
      totalPages: Math.ceil(response.data.total_results / per_page)
    });
  } catch (error) {
    console.error('Pexels Videos API error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch Pexels videos',
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

// Pixabay Videos Search Endpoint (Proxy)
app.get('/api/pixabay/videos', async (req, res) => {
  const { query, page = 1, per_page = 12 } = req.query;
  
  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    const response = await axios.get('https://pixabay.com/api/videos/', {
      params: {
        key: process.env.PIXABAY_KEY,
        q: query,
        page,
        per_page,
        video_type: 'all',
        safesearch: 'true'
      }
    });
    
    res.json({
      success: true,
      videos: response.data.hits.map(video => {
        // Build video files array from available sizes
        const videoFiles = [];
        if (video.videos.large) videoFiles.push({ quality: 'hd', link: video.videos.large.url, width: video.videos.large.width, height: video.videos.large.height });
        if (video.videos.medium) videoFiles.push({ quality: 'sd', link: video.videos.medium.url, width: video.videos.medium.width, height: video.videos.medium.height });
        if (video.videos.small) videoFiles.push({ quality: 'low', link: video.videos.small.url, width: video.videos.small.width, height: video.videos.small.height });
        if (video.videos.tiny) videoFiles.push({ quality: 'tiny', link: video.videos.tiny.url, width: video.videos.tiny.width, height: video.videos.tiny.height });
        
        // Generate a proper thumbnail URL
        // Pixabay videos don't have direct thumbnails, but we can construct one from video ID
        // Use the first frame of the smallest video as thumbnail for preview
        const thumbnailUrl = video.videos.tiny?.thumbnail || video.videos.small?.thumbnail || video.userImageURL;
        
        return {
          id: video.id,
          width: video.videos.large?.width || video.videos.medium?.width || 1920,
          height: video.videos.large?.height || video.videos.medium?.height || 1080,
          duration: video.duration,
          image: thumbnailUrl, // Better thumbnail URL
          url: video.pageURL,
          video_files: videoFiles,
          user: {
            id: video.user_id,
            name: video.user,
            url: `https://pixabay.com/users/${video.user}-${video.user_id}/`
          },
          tags: video.tags,
          views: video.views,
          downloads: video.downloads,
          likes: video.likes
        };
      }),
      total: response.data.totalHits,
      totalPages: Math.ceil(response.data.totalHits / per_page)
    });
  } catch (error) {
    console.error('Pixabay Videos API error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch Pixabay videos',
      details: error.response?.data || error.message
    });
  }
});

// Site Analysis Endpoint - Analyze WordPress site for metadata and style
app.get('/api/analyze-site', async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    const response = await axios.get(url, {
      headers: { 
        'User-Agent': 'SitesOrbit/1.0 (https://sitesorbit.com; webmaster@sitesorbit.com)' 
      },
      timeout: 15000,
      maxRedirects: 5
    });
    
    const html = response.data;
    
    // Extract metadata using regex
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const metaDescMatch = html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
    const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i);
    const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["'](.*?)["']/i);
    const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    
    // Extract title (prefer og:title, fallback to title tag)
    let title = ogTitleMatch?.[1] || titleMatch?.[1] || 'Unknown Site';
    title = title.replace(/<[^>]*>/g, '').trim(); // Strip HTML tags
    
    // Extract description (prefer og:description, fallback to meta description)
    let description = ogDescMatch?.[1] || metaDescMatch?.[1] || '';
    description = description.replace(/<[^>]*>/g, '').trim();
    
    // Extract main heading
    let mainHeading = h1Match?.[1]?.replace(/<[^>]*>/g, '').trim() || '';
    
    // Detect writing style based on content analysis
    const htmlLower = html.toLowerCase();
    let style = 'balanced';
    
    // Professional indicators
    const professionalWords = ['enterprise', 'professional', 'corporate', 'business', 'industry', 'solution', 'services'];
    const professionalCount = professionalWords.filter(word => htmlLower.includes(word)).length;
    
    // Casual indicators
    const casualWords = ['friendly', 'easy', 'simple', 'fun', 'awesome', 'cool', 'hey', 'you\'ll love'];
    const casualCount = casualWords.filter(word => htmlLower.includes(word)).length;
    
    if (professionalCount > casualCount + 2) {
      style = 'professional';
    } else if (casualCount > professionalCount + 2) {
      style = 'casual';
    }
    
    res.json({
      success: true,
      site: {
        url: url,
        title: title,
        description: description,
        mainHeading: mainHeading,
        style: style,
        supportsSearch: true // WordPress always has search
      }
    });
  } catch (error) {
    console.error('Site analysis error:', error.message);
    
    // Return friendly error message
    const statusCode = error.response?.status || 500;
    const errorMessage = statusCode === 404 
      ? 'Site not found. Please check the URL.'
      : statusCode === 403
      ? 'Access denied. The site may be blocking automated requests.'
      : 'Unable to access the site. Please check the URL and try again.';
    
    res.status(500).json({ 
      error: 'Failed to analyze site',
      details: errorMessage
    });
  }
});

// YouTube Video Extraction Endpoint (No API Key Required)
app.get('/api/youtube/extract', async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ 
      success: false, 
      error: 'YouTube URL is required' 
    });
  }
  
  try {
    console.log('YouTube extraction started for:', url);
    
    // Import YouTube library dynamically (ES Module)
    const { Innertube } = await import('youtubei.js');
    
    // Extract video ID using regex (simpler, no library needed)
    const videoIdRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(videoIdRegex);
    
    if (!match || !match[1]) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid YouTube URL' 
      });
    }
    
    const videoId = match[1];
    console.log('Video ID extracted:', videoId);
    
    // Get video metadata using YouTube oEmbed API (public, no auth needed)
    console.log('Fetching video metadata from oEmbed...');
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const oembedResponse = await axios.get(oembedUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const metadata = oembedResponse.data;
    console.log('Metadata retrieved:', metadata.title);
    
    // Get transcript using youtubei.js (much more reliable!)
    console.log('Fetching transcript with youtubei.js...');
    let transcript = '';
    let transcriptAvailable = true;
    let transcriptDuration = 0;
    let transcriptSegments = [];
    let transcriptWithTimestamps = '';
    
    try {
      // Initialize YouTube client
      const youtube = await Innertube.create();
      console.log('YouTube client initialized');
      
      // Get video info
      const videoInfo = await youtube.getInfo(videoId);
      console.log('Video info retrieved:', videoInfo.basic_info.title);
      
      // Try to get transcript
      const transcriptData = await videoInfo.getTranscript();
      
      if (transcriptData && transcriptData.transcript) {
        console.log('✅ Transcript found!');
        
        // Extract text from transcript segments
        const segments = transcriptData.transcript.content.body.initial_segments;
        
        if (segments && segments.length > 0) {
          // Plain transcript (existing)
          transcript = segments
            .map(segment => segment.snippet.text)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          // Calculate duration from last segment
          const lastSegment = segments[segments.length - 1];
          transcriptDuration = Math.round(lastSegment.start_ms / 1000);
          
          // NEW: Extract timestamped segments
          transcriptSegments = segments.map(segment => {
            const startSeconds = Math.round(segment.start_ms / 1000);
            const hrs = Math.floor(startSeconds / 3600);
            const mins = Math.floor((startSeconds % 3600) / 60);
            const secs = startSeconds % 60;
            
            let timestamp;
            if (hrs > 0) {
              timestamp = `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            } else {
              timestamp = `${mins}:${secs.toString().padStart(2, '0')}`;
            }
            
            return {
              timestamp: timestamp,
              seconds: startSeconds,
              text: segment.snippet.text.trim()
            };
          });
          
          // NEW: Create human-readable timestamped transcript
          transcriptWithTimestamps = transcriptSegments
            .map(seg => `[${seg.timestamp}] ${seg.text}`)
            .join('\n');
          
          console.log(`✅ Transcript processed: ${segments.length} segments, ${transcript.split(/\s+/).length} words`);
          console.log(`✅ Timestamped segments: ${transcriptSegments.length}`);
          console.log('First 200 chars:', transcript.substring(0, 200));
          transcriptAvailable = true;
        } else {
          console.log('⚠️ Transcript data has no segments');
          transcriptAvailable = false;
        }
      } else {
        console.log('⚠️ No transcript available for this video');
        transcriptAvailable = false;
      }
      
    } catch (transcriptError) {
      console.log('❌ Transcript fetch failed:', transcriptError.message);
      console.log('Full error:', transcriptError);
      transcriptAvailable = false;
      transcript = '';
    }
    
    // Format duration (seconds to mm:ss or hh:mm:ss)
    const formatDuration = (seconds) => {
      if (!seconds || seconds === 0) return 'Unknown';
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };
    
    res.json({
      success: true,
      data: {
        videoId: videoId,
        title: metadata.title,
        description: '', // oEmbed doesn't provide description
        channel: metadata.author_name || 'Unknown',
        channelUrl: metadata.author_url || `https://www.youtube.com/channel/${videoId}`,
        duration: formatDuration(transcriptDuration),
        durationSeconds: transcriptDuration,
        thumbnail: metadata.thumbnail_url || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        publishedAt: 'Recently', // oEmbed doesn't provide exact date
        viewCount: '', // oEmbed doesn't provide view count
        transcript: transcript,
        transcriptAvailable: transcriptAvailable,
        transcriptWordCount: transcript ? transcript.split(/\s+/).length : 0,
        transcriptSegments: transcriptSegments,
        transcriptWithTimestamps: transcriptWithTimestamps,
        keywords: [],
        category: 'Unknown'
      }
    });
    
    console.log('YouTube extraction completed successfully!');
    
  } catch (error) {
    console.error('YouTube extraction error:', error);
    console.error('Error stack:', error.stack);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to extract YouTube video data';
    let statusCode = 500;
    
    if (error.message.includes('timeout')) {
      errorMessage = 'Request timeout - the video took too long to fetch. Try a shorter video.';
      statusCode = 504;
    } else if (error.message.includes('Video unavailable')) {
      errorMessage = 'Video is unavailable or private';
      statusCode = 404;
    } else if (error.message.includes('Video not found')) {
      errorMessage = 'Video not found';
      statusCode = 404;
    } else if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
      errorMessage = 'Too many requests. Please try again in a few minutes.';
      statusCode = 429;
    } else if (error.message.includes('Sign in to confirm')) {
      errorMessage = 'Age-restricted video - cannot extract data without authentication';
      statusCode = 403;
    } else if (error.message.includes('Could not extract')) {
      errorMessage = 'YouTube structure changed. The library needs updating.';
      statusCode = 503;
    }
    
    res.status(statusCode).json({ 
      success: false, 
      error: errorMessage,
      details: error.message,
      troubleshooting: 'If this persists, try: 1) Restart the server, 2) Try a different video, 3) Check if the video is public'
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
      },
      headers: {
        'User-Agent': 'SitesOrbit/1.0 (https://sitesorbit.com; webmaster@sitesorbit.com)'
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
    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.status === 403 
      ? 'Wikipedia API requires a User-Agent header. Please contact the administrator.'
      : error.response?.data?.error || error.message;
    res.status(500).json({ 
      error: 'Failed to fetch Wikipedia images',
      details: errorMessage
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

// Upload image to imgBB
app.post('/api/imgbb/upload', async (req, res) => {
  const { imageData } = req.body;
  
  if (!imageData) {
    return res.status(400).json({ error: 'Image data is required' });
  }

  try {
    // Extract base64 data from data URL if needed
    let base64Data = imageData;
    if (imageData.startsWith('data:image/')) {
      const base64Match = imageData.match(/^data:image\/\w+;base64,(.+)$/);
      if (!base64Match) {
        return res.status(400).json({ error: 'Invalid image data URL format' });
      }
      base64Data = base64Match[1];
    }

    // Upload to imgBB
    const formData = new URLSearchParams();
    formData.append('key', 'IMGBB_KEY_PLACEHOLDER');
    formData.append('image', base64Data);
    formData.append('expiration', '10800'); // 3 hours in seconds

    const response = await axios.post('https://api.imgbb.com/1/upload', formData.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (response.data.success && response.data.data && response.data.data.url) {
      res.json({
        success: true,
        url: response.data.data.url,
        expiration: response.data.data.expiration
      });
    } else {
      throw new Error('Invalid response from imgBB');
    }
  } catch (error) {
    console.error('imgBB upload error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to upload image to imgBB',
      details: error.response?.data?.error?.message || error.message
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 SitesOrbit Backend API running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔍 Available endpoints:`);
  console.log(`   - GET  /api/unsplash/search?query=...`);
  console.log(`   - GET  /api/pexels/search?query=...`);
  console.log(`   - GET  /api/pexels/videos?query=... 🎬`);
  console.log(`   - GET  /api/pixabay/search?query=...`);
  console.log(`   - GET  /api/pixabay/videos?query=... 🎬`);
  console.log(`   - GET  /api/wikipedia/search?query=...`);
  console.log(`   - GET  /api/youtube/extract?url=... 🎥`);
  console.log(`   - GET  /api/analyze-site?url=... 🔍`);
  console.log(`   - POST /api/ai-image/generate`);
  console.log(`   - POST /api/imgbb/upload`);
});

