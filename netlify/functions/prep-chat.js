// Server-side proxy for the DECIDE PrEP options chatbot.
// The Anthropic API key stays server-side and is never sent to the browser.
// Two actions:
//   - "chat":    a conversational turn; may surface reference pages and mark the
//                conversation ready for results.
//   - "extract": pull the conversation into the same prep_00..prep_10 schema the
//                assessment uses, so the existing recommendation engine can run.

import comparison from '../../src/content/comparison.json' with { type: 'json' };
import assessment from '../../src/content/assessment.json' with { type: 'json' };

// A field-by-field guide for extraction, built from the assessment's own
// question text and option labels so the model knows exactly what each prep_*
// field and option value means.
function buildExtractGuide() {
  const lines = [
    'Map the conversation to these questions. For each question the conversation addresses, directly or by clear implication, choose the closest option value. Leave a question out only when the conversation gives no signal about it.'
  ];
  for (const q of assessment.questions) {
    const opts = q.options.map((o) => `${o.value} = ${o.label}`).join('; ');
    const multi = q.type === 'multi_choice' ? ' [choose all that apply]' : '';
    lines.push(`- ${q.id}${multi} — "${q.text}": ${opts}`);
  }
  return lines.join('\n');
}
const EXTRACT_GUIDE = buildExtractGuide();

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';
const ANTHROPIC_VERSION = '2023-06-01';

// Ground the conversation in the tool's own curated Compare content so the
// chatbot's spoken facts match the rest of DECIDE rather than drifting to
// general knowledge. Built from comparison.json (single source of truth).
function buildGrounding() {
  const lines = [
    'CURATED FACTS. The following are DECIDE\'s own vetted facts from the Compare page. Ground everything you say about the options in these. Do not contradict them or invent numbers that conflict with them:'
  ];
  for (const opt of comparison.options) {
    lines.push('');
    lines.push(`${opt.name} (${opt.brandName}):`);
    for (const cat of comparison.categories) {
      lines.push(`- ${cat.label}: ${cat[opt.id]}`);
    }
    const bf = comparison.bestFor.find((b) => b.id === opt.id);
    if (bf) lines.push(`- ${bf.title} ${bf.points.join('; ')}`);
  }
  return lines.join('\n');
}

const GROUNDING = buildGrounding();

// Token pricing per million tokens, for surfacing an estimated cost per
// conversation. Cache reads/writes priced relative to input.
const PRICING = {
  'claude-sonnet-5': { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75, introInput: 2, introOutput: 10, introUntil: '2026-08-31' },
  'claude-opus-5': { input: 5, output: 25, cacheRead: 0.5, cacheWrite: 6.25 },
  'claude-haiku-4-5': { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 }
};

function priceFor(model) {
  const p = PRICING[model] || PRICING['claude-sonnet-5'];
  let input = p.input;
  let output = p.output;
  if (p.introUntil && new Date() <= new Date(`${p.introUntil}T23:59:59Z`)) {
    input = p.introInput;
    output = p.introOutput;
  }
  return { input, output, cacheRead: p.cacheRead, cacheWrite: p.cacheWrite };
}

function emptyUsage() {
  return { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 };
}

function addUsage(acc, u) {
  if (!u) return;
  acc.input_tokens += u.input_tokens || 0;
  acc.output_tokens += u.output_tokens || 0;
  acc.cache_read_input_tokens += u.cache_read_input_tokens || 0;
  acc.cache_creation_input_tokens += u.cache_creation_input_tokens || 0;
}

function costFromUsage(model, u) {
  const p = priceFor(model);
  const perM = (tok, rate) => ((tok || 0) / 1e6) * rate;
  return (
    perM(u.input_tokens, p.input) +
    perM(u.output_tokens, p.output) +
    perM(u.cache_read_input_tokens, p.cacheRead) +
    perM(u.cache_creation_input_tokens, p.cacheWrite)
  );
}

// Pages the chatbot can surface beside the conversation. Adding a new modality
// is a matter of extending this list and the extraction schema below.
const REFERENCE_IDS = [
  'oral',
  'on-demand',
  'injectable-2mo',
  'injectable-6mo',
  'compare',
  'education'
];

