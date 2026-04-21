#!/usr/bin/env node

const readline = require("node:readline");

const WORDS = [
  "about", "after", "again", "air", "also", "always", "animal", "answer", "around", "ask",
  "back", "because", "before", "begin", "better", "between", "big", "book", "both", "bring",
  "call", "came", "change", "city", "come", "common", "complete", "could", "country", "course",
  "day", "different", "does", "done", "down", "during", "each", "early", "earth", "enough",
  "every", "example", "eye", "face", "family", "far", "father", "feel", "few", "find",
  "first", "follow", "food", "form", "found", "four", "friend", "from", "give", "good",
  "great", "group", "grow", "hand", "hard", "have", "head", "hear", "help", "here",
  "high", "home", "house", "idea", "important", "keep", "kind", "know", "large", "last",
  "late", "learn", "leave", "left", "letter", "life", "light", "line", "little", "long",
  "look", "made", "make", "many", "mean", "might", "mile", "miss", "mother", "move",
  "much", "must", "name", "near", "need", "never", "next", "night", "number", "often",
  "once", "only", "open", "order", "other", "over", "own", "page", "paper", "part",
  "people", "place", "plant", "play", "point", "press", "put", "read", "real", "right",
  "river", "room", "same", "school", "second", "sentence", "set", "should", "show", "side",
  "small", "something", "sound", "spell", "still", "story", "study", "such", "system", "take",
  "talk", "tell", "than", "their", "them", "then", "there", "these", "thing", "think",
  "three", "through", "time", "together", "too", "tree", "turn", "under", "until", "very",
  "walk", "want", "water", "well", "went", "were", "what", "where", "while", "white",
  "will", "with", "without", "word", "work", "world", "would", "write", "year", "young"
];

const VALID_DURATIONS = new Set([15, 30]);
const DEFAULT_DURATION = 15;
const WORD_COUNT = 80;

const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  gray: "\x1b[90m",
  yellow: "\x1b[33m"
};

const state = {
  duration: DEFAULT_DURATION,
  target: "",
  input: "",
  startedAt: null,
  finished: false,
  timer: null,
  tick: null,
  hasRendered: false
};

function parseDuration(argv) {
  const timeFlagIndex = argv.findIndex((arg) => arg === "--time" || arg === "-t");
  const value = timeFlagIndex >= 0 ? argv[timeFlagIndex + 1] : argv[2];
  const duration = Number(value);

  if (!value) {
    return null;
  }

  if (VALID_DURATIONS.has(duration)) {
    return duration;
  }

  console.error("Time mode must be 15 or 30 seconds.");
  process.exit(1);
}

function randomWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

function buildTargetText() {
  return Array.from({ length: WORD_COUNT }, randomWord).join(" ");
}

function hideCursor() {
  process.stdout.write("\x1b[?25l");
}

function showCursor() {
  process.stdout.write("\x1b[?25h");
}

function resetRenderPosition() {
  state.hasRendered = false;
}

function renderHeader() {
  return [
    `${colors.cyan}${colors.bold}+------------------------------------------------------------+${colors.reset}`,
    `${colors.cyan}${colors.bold}|${colors.reset} ${colors.yellow}${colors.bold} __  __             _              _                    ${colors.reset}${colors.cyan}${colors.bold}|${colors.reset}`,
    `${colors.cyan}${colors.bold}|${colors.reset} ${colors.yellow}${colors.bold}|  \\/  | ___  _ __ | | _____ _   _| |_ _   _ _ __   ___ ${colors.reset}${colors.cyan}${colors.bold}|${colors.reset}`,
    `${colors.cyan}${colors.bold}|${colors.reset} ${colors.yellow}${colors.bold}| |\\/| |/ _ \\| '_ \\| |/ / _ \\ | | | __| | | | '_ \\ / _ \\${colors.reset}${colors.cyan}${colors.bold}|${colors.reset}`,
    `${colors.cyan}${colors.bold}|${colors.reset} ${colors.yellow}${colors.bold}| |  | | (_) | | | |   <  __/ |_| | |_| |_| | |_) |  __/${colors.reset}${colors.cyan}${colors.bold}|${colors.reset}`,
    `${colors.cyan}${colors.bold}|${colors.reset} ${colors.yellow}${colors.bold}|_|  |_|\\___/|_| |_|_|\\_\\___|\\__, |\\__|\\__, | .__/ \\___|${colors.reset}${colors.cyan}${colors.bold}|${colors.reset}`,
    `${colors.cyan}${colors.bold}|${colors.reset} ${colors.yellow}${colors.bold}                             |___/     |___/|_|        ${colors.reset}${colors.cyan}${colors.bold}|${colors.reset}`,
    `${colors.cyan}${colors.bold}|${colors.reset} ${colors.blue}${colors.bold}CLI${colors.reset} ${colors.gray}terminal typing sprint // no punctuation // stay sharp${colors.reset} ${colors.cyan}${colors.bold}|${colors.reset}`,
    `${colors.cyan}${colors.bold}+------------------------------------------------------------+${colors.reset}`
  ].join("\n");
}

