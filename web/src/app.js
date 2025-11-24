// Simple client-side chat with Prompt Library and Prompt Optimizer
// Persists prompt library in localStorage under key 'promptLibrary'

const chatEl = document.getElementById('chat');
const promptForm = document.getElementById('promptForm');
const promptInput = document.getElementById('promptInput');
const savePromptBtn = document.getElementById('savePromptBtn');
const clearChatBtn = document.getElementById('clearChatBtn');

const openLibraryBtn = document.getElementById('openLibraryBtn');
const libraryModal = document.getElementById('libraryModal');
const libraryList = document.getElementById('libraryList');
const exportLibrary = document.getElementById('exportLibrary');
const importLibrary = document.getElementById('importLibrary');

const openOptimizerBtn = document.getElementById('openOptimizerBtn');
const optimizerModal = document.getElementById('optimizerModal');
const optimizerInput = document.getElementById('optimizerInput');
const runOptimize = document.getElementById('runOptimize');
const suggestionsEl = document.getElementById('suggestions');
const applyBest = document.getElementById('applyBest');

// Utility: get and set library
function getLibrary(){
  try{ return JSON.parse(localStorage.getItem('promptLibrary')||'[]') }catch(e){return[]}
}
function setLibrary(arr){ localStorage.setItem('promptLibrary', JSON.stringify(arr)) }

// Chat rendering (no AI backend; echo bot for demonstration)
function appendMessage(text, who='bot'){
  const msg = document.createElement('div');
  msg.className = 'msg ' + (who==='user' ? 'user':'bot');
  msg.textContent = text;
  chatEl.appendChild(msg);
  chatEl.scrollTop = chatEl.scrollHeight;
}

promptForm.addEventListener('submit', e =>{
  e.preventDefault();
  const prompt = promptInput.value.trim();
  if(!prompt) return;
  appendMessage(prompt, 'user');

  // Save to prompt history (a separate key) for quick recall
  savePromptHistory(prompt);

  // For demo, echo as bot after slight delay
  setTimeout(()=>{
    appendMessage('Bot (demo): received your prompt — try the Prompt Optimizer to improve it.');
  }, 500);

  promptInput.value = '';
});

clearChatBtn.addEventListener('click', ()=>{ chatEl.innerHTML=''; appendMessage('System: Chat cleared.'); });

// Prompt Library modal
openLibraryBtn.addEventListener('click', ()=>{ renderLibrary(); libraryModal.classList.remove('hidden'); });
openOptimizerBtn.addEventListener('click', ()=>{ // prefill optimizer with current input
  optimizerInput.value = promptInput.value.trim(); suggestionsEl.innerHTML=''; optimizerModal.classList.remove('hidden');
});

// Close buttons
document.querySelectorAll('.close').forEach(btn=>btn.addEventListener('click', e=>{ const id = e.target.dataset.close; document.getElementById(id).classList.add('hidden'); }))

// Save prompt to library
savePromptBtn.addEventListener('click', ()=>{
  const prompt = promptInput.value.trim();
  if(!prompt){ alert('Please type a prompt to save'); return }
  const lib = getLibrary();
  lib.unshift({id:Date.now(), text:prompt, createdAt:new Date().toISOString()});
  setLibrary(lib);
  alert('Saved to Prompt Library');
});

function renderLibrary(){
  const lib = getLibrary();
  libraryList.innerHTML = '';
  if(lib.length===0){ libraryList.innerHTML = '<div class="library-item">No prompts saved yet.</div>'; return }
  lib.forEach(item=>{
    const node = document.createElement('div'); node.className='library-item';
    const meta = document.createElement('div'); meta.className='meta'; meta.textContent = new Date(item.createdAt).toLocaleString();
    const text = document.createElement('div'); text.textContent = item.text;
    const actions = document.createElement('div'); actions.style.marginTop='8px';
    const useBtn = document.createElement('button'); useBtn.textContent='Use'; useBtn.className='primary';
    useBtn.addEventListener('click', ()=>{ promptInput.value = item.text; libraryModal.classList.add('hidden'); });
    const delBtn = document.createElement('button'); delBtn.textContent='Delete'; delBtn.className='secondary';
    delBtn.addEventListener('click', ()=>{ if(confirm('Delete this prompt?')){ const newLib = getLibrary().filter(p=>p.id!==item.id); setLibrary(newLib); renderLibrary(); }});
    actions.appendChild(useBtn); actions.appendChild(delBtn);
    node.appendChild(meta); node.appendChild(text); node.appendChild(actions);
    libraryList.appendChild(node);
  })
}

