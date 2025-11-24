// Minimal Express server to proxy the chat requests to OpenAI
// Works with Node 18+ (native fetch) and Node <18 using node-fetch dynamic import

require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());

// Serve the static front-end from the web/ folder
app.use(express.static(path.join(__dirname, '..', 'web')));

// Fetch helper: use global fetch if present, otherwise dynamically import node-fetch
let fetchFn = globalThis.fetch;
if (!fetchFn) {
  fetchFn = (...args) => import('node-fetch').then(m => m.default(...args));
}

const OPENAI_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_KEY) {
  console.warn('Warning: OPENAI_API_KEY not set. POST /api/chat will fail until you set it in .env');
}

app.post('/api/chat', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' });
    if (!OPENAI_KEY) return res.status(500).json({ error: 'OpenAI key not configured' });

    const resp = await fetchFn('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    const data = await resp.json();
    const text = data?.choices?.[0]?.message?.content ?? '';
    res.json({ text, raw: data });
  } catch (err) {
    console.error('Error in /api/chat', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Health check
app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`Open http://localhost:${PORT}/chatbot/index.html`);
});
