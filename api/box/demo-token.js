// Backend API endpoint for secure Box token generation
// This would typically be deployed as a serverless function or Express route

const BoxSDK = require('box-node-sdk');

// Initialize Box SDK with your app credentials
const sdk = new BoxSDK({
  clientID: process.env.BOX_CLIENT_ID,
  clientSecret: process.env.BOX_CLIENT_SECRET,
  appAuth: {
    keyID: process.env.BOX_KEY_ID,
    privateKey: process.env.BOX_PRIVATE_KEY,
    passphrase: process.env.BOX_PASSPHRASE
  }
});

// Demo files configuration - these should be public demo files in your Box account
const DEMO_FILES = {
  'sample-doc': '1234567890', // Replace with actual demo file IDs
  'sample-pdf': '2345678901',
  'sample-image': '3456789012',
  'sample-video': '4567890123'
};

export default async function handler(req, res) {
  // CORS headers for documentation site
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileId, durationSeconds = 3600 } = req.body;

    // Validate that it's a demo file
    const validDemoFiles = Object.values(DEMO_FILES);
    const requestedFileId = DEMO_FILES[fileId] || fileId;

    if (!validDemoFiles.includes(requestedFileId)) {
      return res.status(400).json({
        error: 'Invalid file ID. Only demo files are supported.',
        availableDemoFiles: Object.keys(DEMO_FILES)
      });
    }

    // Get application client
    const client = sdk.getAppAuthClient('enterprise', process.env.BOX_ENTERPRISE_ID);

    // Create a downscoped token with minimal permissions
    const scopes = ['item_preview', 'item_download']; // Minimal read-only permissions
    const resource = `https://api.box.com/2.0/files/${requestedFileId}`;

    const tokenInfo = await client.exchangeToken(scopes, resource, {
      expires_in: durationSeconds
    });

    // Log for monitoring (remove in production)
    console.log(`Generated demo token for file ${requestedFileId}, expires in ${durationSeconds}s`);

    return res.status(200).json({
      accessToken: tokenInfo.accessToken,
      expiresIn: tokenInfo.expiresIn,
      fileId: requestedFileId,
      tokenType: 'downscoped_demo',
      message: 'Token generated successfully for demo file'
    });

  } catch (error) {
    console.error('Token generation error:', error);

    return res.status(500).json({
      error: 'Failed to generate demo token',
      message: error.message,
      fallback: 'Demo mode will be used instead'
    });
  }
}

// Alternative Express.js version for non-serverless deployment
export const expressHandler = (req, res) => {
  return handler(req, res);
};

// Environment variables needed:
// BOX_CLIENT_ID=your_box_app_client_id
// BOX_CLIENT_SECRET=your_box_app_client_secret
// BOX_KEY_ID=your_box_app_key_id
// BOX_PRIVATE_KEY=your_box_app_private_key
// BOX_PASSPHRASE=your_box_app_passphrase
// BOX_ENTERPRISE_ID=your_box_enterprise_id