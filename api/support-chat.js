// api/support-chat.js
// HarvestFlow support bot powered by Claude.
// Streams responses back to the widget.

import { KNOWLEDGE_BASE } from "./_knowledge.js";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || "https://nrmzymcechakavgyplvg.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const WHATSAPP_NUMBER = "+447823782762"; // Adeniyi's business WhatsApp
const SUPPORT_EMAIL = "adeniyi.tosin@harvestflows.com";

// Build the system prompt — same brand voice in both surfaces
function buildSystemPrompt(userContext) {
  const userBlock = userContext
    ? `
## Current user (logged in)
- Name: ${userContext.name || "unknown"}
- Role: ${userContext.role || "unknown"}
- Church: ${userContext.church_name || "unknown"}
- Recent activity:
${(userContext.recent_actions || []).map(a => `  - ${a}`).join("\n") || "  - no recent activity"}
`
    : `
## Current user
This person is a visitor on the landing page (not logged in). They are
exploring HarvestFlow before signing up.
`;

  return `You are the HarvestFlow support bot. You help church leaders, pastors,
and workers with questions about HarvestFlow.

## Your voice
Warm. Pastoral. Direct. You speak the way a thoughtful Christian colleague
would — never corporate, never preachy. You use British English spelling. You
keep responses short (2-4 short paragraphs at most). When the answer is one
sentence, give one sentence.

## What you know
${KNOWLEDGE_BASE}

${userBlock}

## How to handle questions

**When you can answer confidently from the knowledge base:**
Answer directly. Be specific. Reference the feature by name.

**When the question is partially covered:**
Give your best understanding, then offer to connect them with Adeniyi for
confirmation. Format the offer like this at the end of your message:

"If this is important to confirm, you can reach Adeniyi directly:
- WhatsApp: ${WHATSAPP_NUMBER}
- Email: ${SUPPORT_EMAIL}"

**When the question is out of scope or unknown:**
Don't guess. Say something like: "That's outside what I can help with directly.
Adeniyi will be the right person — here's how to reach him:
- WhatsApp: ${WHATSAPP_NUMBER}
- Email: ${SUPPORT_EMAIL}"

**When asked about features that don't exist:**
Be honest. Say HarvestFlow doesn't currently do that. If it's on the roadmap,
mention that. Don't invent features.

**When asked about pricing:**
Always say HarvestFlow is FREE during beta. Future pricing isn't set yet.

**When asked about other churches' data:**
Never reveal anything about specific churches. Each church's data is private.

## Hard rules
- Never invent features, prices, deadlines, or technical details not in the knowledge base
- Never give medical, legal, financial, or pastoral counselling
- If a user is in crisis, say "I'm a support bot for HarvestFlow, but please reach out to a trusted pastor or counsellor for that"
- Don't ask for passwords, API keys, or sensitive data
- Keep responses short by default, expand only if asked
- Don't end every message with the contact card — only when escalating

## Greeting
First message in a conversation: be warm, ask how you can help. After that,
just answer.`;
}

// Fetch user context from Supabase (only for logged-in users)
async function fetchUserContext(userId) {
  if (!userId || !SUPABASE_SERVICE_KEY) return null;
  try {
    const profileRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?select=name,role,church_id&id=eq.${userId}`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      }
    );
    const profiles = await profileRes.json();
    const profile = profiles[0];
    if (!profile) return null;

    let church_name = "unknown";
    if (profile.church_id) {
      const churchRes = await fetch(
        `${SUPABASE_URL}/rest/v1/churches?select=name&id=eq.${profile.church_id}`,
        {
          headers: {
            apikey: SUPABASE_SERVICE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          },
        }
      );
      const churches = await churchRes.json();
      church_name = churches[0]?.name || "unknown";
    }

    // Recent actions: last 5 follow-ups by this user (proxy for activity)
    let recent_actions = [];
    if (profile.church_id) {
      const fuRes = await fetch(
        `${SUPABASE_URL}/rest/v1/followups?select=method,outcome,date&church_id=eq.${profile.church_id}&order=created_at.desc&limit=5`,
        {
          headers: {
            apikey: SUPABASE_SERVICE_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          },
        }
      );
      const fus = await fuRes.json();
      recent_actions = (fus || []).map(
        (f) => `${f.method} on ${f.date}: ${f.outcome}`
      );
    }

    return {
      name: profile.name,
      role: profile.role,
      church_name,
      recent_actions,
    };
  } catch (e) {
    console.error("fetchUserContext error:", e);
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!ANTHROPIC_API_KEY) {
    return res
      .status(500)
      .json({ error: "Support bot is not configured (missing API key)" });
  }

  try {
    const { messages, userId } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array is required" });
    }

    const userContext = userId ? await fetchUserContext(userId) : null;
    const systemPrompt = buildSystemPrompt(userContext);

    // Call Claude
    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001", // fast + cheap for support
        max_tokens: 600,
        system: systemPrompt,
        messages: messages.map((m) => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.content,
        })),
      }),
    });

    const data = await claudeRes.json();

    if (!claudeRes.ok) {
      console.error("Claude API error:", data);
      return res.status(claudeRes.status).json({
        error: data?.error?.message || "Support bot error",
      });
    }

    const reply =
      data?.content?.[0]?.text ||
      "Sorry, I couldn't generate a reply. Please try again.";

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("support-chat handler error:", error);
    return res.status(500).json({ error: error.message });
  }
}