const SYSTEM_PROMPT = `You are a warm, plain-spoken PrEP options counselor inside DECIDE, a shared decision-making tool for HIV pre-exposure prophylaxis (PrEP). You are talking with a person who is considering PrEP. Your job is to have a short, natural conversation that helps them think through which PrEP option might fit their life, and to prepare them for a conversation with their healthcare provider. You are not a clinician and you do not diagnose or prescribe.

The four PrEP options are: daily oral PrEP (tenofovir/emtricitabine); on-demand oral PrEP (the 2-1-1 schedule, currently studied only for cisgender men who have sex with men); the injection every 2 months (cabotegravir); and the injection every 6 months (lenacapavir).

Over the course of the conversation, gently and naturally cover these dimensions (do not interrogate, do not fire questions in a list, and do not restate what they already told you):
- sex assigned at birth
- whether they have used PrEP before
- pregnancy, breastfeeding, or plans for pregnancy in the next year (only if they were assigned female at birth)
- other medications, vitamins, or supplements they take regularly
- their insurance or coverage situation
- whether they would rather take a pill or get an injection
- how important privacy is to them
- their main concerns about PrEP
- what matters most to them in choosing an option
- how they feel about needles
- how often they are comfortable visiting a provider

Behavior rules:
- Ask one thing at a time. Keep every reply short and conversational, usually one to three sentences.
- Reflect back what you hear before moving on. Be nonjudgmental.
- When a specific option or a side-by-side comparison is relevant to what the person is discussing, call the surface_references tool with the relevant page ids so the interface can show that information beside the chat. Surface references when they help, not on every turn.
- When you have gathered enough across the dimensions above to support a personalized summary, call the mark_ready tool with ready set to true. Then invite the person to view their results, and let them keep chatting if they want.
- Do not output markdown headings, bullet lists, emoji, or em dashes. Write in plain sentences.
- Never claim a specific option is right for them; frame everything as something to discuss with their provider.`;

const TOOLS = [
  {
    name: 'surface_references',
    description:
      'Show one or more DECIDE information pages beside the chat, because they are relevant to what the user is currently discussing. Call this whenever a modality or the comparison would help the user right now.',
    input_schema: {
      type: 'object',
      properties: {
        pageIds: {
          type: 'array',
          items: { type: 'string', enum: REFERENCE_IDS },
          description:
            'Page ids to display. oral = daily pill; on-demand = 2-1-1; injectable-2mo = cabotegravir; injectable-6mo = lenacapavir; compare = side-by-side; education = PrEP basics.'
        }
      },
      required: ['pageIds']
    }
  },
  {
    name: 'mark_ready',
    description:
      'Signal that enough has been discussed across the key dimensions to generate a personalized summary for the user. Call this once you can reasonably characterize their preferences.',
    input_schema: {
      type: 'object',
      properties: {
        ready: { type: 'boolean' },
        note: {
          type: 'string',
          description: 'One short sentence on why the conversation is ready.'
        }
      },
      required: ['ready']
    }
  }
];

// Extraction schema: mirrors assessment.json prep_00..prep_10 exactly so the
// existing recommendation engine consumes it unchanged. All fields optional -
// only include what the conversation supports.
// Every field is REQUIRED with an explicit "not_discussed" escape value. This
// forces the model to make a decision for each dimension (so it stops silently
// skipping things the person clearly said); "not_discussed" values are stripped
// afterward so only real answers reach the recommendation engine.
const ND = 'not_discussed';
const EXTRACT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    prep_00: { type: 'string', enum: ['male', 'female', 'intersex', 'prefer_not_say', ND], description: 'Sex assigned at birth. Use not_discussed if not clearly stated; never guess.' },
    prep_01: { type: 'string', enum: ['yes_oral', 'yes_injectable', 'yes_both', 'no', 'not_sure', ND], description: 'Whether they have used PrEP before.' },
    prep_06: { type: 'string', enum: ['yes', 'no', 'not_applicable', 'not_sure', ND], description: 'Pregnant/breastfeeding/planning pregnancy within a year. not_applicable if not assigned female at birth; not_discussed if unknown. Never guess.' },
    prep_07: { type: 'string', enum: ['yes_prescription', 'yes_supplements', 'yes_both', 'no', 'not_sure', ND], description: 'Other medications, vitamins, or supplements taken regularly.' },
    prep_10: { type: 'string', enum: ['private_insurance', 'medicaid', 'medicare', 'no_insurance', 'not_sure', 'prefer_not_say', ND], description: 'Insurance or coverage situation.' },
    prep_02: { type: 'string', enum: ['daily_pill', 'injection', 'no_preference', ND], description: 'Prefer a daily pill or an injection.' },
    prep_05: { type: 'string', enum: ['very_important', 'somewhat', 'not_concerned', ND], description: 'How important privacy/discretion is to them.' },
    prep_08: { type: 'array', items: { type: 'string', enum: ['side_effects', 'cost', 'remembering', 'privacy', 'needles', 'clinic_visits', 'stopping', 'none'] }, description: 'Every concern they mention. Empty array if none discussed.' },
    prep_09: { type: 'string', enum: ['convenience', 'fewest_side_effects', 'most_effective', 'most_private', 'easiest_to_stop', 'fewest_visits', 'lowest_cost', ND], description: 'Their single top priority in choosing an option.' },
    prep_03: { type: 'string', enum: ['fine', 'tolerable', 'prefer_avoid', 'no_way', ND], description: 'How they feel about needles/injections.' },
    prep_04: { type: 'string', enum: ['every_2mo', 'every_3mo', 'every_6mo', 'flexible', ND], description: 'How often they are comfortable visiting a provider.' }
  },
  required: ['prep_00', 'prep_01', 'prep_06', 'prep_07', 'prep_10', 'prep_02', 'prep_05', 'prep_08', 'prep_09', 'prep_03', 'prep_04']
};

