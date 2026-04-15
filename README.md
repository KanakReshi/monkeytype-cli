# monkeytype-cli

A small terminal typing test inspired by Monkeytype.

Current modes:

- No punctuation, enabled by default and currently the only word mode
- Timed tests: `15` seconds or `30` seconds

## Run

```sh
npm start
```

Or after linking locally:

```sh
npm link
monkeytype-cli
```

You can choose a duration interactively, or pass it as an argument:

```sh
monkeytype-cli 15
monkeytype-cli --time 30
mt -t 15
```

During a test, type the words shown on screen. Use backspace to fix mistakes, `Ctrl+C` to quit, and `Esc` to end the test early.
