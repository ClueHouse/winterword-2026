import { WW_CONFIG } from "./config.js";

async function loadPuzzle(slug) {
  const res = await fetch(WW_CONFIG.api.bootstrap, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug })
  });

  const data = await res.json();
  if (!data.ok) throw new Error("Bootstrap failed");

  const script = document.createElement("script");
  script.src = data.entry + "?v=" + WW_CONFIG.version;
  document.body.appendChild(script);
}

function init() {
  const slug = document.body.getAttribute("data-slug") || "default";
  loadPuzzle(slug);
}

init();
