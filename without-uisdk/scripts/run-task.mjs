/**
 * Starts the Vite app, opens it in headless Chrome, and drives the form
 * with Playwright locators (accessible names / roles) against the DOM.
 */
import { createServer } from "vite"
import { chromium } from "playwright"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const PORT = Number(process.env.PORT || 5174)
const url = `http://127.0.0.1:${PORT}/uisdk-compare/without-uisdk/`

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

  section("1) Read current values via labels")
  const name = await page.getByLabel("Project name").inputValue()
  const region = await page.getByLabel("Region").inputValue()
  const regionLabel = await page.getByLabel("Region").evaluate((el) => {
    const select = el
    return select.selectedOptions[0]?.textContent ?? select.value
  })
  const options = await page.getByLabel("Region").evaluate((el) =>
    [...el.options].map((option) => ({
      value: option.value,
      label: option.textContent,
    })),
  )
  console.log(
    JSON.stringify({ projectName: name, region, regionLabel, options }, null, 2),
  )

  section("2) Fill the name, choose a region, click Save")
  // Playwright talks to the DOM: fill the labeled input, pick an <option>
  // by its value, then click the button by role and name.
  await page.getByLabel("Project name").fill("Atlas")
  await page.getByLabel("Region").selectOption("north-america")
  await page.getByRole("button", { name: "Save" }).click()
  console.log(
    JSON.stringify(
      {
        filled: "Atlas",
        selected: "north-america",
        clicked: "button named Save",
      },
      null,
      2,
    ),
  )

  section("3) Confirmation text on the page")
  const confirmation = await page.locator("#save-result").innerText()
  console.log(confirmation)

  if (confirmation !== "Saved: Atlas · North America") {
    throw new Error(`Unexpected confirmation: ${confirmation}`)
  }

  section("Done")
  console.log(`Task succeeded via Playwright locators at ${url}`)
} finally {
  await browser?.close()
  await vite.close()
}
