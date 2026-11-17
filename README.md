# uisdk-compare

Two small prototypes that do the same "update project settings" task:

- [`with-uisdk/`](./with-uisdk/) — form built with [UI SDK](https://ui-sdk.dev/docs) components, driven through `window.agent` (`snapshot`, `query`, `act`)
- [`without-uisdk/`](./without-uisdk/) — the same form in plain HTML, driven with Playwright locators

Read [`COMPARISON.md`](./COMPARISON.md) for what the library is, what it is not, line counts, and the real run outputs.

The same pages are on GitHub Pages: [https://baptistedumas.github.io/uisdk-compare/](https://baptistedumas.github.io/uisdk-compare/). Each page has a **Let the agent do it** button that runs the task in the browser, with about a second between steps, and a log of what it did. On the UI SDK page the log is the `snapshot()` and `act()` results. On the plain page it is DOM calls: `querySelector`, setting values, dispatching events, and a click. **Reset** puts the form back to Apollo and Europe.

```bash
# needs Node 18+ and Google Chrome
cd with-uisdk && npm install && npm run task
cd ../without-uisdk && npm install && npm run task
```

Vite `base` is set so the built apps load under `/uisdk-compare/with-uisdk/` and `/uisdk-compare/without-uisdk/`. Local dev uses those paths too:

- http://127.0.0.1:5173/uisdk-compare/with-uisdk/
- http://127.0.0.1:5174/uisdk-compare/without-uisdk/
