/* ============================================================
   MODULE: CLUE LIST PAGE
   ============================================================ */

function getClueRecords(clues) {
  return Array.isArray(clues) ? clues : [];
}

function getClueIdFromRecord(record, fallbackId) {
  if (
    record &&
    record.id !== undefined &&
    record.id !== null &&
    String(record.id).trim() !== ""
  ) {
    const parsed = Number(record.id);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return Number(fallbackId);
}

function renderClueList(game, clues) {
  const app = getApp();
  ensureStyles();

  const records = getClueRecords(clues);
  const total =
    records.length > 0
      ? records.length
      : Number(game && game.total_clues) > 0
      ? Number(game.total_clues)
      : 12;

  const items = [];

  for (let index = total - 1; index >= 0; index -= 1) {
    const record = records[index] || null;
    const clueId = getClueIdFromRecord(record, index + 1);

    items.push(`
<article class="ww-list-card" data-clue="${clueId}">
  <div class="ww-list-row">
    <div class="ww-list-thumb">
      <img src="${clueDisplayImageUrl(clueId)}" alt="Clue ${escapeHtml(clueDisplayName(clueId, record))}">
    </div>
    <div class="ww-list-meta">
      <div class="ww-list-copy">
        <div class="ww-kicker">CLUE</div>
        <div class="ww-list-title">${escapeHtml(clueDisplayName(clueId, record))}</div>
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
            <div class="ww-list-side-divider"></div>
            <button type="button" class="ww-list-side-link" data-base-station>BASE STATION</button>
          </nav>
        </div>
      </aside>
      <main class="ww-list-main">
        <div class="ww-list-scroll">
          <div class="ww-list-stack">
            <div class="ww-list-status">
              <span>${escapeHtml(`${total} Clue${total === 1 ? "" : "s"} Available`)}</span>
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

  const baseButtons = app.querySelectorAll("[data-base-station]");
  baseButtons.forEach((button) => {
    button.addEventListener("click", () => {
      renderClueList(game, clues);
    });
  });

  WW.currentView = { type: "list" };
}


























































































































































































































































































































/* ============================================================
   ENGINE CORE (DO NOT TOUCH)
   ============================================================ */

import { WW_CONFIG } from "./config.js";

const REPO_ROOT = "winterword";
const PUBLIC_ROOT = "/assets/winterword";

const IMAGE_BASE = `${PUBLIC_ROOT}/images`;
const AUDIO_BASE = `${PUBLIC_ROOT}/audio`;
const VIDEO_BASE = `${PUBLIC_ROOT}/videos`;
const API_BASE = `${PUBLIC_ROOT}/api`;
const DATA_BASE = `${PUBLIC_ROOT}/data`;

const APP_STYLE_ID = "ww-engine-styles";

const CONFIG = normalizeConfig(WW_CONFIG);

const WW = {
  boot: null,
  game: null,
  clues: [],
  answers: [],
  currentView: { type: "list" },
  repoRoot: REPO_ROOT,
  paths: {
    publicRoot: PUBLIC_ROOT,
    images: IMAGE_BASE,
    audio: AUDIO_BASE,
    videos: VIDEO_BASE,
    api: API_BASE,
    data: DATA_BASE
  }
};

function clueDisplayName(clueId, clueRecord) {
  if (clueRecord && typeof clueRecord.title === "string" && clueRecord.title.trim()) {
    return clueRecord.title.trim();
  }
  if (clueRecord && typeof clueRecord.name === "string" && clueRecord.name.trim()) {
    return clueRecord.name.trim();
  }
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

let bootStarted = false;

console.log("Engine loaded");
startBootstrap();

async function startBootstrap() {
  if (bootStarted) return;
  bootStarted = true;

  try {
    const boot = await fetchJSON(`${API_BASE}/bootstrap`);
    console.log("BOOTSTRAP:", boot);
    await start(boot);
  } catch (err) {
    console.error("BOOTSTRAP ERROR:", err);
    showError(formatErrorMessage("Bootstrap failed", err));
  }
}

function normalizeConfig(config) {
  return config && typeof config === "object" ? config : {};
}

function isAbsoluteUrl(value) {
  return /^https?:\/\//i.test(String(value || ""));
}

function stripLeadingSlash(value) {
  return String(value || "").replace(/^\//+, "");
}

function stripRepoRoot(value) {
  return String(value || "")
    .replace(/^\/?winterword\/?/i, "")
    .replace(/^\//+, "");
}

function joinPath(base, tail) {
  return `${String(base).replace(/\/+$/, "")}/${String(tail).replace(/^\//+, "")}`;
}

function normalizeAssetPath(inputPath, fallbackType) {
  const raw = String(inputPath || "").trim();
  if (!raw) return raw;

  if (isAbsoluteUrl(raw)) return raw;

  const clean = stripRepoRoot(raw);
  const lower = clean.toLowerCase();

  if (lower.startsWith("assets/winterword/")) {
    return `/${stripLeadingSlash(clean)}`;
  }

  if (lower.startsWith("images/")) {
    return joinPath(IMAGE_BASE, clean.slice("images/".length));
  }
  if (lower.startsWith("audio/")) {
    return joinPath(AUDIO_BASE, clean.slice("audio/".length));
  }
  if (lower.startsWith("videos/")) {
    return joinPath(VIDEO_BASE, clean.slice("videos/".length));
  }
  if (lower.startsWith("api/")) {
    return joinPath(API_BASE, clean.slice("api/".length));
  }
  if (lower.startsWith("games/")) {
    return joinPath(joinPath(DATA_BASE, "games"), clean.slice("games/".length));
  }
  if (lower.startsWith("clues/")) {
    return joinPath(joinPath(DATA_BASE, "clues"), clean.slice("clues/".length));
  }
  if (lower.startsWith("answers/")) {
    return joinPath(joinPath(DATA_BASE, "answers"), clean.slice("answers/".length));
  }

  if (fallbackType === "image") {
    return joinPath(IMAGE_BASE, stripLeadingSlash(clean));
  }
  if (fallbackType === "audio") {
    return joinPath(AUDIO_BASE, stripLeadingSlash(clean));
  }
  if (fallbackType === "video") {
    return joinPath(VIDEO_BASE, stripLeadingSlash(clean));
  }
  if (fallbackType === "api") {
    return joinPath(API_BASE, stripLeadingSlash(clean));
  }
  if (fallbackType === "game") {
    return joinPath(joinPath(DATA_BASE, "games"), stripLeadingSlash(clean));
  }
  if (fallbackType === "clue-data") {
    return joinPath(joinPath(DATA_BASE, "clues"), stripLeadingSlash(clean));
  }
  if (fallbackType === "answer-data") {
    return joinPath(joinPath(DATA_BASE, "answers"), stripLeadingSlash(clean));
  }

  return `/${stripLeadingSlash(clean)}`;
}

function normalizeBoot(boot) {
  if (!boot || typeof boot !== "object") {
    throw new Error("Bootstrap payload is missing or invalid.");
  }

  const normalized = { ...boot };

  if (normalized.game_file) {
    normalized.game_file = normalizeAssetPath(normalized.game_file, "game");
  }
  if (normalized.api_endpoint) {
    normalized.api_endpoint = normalizeAssetPath(normalized.api_endpoint, "api");
  }
  if (normalized.audio_base) {
    normalized.audio_base = normalizeAssetPath(normalized.audio_base, "audio");
  }
  if (normalized.video_base) {
    normalized.video_base = normalizeAssetPath(normalized.video_base, "video");
  }
  if (normalized.image_base) {
    normalized.image_base = normalizeAssetPath(normalized.image_base, "image");
  }

  if (!normalized.game_file) {
    throw new Error("Bootstrap payload is missing game_file.");
  }

  return normalized;
}

function normalizeGame(game) {
  if (!game || typeof game !== "object") {
    throw new Error("Game payload is missing or invalid.");
  }

  const normalized = { ...game };

  if (normalized.clues) {
    normalized.clues = normalizeAssetPath(normalized.clues, "clue-data");
  }
  if (normalized.answers) {
    normalized.answers = normalizeAssetPath(normalized.answers, "answer-data");
  }
  if (normalized.image) {
    normalized.image = normalizeAssetPath(normalized.image, "image");
  }
  if (normalized.audio) {
    normalized.audio = normalizeAssetPath(normalized.audio, "audio");
  }
  if (normalized.video) {
    normalized.video = normalizeAssetPath(normalized.video, "video");
  }

  return normalized;
}

async function fetchJSON(path, options) {
  const resolvedPath = normalizeAssetPath(path);
  if (!resolvedPath) {
    throw new Error("Missing JSON path.");
  }

  let res;
  try {
    res = await fetch(resolvedPath, options);
  } catch (err) {
    throw new Error(
      `Network error loading ${resolvedPath}: ${
        err && err.message ? err.message : "Unknown network error"
      }`
    );
  }

  if (!res.ok) {
    throw new Error(
      `Failed to load ${resolvedPath} (${res.status} ${res.statusText})`
    );
  }

  const contentType = res.headers.get("content-type") || "";
  const text = await res.text();

  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error(
      `Expected JSON from ${resolvedPath}, got ${
        contentType || "unknown content type"
      }: ${text.slice(0, 160)}`
    );
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(
      `Invalid JSON from ${resolvedPath}: ${
        err && err.message ? err.message : "Parse error"
      }`
    );
  }
}

function loadBootstrap(boot) {
  const normalized = normalizeBoot(boot);
  console.log("Bootstrap OK:", normalized);
  return normalized;
}

async function loadGame(boot) {
  const path = normalizeAssetPath(boot.game_file, "game");
  console.log("Loading game:", path);
  const game = normalizeGame(await fetchJSON(path));
  console.log("Game OK:", game);
  return game;
}

async function loadClues(game) {
  if (!game.clues) {
    console.log("No clues path found in game payload.");
    return [];
  }

  const path = normalizeAssetPath(game.clues, "clue-data");
  console.log("Loading clues:", path);

  const clues = await fetchJSON(path);
  if (!Array.isArray(clues)) {
    throw new Error("Clues payload must be an array.");
  }

  console.log("Clues OK:", clues);
  return clues;
}

async function loadAnswers(game) {
  if (!game.answers) {
    console.log("No answers path found in game payload.");
    return [];
  }

  const path = normalizeAssetPath(game.answers, "answer-data");
  console.log("Loading answers:", path);

  const answers = await fetchJSON(path);
  if (!Array.isArray(answers)) {
    throw new Error("Answers payload must be an array.");
  }

  console.log("Answers OK:", answers);
  return answers;
}

function getApp() {
  const app =
    document.querySelector("[data-ww-app-root]") ||
    document.getElementById("app");

  if (!app) {
    throw new Error("Missing app container ([data-ww-app-root] or #app).");
  }

  return app;
}

function padClueId(value) {
  return String(value).padStart(2, "0");
}

function getImageBase() {
  return (WW.boot && WW.boot.image_base) || CONFIG.imageBase || IMAGE_BASE;
}

function clueImageUrl(clueId) {
  const padded = padClueId(clueId);
  const extension = padded === "12" ? "gif" : "png";
  return `${getImageBase()}/clues/${padded}.${extension}`;
}

function clueDisplayImageUrl(clueId) {
  const padded = padClueId(clueId);
  return `${getImageBase()}/clues/display/${padded}.png`;
}

function logoUrl() {
  return `${getImageBase()}/ui/logo.png`;
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

  style.textContent = `/* (all your CSS stays exactly the same) */`;

  document.head.appendChild(style);
}

function formatErrorMessage(prefix, err) {
  const base = err && err.message ? err.message : String(err || "Unknown error");
  return `${prefix}\n${base}`;
}

function showError(message) {
  let app;

  try {
    app = getApp();
  } catch (rootErr) {
    console.error("ERROR UI FAILED:", rootErr);
    document.body.innerHTML = `<pre style="padding:16px;color:#fff;background:#000;white-space:pre-wrap;">${escapeHtml(
      formatErrorMessage(message, rootErr)
    )}</pre>`;
    return;
  }

  ensureStyles();

  app.innerHTML = `
<div class="ww-page">
  <div class="ww-empty">${escapeHtml(message)}</div>
</div>
`;
}

async function start(boot) {
  try {
    const normalizedBoot = loadBootstrap(boot);
    const game = await loadGame(normalizedBoot);
    const clues = await loadClues(game);
    const answers = await loadAnswers(game);

    WW.boot = normalizedBoot;
    WW.game = game;
    WW.clues = clues;
    WW.answers = answers;

    // Call your active module here:
    renderClueList(game, clues);

    console.log("ENGINE READY");
  } catch (err) {
    console.error("ENGINE ERROR:", err);
    showError(formatErrorMessage("Engine failed to start", err));
  }
}