function secondsRemaining() {
  if (!state.startedAt) {
    return state.duration;
  }

  const elapsed = Math.floor((Date.now() - state.startedAt) / 1000);
  return Math.max(0, state.duration - elapsed);
}

function calculateStats() {
  const elapsedMs = state.startedAt ? Date.now() - state.startedAt : state.duration * 1000;
  const minutes = Math.max(elapsedMs, state.duration * 1000) / 60000;
  let correctChars = 0;

  for (let index = 0; index < state.input.length; index += 1) {
    if (state.input[index] === state.target[index]) {
      correctChars += 1;
    }
  }

  const errors = Math.max(0, state.input.length - correctChars);
  const accuracy = state.input.length === 0 ? 100 : Math.round((correctChars / state.input.length) * 100);
  const wpm = Math.round(correctChars / 5 / minutes);
  const rawWpm = Math.round(state.input.length / 5 / minutes);

  return { accuracy, errors, rawWpm, wpm };
}

function renderTarget() {
  const chars = [];

  for (let index = 0; index < state.target.length; index += 1) {
    const expected = state.target[index];
    const actual = state.input[index];

    if (actual == null) {
      chars.push(expected);
    } else if (actual === expected) {
      chars.push(`\x1b[32m${expected}\x1b[0m`);
    } else {
      chars.push(`\x1b[31m${expected === " " ? "_" : expected}\x1b[0m`);
    }
  }

  return chars.join("");
}

function render() {
  const clearSequence = state.hasRendered ? "\x1b[H\x1b[J" : "\x1b[2J\x1b[H";
  const output = [
    renderHeader(),
    `mode: no punctuation | time: ${state.duration}s | remaining: ${secondsRemaining()}s`,
    "",
    renderTarget(),
    "",
    state.input || "Start typing...",
    "",
    "Backspace fixes mistakes. Tab restarts. Esc ends early. Ctrl+C quits."
  ].join("\n");

  process.stdout.write(`${clearSequence}${output}`);
  state.hasRendered = true;
}

function stopTimers() {
  clearTimeout(state.timer);
  clearInterval(state.tick);
  state.timer = null;
  state.tick = null;
}

function cleanup() {
  stopTimers();
  showCursor();

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }

  process.stdin.pause();
}

function finish() {
  if (state.finished) {
    return;
  }

  state.finished = true;
  stopTimers();
  showCursor();
  resetRenderPosition();

  const stats = calculateStats();
  const output = [
    renderHeader(),
    "",
    `${colors.bold}${colors.green}Result${colors.reset}`,
    `mode: no punctuation | time: ${state.duration}s`,
    "",
    `wpm: ${stats.wpm}`,
    `raw: ${stats.rawWpm}`,
    `accuracy: ${stats.accuracy}%`,
    `errors: ${stats.errors}`,
    "",
    "Tab restarts. Ctrl+C quits."
  ].join("\n");

  process.stdout.write(`\x1b[2J\x1b[H${output}\n`);
}

function restartTest() {
  stopTimers();
  state.target = buildTargetText();
  state.input = "";
  state.startedAt = null;
  state.finished = false;
  resetRenderPosition();
  hideCursor();
  render();
}

function startTimer() {
  if (state.startedAt) {
    return;
  }

  state.startedAt = Date.now();
  state.timer = setTimeout(finish, state.duration * 1000);
  state.tick = setInterval(render, 250);
}

function handleKeypress(sequence, key) {
  if (key?.ctrl && key.name === "c") {
    cleanup();
    process.exit(0);
  }

  if (key?.name === "escape") {
    finish();
    return;
  }

  if (key?.name === "tab") {
    restartTest();
    return;
  }

  if (state.finished) {
    return;
  }

  if (key?.name === "backspace") {
    startTimer();
    state.input = state.input.slice(0, -1);
    render();
    return;
  }

  if (key?.name === "return") {
    return;
  }

  if (sequence.length === 1 && sequence >= " " && sequence <= "~") {
    startTimer();
    state.input += sequence;

    if (state.input.length >= state.target.length) {
      finish();
      return;
    }

    render();
  }
}

function askDuration() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(`Choose time mode (15/30) [${DEFAULT_DURATION}]: `, (answer) => {
      rl.close();

      if (!answer.trim()) {
        resolve(DEFAULT_DURATION);
        return;
      }

      const duration = Number(answer.trim());
      if (!VALID_DURATIONS.has(duration)) {
        console.log("Invalid time mode. Using 15 seconds.");
        resolve(DEFAULT_DURATION);
        return;
      }

      resolve(duration);
    });
  });
}

async function main() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.error("monkeytype-cli needs an interactive terminal.");
    process.exit(1);
  }

  process.stdout.write(`\x1b[2J\x1b[H${renderHeader()}\n\n`);
  state.duration = parseDuration(process.argv) ?? await askDuration();
  state.target = buildTargetText();

  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on("keypress", handleKeypress);

  hideCursor();
  render();
}

main().catch((error) => {
  cleanup();
  console.error(error);
  process.exit(1);
});
