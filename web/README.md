```markdown
# AI Chat - Prompt Library & Optimizer (Demo)

This adds a small static web UI under web/ that demonstrates:

- A simple chat interface (demo bot only) at web/chatbot/index.html
- Prompt Library: save and manage prompts stored in localStorage
- Prompt History: recent prompts are saved separately in localStorage
- Prompt Optimizer: client-side heuristic optimizer that generates improved prompt variants

How to use

1. Open web/chatbot/index.html in a browser (or serve the web/ folder with a static server).
2. Type a prompt into the input box and press Send (demo bot will echo a response).
3. Save prompts to the library using "Save to Library".
4. Open Prompt Optimizer from the toolbar to generate improved prompt suggestions.

Notes

- This is a client-side demo and does not connect to an LLM. The optimizer uses simple heuristic transformations to illustrate how prompts can be improved.
- You can extend app.js to call an API (e.g., OpenAI) to run real optimizations or connect to a backend for persistent storage.

Next steps you might want me to do:
- Integrate a backend (Node/Express) to persist prompts in a database and connect to a real LLM for optimization.
- Add authentication and multi-user prompt libraries.
- Wire the chat to a real LLM provider.
```
