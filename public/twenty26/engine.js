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

function ensureStyles() {
  if (document.getElementById(APP_STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = APP_STYLE_ID;
  style.textContent = `
    :root{
      --ww-ink:#dce5ec;
      --ww-ink-strong:#eef4fa;
      --ww-muted:rgba(220,229,236,0.72);

      --ww-bg-1:#06111c;
      --ww-bg-2:#0a1624;
      --ww-bg-3:#102235;

      --ww-panel-bg:#02060c;
      --ww-panel-edge:rgba(255,255,255,0.05);

      --ww-rail-list:#334b63;
      --ww-rail-clue-top:#31485f;
      --ww-rail-clue-bottom:#273a4b;

      --ww-card-stroke:rgba(255,255,255,0.14);
      --ww-card-bg-left:#0c141d;
      --ww-card-bg-right:#293545;

      --ww-button-border:rgba(157,195,214,0.36);
      --ww-button-bg:rgba(157,195,214,0.10);
      --ww-button-bg-hover:rgba(157,195,214,0.18);

      --ww-accent:#c8ddea;
      --ww-list-rail-width:8.15rem;
      --ww-clue-rail-width:9.4rem;
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
        radial-gradient(1200px 720px at 18% 18%, rgba(255,255,255,0.035), transparent 60%),
        radial-gradient(980px 560px at 82% 22%, rgba(224,182,182,0.05), transparent 58%),
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

    .ww-shell{
      min-height:100vh;
      width:100%;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:1.55rem;
    }

    .ww-list-frame{
      width:min(1135px, calc(100vw - 3.1rem));
      height:min(92vh, 810px);
      border-radius:1.85rem;
      overflow:hidden;
      display:grid;
      grid-template-columns:var(--ww-list-rail-width) minmax(0,1fr);
      background:
        radial-gradient(circle at center, rgba(255,255,255,0.028) 0%, rgba(255,255,255,0.006) 30%, rgba(0,0,0,0) 58%),
        radial-gradient(circle at center, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.58) 76%, rgba(0,0,0,0.84) 100%),
        var(--ww-panel-bg);
      box-shadow:
        inset 0 0 0 1px var(--ww-panel-edge),
        inset 0 0 120px rgba(0,0,0,0.58),
        inset 0 0 220px rgba(0,0,0,0.34);
    }

    .ww-list-rail{
      background:rgba(51,75,99,0.92);
      box-shadow:inset -1px 0 0 rgba(255,255,255,0.04);
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
      gap:1.45rem;
      padding:1.4rem 0.8rem;
    }

    .ww-list-rail-logo{
      display:flex;
      align-items:center;
      justify-content:center;
      width:100%;
    }

    .ww-list-rail-logo img{
      width:7.1rem;
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
      border:0;
      background:none;
      color:#ffffff;
      font-size:.77rem;
      font-weight:900;
      letter-spacing:.24em;
      text-transform:uppercase;
      cursor:pointer;
      white-space:nowrap;
      padding:.3rem 0;
    }

    .ww-list-main{
      min-width:0;
      min-height:0;
      overflow:hidden;
      display:flex;
    }

    .ww-list-scroll{
      flex:1;
      min-height:0;
      overflow-y:auto;
      overflow-x:hidden;
      padding:2.8rem 1.85rem 1.8rem;
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
      gap:1.3rem;
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
      min-height:7.05rem;
      border-radius:2rem;
      border:1px solid var(--ww-card-stroke);
      overflow:hidden;
      background:linear-gradient(90deg, var(--ww-card-bg-left) 0%, #101922 55%, var(--ww-card-bg-right) 100%);
      box-shadow:0 16px 38px rgba(0,0,0,0.22);
    }

    .ww-list-row{
      display:flex;
      min-height:7.05rem;
    }

    .ww-list-thumb{
      width:24%;
      min-width:24%;
      position:relative;
      overflow:hidden;
      background:#000;
    }

    .ww-list-thumb img{
      width:145%;
      height:100%;
      object-fit:cover;
      object-position:center center;
      transform:translateX(-11%);
      display:block;
    }

    .ww-list-thumb::after{
      content:"";
      position:absolute;
      top:0;
      right:0;
      width:42%;
      height:100%;
      background:linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(12,18,27,0.84) 100%);
      pointer-events:none;
    }

    .ww-list-meta{
      width:76%;
      min-width:76%;
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:1rem;
      padding:1.05rem 1.22rem 1.05rem 1rem;
      background:linear-gradient(90deg, rgba(36,46,58,0.52) 0%, rgba(30,39,50,0.40) 100%);
    }

    .ww-list-copy{
      display:flex;
      flex-direction:column;
      align-items:flex-start;
      gap:.34rem;
      min-width:0;
    }

    .ww-kicker{
      color:var(--ww-accent);
      font-size:.67rem;
      font-weight:900;
      letter-spacing:.22em;
      text-transform:uppercase;
      line-height:1;
    }

    .ww-list-title{
      color:#ffffff;
      font-size:1rem;
      font-weight:900;
      line-height:1;
      text-transform:lowercase;
      text-decoration:underline;
      text-decoration-thickness:1px;
      text-underline-offset:.18em;
    }

    .ww-open{
      border:1px solid var(--ww-button-border);
      background:var(--ww-button-bg);
      color:var(--ww-ink-strong);
      border-radius:1rem;
      padding:.82rem 1.12rem;
      min-width:5.4rem;
      white-space:nowrap;
      font:900 .86rem system-ui,-apple-system,"Segoe UI",sans-serif;
      letter-spacing:.04em;
      cursor:pointer;
      transition:transform 160ms ease, background 160ms ease, border-color 160ms ease;
    }

    .ww-open:hover{
      transform:translateY(-1px);
      background:var(--ww-button-bg-hover);
      border-color:rgba(157,195,214,0.56);
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
      overflow:hidden;
      background:#000;
    }

    .ww-clue-frame{
      width:100%;
      min-height:100vh;
      display:grid;
      grid-template-columns:var(--ww-clue-rail-width) minmax(0,1fr);
      background:#000;
    }

    .ww-clue-rail{
      background:
        linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0) 18%),
        linear-gradient(180deg, var(--ww-rail-clue-top) 0%, var(--ww-rail-clue-bottom) 100%);
      box-shadow:
        inset -1px 0 0 rgba(255,255,255,0.05),
        inset 0 0 40px rgba(255,255,255,0.025);
      position:relative;
    }

    .ww-clue-rail::before{
      content:"";
      position:absolute;
      inset:0;
      pointer-events:none;
      opacity:.15;
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
      gap:1.55rem;
      padding:1.8rem 0.9rem;
    }

    .ww-mini-logo{
      position:relative;
      width:100%;
      display:flex;
      justify-content:center;
      margin-top:-0.15rem;
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
      gap:.8rem;
      align-items:center;
      margin-top:.65rem;
    }

    .ww-mini-textlink{
      text-decoration:none;
      font-weight:900;
      font-size:.82rem;
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
      background:#000;
      overflow:hidden;
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
        height:min(92vh, 810px);
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
        padding:1.2rem 1rem 1.2rem;
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
        height:110px;
      }

      .ww-list-thumb img{
        width:120%;
        transform:translateX(-8%);
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
                  <span>Week 12 Available</span>
                  <span>All Clues Available</span>
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
