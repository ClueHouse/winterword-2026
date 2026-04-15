import { WW_CONFIG } from "./config.js";

const ASSET_BASE = "https://raw.githubusercontent.com/ClueHouse/winterword-assets/main";
const APP_STYLE_ID = "ww-engine-styles";

const WW = {
  boot: null,
  game: null,
  clues: [],
  answers: [],
  currentView: { type: "list" }
};

console.log("Engine loaded");

fetch("/api/bootstrap", { method: "POST" })
  .then((r) => r.json())
  .then((boot) => {
    start(boot);
  })
  .catch((err) => console.error("BOOTSTRAP ERROR:", err));

async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error("Failed to load " + path);
  return await res.json();
}

async function loadBootstrap(boot) {
  console.log("Bootstrap OK:", boot);
  return boot;
}

async function loadGame(boot) {
  const path = boot.game_file;
  console.log("Loading game:", path);
  const game = await loadJSON(path);
  console.log("Game OK:", game);
  return game;
}

async function loadClues(game) {
  console.log("Loading clues:", game.clues);
  const clues = await loadJSON(game.clues);
  console.log("Clues OK:", clues);
  return clues;
}

async function loadAnswers(game) {
  console.log("Loading answers:", game.answers);
  const answers = await loadJSON(game.answers);
  console.log("Answers OK:", answers);
  return answers;
}

function getApp() {
  const app = document.getElementById("app");
  if (!app) throw new Error("Missing #app container");
  return app;
}

