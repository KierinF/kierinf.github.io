# Proxy Server for CRM Demo

**Why you need this:** Browsers block direct API calls to Anthropic due to CORS policy. This simple proxy server solves that problem.

## 🚀 One-Click Deploy (Recommended)

### Option 1: Railway (Easiest - Free $5 credit)

1. Click: [![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

2. Fork this repo if prompted

3. **Add environment variable:**
   - Key: `ANTHROPIC_API_KEY`
   - Value: `your-api-key-here`

4. Click **Deploy**

5. Copy your Railway URL (e.g., `https://your-app.railway.app`)

6. Update `app.js` line 521 to use your Railway URL:
   ```javascript
   const response = await fetch('https://your-app.railway.app/api/messages', {
   ```

7. Commit and push to GitHub

**Done!** Your demo will work in ~2 minutes.

---

### Option 2: Render (Free tier)

1. Go to: https://render.com

2. Click **"New +"** → **"Web Service"**

3. Connect this GitHub repo

4. Settings:
   - **Root Directory:** `proxy`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

5. **Add environment variable:**
   - Key: `ANTHROPIC_API_KEY`
   - Value: `your-api-key-here`

6. Click **Create Web Service**

7. Copy your Render URL (e.g., `https://your-app.onrender.com`)

8. Update `app.js` line 521 with your URL

**Done!**

---

### Option 3: Vercel (Free tier)

1. Install Vercel CLI: `npm i -g vercel`

2. From the `proxy/` directory, run:
   ```bash
   vercel
   ```

3. Follow prompts (it will auto-detect Node.js)

4. Set environment variable:
   ```bash
   vercel env add ANTHROPIC_API_KEY
   ```

5. Copy your Vercel URL

6. Update `app.js` line 521 with your URL

**Done!**

---

## 🧪 Test Your Proxy

Once deployed, test it:

```bash
curl https://your-proxy-url.com/
```

Should return: `{"status":"ok","message":"CRM Demo Proxy Server"}`

---

## 🔧 Local Development

```bash
cd proxy
npm install
export ANTHROPIC_API_KEY=your-key-here
npm start
```

Then update `app.js` to use `http://localhost:3000/api/messages`

---

## 💡 What This Does

- Receives API requests from your browser
- Adds your Anthropic API key
- Forwards to Anthropic's API
- Returns the response
- Enables CORS headers so browsers allow it

**Security:** Your API key stays on the server (not in browser code).

---

## ⚠️ Important

After deploying, update the URL in `/app.js` at line 521:

```javascript
const response = await fetch('YOUR_DEPLOYED_URL_HERE/api/messages', {
```

Then push to GitHub to update your live site!
