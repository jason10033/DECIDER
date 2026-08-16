// Client for the PrEP options chatbot backend (netlify/functions/prep-chat.js).
// In production this calls the serverless function, which proxies Claude with the
// API key kept server-side. During local `vite dev` (no functions runtime) it
// falls back to a scripted mock so the UI can be exercised without a key.

const ENDPOINT = '/.netlify/functions/prep-chat';

async function callBackend(payload) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    let message = `Chat backend error ${res.status}`;
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      // keep default message
    }
    throw new Error(message);
  }
  return res.json();
}

export async function sendChatTurn(messages) {
  try {
    return await callBackend({ action: 'chat', messages });
  } catch (err) {
    if (import.meta.env.DEV) return mockChatTurn(messages);
    throw err;
  }
}

export async function extractResponses(messages) {
  try {
    const data = await callBackend({ action: 'extract', messages });
    return data.responses || {};
  } catch (err) {
    if (import.meta.env.DEV) return mockExtract(messages);
    throw err;
  }
}

// ---- Development mock (only used when the function is unavailable in dev) ----

function mockChatTurn(messages) {
  const userTurns = messages.filter((m) => m.role === 'user').length;
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  const text = (lastUser?.content || '').toString().toLowerCase();

  const references = [];
  if (/inject|shot|needle|cabotegravir|lenacapavir|every 2|every 6|6 month|two month/.test(text)) {
    references.push('injectable-2mo', 'injectable-6mo');
  }
  if (/pill|daily|oral|truvada|descovy/.test(text)) references.push('oral');
  if (/2-1-1|on.?demand|before sex|event/.test(text)) references.push('on-demand');
  if (/compare|difference|options|side by side/.test(text)) references.push('compare');

  const replies = [
    "[dev mock] Thanks for sharing that. To start, what draws you to thinking about PrEP right now?",
    "[dev mock] That makes sense. Would you rather take a daily pill at home, or get an injection at the clinic so you don't think about it as often?",
    "[dev mock] Good to know. How do you feel about needles, and how important is privacy for you?",
    "[dev mock] Helpful. And how often would you be comfortable coming in to see a provider?",
    "[dev mock] I think I have a good sense of what matters to you. You can view your personalized results whenever you're ready, or keep chatting."
  ];
  const reply = replies[Math.min(userTurns - 1, replies.length - 1)] || replies[replies.length - 1];
  const ready = userTurns >= 5;

  return Promise.resolve({ reply, references, ready, readyNote: ready ? 'Covered the key dimensions.' : '' });
}

function mockExtract() {
  return Promise.resolve({
    prep_00: 'male',
    prep_01: 'no',
    prep_02: 'injection',
    prep_03: 'fine',
    prep_04: 'every_6mo',
    prep_05: 'very_important',
    prep_07: 'no',
    prep_08: ['remembering', 'privacy'],
    prep_09: 'convenience',
    prep_10: 'private_insurance'
  });
}
