// api/register.js - runs on harvestflow-landing.vercel.app
const SUPABASE_URL = "https://nrmzymcechakavgyplvg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ybXp5bWNlY2hha2F2Z3lwbHZnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzE0MzUzMCwiZXhwIjoyMDg4NzE5NTMwfQ.A-C_v5A0mlRDA32iXkfv7easgSx01UXlwUSPExMRT6E";
const RESEND_KEY   = "re_3fK1fGdg_85a9EAswq22WSMk6d1ueyK1n";
const APP_URL      = "https://www.harvestflows.com";
const ADMIN_EMAIL  = "adeniyi.tosin@outlook.com";
const DEFAULT_PASS = "Harvest2026";

async function db(path, method = "GET", body = null) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    method,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation"
    },
    body: body ? JSON.stringify(body) : null
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  return data;
}

async function sendEmail(to, subject, html) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "HarvestFlow <onboarding@resend.dev>", to, subject, html })
  });
  return res.json();
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { church_name, admin_name, email, phone, location, size, outreaches, notes } = req.body;

    if (!church_name || !email || !admin_name) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 1. Create church
    const [church] = await db("/rest/v1/churches", "POST", {
      name: church_name, location: location || "",
      admin_email: email, admin_name, phone: phone || "",
      size: size || "", status: "active"
    });

    // 2. Create auth user
    const authRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: DEFAULT_PASS, email_confirm: true, user_metadata: { name: admin_name } })
    });
    const authData = await authRes.json();
    if (!authRes.ok) throw new Error(`Auth: ${JSON.stringify(authData)}`);

    // 3. Update profile
    await db(`/rest/v1/profiles?id=eq.${authData.id}`, "PATCH", {
      name: admin_name, role: "admin", church_id: church.id
    });

    // 4. Welcome email to church
    await sendEmail(email, `Welcome to HarvestFlow — ${church_name}`, `
      <div style="font-family:sans-serif;max-width:540px;margin:0 auto;background:#040c18;color:#f1f5f9;padding:36px;border-radius:14px">
        <h1 style="color:#E8A020;text-align:center">🌾 HarvestFlow</h1>
        <p style="color:#94a3b8;text-align:center;margin-bottom:28px;font-style:italic">Sow the seed. Track the growth.</p>
        <h2>Welcome, ${admin_name}! 👋</h2>
        <p style="color:#94a3b8;margin:12px 0 24px">Your workspace for <strong style="color:#f1f5f9">${church_name}</strong> is ready.</p>
        <div style="background:#0d1526;border:1px solid #1a2540;border-radius:10px;padding:20px;margin-bottom:20px">
          <p style="margin:0 0 12px;font-size:13px;color:#475569;text-transform:uppercase;letter-spacing:.05em">Your Login Details</p>
          <p style="margin:6px 0"><strong>App:</strong> <a href="${APP_URL}" style="color:#E8A020">${APP_URL}</a></p>
          <p style="margin:6px 0"><strong>Email:</strong> ${email}</p>
          <p style="margin:6px 0"><strong>Password:</strong> ${DEFAULT_PASS}</p>
        </div>
        <div style="background:#052e16;border:1px solid #166534;border-radius:8px;padding:14px;margin-bottom:20px">
          <p style="color:#4ade80;font-size:13px;margin:0">⚠️ Please change your password after your first login.</p>
        </div>
        <a href="${APP_URL}" style="display:block;background:#E8A020;color:#000;text-align:center;padding:13px;border-radius:10px;font-weight:700;text-decoration:none">Open HarvestFlow →</a>
        <p style="color:#334155;font-size:11px;text-align:center;margin-top:20px">Need help? Contact ${ADMIN_EMAIL}</p>
      </div>
    `);

    // 5. Notify Adeniyi
    await sendEmail(ADMIN_EMAIL, `🌾 New Church: ${church_name}`, `
      <div style="font-family:sans-serif;max-width:460px">
        <h2>New Church Registration</h2>
        <p><strong>Church:</strong> ${church_name}</p>
        <p><strong>Admin:</strong> ${admin_name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Location:</strong> ${location}</p>
        <p><strong>Size:</strong> ${size}</p>
        <p><strong>Outreaches/yr:</strong> ${outreaches}</p>
        <p><strong>Notes:</strong> ${notes || "—"}</p>
        <p style="color:#666;font-size:12px">Church ID: ${church.id}</p>
      </div>
    `);

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error("Registration error:", error.message);
    return res.status(500).json({ success: false, error: error.message, stack: error.stack });
  }
}