// Export / import
exportLibrary.addEventListener('click', ()=>{
  const data = JSON.stringify(getLibrary(), null, 2);
  const blob = new Blob([data], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download='prompt-library.json'; a.click(); URL.revokeObjectURL(url);
});
importLibrary.addEventListener('click', ()=>{
  const input = document.createElement('input'); input.type='file'; input.accept='application/json';
  input.onchange = e=>{
    const file = e.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = ev =>{ try{ const parsed = JSON.parse(ev.target.result); if(Array.isArray(parsed)){ setLibrary(parsed); renderLibrary(); alert('Imported successfully') }else alert('Invalid file') }catch(err){ alert('Invalid JSON') } }
    reader.readAsText(file);
  }
  input.click();
});

// Prompt history (simple separate list used by library and local retrieval)
function savePromptHistory(prompt){
  const key = 'promptHistory';
  try{
    const hist = JSON.parse(localStorage.getItem(key)||'[]');
    hist.unshift({id:Date.now(), text:prompt, at:new Date().toISOString()});
    // keep last 200
    localStorage.setItem(key, JSON.stringify(hist.slice(0,200)));
  }catch(e){ console.warn('Failed saving history',e) }
}

// Optimizer: client-side heuristic suggestions
function optimizePrompt(original){
  const suggestions = [];
  const trimmed = original.trim();
  // 1. Concise version: remove filler words
  const concise = trimmed.replace(/please|kindly|just/gi, '').replace(/\s{2,}/g,' ').trim();
  suggestions.push({title:'Concise', text: concise || trimmed});

  // 2. Role + clear goal
  const role = `You are an expert assistant. ${trimmed}`;
  suggestions.push({title:'Role + Goal', text: role});

  // 3. Structured with constraints & output format
  const structured = `${trimmed}\n\nConstraints: be concise, provide examples, and include steps if applicable.\nOutput: JSON with keys \"summary\" and \"steps\".`;
  suggestions.push({title:'Structured (with constraints & output)', text: structured});

  // 4. Detailed explicit instruction
  const detailed = `Act as a domain expert. ${trimmed}. Ask clarifying questions if necessary and produce a final actionable answer with examples.`;
  suggestions.push({title:'Detailed (expert)', text: detailed});

  // 5. Transform to prompt + sample input
  const sample = `${trimmed}\n\nExample Input:\n- context: none\nExample Output:\n- Provide a 3-sentence summary and 3 recommended next steps.`;
  suggestions.push({title:'With Example Input/Output', text: sample});

  return suggestions;
}

runOptimize.addEventListener('click', ()=>{
  const txt = optimizerInput.value.trim();
  if(!txt){ alert('Enter a prompt to optimize'); return }
  const sug = optimizePrompt(txt);
  suggestionsEl.innerHTML='';
  sug.forEach((s, i)=>{
    const el = document.createElement('div'); el.className='suggestion';
    const h = document.createElement('strong'); h.textContent = s.title; const pre = document.createElement('pre'); pre.textContent = s.text;
    const useBtn = document.createElement('button'); useBtn.textContent='Use'; useBtn.className='primary'; useBtn.style.marginTop='8px';
    useBtn.addEventListener('click', ()=>{ optimizerInput.value = s.text; alert('Applied suggestion to optimizer input'); });
    el.appendChild(h); el.appendChild(pre); el.appendChild(useBtn);
    suggestionsEl.appendChild(el);
  })
});

applyBest.addEventListener('click', ()=>{
  // Take first suggestion if present
  const first = suggestionsEl.querySelector('.suggestion pre');
  if(first){ promptInput.value = first.textContent; optimizerModal.classList.add('hidden'); }
  else alert('Run optimize first to generate suggestions');
});

// Seed UI
appendMessage('System: Welcome to the AI Chat demo. Use the Prompt Library and Prompt Optimizer from the toolbar.');
