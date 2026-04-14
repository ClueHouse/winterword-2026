// --- ENGINE CORE -------------------------------------------------------------

import { WW_CONFIG } from "./config.js";

console.log("Engine loaded");

// --- BOOTSTRAP FETCH ---------------------------------------------------------

fetch("/bootstrap", { method: "POST" })
  .then(r => r.json())
  .then(boot => {
    start(boot);
  })
  .catch(err => console.error("BOOTSTRAP ERROR:", err));

// Utility: fetch JSON with error handling
async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error("Failed to load " + path);
  return await res.json();
}

// Step 1: load bootstrap
async function loadBootstrap(boot) {
  console.log("Bootstrap OK:", boot);
  return boot;
}

// Step 2: load game definition (from bootstrap)
async function loadGame(boot) {
  const path = boot.game_file;
  console.log("Loading game:", path);
  const game = await loadJSON(path);
  console.log("Game OK:", game);
  return game;
}

// Step 3: load clues
async function loadClues(game) {
  console.log("Loading clues:", game.clues);
  const clues = await loadJSON(game.clues);
  console.log("Clues OK:", clues);
  return clues;
}

// Step 4: load answers
async function loadAnswers(game) {
  console.log("Loading answers:", game.answers);
  const answers = await loadJSON(game.answers);
  console.log("Answers OK:", answers);
  return answers;
}

// --- MAIN ENGINE FLOW --------------------------------------------------------

async function start(boot) {
  try {
    await loadBootstrap(boot);

    const game = await loadGame(boot);
    await loadClues(game);
    await loadAnswers(game);

    console.log("ENGINE READY");
  } catch (err) {
    console.error("ENGINE ERROR:", err);
  }
}
