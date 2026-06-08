// support-widget.js
// Drop-in floating chat widget for HarvestFlow.
// Works on the static landing page AND inside the React app — pure vanilla JS.
//
// To embed:
//   <script src="/support-widget.js" defer></script>
// On the React app, also set window.HARVESTFLOW_USER_ID before the script loads
// so the bot knows who's chatting (e.g. in your auth provider).

(function () {
  const API_ENDPOINT = "/api/support-chat";
  const BRAND_GOLD = "#E8A020";
  const BRAND_DARK = "#0d1526";
  const BRAND_BORDER = "#1a2540";
  const BRAND_TEXT = "#e2e8f0";
  const BRAND_MUTED = "#475569";

  // Don't double-mount
  if (window.__hfSupportMounted) return;
  window.__hfSupportMounted = true;

  // ── Styles ──────────────────────────────────────────────────────────────
  const css = `
    .hf-bubble {
      position: fixed; bottom: 22px; right: 22px; z-index: 999999;
      width: 56px; height: 56px; border-radius: 50%;
      background: ${BRAND_GOLD}; color: #000;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; box-shadow: 0 12px 36px rgba(232,160,32,.4);
      border: none; font-size: 24px; transition: transform .2s, box-shadow .2s;
      font-family: 'DM Sans', sans-serif;
    }
    .hf-bubble:hover { transform: scale(1.05); box-shadow: 0 16px 48px rgba(232,160,32,.5); }
    .hf-label {
      position: fixed; bottom: 33px; right: 88px; z-index: 999999;
      background: ${BRAND_DARK}; color: ${BRAND_GOLD};
      font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600;
      padding: 5px 10px; border-radius: 20px;
      border: 1px solid ${BRAND_BORDER};
      white-space: nowrap; pointer-events: none;
      box-shadow: 0 4px 12px rgba(0,0,0,.4);
    }
    @media (max-width: 480px) { .hf-label { right: 78px; bottom: 22px; } }
    .hf-panel {
      position: fixed; bottom: 92px; right: 22px; z-index: 999999;
      width: 360px; max-width: calc(100vw - 44px); height: 540px;
      max-height: calc(100vh - 130px);
      background: ${BRAND_DARK}; border: 1px solid ${BRAND_BORDER};
      border-radius: 16px; box-shadow: 0 30px 80px rgba(0,0,0,.6);
      display: none; flex-direction: column; overflow: hidden;
      font-family: 'DM Sans', sans-serif; color: ${BRAND_TEXT};
    }
    .hf-panel.open { display: flex; animation: hf-up .25s ease; }
    @keyframes hf-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .hf-header {
      padding: 14px 18px; border-bottom: 1px solid ${BRAND_BORDER};
      display: flex; align-items: center; justify-content: space-between;
    }
    .hf-header-title {
      font-family: 'Playfair Display', serif; font-size: 16px; font-weight: 800;
      color: ${BRAND_GOLD};
    }
    .hf-header-sub { font-size: 11px; color: ${BRAND_MUTED}; margin-top: 2px; }
    .hf-close {
      background: none; border: none; cursor: pointer; color: ${BRAND_MUTED};
      font-size: 20px; line-height: 1; padding: 4px;
    }
    .hf-messages {
      flex: 1; overflow-y: auto; padding: 16px;
      display: flex; flex-direction: column; gap: 10px;
    }
    .hf-messages::-webkit-scrollbar { width: 4px; }
    .hf-messages::-webkit-scrollbar-thumb { background: ${BRAND_BORDER}; border-radius: 4px; }
    .hf-msg {
      max-width: 85%; padding: 10px 14px; border-radius: 14px;
      font-size: 13px; line-height: 1.55; word-wrap: break-word; white-space: pre-wrap;
    }
    .hf-msg.user {
      background: ${BRAND_GOLD}; color: #000; align-self: flex-end;
      border-bottom-right-radius: 4px;
    }
    .hf-msg.bot {
      background: #060f1e; border: 1px solid ${BRAND_BORDER};
      color: ${BRAND_TEXT}; align-self: flex-start;
      border-bottom-left-radius: 4px;
    }
    .hf-msg.bot a { color: ${BRAND_GOLD}; text-decoration: underline; }
    .hf-typing {
      display: inline-flex; gap: 4px; align-items: center; padding: 14px 16px;
      background: #060f1e; border: 1px solid ${BRAND_BORDER};
      border-radius: 14px; align-self: flex-start;
    }
    .hf-typing span {
      width: 6px; height: 6px; border-radius: 50%; background: ${BRAND_MUTED};
      animation: hf-blink 1.4s ease-in-out infinite;
    }
    .hf-typing span:nth-child(2) { animation-delay: .2s; }
    .hf-typing span:nth-child(3) { animation-delay: .4s; }
    @keyframes hf-blink { 0%,80%,100% { opacity: .3; } 40% { opacity: 1; } }
    .hf-input-row {
      padding: 12px; border-top: 1px solid ${BRAND_BORDER};
      display: flex; gap: 8px;
    }
    .hf-input {
      flex: 1; background: #060f1e; border: 1px solid ${BRAND_BORDER};
      border-radius: 10px; padding: 10px 14px; font-size: 13px;
      color: ${BRAND_TEXT}; outline: none; font-family: inherit;
      resize: none; max-height: 100px;
    }
    .hf-input:focus { border-color: ${BRAND_GOLD}; }
    .hf-input::placeholder { color: ${BRAND_MUTED}; }
    .hf-send {
      background: ${BRAND_GOLD}; color: #000; border: none; border-radius: 10px;
      width: 40px; height: 40px; cursor: pointer; font-size: 16px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .hf-send:disabled { opacity: .5; cursor: not-allowed; }
    .hf-footer {
      padding: 8px 16px; font-size: 10px; color: ${BRAND_MUTED};
      text-align: center; border-top: 1px solid ${BRAND_BORDER};
    }
    @media (max-width: 480px) {
      .hf-panel { right: 12px; bottom: 80px; width: calc(100vw - 24px); height: 70vh; }
      .hf-bubble { right: 12px; bottom: 12px; }
    }
  `;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  // ── DOM ─────────────────────────────────────────────────────────────────
  const bubble = document.createElement("button");
  bubble.className = "hf-bubble";
  bubble.setAttribute("aria-label", "Open support chat");
  bubble.innerHTML = "💬";

  const panel = document.createElement("div");
  panel.className = "hf-panel";
  panel.innerHTML = `
    <div class="hf-header">
      <div>
        <div class="hf-header-title">Barnabas — HarvestFlow Support</div>
        <div class="hf-header-sub">Usually replies instantly</div>
      </div>
      <button class="hf-close" aria-label="Close">✕</button>
    </div>
    <div class="hf-messages" id="hf-messages"></div>
    <div class="hf-input-row">
      <textarea class="hf-input" id="hf-input" placeholder="Ask anything..." rows="1"></textarea>
      <button class="hf-send" id="hf-send" aria-label="Send">➤</button>
    </div>
    <div class="hf-footer">Powered by HarvestFlow</div>
  `;

  const label = document.createElement("div");
  label.className = "hf-label";
  label.textContent = "Chat with Barnabas";

  document.body.appendChild(label);
  document.body.appendChild(bubble);
  document.body.appendChild(panel);

  const messagesEl = panel.querySelector("#hf-messages");
  const inputEl = panel.querySelector("#hf-input");
  const sendEl = panel.querySelector("#hf-send");
  const closeEl = panel.querySelector(".hf-close");

  // ── Conversation state ──────────────────────────────────────────────────
  const messages = [];
  let isOpen = false;
  let isWaiting = false;

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  // Render a message — supports basic linkification for wa.me, mailto, https links
  function renderMessage(role, content) {
    const div = document.createElement("div");
    div.className = `hf-msg ${role}`;
    if (role === "bot") {
      const html = escapeHtml(content)
        .replace(
          /(https?:\/\/[^\s)]+)/g,
          '<a href="$1" target="_blank" rel="noopener">$1</a>'
        )
        .replace(
          /(mailto:[^\s)]+)/g,
          '<a href="$1">$1</a>'
        )
        .replace(
          /(\+?[\d\s\-\(\)]{8,}\d)/g,
          (m) => `<a href="https://wa.me/${m.replace(/\D/g, "")}" target="_blank" rel="noopener">${m}</a>`
        );
      div.innerHTML = html;
    } else {
      div.textContent = content;
    }
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showTyping() {
    const div = document.createElement("div");
    div.className = "hf-typing";
    div.id = "hf-typing-indicator";
    div.innerHTML = "<span></span><span></span><span></span>";
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function hideTyping() {
    const t = document.getElementById("hf-typing-indicator");
    if (t) t.remove();
  }

  async function sendMessage(text) {
    if (!text || isWaiting) return;
    messages.push({ role: "user", content: text });
    renderMessage("user", text);
    inputEl.value = "";
    inputEl.style.height = "auto";
    isWaiting = true;
    sendEl.disabled = true;
    showTyping();

    try {
      const res = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages,
          userId: window.HARVESTFLOW_USER_ID || null,
        }),
      });
      const data = await res.json();
      hideTyping();
      if (!res.ok) {
        renderMessage(
          "bot",
          "Sorry, I'm having trouble right now. Please try again, or reach Adeniyi directly:\nWhatsApp: +447823782762\nEmail: adeniyi.tosin@harvestflows.com"
        );
        return;
      }
      const reply = data.reply || "Sorry, I couldn't reply just now.";
      messages.push({ role: "assistant", content: reply });
      renderMessage("bot", reply);
    } catch (e) {
      hideTyping();
      renderMessage(
        "bot",
        "Connection problem. Please try again, or message Adeniyi on WhatsApp: +447823782762"
      );
    } finally {
      isWaiting = false;
      sendEl.disabled = false;
      inputEl.focus();
    }
  }

  function openPanel() {
    panel.classList.add("open");
    isOpen = true;
    bubble.innerHTML = "✕";
    if (messages.length === 0) {
      // Greeting
      const greeting = "Hi! I'm Barnabas 👋 How can I help your church today?";
      messages.push({ role: "assistant", content: greeting });
      renderMessage("bot", greeting);
    }
    setTimeout(() => inputEl.focus(), 300);
  }

  function closePanel() {
    panel.classList.remove("open");
    isOpen = false;
    bubble.innerHTML = "💬";
  }

  // ── Wire events ─────────────────────────────────────────────────────────
  bubble.addEventListener("click", () => (isOpen ? closePanel() : openPanel()));
  closeEl.addEventListener("click", closePanel);

  sendEl.addEventListener("click", () => sendMessage(inputEl.value.trim()));
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputEl.value.trim());
    }
  });
  inputEl.addEventListener("input", () => {
    inputEl.style.height = "auto";
    inputEl.style.height = Math.min(inputEl.scrollHeight, 100) + "px";
  });
})();
