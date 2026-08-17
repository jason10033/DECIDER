import { useState, useRef, useEffect } from 'react';
import { sendChatTurn, extractResponses } from '../services/prepChat';
import comparison from '../content/comparison.json';

// Metadata for the pages the chatbot can surface beside the conversation.
const REFERENCES = {
  education: {
    title: 'PrEP basics',
    blurb: 'How PrEP prevents HIV and what the options are.',
    route: '/education'
  },
  oral: {
    title: 'Daily Pill (oral PrEP)',
    blurb: 'One pill a day, taken at home.',
    route: '/learn/oral-prep'
  },
  'on-demand': {
    title: 'On-Demand Pill (2-1-1)',
    blurb: 'Pills taken around the time of sex. Studied for cisgender men who have sex with men.',
    route: '/learn/on-demand'
  },
  'injectable-2mo': {
    title: '2-Month Injection (cabotegravir)',
    blurb: 'A shot every 2 months at your provider.',
    route: '/learn/injectable-2mo'
  },
  'injectable-6mo': {
    title: '6-Month Injection (lenacapavir)',
    blurb: 'An injection just twice a year.',
    route: '/learn/injectable-6mo'
  },
  compare: {
    title: 'Compare all options',
    blurb: 'See the four options side by side.',
    route: '/compare'
  }
};

// Map a side-panel reference id to its Compare-table option id, so we can show
// the curated key facts inline (no navigation, so the conversation is never lost).
const OPTION_KEY = {
  oral: 'oral',
  'on-demand': 'on_demand',
  'injectable-2mo': 'injectable_2mo',
  'injectable-6mo': 'injectable_6mo'
};
const KEY_CATEGORIES = ['How You Take It', 'How Often', 'Effectiveness', "Who It's For", 'Stopping'];

function factsFor(id) {
  const optId = OPTION_KEY[id];
  if (!optId) return null;
  return comparison.categories
    .filter((c) => KEY_CATEGORIES.includes(c.label))
    .map((c) => ({ label: c.label, value: c[optId] }));
}

// Absolute URL so target=_blank reliably opens a new tab instead of navigating
// the current tab's hash in place (which would discard the conversation).
function fullUrl(route) {
  return `${window.location.origin}${window.location.pathname}#${route}`;
}

// Neutral fallbacks so a partial conversation still yields a complete results
// page. Real values extracted from the conversation always take precedence.
const DEFAULTS = {
  prep_00: 'prefer_not_say',
  prep_01: 'not_sure',
  prep_02: 'no_preference',
  prep_03: 'tolerable',
  prep_04: 'flexible',
  prep_05: 'somewhat',
  prep_07: 'not_sure',
  prep_08: ['none'],
  prep_09: 'most_effective',
  prep_10: 'not_sure'
};

function completeResponses(extracted) {
  const r = { ...DEFAULTS, ...extracted };
  if (!Array.isArray(r.prep_08) || r.prep_08.length === 0) r.prep_08 = ['none'];
  if (r.prep_00 === 'female' && !r.prep_06) r.prep_06 = 'not_sure';
  return r;
}

const GREETING =
  "Hi, I'm here to help you think through your PrEP options and get ready to talk with your provider. Nothing you share is saved. To start, what's on your mind about PrEP?";

export default function Chatbot({ onComplete }) {
  const [messages, setMessages] = useState([]); // {role, content}
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [refs, setRefs] = useState([]); // ordered list of reference ids
  const [expanded, setExpanded] = useState({}); // which reference cards show inline facts
  const [error, setError] = useState('');
  const scrollRef = useRef(null);

  const toggleExpanded = (id) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, busy]);

  const addRefs = (ids) => {
    setRefs((prev) => {
      const next = [...prev];
      for (const id of ids) {
        if (REFERENCES[id] && !next.includes(id)) next.push(id);
      }
      return next;
    });
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setError('');
    const nextMessages = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setBusy(true);
    try {
      const res = await sendChatTurn(nextMessages);
      setMessages((prev) => [...prev, { role: 'assistant', content: res.reply }]);
      if (res.references?.length) addRefs(res.references);
      if (res.ready) setReady(true);
    } catch (err) {
      setError(err.message || 'Something went wrong reaching the chatbot.');
    } finally {
      setBusy(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSeeResults = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const extracted = await extractResponses(messages);
      onComplete(completeResponses(extracted));
    } catch (err) {
      setError(err.message || 'Could not generate your results. Please try again.');
      setBusy(false);
    }
  };

  return (
    <div className="chatbot-page">
      <div className="chatbot-header">
        <span className="pilot-badge">Chatbot pilot</span>
        <h1>Talk it Through</h1>
        <p className="chatbot-intro">
          Have a short conversation about your PrEP options. As you talk, relevant information
          will appear on the right, and you can get a personalized summary for your provider when
          you're ready. This is educational and does not replace medical advice.
        </p>
      </div>

      <div className="chatbot-layout">
        <div className="chat-column">
          <div className="chat-messages" ref={scrollRef}>
            <div className="chat-bubble assistant">{GREETING}</div>
            {messages.map((m, i) => (
              <div key={i} className={`chat-bubble ${m.role}`}>{m.content}</div>
            ))}
            {busy && (
              <div className="chat-bubble assistant chat-typing" aria-live="polite">
                <span></span><span></span><span></span>
              </div>
            )}
          </div>

          {error && <div className="chat-error">{error}</div>}

          {ready && (
            <div className="chat-ready">
              <p>You've covered enough for a personalized summary.</p>
              <button className="btn btn-primary" onClick={handleSeeResults} disabled={busy}>
                See my personalized results &rarr;
              </button>
            </div>
          )}

          <div className="chat-input-row">
            <textarea
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows={2}
              disabled={busy}
            />
            <button className="btn btn-primary chat-send" onClick={handleSend} disabled={busy || !input.trim()}>
              Send
            </button>
          </div>
        </div>

        <aside className="chat-side-panel" aria-label="Relevant information">
          <h2>For you to explore</h2>
          {refs.length === 0 ? (
            <p className="side-panel-empty">
              As your conversation touches on different PrEP options, links to learn more will
              appear here.
            </p>
          ) : (
            <ul className="side-panel-cards">
              {refs.map((id) => {
                const ref = REFERENCES[id];
                const facts = factsFor(id);
                const isOpen = expanded[id];
                return (
                  <li key={id} className="side-panel-card">
                    <h3>{ref.title}</h3>
                    <p>{ref.blurb}</p>
                    {facts && (
                      <button
                        type="button"
                        className="side-panel-toggle"
                        onClick={() => toggleExpanded(id)}
                        aria-expanded={isOpen}
                      >
                        {isOpen ? 'Hide key facts' : 'Show key facts'}
                      </button>
                    )}
                    {facts && isOpen && (
                      <dl className="side-panel-facts">
                        {facts.map((f) => (
                          <div key={f.label}>
                            <dt>{f.label}</dt>
                            <dd>{f.value}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                    <a
                      href={fullUrl(ref.route)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="side-panel-link"
                    >
                      Open full page (new tab) &rarr;
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
