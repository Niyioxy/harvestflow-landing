// api/register.js — HarvestFlow church auto-provisioning
// Flow:
//   1. Validate input
//   2. Create church record in Supabase
//   3. Create admin user in Supabase Auth (sends magic link email via Resend)
//   4. Create admin profile record
//   5. Notify Adeniyi via WhatsApp
//   6. Return success

const SUPABASE_URL = process.env.SUPABASE_URL || "https://nrmzymcechakavgyplvg.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// Headers for server-side calls with the service key. New sb_secret_ keys are
// rejected in the Authorization header, so it is only added for legacy JWT keys.
const serviceHeaders = () => SUPABASE_SERVICE_KEY?.startsWith("eyJ")
  ? { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` }
  : { apikey: SUPABASE_SERVICE_KEY };
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EBULKSMS_USERNAME = process.env.EBULKSMS_USERNAME;
const EBULKSMS_APIKEY = process.env.EBULKSMS_APIKEY;

const ADENIYI_WHATSAPP = "447823782762";// Adeniyi's number in international format
const APP_URL = "https://app.harvestflows.com";
const FROM_EMAIL = "HarvestFlow <adeniyi.tosin@harvestflows.com>";

// ── Supabase admin helpers ─────────────────────────────────────────────────
const supabaseAdmin = {
  async createUser(email, churchName) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        ...serviceHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        email_confirm: true, // mark as confirmed — magic link handles auth
        user_metadata: { church_name: churchName },
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.msg || data.message || data.error_description || data.error || "Failed to create user");
      err.emailExists = res.status === 422 || data.error_code === "email_exists" || /already/i.test(err.message);
      throw err;
    }
    return data;
  },

  // Rollback helper: best effort, errors are logged rather than thrown
  async remove(path) {
    try {
      const res = await fetch(`${SUPABASE_URL}${path}`, { method: "DELETE", headers: serviceHeaders() });
      if (!res.ok) console.error("Rollback failed:", path, res.status, await res.text());
    } catch (e) {
      console.error("Rollback error:", path, e.message);
    }
  },

  async generateMagicLink(email) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
      method: "POST",
      headers: {
        ...serviceHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "magiclink",
        email,
        options: { redirect_to: APP_URL },
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to generate magic link");
    return data.action_link || data.properties?.action_link;
  },

  async insertChurch(data) {
    const row = {
      name: data.church_name,
      admin_name: data.admin_name,
      admin_email: data.email,
      location: data.location,
      country: data.country || null,
      size: data.size || null,
      outreaches_per_year: data.outreaches || null,
      notes: data.notes || null,
      status: "active",
    };
    const attribution = {
      signup_source: data.signup_source,
      signup_landing_path: data.signup_landing_path,
      heard_about: data.heard_about,
    };
    const post = body => fetch(`${SUPABASE_URL}/rest/v1/churches`, {
      method: "POST",
      headers: {
        ...serviceHeaders(),
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(body),
    });
    let res = await post({ ...row, ...attribution });
    let result = await res.json();
    // Until the signup-source columns exist (PGRST204), register without them
    if (!res.ok && result.code === "PGRST204") {
      console.error("Signup source not saved:", result.message);
      res = await post(row);
      result = await res.json();
    }
    if (!res.ok) throw new Error(result.message || "Failed to create church");
    return Array.isArray(result) ? result[0] : result;
  },

  async insertProfile(userId, churchId, adminName, email) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: "POST",
    headers: {
      ...serviceHeaders(),
      "Content-Type": "application/json",
      Prefer: "return=representation,resolution=merge-duplicates",  // ← change this line
    },
      body: JSON.stringify({
        id: userId,
        church_id: churchId,
        name: adminName,
        email,
        role: "admin",
      }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Failed to create profile");
    return result;
  },
};

// ── Send welcome email via Resend ──────────────────────────────────────────
async function sendWelcomeEmail(to, adminName, churchName, magicLink) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject: `Welcome to HarvestFlow — Your church workspace is ready`,
      html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#040C18;font-family:'DM Sans',Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">

    <!-- Logo -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-flex;align-items:center;gap:10px;">
        <div style="width:40px;height:40px;background:rgba(232,160,32,0.1);border-radius:50%;
          display:flex;align-items:center;justify-content:center;border:1px solid rgba(232,160,32,0.3);">
          <div style="width:0;height:0;border-left:8px solid transparent;
            border-right:8px solid transparent;border-bottom:14px solid #E8A020;
            margin-top:-3px;"></div>
        </div>
        <span style="font-size:22px;font-weight:800;color:#E8A020;font-family:Georgia,serif;">HarvestFlow</span>
      </div>
    </div>

    <!-- Card -->
    <div style="background:#0D1526;border:1px solid #1A2540;border-radius:20px;padding:40px;
      box-shadow:0 40px 80px rgba(0,0,0,0.5);">

      <!-- Top accent -->
      <div style="height:2px;background:linear-gradient(90deg,transparent,#E8A020,transparent);
        margin:-40px -40px 32px;border-radius:20px 20px 0 0;"></div>

      <h1 style="font-family:Georgia,serif;font-size:26px;font-weight:800;
        color:#F1F5F9;margin:0 0 8px;line-height:1.2;">
        Welcome to HarvestFlow, ${adminName}!
      </h1>
      <p style="font-size:14px;color:#475569;margin:0 0 28px;">
        Your workspace for <strong style="color:#E8A020">${churchName}</strong> is ready.
      </p>

      <p style="font-size:14px;color:#94A3B8;line-height:1.7;margin:0 0 28px;">
        Every soul that responds at your outreach deserves to be followed up, discipled,
        and retained. HarvestFlow is your system to make sure none of them are forgotten.
      </p>

      <!-- CTA Button -->
      <div style="text-align:center;margin:32px 0;">
        <a href="${magicLink}"
          style="display:inline-block;background:#E8A020;color:#000;
          font-size:15px;font-weight:700;padding:16px 40px;border-radius:12px;
          text-decoration:none;box-shadow:0 8px 32px rgba(232,160,32,0.35);">
          Access Your Workspace →
        </a>
      </div>

      <p style="font-size:12px;color:#334155;text-align:center;margin:0 0 28px;">
        This link will log you in automatically. It expires in 24 hours.<br>
        After logging in, you can set a password from your account settings.
      </p>

      <!-- Divider -->
      <div style="height:1px;background:#1A2540;margin:28px 0;"></div>

      <!-- Getting started steps -->
      <h3 style="font-family:Georgia,serif;font-size:16px;font-weight:700;
        color:#F1F5F9;margin:0 0 16px;">Getting started</h3>

      <div style="display:flex;flex-direction:column;gap:12px;">
        <div style="display:flex;gap:12px;align-items:flex-start;">
          <div style="width:26px;height:26px;border-radius:50%;background:rgba(232,160,32,0.1);
            border:1px solid rgba(232,160,32,0.2);display:flex;align-items:center;
            justify-content:center;font-size:11px;font-weight:800;color:#E8A020;flex-shrink:0;">1</div>
          <div>
            <div style="font-size:13px;font-weight:600;color:#E2E8F0;">Add your outreach event</div>
            <div style="font-size:12px;color:#475569;">Go to Outreaches → Add Crusade</div>
          </div>
        </div>
        <div style="display:flex;gap:12px;align-items:flex-start;">
          <div style="width:26px;height:26px;border-radius:50%;background:rgba(232,160,32,0.1);
            border:1px solid rgba(232,160,32,0.2);display:flex;align-items:center;
            justify-content:center;font-size:11px;font-weight:800;color:#E8A020;flex-shrink:0;">2</div>
          <div>
            <div style="font-size:13px;font-weight:600;color:#E2E8F0;">Register your first convert</div>
            <div style="font-size:12px;color:#475569;">Use voice registration or fill the form manually</div>
          </div>
        </div>
        <div style="display:flex;gap:12px;align-items:flex-start;">
          <div style="width:26px;height:26px;border-radius:50%;background:rgba(232,160,32,0.1);
            border:1px solid rgba(232,160,32,0.2);display:flex;align-items:center;
            justify-content:center;font-size:11px;font-weight:800;color:#E8A020;flex-shrink:0;">3</div>
          <div>
            <div style="font-size:13px;font-weight:600;color:#E2E8F0;">Add your follow-up workers</div>
            <div style="font-size:12px;color:#475569;">Contact us and we'll add your team members</div>
          </div>
        </div>
      </div>

      <!-- Divider -->
      <div style="height:1px;background:#1A2540;margin:28px 0;"></div>

      <p style="font-size:13px;color:#475569;line-height:1.7;margin:0;">
        Need help? Reply to this email or WhatsApp Adeniyi directly at
        <a href="https://wa.me/447823782762" style="color:#E8A020;text-decoration:none;">+44 7823 782762</a>.
        We're here to make sure your church gets the most out of HarvestFlow.
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:24px;">
      <p style="font-size:11px;color:#1E2D45;font-style:italic;margin:0;">
        HarvestFlow · Sow the seed. Track the growth. · © 2026
      </p>
    </div>
  </div>
</body>
</html>
      `,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to send welcome email");
  return data;
}

