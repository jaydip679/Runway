require('dotenv').config();
const http = require('http');
const { exec } = require('child_process');

const PORT = 3000;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env');
  process.exit(1);
}

const SCOPES = 'https://www.googleapis.com/auth/gmail.send';

// 1. Generate Auth URL
const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
  `client_id=${CLIENT_ID}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&response_type=code` +
  `&scope=${encodeURIComponent(SCOPES)}` +
  `&access_type=offline` +
  `&prompt=consent`; // Force consent to guarantee we get a refresh_token

console.log('----------------------------------------------------');
console.log('🚀 GMAIL API OAUTH2 HELPER');
console.log('----------------------------------------------------');
console.log('Please click or copy/paste the following URL into your browser:\n');
console.log(authUrl);
console.log('\n----------------------------------------------------\n');

// 2. Open browser automatically (fixed for Windows start command bug)
const startCmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start ""' : 'xdg-open';
exec(`${startCmd} "${authUrl}"`);

// 3. Start local server to receive the callback
const server = http.createServer(async (req, res) => {
  if (req.url.startsWith('/oauth2callback')) {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const code = url.searchParams.get('code');
    
    if (!code) {
      res.writeHead(400);
      res.end('Authentication failed. No code found.');
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write('<h1>Authentication successful!</h1><p>You can close this window and return to your terminal.</p>');
    res.end();

    console.log('✅ Received authorization code. Exchanging for tokens...');

    // 4. Exchange code for Refresh Token
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          redirect_uri: REDIRECT_URI,
          grant_type: 'authorization_code',
        })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error_description || data.error);
      }

      console.log('\n🎉 SUCCESS! Here is your Refresh Token:');
      console.log('----------------------------------------------------');
      console.log(`GMAIL_REFRESH_TOKEN=${data.refresh_token}`);
      console.log('----------------------------------------------------');
      console.log('\nCopy the line above into your local .env file and Render dashboard!');
      
    } catch (err) {
      console.error('❌ Failed to exchange token:', err.message);
    } finally {
      process.exit(0);
    }
  }
});

server.listen(PORT, () => {
  console.log(`Waiting for Google callback on ${REDIRECT_URI}...`);
});
