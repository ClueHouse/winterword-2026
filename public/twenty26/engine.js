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
      --ww-muted:rgba(220,229,236,0.72);
      --ww-bg-1:#050a11;
      --ww-bg-2:#0a1521;
      --ww-bg-3:#102131;
      --ww-rail-bg:#30485f;
      --ww-ink-strong:#ecf3fa;
      --ww-accent:#9dc3d6;
      --ww-card-border:rgba(255,255,255,0.16);
      --ww-shell-stroke:rgba(255,255,255,0.06);
      --ww-overlay:rgba(0,0,0,0.92);
      --ww-left-narrow:7.4rem;
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
        radial-gradient(980px 560px at 82% 22%, rgba(224,182,182,0.06), transparent 58%),
        linear-gradient(135deg, var(--ww-bg-1) 0%, var(--ww-bg-2) 48%, var(--ww-bg-3) 100%);
    }

    #app{
      min-height:100vh;
    }

    .ww-page{
      min-height:100vh;
      padding:0;
      overflow:hidden;
    }

    .ww-shell{
      width:100%;
      min-height:100vh;
      overflow:hidden;
      background:transparent;
    }

    .ww-content{
      min-height:100vh;
      display:grid;
      grid-template-columns:6.6rem minmax(0,1fr);
      gap:1.9rem;
      padding:1.9rem 2.2rem;
      overflow:hidden;
    }

    .ww-side{
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
      gap:1rem;
    }

    .ww-side-logo{
      display:flex;
      flex-direction:column;
      align-items:center;
      gap:.95rem;
      text-decoration:none;
      background:none;
      border:0;
      padding:0;
      cursor:pointer;
      color:inherit;
    }

    .ww-side-logo img{
      width:8.9rem;
      display:block;
      filter:
        drop-shadow(0 8px 12px rgba(0,0,0,0.35))
        drop-shadow(0 2px 3px rgba(0,0,0,0.25));
    }

    .ww-side-divider{
      width:42px;
      height:1px;
      background:rgba(255,255,255,0.18);
    }

    .ww-side-label{
      font-size:.76rem;
      letter-spacing:.22em;
      text-transform:uppercase;
      font-weight:900;
      color:#ffffff;
      white-space:nowrap;
    }

    .ww-main{
      height:100vh;
      display:flex;
      overflow:hidden;
      align-items:center;
    }

    .ww-stage-list{
      width:100%;
      height:calc(100vh - 3.8rem);
      border-radius:1.55rem;
      overflow:hidden;
      background:
        radial-gradient(circle at center, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.008) 28%, rgba(0,0,0,0) 54%),
        radial-gradient(circle at center, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.60) 76%, rgba(0,0,0,0.85) 100%),
        #02060c;
      box-shadow:
        inset 0 0 0 1px var(--ww-shell-stroke),
        inset 0 0 120px rgba(0,0,0,0.58),
        inset 0 0 220px rgba(0,0,0,0.36);
      display:flex;
      flex-direction:column;
    }

    .ww-list-scroll{
      flex:1;
      overflow-y:auto;
      overflow-x:hidden;
      padding:3rem 1.8rem 2rem;
    }

    .ww-list-scroll::-webkit-scrollbar{
      width:10px;
    }

    .ww-list-scroll::-webkit-scrollbar-thumb{
      background:rgba(255,255,255,0.14);
      border-radius:999px;
    }

    .ww-cllist{
      width:min(980px,100%);
      margin:0 auto;
      display:flex;
      flex-direction:column;
      gap:1.55rem;
    }

    .ww-status{
      width:min(900px,100%);
      margin:0 auto .85rem;
      display:flex;
      justify-content:center;
      gap:2rem;
      font-size:1rem;
      font-weight:950;
      letter-spacing:.20em;
      text-transform:uppercase;
      color:var(--ww-ink-strong);
      text-align:center;
      flex-wrap:wrap;
    }

    .ww-banner{
      width:min(900px,100%);
      margin:0 auto;
      border-radius:2rem;
      border:1px solid var(--ww-card-border);
      overflow:hidden;
      background:linear-gradient(90deg, rgba(10,18,27,0.92) 0%, rgba(14,22,32,0.92) 58%, rgba(36,45,57,0.92) 100%);
      box-shadow:0 18px 42px rgba(0,0,0,0.24);
    }

    .ww-clrow{
      display:flex;
      min-height:7.55rem;
    }

    .ww-img{
      width:62%;
      overflow:hidden;
      background:#000;
    }

    .ww-img img{
      width:100%;
      height:100%;
      object-fit:cover;
      display:block;
    }

    .ww-meta{
      width:38%;
      display:flex;
      justify-content:space-between;
      align-items:center;
      padding:1.1rem 1.35rem;
      border-left:1px solid rgba(255,255,255,0.10);
      gap:1rem;
      background:linear-gradient(90deg, rgba(44,52,65,0.45) 0%, rgba(28,37,48,0.38) 100%);
    }

    .ww-meta-copy{
      display:flex;
      flex-direction:column;
      gap:.38rem;
      min-width:0;
      align-items:flex-start;
    }

    .ww-kicker{
      font-size:.68rem;
      letter-spacing:.22em;
      text-transform:uppercase;
      color:#c7dfeb;
      font-weight:900;
    }

    .ww-num{
      font:900 1.05rem/1 system-ui,-apple-system,"Segoe UI",sans-serif;
      color:#ffffff;
      text-transform:lowercase;
      text-decoration:underline;
      text-decoration-thickness:1px;
      text-underline-offset:.18em;
    }

    .ww-open{
      padding:.95rem 1.22rem;
      border-radius:1rem;
      border:1px solid rgba(157,195,214,0.38);
      background:rgba(157,195,214,0.12);
      color:var(--ww-ink-strong);
      font:900 .88rem system-ui,-apple-system,"Segoe UI",sans-serif;
      letter-spacing:.04em;
      white-space:nowrap;
      cursor:pointer;
      transition:transform 160ms ease, background 160ms ease, border-color 160ms ease;
      min-width:5.4rem;
    }

    .ww-open:hover{
      transform:translateY(-1px);
      background:rgba(157,195,214,0.20);
      border-color:rgba(157,195,214,0.58);
    }

    .ww-open:focus-visible,
    .ww-side-logo:focus-visible,
    .ww-mini-textlink:focus-visible,
    .ww-back-btn:focus-visible,
    .ww-clue-still:focus-visible,
    .ww-overlay-close:focus-visible{
      outline:2px solid rgba(255,255,255,0.75);
      outline-offset:3px;
    }

    .ww-portal{
      display:flex;
      height:100vh;
      overflow:hidden;
      background:#000;
    }

    .ww-left{
      width:var(--ww-left-narrow);
      background:var(--ww-rail-bg);
      box-shadow:inset -1px 0 0 rgba(255,255,255,0.06);
      flex:0 0 var(--ww-left-narrow);
    }

    .ww-mini-shell{
      height:100%;
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
      gap:1.2rem;
    }

    .ww-mini-logo{
      position:relative;
      width:100%;
      display:flex;
      justify-content:center;
    }

    .ww-mini-logo::before{
      content:"";
      position:absolute;
      inset:-24px;
      border-radius:50%;
      background:radial-gradient(
        circle,
        rgba(255,255,255,0.18) 0%,
        rgba(255,255,255,0.08) 40%,
        rgba(255,255,255,0.00) 70%
      );
      filter:blur(10px);
      z-index:0;
    }

    .ww-mini-logo img{
      width:8.6rem;
      position:relative;
      z-index:1;
      display:block;
      filter:
        drop-shadow(0 8px 12px rgba(0,0,0,0.35))
        drop-shadow(0 2px 3px rgba(0,0,0,0.25));
    }

    .ww-mini-textnav{
      display:flex;
      flex-direction:column;
      gap:.9rem;
      align-items:center;
    }

    .ww-mini-textlink{
      text-decoration:none;
      font-weight:900;
      font-size:.78rem;
      letter-spacing:.28em;
      text-transform:uppercase;
      color:#e3edf5;
      opacity:.92;
      display:inline-block;
      transition:transform 150ms ease, color 150ms ease;
      background:none;
      border:0;
      cursor:pointer;
      padding:0;
    }

    .ww-mini-textlink:hover{
      color:#ffffff;
      transform:scale(1.14);
    }

    .ww-mini-textlink[data-active="true"]{
      color:#ffffff;
    }

    .ww-right{
      flex:1;
      position:relative;
      overflow:hidden;
      background:#000;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:2rem 2.4rem;
    }

    .ww-stage{
      width:100%;
      height:100%;
      border-radius:1.4rem;
      position:relative;
      overflow:hidden;
      background:
        radial-gradient(circle at center, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 28%, rgba(0,0,0,0) 55%),
        radial-gradient(circle at center, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.55) 76%, rgba(0,0,0,0.82) 100%),
        #000;
      box-shadow:
        inset 0 0 120px rgba(0,0,0,0.58),
        inset 0 0 220px rgba(0,0,0,0.38);
    }

    .ww-clue-stage{
      position:absolute;
      inset:0;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:3.2vh 3.2vw;
    }

    .ww-clue-still{
      width:min(88vw, 1380px);
      max-height:88vh;
      object-fit:contain;
      cursor:pointer;
      border:0;
      background:none;
      padding:0;
      display:block;
    }

    .ww-clue-still img{
      width:100%;
      max-height:88vh;
      object-fit:contain;
      display:block;
    }

    .ww-overlay{
      position:absolute;
      inset:0;
      z-index:20;
      display:none;
    }

    .ww-overlay.is-open{
      display:block;
    }

    .ww-veil{
      position:absolute;
      inset:0;
      background:var(--ww-overlay);
    }

    .ww-modal{
      position:absolute;
      inset:0;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:3.2vh 3.2vw;
    }

    .ww-modal-inner{
      width:min(92vw, 1400px);
      max-height:92vh;
      position:relative;
    }

    .ww-modal-inner img{
      width:100%;
      max-height:92vh;
      object-fit:contain;
      display:block;
      box-shadow:0 26px 78px rgba(0,0,0,0.65);
      border-radius:.9rem;
      background:#000;
    }

    .ww-overlay-close{
      position:absolute;
      top:14px;
      right:14px;
      z-index:2;
      border:1px solid rgba(255,255,255,0.2);
      background:rgba(0,0,0,0.5);
      color:#fff;
      border-radius:999px;
      padding:.55rem .85rem;
      cursor:pointer;
      font-weight:700;
    }

    .ww-back-btn{
      position:absolute;
      top:22px;
      left:22px;
      z-index:25;
      border:1px solid rgba(255,255,255,0.24);
      background:rgba(0,0,0,0.45);
      color:#fff;
      border-radius:999px;
      padding:.7rem 1rem;
      cursor:pointer;
      font-weight:800;
      letter-spacing:.12em;
      text-transform:uppercase;
      font-size:.72rem;
    }

    .ww-clue-caption{
      position:absolute;
      bottom:28px;
      left:50%;
      transform:translateX(-50%);
      z-index:18;
      text-align:center;
      display:flex;
      flex-direction:column;
      gap:.35rem;
      align-items:center;
      pointer-events:none;
    }

    .ww-clue-caption .ww-kicker{
      font-size:.68rem;
      letter-spacing:.28em;
      color:#b7d3e2;
    }

    .ww-clue-caption .ww-caption-title{
      color:#ffffff;
      font-size:1.05rem;
      font-weight:900;
      letter-spacing:.14em;
      text-transform:uppercase;
      text-shadow:0 2px 10px rgba(0,0,0,0.55);
    }

    .ww-empty{
      width:100%;
      min-height:100vh;
      display:flex;
      align-items:center;
      justify-content:center;
      text-align:center;
      padding:2rem;
      color:var(--ww-ink-strong);
      font-weight:700;
    }

    @media (max-width:980px){
      .ww-content{
        grid-template-columns:1fr;
        gap:1rem;
        padding:1rem;
      }

      .ww-side{
        justify-content:flex-start;
      }

      .ww-main{
        height:auto;
      }

      .ww-stage-list{
        height:calc(100vh - 8rem);
      }

      .ww-clrow{
        flex-direction:column;
        min-height:auto;
      }

      .ww-img,
      .ww-meta{
        width:100%;
      }

      .ww-meta{
        border-left:0;
        border-top:1px solid rgba(255,255,255,0.10);
      }

      .ww-status,
      .ww-banner{
        width:min(100%, 980px);
      }

      .ww-portal{
        flex-direction:column;
        height:100vh;
      }

      .ww-left{
        width:100%;
        flex:0 0 auto;
      }

      .ww-mini-shell{
        padding:1rem 0;
      }

      .ww-right{
        min-height:65vh;
        padding:1rem;
      }

      .ww-stage{
        border-radius:1rem;
      }

      .ww-back-btn{
        top:14px;
        left:14px;
      }

      .ww-clue-caption{
        bottom:20px;
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
      <div class="ww-shell">
        <div class="ww-empty">${escapeHtml(message)}</div>
      </div>
    </div>
  `;
}

function renderClueList(game, clues) {
  const app = getApp();
  ensureStyles();

  if (!Array.isArray(clues) || clues.length === 0) {
    throw new Error("No clues found");
  }

  const items = clues
    .slice()
    .sort((a, b) => Number(b.id) - Number(a.id))
    .map((clue) => {
      const clueId = Number(clue.id);
      return `
        <article class="ww-banner" data-clue="${clueId}">
          <div class="ww-clrow">
            <div class="ww-img">
              <img src="${clueDisplayImageUrl(clueId)}" alt="Clue ${escapeHtml(clueDisplayName(clueId))}">
            </div>
            <div class="ww-meta">
              <div class="ww-meta-copy">
                <div class="ww-kicker">CLUE</div>
                <div class="ww-num">${escapeHtml(clueDisplayName(clueId))}</div>
              </div>
              <button type="button" class="ww-open" data-open-clue="${clueId}">OPEN →</button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  app.innerHTML = `
    <div class="ww-page">
      <div class="ww-shell">
        <div class="ww-content">
          <div class="ww-side">
            <button type="button" class="ww-side-logo" data-go-list aria-label="Clue List">
              <img src="${logoUrl()}" alt="WinterWord">
              <div class="ww-side-divider"></div>
              <div class="ww-side-label">CLUE LIST</div>
            </button>
          </div>

          <div class="ww-main">
            <div class="ww-stage-list">
              <div class="ww-list-scroll">
                <div class="ww-cllist">
                  <div class="ww-status">
                    <span>${escapeHtml(game.title || "WinterWord 2026")}</span>
                    <span>${clues.length} clue${clues.length === 1 ? "" : "s"} loaded</span>
                  </div>
                  ${items}
                </div>
              </div>
            </div>
          </div>
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

  const listButton = app.querySelector("[data-go-list]");
  if (listButton) {
    listButton.addEventListener("click", () => {
      renderClueList(game, clues);
    });
  }

  WW.currentView = { type: "list" };
}

function renderSingleClue(game, clues, clueId) {
  const app = getApp();
  ensureStyles();

  const clue = clues.find((item) => Number(item.id) === Number(clueId));
  if (!clue) {
    throw new Error("Clue not found");
  }

  const clueIdNum = Number(clue.id);
  const imageUrl = clueImageUrl(clueIdNum);
  const clueTitle = clue.title || `Clue ${clueIdNum}`;

  app.innerHTML = `
    <div class="ww-page">
      <div class="ww-shell">
        <div class="ww-portal">
          <aside class="ww-left">
            <div class="ww-mini-shell">
              <div class="ww-mini-logo">
                <img src="${logoUrl()}" alt="WinterWord">
              </div>

              <nav class="ww-mini-textnav">
                <button type="button" class="ww-mini-textlink" data-go-list>Clues</button>
                <button type="button" class="ww-mini-textlink" data-go-list>Back</button>
              </nav>
            </div>
          </aside>

          <main class="ww-right">
            <div class="ww-stage">
              <button type="button" class="ww-back-btn" data-go-list>← Back</button>

              <div class="ww-clue-stage">
                <button type="button" class="ww-clue-still" data-open-overlay aria-label="Open ${escapeHtml(clueTitle)}">
                  <img src="${imageUrl}" alt="${escapeHtml(clueTitle)}">
                </button>
              </div>

              <div class="ww-clue-caption">
                <div class="ww-kicker">CLUE</div>
                <div class="ww-caption-title">${escapeHtml(clueDisplayName(clueIdNum))}</div>
              </div>

              <div class="ww-overlay" id="wwOverlay">
                <div class="ww-veil" data-close-overlay></div>
                <div class="ww-modal">
                  <div class="ww-modal-inner">
                    <button type="button" class="ww-overlay-close" data-close-overlay>Close</button>
                    <img src="${imageUrl}" alt="${escapeHtml(clueTitle)}">
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  `;

  const overlay = app.querySelector("#wwOverlay");
  const openOverlayButton = app.querySelector("[data-open-overlay]");
  const closeOverlayButtons = app.querySelectorAll("[data-close-overlay]");
  const listButtons = app.querySelectorAll("[data-go-list]");

  function openOverlay() {
    if (overlay) overlay.classList.add("is-open");
  }

  function closeOverlay() {
    if (overlay) overlay.classList.remove("is-open");
  }

  if (openOverlayButton) {
    openOverlayButton.addEventListener("click", openOverlay);
  }

  closeOverlayButtons.forEach((button) => {
    button.addEventListener("click", closeOverlay);
  });

  listButtons.forEach((button) => {
    button.addEventListener("click", () => {
      renderClueList(game, clues);
    });
  });

  document.onkeydown = function onKeyDown(event) {
    if (event.key === "Escape") {
      closeOverlay();
    }
  };

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
