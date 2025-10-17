// Example Express.js backend proxy for Box UI Elements
// This proxy handles authentication server-side and routes Box API calls
// Install: npm install express axios

const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// CORS middleware for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Box API proxy endpoint
app.post('/api/box/proxy', async (req, res) => {
  try {
    const {
      originalUrl,
      originalMethod,
      originalData,
      originalParams,
      originalHeaders
    } = req.body;

    console.log('Proxying request:', {
      method: originalMethod,
      url: originalUrl
    });

    // Get access token from your secure token service
    // This could be JWT, OAuth2, or App Token depending on your setup
    const accessToken = await getSecureAccessToken(req);

    // Prepare the request to Box API
    const boxRequest = {
      method: originalMethod.toLowerCase(),
      url: originalUrl,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': originalHeaders?.['Content-Type'] || 'application/json',
        // Remove any client-side headers that shouldn't be forwarded
        ...filterHeaders(originalHeaders)
      }
    };

    // Add data for POST/PUT requests
    if (originalData && ['post', 'put', 'patch'].includes(originalMethod.toLowerCase())) {
      boxRequest.data = originalData;
    }

    // Add query parameters
    if (originalParams) {
      boxRequest.params = originalParams;
    }

    // Make request to Box API
    const boxResponse = await axios(boxRequest);

    // Return the response to the UI Elements
    res.json(boxResponse.data);

  } catch (error) {
    console.error('Proxy error:', error.response?.data || error.message);

    // Return appropriate error to UI Elements
    const status = error.response?.status || 500;
    const errorData = error.response?.data || {
      type: 'error',
      message: 'Proxy server error'
    };

    res.status(status).json(errorData);
  }
});

// Secure token retrieval function
async function getSecureAccessToken(req) {
  // TODO: Implement your token management logic here
  // This is where you'd:
  // 1. Validate the user's session/authentication
  // 2. Generate or retrieve a Box access token
  // 3. Return a valid token with appropriate permissions

  // For demo purposes, return a placeholder
  // In production, replace with actual token logic:

  // Example JWT implementation:
  // return await generateJWTToken(userId);

  // Example OAuth2 implementation:
  // return await getOAuth2Token(req.user.id);

  // Example App Token implementation:
  // return process.env.BOX_APP_TOKEN;
  try {
    return "x492QHyP0x5GNg7QBZ07b24KeOwcfpAK"
  } catch (e) {
    console.error('Error getting access token:', e);
    throw new Error('Failed to get access token');
  }
}

// Filter headers to remove client-specific headers
function filterHeaders(headers) {
  if (!headers) return {};

  const filteredHeaders = { ...headers };

  // Remove headers that shouldn't be forwarded
  delete filteredHeaders['host'];
  delete filteredHeaders['origin'];
  delete filteredHeaders['referer'];
  delete filteredHeaders['user-agent'];
  delete filteredHeaders['accept-encoding'];
  delete filteredHeaders['accept-language'];
  delete filteredHeaders['sec-fetch-mode'];
  delete filteredHeaders['sec-fetch-site'];
  delete filteredHeaders['sec-fetch-dest'];

  return filteredHeaders;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Box proxy server is running' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Box proxy server running on port ${PORT}`);
  console.log('Available endpoints:');
  console.log('  POST /api/box/proxy - Box API proxy');
  console.log('  GET /api/health - Health check');
});

module.exports = app;