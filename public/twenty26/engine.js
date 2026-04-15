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
      --ww-bg-1:#06111b;
      --ww-bg-2:#091521;
      --ww-bg-3:#122231;

      --ww-panel-bg:#03070d;
      --ww-panel-edge:rgba(255,255,255,0.04);

      --ww-rail-clue-top:#30475e;
      --ww-rail-clue-bottom:#263949;

      --ww-list-sidebar-width:13.25rem;
      --ww-clue-rail-width:9.9rem;

      --ww-card-stroke:rgba(255,255,255,0.10);
      --ww-card-shadow:0 10px 24px rgba(0,0,0,0.18);

      --ww-pill-left:#0b131b;
      --ww-pill-mid:#101821;
      --ww-pill-right:#1f2a36;

      --ww-button-border:rgba(188,211,224,0.28);
      --ww-button-bg:rgba(188,211,224,0.07);
      --ww-button-bg-hover:rgba(188,211,224,0.14);

      --ww-accent:#d7e4ec;
      --ww-muted:#b8c9d5;
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
        radial-gradient(1200px 720px at 18% 18%, rgba(255,255,255,0.028), transparent 60%),
        radial-gradient(980px 560px at 82% 22%, rgba(211,182,160,0.035), transparent 58%),
        linear-gradient(135deg, var(--ww-bg-1) 0%, var(--ww-bg-2) 50%, var(--ww-bg-3) 100%);
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
      padding:1.25rem;
    }

    /* CLUE LIST */
    .ww-list-frame{
      width:min(1140px, calc(100vw - 2.5rem));
      height:min(92vh, 810px);
      border-radius:1.8rem;
      overflow:hidden;
      display:grid;
      grid-template-columns:var(--ww-list-sidebar-width) minmax(0,1fr);
      background:
        radial-gradient(circle at center, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.004) 26%, rgba(0,0,0,0) 54%),
        radial-gradient(circle at center, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.52) 76%, rgba(0,0,0,0.84) 100%),
        var(--ww-panel-bg);
      box-shadow:
        inset 0 0 0 1px var(--ww-panel-edge),
        inset 0 0 120px rgba(0,0,0,0.52),
        inset 0 0 220px rgba(0,0,0,0.26);
    }

    .ww-list-sidebar{
      position:relative;
      min-height:0;
      display:flex;
      align-items:stretch;
      justify-content:center;
      background:
        linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.012) 20%, rgba(255,255,255,0) 58%),
        linear-gradient(180deg, rgba(44,61,78,0.34) 0%, rgba(24,34,45,0.18) 100%);
    }

    .ww-list-sidebar::after{
      content:"";
      position:absolute;
      top:1.8rem;
      right:0;
      bottom:1.8rem;
      width:1px;
      background:linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.08) 16%, rgba(255,255,255,0.08) 84%, rgba(255,255,255,0) 100%);
      pointer-events:none;
    }

    .ww-list-sidebar-inner{
      width:100%;
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:flex-start;
      padding:2.25rem 1.1rem 2rem;
      gap:2rem;
    }

    .ww-list-logo{
      width:100%;
      display:flex;
      align-items:center;
      justify-content:center;
      padding-top:.2rem;
    }

    .ww-list-logo img{
      width:7.35rem;
      display:block;
      opacity:.97;
      filter:
        drop-shadow(0 10px 14px rgba(0,0,0,0.34))
        drop-shadow(0 2px 4px rgba(0,0,0,0.24));
    }

    .ww-list-side-nav{
      width:100%;
      display:flex;
      flex-direction:column;
      align-items:center;
      gap:1.05rem;
      margin-top:.5rem;
    }

    .ww-list-side-link{
      border:0;
      background:none;
      color:#f3f6f9;
      font-size:.78rem;
      font-weight:900;
      letter-spacing:.28em;
      text-transform:uppercase;
      cursor:pointer;
      white-space:nowrap;
      padding:.2rem 0;
      line-height:1.25;
      opacity:.94;
      transition:transform 150ms ease, opacity 150ms ease, color 150ms ease;
    }

    .ww-list-side-link:hover{
      transform:scale(1.05);
      opacity:1;
      color:#ffffff;
    }

    .ww-list-side-link[data-active="true"]{
      color:#ffffff;
      opacity:1;
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
      padding:2.1rem 1.65rem 1.5rem 1.4rem;
    }

    .ww-list-scroll::-webkit-scrollbar{
      width:10px;
    }

    .ww-list-scroll::-webkit-scrollbar-thumb{
      background:rgba(255,255,255,0.14);
      border-radius:999px;
    }

    .ww-list-stack{
      width:min(820px, 100%);
      margin:0 auto;
      display:flex;
      flex-direction:column;
      gap:.72rem;
    }

    .ww-list-status{
      display:flex;
      justify-content:center;
      gap:1.7rem;
      flex-wrap:wrap;
      margin:0 0 .35rem;
      color:var(--ww-accent);
      font-size:.82rem;
      font-weight:900;
      letter-spacing:.20em;
      text-transform:uppercase;
      text-align:center;
      opacity:.95;
    }

    .ww-list-card{
      width:100%;
      min-height:4.55rem;
      border-radius:999px;
      border:1px solid var(--ww-card-stroke);
      overflow:hidden;
      background:linear-gradient(90deg, var(--ww-pill-left) 0%, var(--ww-pill-mid) 54%, var(--ww-pill-right) 100%);
      box-shadow:var(--ww-card-shadow);
      backdrop-filter:blur(1px);
    }

    .ww-list-row{
      display:grid;
      grid-template-columns:5.35rem minmax(0,1fr) auto;
      align-items:center;
      min-height:4.55rem;
      gap:0;
    }

    .ww-list-thumb{
      position:relative;
      height:100%;
      overflow:hidden;
      background:#000;
    }

    .ww-list-thumb img{
      position:absolute;
      inset:0 auto 0 0;
      width:220%;
      height:100%;
      object-fit:cover;
      object-position:center center;
      transform:translateX(-34%);
      display:block;
    }

    .ww-list-thumb::after{
      content:"";
      position:absolute;
      top:0;
      right:0;
      width:56px;
      height:100%;
      background:linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(11,19,27,0.94) 100%);
      pointer-events:none;
    }

    .ww-list-meta{
      min-width:0;
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:.9rem;
      padding:.7rem .9rem .7rem .2rem;
    }

    .ww-list-copy{
      display:flex;
      flex-direction:column;
      align-items:flex-start;
      justify-content:center;
      gap:.14rem;
      min-width:0;
    }

    .ww-kicker{
      color:var(--ww-muted);
      font-size:.56rem;
      font-weight:900;
      letter-spacing:.24em;
      text-transform:uppercase;
      line-height:1;
    }

    .ww-list-title{
      color:#ffffff;
      font-size:.9rem;
      font-weight:900;
      line-height:1.05;
      text-transform:lowercase;
      text-decoration:underline;
      text-decoration-thickness:1px;
      text-underline-offset:.18em;
    }

    .ww-open-wrap{
      display:flex;
      align-items:center;
      justify-content:flex-end;
      padding-right:.72rem;
    }

    .ww-open{
      border:1px solid var(--ww-button-border);
      background:var(--ww-button-bg);
      color:var(--ww-ink-strong);
      border-radius:999px;
      padding:.58rem .92rem;
      min-width:4.6rem;
      white-space:nowrap;
      font:900 .75rem system-ui,-apple-system,"Segoe UI",sans-serif;
      letter-spacing:.08em;
      cursor:pointer;
      transition:transform 160ms ease, background 160ms ease, border-color 160ms ease;
    }

    .ww-open:hover{
      transform:translateY(-1px);
      background:var(--ww-button-bg-hover);
      border-color:rgba(188,211,224,0.48);
    }

    .ww-open:focus-visible,
    .ww-list-side-link:focus-visible,
    .ww-mini-textlink:focus-visible{
      outline:2px solid rgba(255,255,255,0.8);
      outline-offset:3px;
    }

    /* CLUE PAGE */
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
      gap:.82rem;
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

      .ww-list-row{
        grid-template-columns:4.8rem minmax(0,1fr) auto;
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

      .ww-list-sidebar{
        display:none;
      }

      .ww-list-scroll{
        padding:1.1rem .9rem 1.1rem;
      }

      .ww-list-stack{
        width:100%;
        gap:.68rem;
      }

      .ww-list-card{
        border-radius:1.35rem;
      }

      .ww-list-row{
        grid-template-columns:4.5rem minmax(0,1fr);
        min-height:4.5rem;
      }

      .ww-open-wrap{
        padding-right:.35rem;
      }

      .ww-open{
        min-width:auto;
        padding:.54rem .78rem;
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

    @media (max-width:640px){
      .ww-list-status{
        gap:.55rem;
        font-size:.72rem;
        letter-spacing:.12em;
      }

      .ww-list-row{
        grid-template-columns:4.15rem minmax(0,1fr);
      }

      .ww-list-meta{
        gap:.55rem;
        padding:.62rem .3rem .62rem .1rem;
      }

      .ww-list-title{
        font-size:.84rem;
      }

      .ww-open{
        font-size:.7rem;
        letter-spacing:.05em;
        padding:.52rem .7rem;
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
            <div class="ww-open-wrap">
              <button type="button" class="ww-open" data-open-clue="${clueId}">OPEN →</button>
            </div>
          </div>
        </div>
      </article>
    `);
  }

  app.innerHTML = `
    <div class="ww-page">
      <div class="ww-shell">
        <div class="ww-list-frame">
          <aside class="ww-list-sidebar">
            <div class="ww-list-sidebar-inner">
              <div class="ww-list-logo">
                <img src="${logoUrl()}" alt="WinterWord">
              </div>

              <nav class="ww-list-side-nav" aria-label="Clue list navigation">
                <button type="button" class="ww-list-side-link">BASE STATION</button>
                <button type="button" class="ww-list-side-link" data-active="true">CLUES</button>
                <button type="button" class="ww-list-side-link">LIFELINE</button>
              </nav>
            </div>
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
