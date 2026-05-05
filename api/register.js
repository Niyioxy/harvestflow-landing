// api/register.js — HarvestFlow church auto-provisioning
// Flow:
//   1. Validate input
//   2. Create church record in Supabase
//   3. Create admin user in Supabase Auth (sends magic link email via Resend)
//   4. Create admin profile record
//   5. Notify Adeniyi via WhatsApp
//   6. Return success

const SUPABASE_URL = process.env.SUPABASE_URL || "https://nrmzymcechakavgyplvg.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ybXp5bWNlY2hha2F2Z3lwbHZnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzE0MzUzMCwiZXhwIjoyMDg4NzE5NTMwfQ.A-C_v5A0mlRDA32iXkfv7easgSx01UXlwUSPExMRT6E";
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EBULKSMS_USERNAME = process.env.EBULKSMS_USERNAME;
const EBULKSMS_APIKEY = process.env.EBULKSMS_APIKEY;

const ADENIYI_WHATSAPP = "447823782762";// Adeniyi's number in international format
const APP_URL = "https://www.harvestflows.com";
const FROM_EMAIL = "HarvestFlow <adeniyi.tosin@harvestflows.com>";

// ── Supabase admin helpers ─────────────────────────────────────────────────
const supabaseAdmin = {
  async createUser(email, churchName) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        email_confirm: true, // mark as confirmed — magic link handles auth
        user_metadata: { church_name: churchName },
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || "Failed to create user");
    return data;
  },

  async generateMagicLink(email) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
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
    const res = await fetch(`${SUPABASE_URL}/rest/v1/churches`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        name: data.church_name,
        admin_name: data.admin_name,
        admin_email: data.email,
        location: data.location,
        size: data.size || null,
        outreaches_per_year: data.outreaches || null,
        notes: data.notes || null,
        status: "active",
      }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Failed to create church");
    return Array.isArray(result) ? result[0] : result;
  },

  async insertProfile(userId, churchId, adminName, email) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
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

// ── Notify Adeniyi via WhatsApp ────────────────────────────────────────────
async function notifyAdeniyi(churchName, adminName, email, location, size) {
  const message =
    `🎉 New HarvestFlow Registration!\n\n` +
    `Church: ${churchName}\n` +
    `Admin: ${adminName}\n` +
    `Email: ${email}\n` +
    `Location: ${location}\n` +
    `Size: ${size || "Not specified"}\n\n` +
    `Workspace has been auto-provisioned. Welcome email sent.`;

  try {
    await fetch("https://api.ebulksms.com/sendwhatsapp.json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        WA: {
          auth: { username: EBULKSMS_USERNAME, apikey: EBULKSMS_APIKEY },
          message: { subject: "New Registration", messagetext: message },
          recipients: [ADENIYI_WHATSAPP],
        },
      }),
    });
  } catch (e) {
    // Non-fatal — don't fail the registration if notification fails
    console.error("WhatsApp notify error:", e.message);
  }
}

// ── Main handler ───────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { church_name, admin_name, phone, email, location, size, outreaches, notes } = req.body || {};

  // Validate required fields
  if (!church_name || !admin_name || !email || !location || !phone) {
    return res.status(400).json({ success: false, error: "Please fill in all required fields." });
  }

  // Basic email check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, error: "Please enter a valid email address." });
  }

  try {
    // 1. Create church record
    const church = await supabaseAdmin.insertChurch({
      church_name, admin_name, email, location, size, outreaches, notes,
    });

    // 2. Create admin user in Supabase Auth
    let user;
    try {
      user = await supabaseAdmin.createUser(email, church_name);
    } catch (e) {
      // User may already exist — fetch existing
      if (e.message?.includes("already") || e.message?.includes("duplicate")) {
        return res.status(409).json({
          success: false,
          error: "An account with this email already exists. Please contact us if you need help accessing it.",
        });
      }
      throw e;
    }

    // 3. Create profile record
    await supabaseAdmin.insertProfile(user.id, church.id, admin_name, email);

    // 4. Generate magic link
    const magicLink = await supabaseAdmin.generateMagicLink(email);
    if (!magicLink) throw new Error("Could not generate login link");

    // 5. Send welcome email
    await sendWelcomeEmail(email, admin_name, church_name, magicLink);

    // 6. Notify Adeniyi (non-blocking)
    notifyAdeniyi(church_name, admin_name, email, location, size);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      success: false,
      error: "Something went wrong. Please email adeniyi.tosin@harvestflows.com directly.",
    });
  }
}