function ensureStyles() {
  if (document.getElementById(APP_STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = APP_STYLE_ID;
  style.textContent = `
    :root{
      --ww-ink:#dce5ec;
      --ww-ink-strong:#ecf3fa;
      --ww-muted:rgba(220,229,236,0.72);
      --ww-bg-1:#06101b;
      --ww-bg-2:#0a1522;
      --ww-bg-3:#102133;
      --ww-rail-bg:#2d4255;
      --ww-rail-bg-dark:#27394a;
      --ww-accent:#9dc3d6;
      --ww-card-border:rgba(255,255,255,0.14);
      --ww-shell-stroke:rgba(255,255,255,0.05);
      --ww-panel-bg:#02060c;
      --ww-left-list:8.2rem;
      --ww-left-clue:9.2rem;
    }

    *{box-sizing:border-box;}

    html,body{
      margin:0;
      padding:0;
      min-height:100%;
    }

    body{
      margin:0;
      font-family:system-ui,-apple-system,"Segoe UI",sans-serif;
      color:var(--ww-ink);
      background:
        radial-gradient(1200px 700px at 18% 18%, rgba(255,255,255,0.035), transparent 60%),
        radial-gradient(980px 560px at 82% 22%, rgba(224,182,182,0.055), transparent 58%),
        linear-gradient(135deg, var(--ww-bg-1) 0%, var(--ww-bg-2) 48%, var(--ww-bg-3) 100%);
    }

    #app{
      min-height:100vh;
    }

    .ww-page{
      min-height:100vh;
      width:100%;
      overflow:hidden;
    }

    .ww-empty{
      min-height:100vh;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:2rem;
      text-align:center;
      color:var(--ww-ink-strong);
      font-weight:700;
    }

    .ww-sr-only{
      position:absolute;
      width:1px;
      height:1px;
      padding:0;
      margin:-1px;
      overflow:hidden;
      clip:rect(0,0,0,0);
      white-space:nowrap;
      border:0;
    }

    .ww-shell{
      min-height:100vh;
      width:100%;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:1.8rem;
    }

    .ww-list-frame{
      width:min(1320px, calc(100vw - 3.6rem));
      height:min(92vh, 860px);
      border-radius:1.85rem;
      overflow:hidden;
      background:
        radial-gradient(circle at center, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.006) 30%, rgba(0,0,0,0) 56%),
        radial-gradient(circle at center, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.58) 76%, rgba(0,0,0,0.84) 100%),
        var(--ww-panel-bg);
      box-shadow:
        inset 0 0 0 1px var(--ww-shell-stroke),
        inset 0 0 120px rgba(0,0,0,0.56),
        inset 0 0 220px rgba(0,0,0,0.34);
      display:grid;
      grid-template-columns:var(--ww-left-list) minmax(0,1fr);
    }

    .ww-list-rail{
      background:var(--ww-rail-bg);
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
      gap:1.25rem;
      padding:1.4rem 0.8rem;
      box-shadow:inset -1px 0 0 rgba(255,255,255,0.06);
    }

    .ww-list-rail-logo{
      display:flex;
      align-items:center;
      justify-content:center;
    }

    .ww-list-rail-logo img{
      width:7.25rem;
      display:block;
      filter:
        drop-shadow(0 10px 14px rgba(0,0,0,0.34))
        drop-shadow(0 3px 4px rgba(0,0,0,0.24));
    }

    .ww-list-rail-divider{
      width:42px;
      height:1px;
      background:rgba(255,255,255,0.18);
    }

    .ww-list-rail-link{
      background:none;
      border:0;
      padding:0;
      margin:0;
      color:#ffffff;
      font-weight:900;
      font-size:.78rem;
      letter-spacing:.22em;
      text-transform:uppercase;
      cursor:pointer;
      white-space:nowrap;
    }

    .ww-list-main{
      min-width:0;
      min-height:0;
      display:flex;
      align-items:stretch;
      justify-content:center;
      padding:0;
      overflow:hidden;
    }

    .ww-list-scroll{
      width:100%;
      height:100%;
      overflow-y:auto;
      overflow-x:hidden;
      padding:3rem 2rem 2.2rem;
    }

    .ww-list-scroll::-webkit-scrollbar{
      width:10px;
    }

    .ww-list-scroll::-webkit-scrollbar-thumb{
      background:rgba(255,255,255,0.16);
      border-radius:999px;
    }

    .ww-list-stack{
      width:min(900px, 100%);
      margin:0 auto;
      display:flex;
      flex-direction:column;
      gap:1.45rem;
    }

    .ww-list-status{
      display:flex;
      justify-content:center;
      gap:2rem;
      flex-wrap:wrap;
      margin:0 0 1rem;
      color:var(--ww-ink-strong);
      font-size:.98rem;
      font-weight:950;
      letter-spacing:.21em;
      text-transform:uppercase;
      text-align:center;
    }

    .ww-list-card{
      width:100%;
      min-height:7.7rem;
      border-radius:2rem;
      border:1px solid var(--ww-card-border);
      overflow:hidden;
      background:linear-gradient(90deg, rgba(10,18,27,0.92) 0%, rgba(13,22,32,0.92) 58%, rgba(36,45,57,0.92) 100%);
      box-shadow:0 18px 42px rgba(0,0,0,0.24);
    }

    .ww-list-row{
      display:flex;
      min-height:7.7rem;
    }

    .ww-list-thumb{
      width:33%;
      min-width:33%;
      position:relative;
      overflow:hidden;
      background:#000;
    }

    .ww-list-thumb img{
      width:100%;
      height:100%;
      object-fit:cover;
      display:block;
    }

    .ww-list-thumb::after{
      content:"";
      position:absolute;
      top:0;
      right:0;
      width:24%;
      height:100%;
      pointer-events:none;
      background:linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(12,18,27,0.72) 100%);
    }

    .ww-list-meta{
      width:67%;
      min-width:67%;
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:1rem;
      padding:1.2rem 1.35rem 1.2rem 1.2rem;
      background:linear-gradient(90deg, rgba(35,44,55,0.56) 0%, rgba(28,37,48,0.42) 100%);
    }

    .ww-list-copy{
      display:flex;
      flex-direction:column;
      align-items:flex-start;
      gap:.38rem;
      min-width:0;
    }

    .ww-kicker{
      color:#c7dfeb;
      font-size:.68rem;
      font-weight:900;
      letter-spacing:.22em;
      text-transform:uppercase;
      line-height:1;
    }

    .ww-list-title{
      color:#ffffff;
      font-size:1.05rem;
      font-weight:900;
      line-height:1;
      text-transform:lowercase;
      text-decoration:underline;
      text-decoration-thickness:1px;
      text-underline-offset:.18em;
    }

    .ww-open{
      border:1px solid rgba(157,195,214,0.38);
      background:rgba(157,195,214,0.12);
      color:var(--ww-ink-strong);
      border-radius:1rem;
      padding:.92rem 1.2rem;
      min-width:5.5rem;
      white-space:nowrap;
      font:900 .88rem system-ui,-apple-system,"Segoe UI",sans-serif;
      letter-spacing:.04em;
      cursor:pointer;
      transition:transform 160ms ease, background 160ms ease, border-color 160ms ease;
    }

    .ww-open:hover{
      transform:translateY(-1px);
      background:rgba(157,195,214,0.20);
      border-color:rgba(157,195,214,0.58);
    }

    .ww-open:focus-visible,
    .ww-list-rail-link:focus-visible,
    .ww-mini-textlink:focus-visible{
      outline:2px solid rgba(255,255,255,0.8);
      outline-offset:3px;
    }

    .ww-clue-shell{
      min-height:100vh;
      width:100%;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:0;
      overflow:hidden;
      background:#000;
    }

    .ww-clue-frame{
      width:100%;
      min-height:100vh;
      display:grid;
      grid-template-columns:var(--ww-left-clue) minmax(0,1fr);
      overflow:hidden;
      background:#000;
    }

    .ww-clue-rail{
      background:
        linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 18%),
        linear-gradient(180deg, var(--ww-rail-bg) 0%, var(--ww-rail-bg-dark) 100%);
      box-shadow:
        inset -1px 0 0 rgba(255,255,255,0.06),
        inset 0 0 40px rgba(255,255,255,0.03);
      position:relative;
    }

    .ww-clue-rail::before{
      content:"";
      position:absolute;
      inset:0;
      pointer-events:none;
      opacity:.16;
      background-image:
        linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
      background-size:100% 7px, 7px 100%;
      mix-blend-mode:soft-light;
    }

    .ww-mini-shell{
      position:relative;
      z-index:1;
      height:100%;
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
      gap:1.5rem;
      padding:1.8rem 0.9rem;
    }

    .ww-mini-logo{
      position:relative;
      width:100%;
      display:flex;
      justify-content:center;
      margin-top:-0.2rem;
    }

    .ww-mini-logo::before{
      content:"";
      position:absolute;
      inset:-18px;
      border-radius:50%;
      background:radial-gradient(circle, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 42%, rgba(255,255,255,0) 72%);
      filter:blur(8px);
      z-index:0;
    }

    .ww-mini-logo img{
      width:7.6rem;
      position:relative;
      z-index:1;
      display:block;
      filter:
        drop-shadow(0 9px 12px rgba(0,0,0,0.34))
        drop-shadow(0 2px 4px rgba(0,0,0,0.24));
    }

    .ww-mini-textnav{
      display:flex;
      flex-direction:column;
      gap:.76rem;
      align-items:center;
      margin-top:.5rem;
    }

    .ww-mini-textlink{
      text-decoration:none;
      font-weight:900;
      font-size:.78rem;
      letter-spacing:.31em;
      text-transform:uppercase;
      color:#f1f6fa;
      opacity:.98;
      display:inline-block;
      background:none;
      border:0;
      cursor:pointer;
      padding:0;
      line-height:1.45;
      transition:transform 150ms ease, color 150ms ease, opacity 150ms ease;
    }

    .ww-mini-textlink:hover{
      color:#ffffff;
      transform:scale(1.08);
    }

    .ww-mini-textlink[data-active="true"]{
      color:#ffffff;
    }

    .ww-clue-main{
      min-width:0;
      min-height:100vh;
      display:flex;
      align-items:center;
      justify-content:center;
      overflow:hidden;
      background:#000;
    }

    .ww-clue-stage{
      width:100%;
      height:100vh;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:2.8vh 2.8vw;
      background:
        radial-gradient(circle at center, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 28%, rgba(0,0,0,0) 55%),
        radial-gradient(circle at center, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.55) 76%, rgba(0,0,0,0.82) 100%),
        #000;
      box-shadow:
        inset 0 0 120px rgba(0,0,0,0.58),
        inset 0 0 220px rgba(0,0,0,0.38);
    }

    .ww-clue-image{
      width:min(90vw, 1400px);
      max-height:90vh;
      object-fit:contain;
      display:block;
    }

    @media (max-width:1100px){
      .ww-shell{
        padding:1rem;
      }

      .ww-list-frame{
        width:min(100%, calc(100vw - 2rem));
        height:min(92vh, 860px);
      }
    }

    @media (max-width:980px){
      .ww-shell{
        padding:0;
      }

      .ww-list-frame{
        width:100%;
        height:100vh;
        border-radius:0;
        grid-template-columns:1fr;
      }

      .ww-list-rail{
        display:none;
      }

      .ww-list-scroll{
        padding:1.4rem 1rem 1.4rem;
      }

      .ww-list-card{
        border-radius:1.3rem;
      }

      .ww-list-row{
        flex-direction:column;
      }

      .ww-list-thumb,
      .ww-list-meta{
        width:100%;
        min-width:100%;
      }

      .ww-list-thumb{
        height:120px;
      }

      .ww-list-thumb::after{
        display:none;
      }

      .ww-list-meta{
        padding:1rem;
      }

      .ww-clue-frame{
        grid-template-columns:1fr;
      }

      .ww-clue-rail{
        display:none;
      }

      .ww-clue-stage{
        padding:1.2rem;
      }

      .ww-clue-image{
        width:100%;
        max-height:86vh;
      }
    }
  `;
  document.head.appendChild(style);
}

function padClueId(value) {
  return String(value).padStart(2, "0");
}

function clueImageUrl(clueId) {
  const padded = padClueId(clueId);
  const extension = padded === "12" ? "gif" : "png";
  return `${ASSET_BASE}/images/clues/${padded}.${extension}`;
}

function clueDisplayImageUrl(clueId) {
  const padded = padClueId(clueId);
  return `${ASSET_BASE}/images/clues/display/${padded}.png`;
}

function logoUrl() {
  return `${ASSET_BASE}/images/ui/logo.png`;
}

function clueDisplayName(clueId) {
  const names = {
    1: "one",
    2: "two",
    3: "three",
    4: "four",
    5: "five",
    6: "six",
    7: "seven",
    8: "eight",
    9: "nine",
    10: "ten",
    11: "eleven",
    12: "twelve"
  };
  return names[Number(clueId)] || String(clueId);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function showError(message) {
  const app = getApp();
  ensureStyles();
  app.innerHTML = `
    <div class="ww-page">
      <div class="ww-empty">${escapeHtml(message)}</div>
    </div>
  `;
}

function renderClueList(game, clues) {
  const app = getApp();
  ensureStyles();

  const items = [];
  for (let clueId = 12; clueId >= 1; clueId -= 1) {
    items.push(`
      <article class="ww-list-card" data-clue="${clueId}">
        <div class="ww-list-row">
          <div class="ww-list-thumb">
            <img src="${clueDisplayImageUrl(clueId)}" alt="Clue ${escapeHtml(clueDisplayName(clueId))}">
          </div>
          <div class="ww-list-meta">
            <div class="ww-list-copy">
              <div class="ww-kicker">CLUE</div>
              <div class="ww-list-title">${escapeHtml(clueDisplayName(clueId))}</div>
            </div>
            <button type="button" class="ww-open" data-open-clue="${clueId}">OPEN →</button>
          </div>
        </div>
      </article>
    `);
  }

  app.innerHTML = `
    <div class="ww-page">
      <div class="ww-shell">
        <div class="ww-list-frame">
          <aside class="ww-list-rail">
            <div class="ww-list-rail-logo">
              <img src="${logoUrl()}" alt="WinterWord">
            </div>
            <div class="ww-list-rail-divider"></div>
            <button type="button" class="ww-list-rail-link">BASE STATION</button>
          </aside>

          <main class="ww-list-main">
            <div class="ww-list-scroll">
              <div class="ww-list-stack">
                <div class="ww-list-status">
                  <span>${escapeHtml(game.title || "WinterWord 2026")}</span>
                  <span>12 clue thumbnails</span>
                </div>
                ${items.join("")}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  `;

  const openButtons = app.querySelectorAll("[data-open-clue]");
  openButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const clueId = Number(button.getAttribute("data-open-clue"));
      renderSingleClue(game, clues, clueId);
    });
  });

  WW.currentView = { type: "list" };
}

