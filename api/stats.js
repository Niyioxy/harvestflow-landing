// api/stats.js — public landing-page counters
// Returns only aggregate counts so no Supabase key ever reaches the browser.


const SUPABASE_URL = process.env.SUPABASE_URL || "https://nrmzymcechakavgyplvg.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// New sb_secret_ keys are rejected in the Authorization header
const serviceHeaders = () => SUPABASE_SERVICE_KEY?.startsWith("eyJ")
  ? { apikey: SUPABASE_SERVICE_KEY, Authorization: `Bearer ${SUPABASE_SERVICE_KEY}` }
  : { apikey: SUPABASE_SERVICE_KEY };

// HEAD + count=exact returns the total in Content-Range without transferring rows
async function countRows(table) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=id`, {
    method: "HEAD",
    headers: {
      ...serviceHeaders(),
      Prefer: "count=exact",
    },
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`Count failed for ${table}: ${res.status}`);
  const total = Number((res.headers.get("content-range") || "").split("/")[1]);
  return Number.isFinite(total) ? total : 0;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!SUPABASE_SERVICE_KEY) {
    return res.status(503).json({ error: "Stats unavailable" });
  }

  try {
    const [converts, workers, churches] = await Promise.all([
      countRows("converts"),
      countRows("workers"),
      countRows("churches"),
    ]);
    // Cache at the edge so page views don't each hit the database
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json({ converts, workers, churches });
  } catch (error) {
    console.error("stats error:", error);
    return res.status(502).json({ error: "Stats unavailable" });
  }
}
