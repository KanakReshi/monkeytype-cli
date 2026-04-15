# monkeytype-cli

A tiny Monkeytype-inspired typing test that runs in your terminal.

It currently focuses on one clean practice mode: lowercase words with no punctuation. Pick a `15` or `30` second test, type the prompt, and get your WPM, raw WPM, accuracy, and error count when the timer ends.

## Features

- No-punctuation mode by default
- `15` second and `30` second timed tests
- Live correctness highlighting while you type
- Backspace support for fixing mistakes
- Results for WPM, raw WPM, accuracy, and errors
- No runtime dependencies

## Requirements

- Node.js `18` or newer
- An interactive terminal

## Quick Start

Run the CLI from the project directory:

```sh
npm start
```

You will be asked to choose a time mode:

```text
Choose time mode (15/30) [15]:
```

Press `Enter` to use the default `15` second mode.

## Commands

Pass the duration directly:

```sh
npm start -- 15
npm start -- 30
```

Link it locally if you want a real command on your machine:

```sh
npm link
```

Then run either binary:

```sh
monkeytype-cli 15
monkeytype-cli --time 30
mt -t 15
```

## Controls

| Key | Action |
| --- | --- |
| `Backspace` | Delete the previous character |
| `Esc` | End the test early and show results |
| `Ctrl+C` | Quit immediately |

## Scoring

`wpm` is based on correctly typed characters divided by five, normalized over the selected test duration.

`raw` is based on all typed characters divided by five, also normalized over the selected test duration.

`accuracy` is the percentage of typed characters that match the prompt.

`errors` is the number of typed characters that do not match the prompt.

## Project Structure

```text
.
├── package.json
├── README.md
└── src
    └── index.js
```

## Development

Check that the CLI parses correctly:

```sh
npm test
```

Run it directly while developing:

```sh
node src/index.js 15
```

## Current Scope

This project intentionally starts small:

- The only word mode is no punctuation.
- The only time modes are `15` and `30` seconds.
- There are no online accounts, leaderboards, themes, or config files yet.
