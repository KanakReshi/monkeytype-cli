#!/usr/bin/env node

const readline = require("node:readline");

/*
 * This file is the whole CLI app:
 * 1. Choose a time mode.
 * 2. Generate random words.
 * 3. Read each keypress.
 * 4. Render the typing test.
 * 5. Show final stats.
 */

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
const TARGET_WORD_COUNT = 80;

const ANSI = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  gray: "\x1b[90m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  clearScreen: "\x1b[2J\x1b[H",
  clearFromTop: "\x1b[H\x1b[J",
  hideCursor: "\x1b[?25l",
  showCursor: "\x1b[?25h"
};

const testState = {
  duration: DEFAULT_DURATION,
  targetText: "",
  typedText: "",
  startedAt: null,
  finished: false,
  finishTimer: null,
  renderTimer: null,
  hasRendered: false,
  errorCount: 0
};

function color(text, ...styles) {
  return `${styles.join("")}${text}${ANSI.reset}`;
}

function parseDurationFromArgs(argv) {
  const timeFlagIndex = argv.findIndex((arg) => arg === "--time" || arg === "-t");
  const value = timeFlagIndex >= 0 ? argv[timeFlagIndex + 1] : argv[2];

  if (!value) {
    return null;
  }

  const duration = Number(value);

  if (VALID_DURATIONS.has(duration)) {
    return duration;
  }

  console.error("Time mode must be 15 or 30 seconds.");
  process.exit(1);
}

function getRandomWord() {
  const randomIndex = Math.floor(Math.random() * WORDS.length);
  return WORDS[randomIndex];
}

function buildTargetText() {
  return Array.from({ length: TARGET_WORD_COUNT }, getRandomWord).join(" ");
}

function writeToTerminal(text) {
  process.stdout.write(text);
}

function hideCursor() {
  writeToTerminal(ANSI.hideCursor);
}

function showCursor() {
  writeToTerminal(ANSI.showCursor);
}

function resetRenderPosition() {
  testState.hasRendered = false;
}

function renderHeader() {
  const border = color("+------------------------------------------------------------+", ANSI.cyan, ANSI.bold);
  const edge = color("|", ANSI.cyan, ANSI.bold);
  const title = (text) => color(text, ANSI.yellow, ANSI.bold);

  return [
    border,
    `${edge} ${title(" __  __             _              _                    ")}   ${edge}`,
    `${edge} ${title("|  \\/  | ___  _ __ | | _____ _   _| |_ _   _ _ __   ___ ")}   ${edge}`,
    `${edge} ${title("| |\\/| |/ _ \\| '_ \\| |/ / _ \\ | | | __| | | | '_ \\ / _ \\")}   ${edge}`,
    `${edge} ${title("| |  | | (_) | | | |   <  __/ |_| | |_| |_| | |_) |  __/")}   ${edge}`,
    `${edge} ${title("|_|  |_|\\___/|_| |_|_|\\_\\___|\\__, |\\__|\\__, | .__/ \\___|")}   ${edge}`,
    `${edge} ${title("                             |___/     |___/|_|        ")}    ${edge}`,
    `${edge} ${color("CLI", ANSI.blue, ANSI.bold)} ${color("terminal typing sprint // no punctuation // stay sharp", ANSI.gray)} ${edge}`,
    border
  ].join("\n");
}

function getSecondsRemaining() {
  if (!testState.startedAt) {
    return testState.duration;
  }

  const elapsedSeconds = Math.floor((Date.now() - testState.startedAt) / 1000);
  return Math.max(0, testState.duration - elapsedSeconds);
}

function countCorrectCharacters() {
  let correctCharacters = 0;

  for (let index = 0; index < testState.typedText.length; index += 1) {
    if (testState.typedText[index] === testState.targetText[index]) {
      correctCharacters += 1;
    }
  }

  return correctCharacters;
}

function calculateStats() {
  const elapsedMs = testState.startedAt ? Date.now() - testState.startedAt : testState.duration * 1000;
  const scoringMs = Math.max(elapsedMs, testState.duration * 1000);
  const minutes = scoringMs / 60000;
  const correctCharacters = countCorrectCharacters();
  const typedCharacters = testState.typedText.length;
  const errors = testState.errorCount;
  const accuracy = typedCharacters === 0 ? 100 : Math.round((correctCharacters / typedCharacters) * 100);
  const wpm = Math.round(correctCharacters / 5 / minutes);
  const rawWpm = Math.round(typedCharacters / 5 / minutes);

  return { accuracy, errors, rawWpm, wpm };
}

function renderTargetText() {
  const visibleCharacters = [];

  for (let index = 0; index < testState.targetText.length; index += 1) {
    const expectedCharacter = testState.targetText[index];
    const typedCharacter = testState.typedText[index];

    if (typedCharacter == null) {
      visibleCharacters.push(expectedCharacter);
    } else if (typedCharacter === expectedCharacter) {
      visibleCharacters.push(color(expectedCharacter, ANSI.green));
    } else {
      const visibleMistake = expectedCharacter === " " ? "_" : expectedCharacter;
      visibleCharacters.push(color(visibleMistake, ANSI.red));
    }
  }

  return visibleCharacters.join("");
}

function renderTestScreen() {
  const clearSequence = testState.hasRendered ? ANSI.clearFromTop : ANSI.clearScreen;
  const typedLine = testState.typedText || "Start typing...";
  const output = [
    renderHeader(),
    `mode: no punctuation | time: ${testState.duration}s | remaining: ${getSecondsRemaining()}s`,
    "",
    renderTargetText(),
    "",
    typedLine,
    "",
    "Backspace fixes mistakes. Tab restarts. Esc ends early. Ctrl+C quits."
  ].join("\n");

  writeToTerminal(`${clearSequence}${output}`);
  testState.hasRendered = true;
}

function stopTimers() {
  clearTimeout(testState.finishTimer);
  clearInterval(testState.renderTimer);
  testState.finishTimer = null;
  testState.renderTimer = null;
}

function cleanupTerminal() {
  stopTimers();
  showCursor();

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false);
  }

  process.stdin.pause();
}

