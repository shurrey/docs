# Secure Box UI Elements Token Service

This documentation site includes a secure backend service for generating temporary, downscoped Box access tokens for documentation demos.

## 🔐 Security Features

- **Downscoped Tokens**: Minimal permissions (preview + download only)
- **Short-lived**: 1-hour expiration by default
- **Demo Files Only**: Restricted to pre-approved demo files
- **No Token Exposure**: Tokens never appear in frontend source code

## 🏗️ Architecture

```
Mintlify Docs → Backend API → Box API
      ↓              ↓          ↓
  UI Elements  → Demo Token → Real Preview
```

## 📦 Setup Instructions

### 1. Install Dependencies
```bash
npm install box-node-sdk dotenv
```

### 2. Configure Environment
```bash
npm run setup-env
# Edit .env with your Box app credentials
```

### 3. Box App Setup

Create a **Server Authentication (JWT)** Box app:

1. Go to [Box Developer Console](https://account.box.com/developers/console)
2. Create New App → Custom App → Server Authentication (JWT)
3. Download the JSON config file
4. Extract credentials to `.env`:
   - Client ID & Secret
   - Key ID & Private Key
   - Enterprise ID

### 4. Demo Files Setup

Upload demo files to Box and update `.env`:
```bash
DEMO_FILE_PDF=123456789     # Replace with actual file IDs
DEMO_FILE_DOC=234567890
DEMO_FILE_IMAGE=345678901
```

### 5. Deploy Options

#### Option A: Vercel/Netlify (Serverless)
```bash
# Deploy as serverless function
vercel deploy
# or
netlify deploy
```

#### Option B: Express Server
```javascript
const express = require('express');
const { expressHandler } = require('./api/box/demo-token.js');

const app = express();
app.use('/api/box/demo-token', expressHandler);
app.listen(3001);
```

#### Option C: Next.js API Route
```bash
# Move to pages/api/box/demo-token.js
# Next.js will handle routing automatically
```

## 🎯 Frontend Integration

Update your Mintlify component:

```jsx
import { ContentPreview } from "/snippets/box-ui-secure.jsx"

<ContentPreview
  fileId="sample-doc"
  useSecureTokens={true}
  hasHeader={true}
  hasDownload={true}
/>
```

## 🔧 API Endpoint

**POST** `/api/box/demo-token`

**Request:**
```json
{
  "fileId": "sample-doc",
  "durationSeconds": 3600
}
```

**Response:**
```json
{
  "accessToken": "downscopedtoken123...",
  "expiresIn": 3600,
  "fileId": "1234567890",
  "tokenType": "downscoped_demo"
}
```

## 🚨 Security Best Practices

1. **Environment Variables**: Never commit `.env` to git
2. **CORS**: Restrict to your documentation domain
3. **Rate Limiting**: Add request throttling in production
4. **Monitoring**: Log token generation for security auditing
5. **Demo Files Only**: Never allow arbitrary file access

## 🔄 Deployment Checklist

- [ ] Box app configured with JWT authentication
- [ ] Demo files uploaded and IDs recorded
- [ ] Environment variables set in deployment platform
- [ ] CORS configured for your domain
- [ ] Rate limiting enabled
- [ ] Error monitoring set up

## 🐛 Troubleshooting

**Token Generation Fails:**
- Check Box app permissions (Enterprise admin approval)
- Verify private key format in environment variables
- Ensure demo file IDs exist and are accessible

**CORS Errors:**
- Add your documentation domain to ALLOWED_ORIGINS
- Check deployment platform CORS settings

**Preview Not Loading:**
- Verify Box UI Elements CDN is accessible
- Check browser console for JavaScript errors
- Confirm token service endpoint is reachable

## 📞 Support

For issues with Box API integration, see:
- [Box Developer Documentation](https://developer.box.com)
- [Box SDK for Node.js](https://github.com/box/box-node-sdk)
- [Box UI Elements](https://github.com/box/box-ui-elements)