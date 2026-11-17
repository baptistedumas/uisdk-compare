# What UI SDK actually does — a side-by-side prototype

Two throwaway Vite + React + TypeScript apps do the **same task**. One is built with [UI SDK](https://ui-sdk.dev/docs) and driven through its agent bridge. The other is plain HTML driven with Playwright. Both were installed and run on this machine (headless Chrome). Nothing below is invented.

## Which "uisdk" is this?

Several projects use a similar name, including Formant's `@formant/ui-sdk`, Seekora's `@seekora-ai/ui-sdk-*`, GoodData.UI, Webitel's `@webitel/ui-sdk`, and Alteryx's AYX UI SDK. Those are ordinary product UI toolkits.

The one that matches "it seems to ease browsing for AI" is **Vercel Labs' UI SDK** (beta, first published 12 November 2026):

- Docs: https://ui-sdk.dev/docs
- Agent bridge: https://ui-sdk.dev/docs/agents/connect-an-agent
- Guide: https://ui-sdk.dev/docs/agents/connect-an-agent/guide
- Reference: https://ui-sdk.dev/docs/agents/connect-an-agent/reference
- Introducing post: https://ui-sdk.dev/docs/core/changelog/introducing-ui-sdk
- GitHub: https://github.com/vercel-labs/ui
- npm: `@ui-sdk/react` and `@ui-sdk/core` (this prototype used `0.1.0-beta.6`)

It is a TypeScript library of UI **behaviors** (keyboard, focus, selection, popups, ARIA) plus ready-made unstyled components for React, Vue, Svelte, Solid, and Web Components. It is also built so an **agent can use** the finished UI.

Important correction: it does **not** help an agent browse arbitrary websites (Wikipedia, a random shop, and so on). The bridge only sees components built with UI SDK on a page you control. That is why this comparison uses two local apps with no login, not a public third-party site.

No API key or paid service is required for the bridge itself. Optional [WebMCP](https://ui-sdk.dev/docs/agents/connect-an-agent/webmcp) registration (`registerTools`) publishes `snapshot`, `query`, and `act` to a browser that implements `document.modelContext` (for example ChatGPT's built-in browser). In regular Chrome it is a no-op. This demo calls `window.agent` directly.

## The task

On a "Project Settings" page that starts as:

- Project name: **Apollo**
- Region: **Europe** (choices: Europe, North America, Asia Pacific)
- Save has not been pressed

do this:

1. Read the current values.
2. List the region choices.
3. Rename the project to **Atlas**.
4. Change the region to **North America**.
5. Press **Save**.
6. Confirm the page shows `Saved: Atlas · North America`.

This is the same kind of form as the official agent guide (a labeled Select, plus the official Input + `setValue` example).

## What UI SDK handles for you

In `with-uisdk/`, the page creates a bridge once:

```ts
import { createAgent } from "@ui-sdk/react/agent"
const agent = createAgent()
```

After the components mount, an agent (or our script) can:

- **`snapshot()`** — get a structured list of components, their accessible names, current values, and allowed actions (`setValue`, `press`, …). You do not parse the DOM or a screenshot.
- **`query({ within: "Region" })`** — list a Select's choices. If the Select is given an `items` prop, this works **without opening the popup**.
- **`act({ steps })`** — call those actions by label or `ref`, for example `{ ref: "Project name", action: "setValue", args: ["Atlas"] }`. The change goes through the component API (and `onValueChange` with `details.source === "agent"`), not through key-by-key typing.

Permissions (`allow` on `createAgent`, plus change callbacks) can refuse or cancel a step. This demo does not restrict actions.

In `without-uisdk/`, none of that exists. Playwright must find each control in the DOM (`getByLabel`, `getByRole`), fill or `selectOption`, and click. That is simple here because the baseline uses a native `<select>`. A custom popup list (the kind UI SDK's Select actually is) would need extra steps: open the list, then click an option, and hope the markup is stable.

## Line counts and complexity

Counts are source only (comments included), excluding `node_modules`, lockfiles, and identical CSS (165 lines in both). The in-page demo button and log are included in `src/App.tsx`.

| File | with UI SDK | without UI SDK |
| --- | ---: | ---: |
| `src/App.tsx` | 216 | 212 |
| `src/agent.ts` | 19 | — |
| `src/main.tsx` | 13 | 10 |
| `scripts/run-task.mjs` | 67 | 79 |
| **Total of the above** | **315** | **301** |

The UI SDK **app** is a bit longer because a Select is assembled from parts (`Select`, `SelectLabel`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`) and because the page must start the bridge before render.

The **task logic** is not dramatically shorter either. Once the browser is open, the UI SDK runner is essentially three calls (`snapshot`, `query`, `act`). The Playwright runner is three locators (`getByLabel` / `selectOption` / `getByRole`). For this small native form, both are easy to read.

The difference is the **shape of the API**, not raw line count:

- UI SDK speaks in components, labels, and actions. The snapshot is something you could hand to a language model as a tool result.
- Playwright speaks in the DOM. You choose locators. You do not get a ready-made component inventory, and a custom widget is more work than a native `<select>`.

UI SDK also has a second job this comparison only touches lightly: it is a **component/behavior library** for *building* interfaces (including by coding agents). The agent bridge is the part that helps an agent *use* those interfaces.

## What each approach is good at

**UI SDK (with the bridge)** is a good fit when:

- You are building the app, not scraping someone else's site.
- You want agents to operate forms through a stable, permissioned API (`setValue`, `press`) instead of CSS selectors or screenshots.
- Lists should be readable without opening popups (`items` + `query`).
- You may later expose the same tools to a browser agent via WebMCP.

**Playwright / raw DOM** is a good fit when:

- The page is not yours, or is not built with UI SDK — this is the only option for general web browsing.
- You already have a test or automation suite and accessible names (`getByLabel`, `getByRole`).
- The UI is simple native controls, where Playwright is already short and reliable.

## Actual run outputs

Both commands were run on this box with headless Google Chrome, Playwright `channel: "chrome"`. No output was fabricated.

### `with-uisdk/` — `npm run task`

`snapshot()` returned three components (the Field wrapper is not listed as its own component):

```json
[
  {
    "ref": "c1",
    "component": "input",
    "actions": ["setValue", "clear"],
    "label": "Project name",
    "value": "Apollo"
  },
  {
    "ref": "c3",
    "component": "select",
    "actions": ["setOpen", "setValue", "clear", "setQuery"],
    "label": "Region",
    "open": false,
    "value": "europe",
    "query": "",
    "items": [
      { "value": "europe", "label": "Europe" },
      { "value": "north-america", "label": "North America" },
      { "value": "asia-pacific", "label": "Asia Pacific" }
    ]
  },
  {
    "ref": "c4",
    "component": "button",
    "actions": ["press"],
    "label": "Save"
  }
]
```

`query({ within: "Region" })` returned the same Region select and its three `items`, with `"open": false`.

`act(...)` returned:

```json
{
  "ok": true,
  "steps": [
    {
      "step": 0,
      "ref": "c1",
      "changes": [
        { "component": "input", "label": "Project name", "key": "value", "value": "Atlas" }
      ]
    },
    {
      "step": 1,
      "ref": "c3",
      "changes": [
        { "component": "select", "label": "Region", "key": "value", "value": "north-america" }
      ]
    },
    { "step": 2, "ref": "c4", "result": "Pressed \"Save\"." }
  ],
  "appeared": [],
  "values": {
    "c1 Project name": "Atlas",
    "c3 Region": "north-america"
  }
}
```

Confirmation on the page: `Saved: Atlas · North America`

### `without-uisdk/` — `npm run task`

Reading via labels:

```json
{
  "projectName": "Apollo",
  "region": "europe",
  "regionLabel": "Europe",
  "options": [
    { "value": "europe", "label": "Europe" },
    { "value": "north-america", "label": "North America" },
    { "value": "asia-pacific", "label": "Asia Pacific" }
  ]
}
```

Then: fill `Atlas`, `selectOption("north-america")`, click the button named Save.

Confirmation on the page: `Saved: Atlas · North America`

## Try it on GitHub Pages

https://baptistedumas.github.io/uisdk-compare/

Each built page has a **Let the agent do it** button and a **Reset** button. On the UI SDK page the button calls `snapshot()`, then `act()` by label (`Project name`, `Region`, `Save`), and the log shows those results. On the plain page the button uses `querySelector`, sets the control values, dispatches events, and clicks Save. Steps are spaced so the form changes are visible. The Playwright runners below are unchanged: they still drive the form themselves, not the button.

## How to rerun

```bash
cd with-uisdk && npm install && npm run task
cd ../without-uisdk && npm install && npm run task
```

Each README has a shorter walkthrough and, for the UI SDK app, the same calls you can type in the browser console.
