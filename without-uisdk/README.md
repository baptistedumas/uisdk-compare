# Project Settings — without UI SDK

The same "update project settings" task as `../with-uisdk`, but the form is plain HTML (`<input>`, `<select>`, `<button>`) and the runner drives it with [Playwright](https://playwright.dev) locators.

The demo task is: read the form, list the Region choices, rename the project from Apollo to Atlas, switch the region from Europe to North America, and press Save.

The runner finds controls by accessible name and role:

- `page.getByLabel("Project name")`
- `page.getByLabel("Region")` / `selectOption("north-america")`
- `page.getByRole("button", { name: "Save" })`

That is the usual baseline for automating a page that does not expose a component-level agent API.

## Run

Needs Node 18+ and Google Chrome (used headless via Playwright's `channel: "chrome"`).

```bash
npm install
npm run task
```

That starts Vite on http://127.0.0.1:5174, runs the task in headless Chrome, prints the result, and shuts everything down.

To click around yourself:

```bash
npm run dev
```

Open http://127.0.0.1:5174/uisdk-compare/without-uisdk/ (the Vite `base` used on GitHub Pages). **Let the agent do it** runs the task with `querySelector`, sets the values, dispatches `input` and `change`, and clicks Save. **Reset** restores Apollo and Europe.
