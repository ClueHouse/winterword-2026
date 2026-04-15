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
      --ww-bg-1:#070c12;
      --ww-bg-2:#0e1721;
      --ww-bg-3:#152534;
      --ww-rail-bg:#2a3f52;
      --ww-ink-strong:#ecf3fa;
      --ww-accent:#9dc3d6;
      --ww-card-border:rgba(255,255,255,0.18);
      --ww-card-bg-top:rgba(255,255,255,0.12);
      --ww-card-bg-bottom:rgba(255,255,255,0.035);
      --ww-shell-bg:rgba(0,0,0,0.48);
      --ww-shell-stroke:rgba(255,255,255,0.05);
      --ww-overlay:rgba(0,0,0,0.92);
      --ww-left-narrow:8.8rem;
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
        radial-gradient(1200px 700px at 18% 18%, rgba(255,255,255,0.04), transparent 60%),
        radial-gradient(900px 520px at 82% 22%, rgba(224,182,182,0.08), transparent 58%),
        linear-gradient(135deg, var(--ww-bg-1) 0%, var(--ww-bg-2) 48%, var(--ww-bg-3) 100%);
    }

    #app{
      min-height:100vh;
    }

    .ww-page{
      min-height:100vh;
      padding:2rem;
      overflow:hidden;
    }

    .ww-shell{
      max-width:82rem;
      margin:0 auto;
      height:calc(100vh - 4rem);
      border-radius:1.75rem;
      overflow:hidden;
      background:var(--ww-shell-bg);
      backdrop-filter:blur(6px);
      box-shadow:
        0 30px 80px rgba(0,0,0,0.6),
        inset 0 0 0 1px var(--ww-shell-stroke);
    }

    .ww-content{
      height:100%;
      display:grid;
      grid-template-columns:6.4rem minmax(0,1fr);
      gap:2rem;
      padding:2.35rem 2.4rem;
      overflow:hidden;
    }

    .ww-side{
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
      gap:1.35rem;
    }

    .ww-side-logo{
      display:flex;
      flex-direction:column;
      align-items:center;
      gap:.85rem;
      text-decoration:none;
      background:none;
      border:0;
      padding:0;
      cursor:pointer;
      color:inherit;
    }

    .ww-side-mark{
      width:5rem;
      height:5rem;
      border-radius:50%;
      display:flex;
      align-items:center;
      justify-content:center;
      background:radial-gradient(circle, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.06) 48%, rgba(255,255,255,0) 72%);
      box-shadow:
        0 8px 24px rgba(0,0,0,0.35),
        inset 0 0 0 1px rgba(255,255,255,0.08);
      color:#fff;
      font-weight:900;
      letter-spacing:.08em;
      font-size:1rem;
    }

    .ww-side-divider{
      width:44px;
      height:1px;
      background:rgba(255,255,255,0.20);
    }

    .ww-side-label{
      font-size:.82rem;
      letter-spacing:.22em;
      text-transform:uppercase;
      font-weight:900;
      color:#ffffff;
      text-shadow:
        0 1px 2px rgba(0,0,0,0.75),
        0 0 4px rgba(255,255,255,0.04);
      white-space:nowrap;
    }

    .ww-main{
      height:100%;
      display:flex;
      overflow:hidden;
    }

    .ww-scroll{
      width:100%;
      height:100%;
      overflow-y:auto;
      overflow-x:hidden;
      padding-right:.35rem;
    }

    .ww-scroll::-webkit-scrollbar{
      width:10px;
    }

    .ww-scroll::-webkit-scrollbar-thumb{
      background:rgba(255,255,255,0.14);
      border-radius:999px;
    }

    .ww-wrap{
      padding:60px 18px 40px;
    }

    .ww-cllist{
      width:min(1100px,92vw);
      margin:0 auto;
      display:flex;
      flex-direction:column;
      gap:26px;
    }

    .ww-status{
      width:min(980px,76vw);
      margin:0 auto 34px;
      display:flex;
      justify-content:center;
      gap:28px;
      font-size:.98rem;
      font-weight:950;
      letter-spacing:.20em;
      text-transform:uppercase;
      color:var(--ww-ink-strong);
      text-align:center;
      flex-wrap:wrap;
    }

    .ww-banner{
      width:min(980px,76vw);
      margin:0 auto;
      border-radius:28px;
      border:1px solid var(--ww-card-border);
      background:linear-gradient(180deg, var(--ww-card-bg-top), var(--ww-card-bg-bottom));
      overflow:hidden;
      box-shadow:0 18px 46px rgba(0,0,0,0.28);
    }

    .ww-clrow{
      display:flex;
      height:132px;
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
      transform:scale(1.04);
      display:block;
    }

    .ww-banner[data-clue="11"] .ww-img img{
      transform:scale(1.35);
    }

    .ww-meta{
      width:38%;
      display:flex;
      justify-content:space-between;
      align-items:center;
      padding:14px 20px;
      border-left:1px solid rgba(255,255,255,0.10);
      gap:1rem;
    }

    .ww-meta-copy{
      display:flex;
      flex-direction:column;
      gap:4px;
      min-width:0;
    }

    .ww-kicker{
      font-size:.68rem;
      letter-spacing:.22em;
      text-transform:uppercase;
      color:var(--ww-accent);
      font-weight:900;
    }

    .ww-num{
      font:900 20px/1 system-ui,-apple-system,"Segoe UI",sans-serif;
      color:var(--ww-ink-strong);
      text-transform:lowercase;
    }

    .ww-line{
      width:40px;
      height:1px;
      background:rgba(157,195,214,0.5);
    }

    .ww-open{
      padding:12px 20px;
      border-radius:16px;
      border:1px solid rgba(157,195,214,0.40);
      background:rgba(157,195,214,0.15);
      color:var(--ww-ink-strong);
      font:900 13px system-ui,-apple-system,"Segoe UI",sans-serif;
      white-space:nowrap;
      cursor:pointer;
      transition:transform 160ms ease, background 160ms ease, border-color 160ms ease;
    }

    .ww-open:hover{
      transform:translateY(-1px);
      background:rgba(157,195,214,0.22);
      border-color:rgba(157,195,214,0.60);
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
      height:100%;
      overflow:hidden;
      border-radius:1.75rem;
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
      inset:auto;
      width:7.6rem;
      height:7.6rem;
      border-radius:50%;
      background:radial-gradient(circle, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 40%, rgba(255,255,255,0.00) 70%);
      filter:blur(10px);
      z-index:0;
    }

    .ww-mini-logo-mark{
      width:5.8rem;
      height:5.8rem;
      border-radius:50%;
      display:flex;
      align-items:center;
      justify-content:center;
      position:relative;
      z-index:1;
      color:#fff;
      font-weight:900;
      letter-spacing:.08em;
      background:rgba(255,255,255,0.06);
      box-shadow:
        0 8px 12px rgba(0,0,0,0.35),
        0 2px 3px rgba(0,0,0,0.25);
    }

    .ww-mini-textnav{
      display:flex;
      flex-direction:column;
      gap:0.9rem;
      align-items:center;
    }

    .ww-mini-textlink{
      text-decoration:none;
      font-weight:900;
      font-size:0.78rem;
      letter-spacing:0.28em;
      text-transform:uppercase;
      color:#e3edf5;
      opacity:0.92;
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
      width:min(90vw, 1400px);
      max-height:90vh;
      object-fit:contain;
      cursor:pointer;
      border:0;
      background:none;
      padding:0;
      display:block;
    }

    .ww-clue-still img{
      width:100%;
      max-height:90vh;
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
      border-radius:0.9rem;
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
      letter-spacing:.04em;
      text-transform:uppercase;
      font-size:.76rem;
    }

    .ww-empty{
      width:100%;
      min-height:100%;
      display:flex;
      align-items:center;
      justify-content:center;
      text-align:center;
      padding:2rem;
      color:var(--ww-ink-strong);
      font-weight:700;
    }

    @media (max-width:980px){
      .ww-page{
        padding:0;
      }

      .ww-shell{
        height:100vh;
        border-radius:0;
      }

      .ww-content{
        grid-template-columns:1fr;
        gap:1rem;
        padding:1rem;
      }

      .ww-side{
        justify-content:flex-start;
      }

      .ww-clrow{
        flex-direction:column;
        height:auto;
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
      }

      .ww-back-btn{
        top:14px;
        left:14px;
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
              <img src="${clueImageUrl(clueId)}" alt="Clue ${escapeHtml(clueDisplayName(clueId))}">
            </div>
            <div class="ww-meta">
              <div class="ww-meta-copy">
                <div class="ww-kicker">CLUE</div>
                <div class="ww-num">${escapeHtml(clueDisplayName(clueId))}</div>
                <div class="ww-line"></div>
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
              <div class="ww-side-mark">WW</div>
              <div class="ww-side-divider"></div>
              <div class="ww-side-label">CLUE LIST</div>
            </button>
          </div>

          <div class="ww-main">
            <div class="ww-scroll">
              <section class="ww-wrap">
                <div class="ww-cllist">
                  <div class="ww-status">
                    <span>${escapeHtml(game.title || "WinterWord 2026")}</span>
                    <span>${clues.length} Clue${clues.length === 1 ? "" : "s"} Loaded</span>
                  </div>
                  ${items}
                </div>
              </section>
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
                <div class="ww-mini-logo-mark">WW</div>
              </div>

              <nav class="ww-mini-textnav">
                <button type="button" class="ww-mini-textlink" data-go-list>Clues</button>
                <button type="button" class="ww-mini-textlink" data-go-list>Back</button>
              </nav>
            </div>
          </aside>

          <main class="ww-right">
            <button type="button" class="ww-back-btn" data-go-list>← Back</button>

            <div class="ww-clue-stage">
              <button type="button" class="ww-clue-still" data-open-overlay aria-label="Open ${escapeHtml(clueTitle)}">
                <img src="${imageUrl}" alt="${escapeHtml(clueTitle)}">
              </button>
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
