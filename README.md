# Running the AI Demo Agent

The AI demo agent calls the Anthropic API directly from your browser using your API key.

## Quick Start

### For GitHub Pages (Recommended)

1. **Visit the site:**
   Navigate to `https://kierinf.github.io`

2. **Add your API key:**
   Click "Add your Anthropic API key" in the warning banner and enter your key

3. **Start chatting:**
   Ask the AI to demonstrate CRM features!

### For Local Development

1. **Start a local server:**
   ```bash
   python3 -m http.server 8080
   ```

2. **Open your browser:**
   Navigate to `http://localhost:8080`

3. **Add your API key:**
   Click "Add your Anthropic API key" and enter your key

## How It Works

- Your API key is stored securely in your browser's localStorage
- API calls go directly from your browser to Anthropic's API
- The key never touches any server (100% client-side)

## CORS Note

**Important:** Some browsers may block direct API calls due to CORS policy. If you encounter CORS errors:
- Try a different browser (Chrome/Edge usually work)
- Or see DEPLOYMENT.md for proxy server options

## Security Note

- Your API key stays in your browser only
- It's stored in localStorage and never sent to any server except Anthropic
- Clear your browser data to remove the stored key
- Get your API key at https://console.anthropic.com/
