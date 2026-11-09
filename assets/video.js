// YouTube videos that load only when played: each <div class="yt" data-id="…" data-title="…">
// shows the thumbnail and a play button; pressing it swaps in the player from
// youtube-nocookie.com (privacy-enhanced mode), so nothing from YouTube loads before then.
(function () {
  var css = document.createElement("style");
  css.textContent =
    ".yt{position:relative;width:100%;max-width:880px;margin:28px auto 0;aspect-ratio:16/9;border-radius:16px;overflow:hidden;background:#0D1526;box-shadow:0 20px 60px rgba(0,0,0,.35)}" +
    ".yt button{all:unset;position:absolute;inset:0;cursor:pointer;display:flex;align-items:center;justify-content:center}" +
    ".yt img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}" +
    ".yt .play{position:relative;width:84px;height:84px;border-radius:50%;background:#E8A020;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 30px rgba(0,0,0,.4);transition:transform .2s}" +
    ".yt button:hover .play,.yt button:focus-visible .play{transform:scale(1.08)}" +
    ".yt .play::after{content:'';margin-left:6px;border-left:26px solid #040C18;border-top:16px solid transparent;border-bottom:16px solid transparent}" +
    ".yt .label{position:absolute;left:16px;bottom:14px;font:600 15px 'DM Sans',sans-serif;color:#fff;background:rgba(4,12,24,.75);padding:6px 12px;border-radius:8px}" +
    ".yt iframe{position:absolute;inset:0;width:100%;height:100%;border:0}";
  document.head.appendChild(css);

  document.querySelectorAll(".yt[data-id]").forEach(function (box) {
    var id = box.getAttribute("data-id"), title = box.getAttribute("data-title") || "Play video";
    var btn = document.createElement("button");
    btn.setAttribute("aria-label", "Play video: " + title);
    var img = document.createElement("img");
    img.src = "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg";
    img.alt = ""; img.loading = "lazy"; img.width = 480; img.height = 360;
    var play = document.createElement("span"); play.className = "play";
    var label = document.createElement("span"); label.className = "label"; label.textContent = title;
    btn.appendChild(img); btn.appendChild(play); btn.appendChild(label);
    btn.addEventListener("click", function () {
      var f = document.createElement("iframe");
      f.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0";
      f.title = title;
      f.allow = "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen";
      f.allowFullscreen = true;
      box.replaceChildren(f);
    });
    box.replaceChildren(btn);
  });
})();
