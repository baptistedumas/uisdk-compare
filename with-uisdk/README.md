# Project Settings — with UI SDK

A small Vite + React form built with [UI SDK](https://ui-sdk.dev/docs) components (`Input`, `Select`, `Button`) and the agent bridge (`createAgent`).

The demo task is: read the form, list the Region choices, rename the project from Apollo to Atlas, switch the region from Europe to North America, and press Save.

The runner does **not** click CSS selectors. It calls the page's `window.agent` API:

- `snapshot()` — list components, current values, and supported actions
- `query({ within: "Region" })` — list select choices without opening the popup
- `act({ steps })` — `setValue` / `press` by accessible name

No API key is required. The optional WebMCP registration (`registerTools`) only activates in a browser that provides `document.modelContext` (for example ChatGPT's built-in browser). Regular Chrome ignores it. This runner talks to the bridge directly.

## Docs used

- [Get started (agent bridge)](https://ui-sdk.dev/docs/agents/connect-an-agent)
- [Guide (Vite + Select)](https://ui-sdk.dev/docs/agents/connect-an-agent/guide)
- [Reference](https://ui-sdk.dev/docs/agents/connect-an-agent/reference)

## Run

Needs Node 18+ and Google Chrome (used headless via Playwright's `channel: "chrome"`).

```bash
npm install
npm run task
```

That starts Vite on http://127.0.0.1:5173, runs the task in headless Chrome, prints the bridge output, and shuts everything down.

To click around yourself:

```bash
npm run dev
```

Open http://127.0.0.1:5173/uisdk-compare/with-uisdk/ (the Vite `base` used on GitHub Pages). **Let the agent do it** calls `snapshot()` and then `act()` one step at a time, and writes each result into the log. **Reset** restores Apollo and Europe.

Then in the browser console:

```js
window.agent.snapshot()
await window.agent.query({ within: "Region" })
await window.agent.act({
  steps: [
    { ref: "Project name", action: "setValue", args: ["Atlas"] },
    { ref: "Region", action: "setValue", args: ["north-america"] },
    { ref: "Save", action: "press" },
  ],
})
```