// ── Notify Adeniyi by WhatsApp and email ───────────────────────────────────
// The WhatsApp goes from the eBulkSMS-linked number, which may be Adeniyi's own,
// so an email copy goes too. Never throws: a registration never fails over it.
const ALERT_EMAIL = process.env.NEW_CHURCH_ALERT_EMAIL || "adeniyi.tosin@harvestflows.com";
async function notifyAdeniyi(churchName, adminName, email, location, size, found) {
  const message =
    `🎉 New HarvestFlow Registration!\n\n` +
    `Church: ${churchName}\n` +
    `Admin: ${adminName}\n` +
    `Email: ${email}\n` +
    `Location: ${location}\n` +
    `Size: ${size || "Not specified"}\n` +
    `Found us: ${found || "Not known"}\n\n` +
    `Workspace has been auto-provisioned. Welcome email sent.`;

  const whatsapp = fetch("https://api.ebulksms.com/sendwhatsapp.json", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      WA: {
        auth: { username: EBULKSMS_USERNAME, apikey: EBULKSMS_APIKEY },
        message: { subject: "New Registration", messagetext: message },
        recipients: [ADENIYI_WHATSAPP],
      },
    }),
    signal: AbortSignal.timeout(8000),
  });
  const mail = fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM_EMAIL, to: ALERT_EMAIL, subject: `New church registered: ${churchName}`, text: message.replace(/^🎉 /, "") }),
    signal: AbortSignal.timeout(8000),
  }).then(async r => { if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`); });
  const [wa, em] = await Promise.allSettled([whatsapp, mail]);
  if (wa.status === "rejected") console.error("WhatsApp notify error:", wa.reason?.message);
  if (em.status === "rejected") console.error("Email notify error:", em.reason?.message);
}

// ── Main handler ───────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { church_name, admin_name, phone, email, location, country, size, outreaches, notes } = req.body || {};
  // Where the church found us (assets/source.js and the form); short, plain text or nothing
  const plain = (v, max) => (typeof v === "string" ? v.replace(/[^\w .:\/-]/g, "").trim().slice(0, max) : "") || null;
  const signup_source = plain(req.body?.signup_source, 100);
  const signup_landing_path = plain(req.body?.signup_landing_path, 200);
  const heard_about = plain(req.body?.heard_about, 60);

  // Validate required fields
  if (!church_name || !admin_name || !email || !location || !phone) {
    return res.status(400).json({ success: false, error: "Please fill in all required fields." });
  }

  // Basic email check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, error: "Please enter a valid email address." });
  }

  // Create the login first: Supabase rejects a duplicate email before anything
  // else exists. If a later step fails, everything created so far is removed so
  // a retry starts clean (previously a failed sign-up left an empty church behind).
  const created = { userId: null, churchId: null };
  try {
    // 1. Create admin user in Supabase Auth
    let user;
    try {
      user = await supabaseAdmin.createUser(email, church_name);
    } catch (e) {
      if (e.emailExists) {
        return res.status(409).json({
          success: false,
          error: "An account with this email already exists. Please sign in instead, or contact us if you need help accessing it.",
        });
      }
      throw e;
    }
    created.userId = user.id;

    // 2. Create church record
    const church = await supabaseAdmin.insertChurch({
      church_name, admin_name, email, location, country, size, outreaches, notes,
      signup_source, signup_landing_path, heard_about,
    });
    created.churchId = church.id;

    // 3. Create profile record
    await supabaseAdmin.insertProfile(user.id, church.id, admin_name, email);

    // 4. Generate magic link
    const magicLink = await supabaseAdmin.generateMagicLink(email);
    if (!magicLink) throw new Error("Could not generate login link");

    // 5. Send welcome email
    await sendWelcomeEmail(email, admin_name, church_name, magicLink);

    // 6. Notify Adeniyi. Awaited: a function can be stopped as soon as it replies,
    // which cut unawaited alerts off. It never throws.
    await notifyAdeniyi(church_name, admin_name, email, location, size,
      [heard_about, signup_source && `via ${signup_source}`, signup_landing_path && `landed on ${signup_landing_path}`].filter(Boolean).join(", "));

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Registration error:", error);
    if (created.userId) await supabaseAdmin.remove(`/rest/v1/profiles?id=eq.${encodeURIComponent(created.userId)}`);
    if (created.churchId) await supabaseAdmin.remove(`/rest/v1/churches?id=eq.${encodeURIComponent(created.churchId)}`);
    if (created.userId) await supabaseAdmin.remove(`/auth/v1/admin/users/${encodeURIComponent(created.userId)}`);
    return res.status(500).json({
      success: false,
      error: "Something went wrong. Please email adeniyi.tosin@harvestflows.com directly.",
    });
  }
}