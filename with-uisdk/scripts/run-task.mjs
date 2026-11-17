/**
 * Starts the Vite app, opens it in headless Chrome, and drives the form
 * through the UI SDK agent bridge (window.agent), not through CSS selectors.
 */
import { createServer } from "vite"
import { chromium } from "playwright"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const PORT = Number(process.env.PORT || 5173)
const url = `http://127.0.0.1:${PORT}/uisdk-compare/with-uisdk/`

function section(title) {
  console.log(`\n=== ${title} ===`)
}

const vite = await createServer({
  root,
  configFile: path.join(root, "vite.config.ts"),
  server: { port: PORT, strictPort: true, host: "127.0.0.1" },
})
await vite.listen()

let browser
try {
  browser = await chromium.launch({ channel: "chrome", headless: true })
  const page = await browser.newPage()
  await page.goto(url, { waitUntil: "networkidle" })
  await page.waitForFunction(() => "agent" in window)

  section("1) snapshot() — what the agent sees")
  const snapshot = await page.evaluate(() => window.agent.snapshot())
  console.log(JSON.stringify(snapshot, null, 2))

  section("2) query({ within: \"Region\" }) — list choices without opening the popup")
  const queryResult = await page.evaluate(() =>
    window.agent.query({ within: "Region" }),
  )
  console.log(JSON.stringify(queryResult, null, 2))

  section("3) act() — set name, change region, press Save")
  const actResult = await page.evaluate(() =>
    window.agent.act({
      steps: [
        { ref: "Project name", action: "setValue", args: ["Atlas"] },
        { ref: "Region", action: "setValue", args: ["north-america"] },
        { ref: "Save", action: "press" },
      ],
    }),
  )
  console.log(JSON.stringify(actResult, null, 2))

  section("4) Confirmation text on the page")
  const confirmation = await page.locator("#save-result").innerText()
  console.log(confirmation)

  if (confirmation !== "Saved: Atlas · North America") {
    throw new Error(`Unexpected confirmation: ${confirmation}`)
  }

  section("Done")
  console.log(`Task succeeded via the UI SDK bridge at ${url}`)
} finally {
  await browser?.close()
  await vite.close()
}
