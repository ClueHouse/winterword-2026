import { WW_CONFIG } from "./config.js";

console.log("Engine loaded");

fetch("/api/bootstrap", { method: "POST" })
  .then(r => r.json())
  .then(boot => {
    start(boot);
  })
  .catch(err => console.error("BOOTSTRAP ERROR:", err));

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

function renderClueList(game, clues) {
  const app = document.getElementById("app");
  if (!app) throw new Error("Missing #app container");
  if (!Array.isArray(clues) || clues.length === 0) {
    throw new Error("No clues found");
  }

  const items = clues.map(clue => {
    return `
      <li>
        <strong>${clue.title}</strong><br>
        <span>${clue.content}</span>
      </li>
    `;
  }).join("");

  app.innerHTML = `
    <main>
      <h1>${game.title}</h1>
      <h2>Clue List</h2>
      <ol>
        ${items}
      </ol>
    </main>
  `;
}

async function start(boot) {
  try {
    await loadBootstrap(boot);

    const game = await loadGame(boot);
    const clues = await loadClues(game);
    await loadAnswers(game);

    renderClueList(game, clues);

    console.log("ENGINE READY");
  } catch (err) {
    console.error("ENGINE ERROR:", err);
  }
}