function renderSingleClue(game, clues, clueId) {
  const app = getApp();
  ensureStyles();

  const clueIdNum = Number(clueId);
  const imageUrl = clueImageUrl(clueIdNum);

  app.innerHTML = `
    <div class="ww-page">
      <div class="ww-clue-shell">
        <div class="ww-clue-frame">
          <aside class="ww-clue-rail">
            <div class="ww-mini-shell">
              <div class="ww-mini-logo">
                <img src="${logoUrl()}" alt="WinterWord">
              </div>

              <nav class="ww-mini-textnav" aria-label="Clue navigation">
                <button type="button" class="ww-mini-textlink">BASE</button>
                <button type="button" class="ww-mini-textlink" data-go-list data-active="true">CLUES</button>
                <button type="button" class="ww-mini-textlink">LIFE</button>
              </nav>
            </div>
          </aside>

          <main class="ww-clue-main">
            <div class="ww-clue-stage">
              <img class="ww-clue-image" src="${imageUrl}" alt="Clue ${clueIdNum}">
            </div>
          </main>
        </div>
      </div>
    </div>
  `;

  const listButtons = app.querySelectorAll("[data-go-list]");
  listButtons.forEach((button) => {
    button.addEventListener("click", () => {
      renderClueList(game, clues);
    });
  });

  WW.currentView = { type: "clue", clueId: clueIdNum };
}

async function start(boot) {
  try {
    await loadBootstrap(boot);

    const game = await loadGame(boot);
    const clues = await loadClues(game);
    const answers = await loadAnswers(game);

    WW.boot = boot;
    WW.game = game;
    WW.clues = clues;
    WW.answers = answers;

    renderClueList(game, clues);

    console.log("ENGINE READY");
  } catch (err) {
    console.error("ENGINE ERROR:", err);
    showError(err && err.message ? err.message : "Engine failed to start");
  }
}