function finishTest() {
  if (testState.finished) {
    return;
  }

  testState.finished = true;
  stopTimers();
  showCursor();
  resetRenderPosition();

  const stats = calculateStats();
  const output = [
    renderHeader(),
    "",
    color("Result", ANSI.bold, ANSI.green),
    `mode: no punctuation | time: ${testState.duration}s`,
    "",
    `wpm: ${stats.wpm}`,
    `raw: ${stats.rawWpm}`,
    `accuracy: ${stats.accuracy}%`,
    `errors: ${stats.errors}`,
    "",
    "Tab restarts. Ctrl+C quits."
  ].join("\n");

  writeToTerminal(`${ANSI.clearScreen}${output}\n`);
}

function restartTest() {
  stopTimers();
  testState.targetText = buildTargetText();
  testState.typedText = "";
  testState.startedAt = null;
  testState.finished = false;
  testState.errorCount = 0;
  resetRenderPosition();
  hideCursor();
  renderTestScreen();
}

function startTimerIfNeeded() {
  if (testState.startedAt) {
    return;
  }

  testState.startedAt = Date.now();
  testState.finishTimer = setTimeout(finishTest, testState.duration * 1000);
  testState.renderTimer = setInterval(renderTestScreen, 250);
}

function isPrintableCharacter(sequence) {
  return sequence.length === 1 && sequence >= " " && sequence <= "~";
}

function handleKeypress(sequence, key) {
  if (key?.ctrl && key.name === "c") {
    cleanupTerminal();
    process.exit(0);
  }

  if (key?.name === "escape") {
    finishTest();
    return;
  }

  if (key?.name === "tab") {
    restartTest();
    return;
  }

  if (testState.finished) {
    return;
  }

  if (key?.name === "backspace") {
    startTimerIfNeeded();
    testState.typedText = testState.typedText.slice(0, -1);
    renderTestScreen();
    return;
  }

  if (key?.name === "return") {
    return;
  }

  if (isPrintableCharacter(sequence)) {
    startTimerIfNeeded();
    const currentIndex = testState.typedText.length;
    if (sequence !== testState.targetText[currentIndex]) {
      testState.errorCount += 1;
    }
    testState.typedText += sequence;

    if (testState.typedText.length >= testState.targetText.length) {
      finishTest();
      return;
    }

    renderTestScreen();
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

      const trimmedAnswer = answer.trim();

      if (!trimmedAnswer) {
        resolve(DEFAULT_DURATION);
        return;
      }

      const duration = Number(trimmedAnswer);

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

  writeToTerminal(`${ANSI.clearScreen}${renderHeader()}\n\n`);
  testState.duration = parseDurationFromArgs(process.argv) ?? await askDuration();
  testState.targetText = buildTargetText();

  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on("keypress", handleKeypress);

  hideCursor();
  renderTestScreen();
}

main().catch((error) => {
  cleanupTerminal();
  console.error(error);
  process.exit(1);  
});
