# Running the AI Demo Agent Locally

The AI demo agent requires a backend proxy server to avoid CORS issues when calling the Anthropic API from the browser.

## Quick Start

1. **Edit `proxy-server.py` and add your API key:**
   ```python
   ANTHROPIC_API_KEY = 'your-api-key-here'
   ```

2. **Start the proxy server:**
   ```bash
   python3 proxy-server.py
   ```
   This runs on `http://localhost:8081`

3. **Start the web server:**
   ```bash
   python3 -m http.server 8080
   ```
   This runs on `http://localhost:8080`

4. **Open your browser:**
   Navigate to `http://localhost:8080`

5. **Add your API key in the UI:**
   Click "Add your Anthropic API key" and enter your key

## Why a Proxy Server?

Browsers block direct API calls to third-party services (CORS policy). The proxy server:
- Runs locally on your machine
- Forwards requests from the browser to Anthropic's API
- Adds the necessary authentication headers

## Security Note

- The `proxy-server.py` file is in `.gitignore` to prevent accidentally committing your API key
- Your API key is also stored in your browser's localStorage
- Never commit API keys to version control
