// Where a visitor came from, for counting which pages and searches bring
// registrations. Nothing is stored on the device: the source travels in the
// "Register" links (?src=…&from=…) to the form on the home page, which sends it
// with the registration.
//   src  — utm_source, or the site that linked here (google, bing, chatgpt,
//          facebook, …), "direct" with no referrer, "unknown" from another of
//          our pages without the details
//   from — the first of our pages they landed on
(function () {
  var params = new URLSearchParams(location.search);
  var host = "";
  try { host = document.referrer ? new URL(document.referrer).hostname.toLowerCase() : ""; } catch (e) {}
  var ours = /(^|\.)harvestflows\.com$/.test(host) || /harvestflow[\w-]*\.vercel\.app$/.test(host);
  var named = [["google.", "google"], ["bing.", "bing"], ["duckduckgo.", "duckduckgo"], ["yahoo.", "yahoo"],
    ["chatgpt.", "chatgpt"], ["openai.", "chatgpt"], ["perplexity.", "perplexity"], ["claude.ai", "claude"],
    ["facebook.", "facebook"], ["instagram.", "instagram"], ["linkedin.", "linkedin"], ["whatsapp.", "whatsapp"],
    ["t.co", "x"], ["twitter.", "x"], ["youtube.", "youtube"]];
  var site = host.replace(/^www\./, "");
  for (var i = 0; i < named.length; i++) {
    if (host.indexOf(named[i][0]) !== -1) { site = named[i][1]; break; }
  }
  var clean = function (v, max) { return String(v || "").replace(/[^\w .:\/-]/g, "").slice(0, max); };
  var src = clean(params.get("src") || params.get("utm_source") || (host ? (ours ? "unknown" : site) : "direct"), 100);
  var from = clean(params.get("from") || location.pathname, 200);
  window.hfSource = { src: src, from: from };

  // Carry it to the registration form
  document.querySelectorAll("a[href]").forEach(function (a) {
    var url;
    try { url = new URL(a.getAttribute("href"), location.href); } catch (e) { return; }
    var home = url.pathname === "/" && /(^|\.)harvestflows\.com$/.test(url.hostname);
    // On the home page itself the form reads window.hfSource; its links just scroll
    if (!home || url.hash !== "#register" || (url.origin === location.origin && location.pathname === "/")) return;
    url.searchParams.set("src", src);
    url.searchParams.set("from", from);
    a.setAttribute("href", url.origin === location.origin ? url.pathname + url.search + url.hash : url.href);
  });
})();
