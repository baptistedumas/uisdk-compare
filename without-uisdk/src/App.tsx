import { useEffect, useRef, useState, type FormEvent } from "react"

const regions = [
  { value: "europe", label: "Europe" },
  { value: "north-america", label: "North America" },
  { value: "asia-pacific", label: "Asia Pacific" },
]

const STEP_PAUSE_MS = 800

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function requireControl(selector: string) {
  const element = document.querySelector(selector)
  if (!(element instanceof HTMLInputElement || element instanceof HTMLSelectElement)) {
    throw new Error(`Could not find ${selector}`)
  }
  return element
}

// React keeps its own value tracker on controlled inputs. Assigning through
// the prototype setter, then dispatching input/change, is what makes onChange run.
function setControlValue(element: HTMLInputElement | HTMLSelectElement, value: string) {
  const prototype =
    element instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype
  const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set
  if (!setter) throw new Error(`Could not set ${element.id}`)
  setter.call(element, value)
  const eventName = element instanceof HTMLSelectElement ? "change" : "input"
  element.dispatchEvent(new Event(eventName, { bubbles: true }))
}

function App() {
  const [name, setName] = useState("Apollo")
  const [region, setRegion] = useState("europe")
  const [saved, setSaved] = useState<string | null>(null)
  const [log, setLog] = useState<string[]>([])
  const [running, setRunning] = useState(false)
  const runRef = useRef(0)
  const logRef = useRef<HTMLPreElement>(null)

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight })
  }, [log])

  const regionLabel = regions.find((item) => item.value === region)?.label ?? region

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    setSaved(`Saved: ${name} · ${regionLabel}`)
  }

  function reset() {
    runRef.current += 1
    setRunning(false)
    setName("Apollo")
    setRegion("europe")
    setSaved(null)
    setLog([])
  }

  async function letTheAgentDoIt() {
    if (running) return
    const id = ++runRef.current
    setRunning(true)
    setSaved(null)
    setLog([])

    const push = (entry: string) => {
      if (runRef.current !== id) return
      setLog((current) => [...current, entry])
    }
    const stillRunning = () => runRef.current === id

    try {
      const nameInput = requireControl("#project-name")
      const regionSelect = requireControl("#region")
      const regionText =
        regionSelect instanceof HTMLSelectElement
          ? (regionSelect.selectedOptions[0]?.textContent ?? regionSelect.value)
          : regionSelect.value
      push(
        `querySelector("#project-name") value: ${JSON.stringify(nameInput.value)}\nquerySelector("#region") value: ${JSON.stringify(regionSelect.value)} (${regionText})`,
      )
      await wait(STEP_PAUSE_MS)
      if (!stillRunning()) return

      setControlValue(nameInput, "Atlas")
      push('Set #project-name to "Atlas" and dispatched an input event.')
      await wait(STEP_PAUSE_MS)
      if (!stillRunning()) return

      setControlValue(regionSelect, "north-america")
      push('Set #region to "north-america" and dispatched a change event.')
      await wait(STEP_PAUSE_MS)
      if (!stillRunning()) return

      const save = document.querySelector("button.save")
      if (!(save instanceof HTMLButtonElement)) {
        throw new Error("Could not find button.save")
      }
      save.click()
      push("Clicked button.save.")
      await wait(STEP_PAUSE_MS)
      if (!stillRunning()) return

      const confirmation = document.querySelector("#save-result")?.textContent ?? ""
      push(`#save-result: ${confirmation}`)
    } catch (error) {
      push(error instanceof Error ? error.message : String(error))
    } finally {
      if (stillRunning()) setRunning(false)
    }
  }

  return (
    <main>
      <div className="demo-bar">
        <p className="demo-caption">
          Runs the same task with querySelector, setting values, dispatching
          events, and clicking Save.
        </p>
        <div className="demo-actions">
          <button
            type="button"
            className="agent-run"
            onClick={() => {
              void letTheAgentDoIt()
            }}
            disabled={running}
          >
            Let the agent do it
          </button>
          <button
            type="button"
            className="agent-reset"
            onClick={reset}
            disabled={running}
          >
            Reset
          </button>
        </div>
      </div>

      <h1>Project Settings</h1>
      <p className="lede">
        The same form, built with plain HTML. Automation finds controls
        with Playwright locators (labels and roles), not a component bridge.
      </p>

      <form onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="project-name">Project name</label>
          <input
            id="project-name"
            className="control"
            name="project-name"
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              setSaved(null)
            }}
          />
        </div>

        <div className="field">
          <label htmlFor="region">Region</label>
          {/* A native <select> is the straightforward baseline. A custom
              popup list (like UI SDK's Select) would need extra steps:
              open the list, then click an option. */}
          <select
            id="region"
            className="control"
            name="region"
            value={region}
            onChange={(event) => {
              setRegion(event.target.value)
              setSaved(null)
            }}
          >
            {regions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <button className="save" type="submit">
          Save
        </button>
      </form>

      <p id="save-result" role="status">
        {saved ?? "Not saved yet."}
      </p>

      <h2 className="log-heading">Log</h2>
      <pre ref={logRef} className="demo-log">
        {log.length === 0
          ? 'Press "Let the agent do it". Each DOM step is written here.'
          : log.join("\n\n")}
      </pre>
    </main>
  )
}

export default App
