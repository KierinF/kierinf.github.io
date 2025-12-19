# Deploying the AI Demo Agent

## The Problem

The AI demo requires calling Anthropic's API from the browser, but:
1. **CORS Policy**: Browsers block direct API calls to Anthropic (security feature)
2. **API Key Security**: We can't hardcode API keys in public GitHub repos
3. **GitHub Pages**: Static hosting can't run backend servers

## Solution Options

### Option 1: Local Development Only (Easiest)
**Best for**: Testing and development

**Status**: ✅ Already set up (proxy-server.py)

**Limitations**: Only works on your local machine

### Option 2: Deploy Serverless Proxy (Recommended for Production)
**Best for**: Public demos on GitHub Pages

You need to deploy a simple proxy server that:
- Runs on a public URL
- Forwards browser requests to Anthropic API
- Adds your API key securely

**Free Options:**

#### A. Cloudflare Workers (Recommended - Free tier: 100k requests/day)
1. Sign up at https://workers.cloudflare.com/
2. Create a new Worker
3. Copy the code from [worker-template.js](./docs/worker-template.js)
4. Add your API key as an environment variable
5. Deploy
6. Update `app.js` to use your Worker URL instead of `localhost:8081`

#### B. Vercel Edge Functions (Free tier: 100k invocations/month)
1. Sign up at https://vercel.com/
2. Create a new project
3. Add an API route with the proxy code
4. Set API key as environment variable
5. Deploy
6. Update `app.js` to use your Vercel API endpoint

#### C. Railway / Render (Free tier with limitations)
1. Deploy the Python `proxy-server.py` file
2. Set API key as environment variable
3. Get public URL
4. Update `app.js`

### Option 3: Prompt Users for API Key (Not Recommended)
Let each user enter their own Anthropic API key through the UI.

**Pros**: No backend needed
**Cons**: Still has CORS issues, requires users to have API keys

## Current State

✅ **Working**: Local development (localhost:8080 + localhost:8081)
❌ **Not Working**: GitHub Pages (requires deployed proxy)

## Quick Start for GitHub Pages

1. Choose a serverless platform (Cloudflare Workers recommended)
2. Deploy the proxy with your API key
3. Update this line in `app.js`:
   ```javascript
   const response = await fetch('YOUR_PROXY_URL_HERE/api/messages', {
   ```
4. Commit and push to GitHub
5. Access via https://kierinf.github.io

**Important**: Rotate your API key after testing since it was exposed in this chat!