async function callAnthropic(apiKey, body) {
  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic API ${res.status}: ${text}`);
  }
  return res.json();
}

// Run a short server-side tool loop so the assistant's text and its tool calls
// resolve within a single request. Tool side effects are collected and returned
// to the client; tool results are trivial acknowledgements.
async function runChat(apiKey, clientMessages) {
  const messages = clientMessages.map((m) => ({ role: m.role, content: m.content }));
  const references = [];
  const usage = emptyUsage();
  let ready = false;
  let readyNote = '';

  for (let i = 0; i < 5; i++) {
    const data = await callAnthropic(apiKey, {
      model: MODEL,
      max_tokens: 1024,
      system: [{ type: 'text', text: `${SYSTEM_PROMPT}\n\n${GROUNDING}`, cache_control: { type: 'ephemeral' } }],
      tools: TOOLS,
      output_config: { effort: 'low' },
      messages
    });
    addUsage(usage, data.usage);

    const textBlocks = data.content.filter((b) => b.type === 'text');
    const toolUses = data.content.filter((b) => b.type === 'tool_use');

    if (data.stop_reason === 'tool_use' && toolUses.length > 0) {
      messages.push({ role: 'assistant', content: data.content });
      const toolResults = toolUses.map((tu) => {
        if (tu.name === 'surface_references' && Array.isArray(tu.input?.pageIds)) {
          for (const id of tu.input.pageIds) {
            if (REFERENCE_IDS.includes(id) && !references.includes(id)) references.push(id);
          }
        } else if (tu.name === 'mark_ready') {
          if (tu.input?.ready) ready = true;
          if (tu.input?.note) readyNote = String(tu.input.note);
        }
        return { type: 'tool_result', tool_use_id: tu.id, content: 'ok' };
      });
      messages.push({ role: 'user', content: toolResults });
      // If the model produced text alongside its tool calls, we still loop so it
      // can deliver a final conversational reply.
      continue;
    }

    const reply = textBlocks.map((b) => b.text).join('\n').trim();
    return { reply, references, ready, readyNote, usage, cost: costFromUsage(MODEL, usage), model: MODEL };
  }

  return {
    reply: "Let's keep going. Tell me a bit more about what matters to you.",
    references,
    ready,
    readyNote,
    usage,
    cost: costFromUsage(MODEL, usage),
    model: MODEL
  };
}

async function runExtract(apiKey, clientMessages) {
  const transcript = clientMessages
    .map((m) => `${m.role === 'user' ? 'Person' : 'Counselor'}: ${contentToText(m.content)}`)
    .join('\n');

  const data = await callAnthropic(apiKey, {
    model: MODEL,
    max_tokens: 1024,
    system:
      `You extract a PrEP options counseling conversation into a structured preferences object. Capture every field the person states or clearly implies, mapping their natural language to the closest option value. Only leave a field out when the conversation genuinely does not address it. Do not guess sex assigned at birth (prep_00) or pregnancy status (prep_06) without clear evidence; prep_06 only applies if assigned female at birth.\n\n${EXTRACT_GUIDE}`,
    output_config: { format: { type: 'json_schema', schema: EXTRACT_SCHEMA } },
    messages: [
      {
        role: 'user',
        content: `Here is the conversation:\n\n${transcript}\n\nExtract the person's PrEP preferences into the schema.`
      }
    ]
  });

  const textBlock = data.content.find((b) => b.type === 'text');
  let raw = {};
  try {
    raw = JSON.parse(textBlock?.text || '{}');
  } catch {
    raw = {};
  }
  // Drop the "not_discussed" escape values and empty arrays so only real
  // answers reach the recommendation engine (missing fields fall back to the
  // client's neutral defaults).
  const responses = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v === ND) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    responses[k] = v;
  }
  const usage = emptyUsage();
  addUsage(usage, data.usage);
  return { responses, usage, cost: costFromUsage(MODEL, usage), model: MODEL, _v: 'req-v4' };
}

function contentToText(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.filter((b) => b.type === 'text').map((b) => b.text).join(' ');
  }
  return '';
}

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Chatbot not configured (missing ANTHROPIC_API_KEY)' }) };
  }

  try {
    const { action, messages } = JSON.parse(event.body || '{}');
    if (!Array.isArray(messages) || messages.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'messages required' }) };
    }

    const result = action === 'extract'
      ? await runExtract(apiKey, messages)
      : await runChat(apiKey, messages);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('prep-chat error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}
