import { useEffect, useRef, useState } from "react"
import { Button } from "@ui-sdk/react/button"
import { Field, FieldLabel } from "@ui-sdk/react/field"
import { Input } from "@ui-sdk/react/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@ui-sdk/react/select"
import { agent } from "./agent"

const regions = [
  { value: "europe", label: "Europe" },
  { value: "north-america", label: "North America" },
  { value: "asia-pacific", label: "Asia Pacific" },
]

// Long enough to watch each field change, short enough that the demo stays a demo.
const STEP_PAUSE_MS = 800

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

// Same steps as scripts/run-task.mjs. `ref` is the accessible label.
// One act() per step so the pause sits between calls. act() itself runs
// every step in the array immediately, and it has no delay option.
const taskSteps = [
  { ref: "Project name", action: "setValue", args: ["Atlas"] },
  { ref: "Region", action: "setValue", args: ["north-america"] },
  { ref: "Save", action: "press" },
]

function App() {
  // Controlled state so a change made by the agent (via setValue) is
  // visible to React when Save is pressed. UI SDK calls onValueChange
  // with details.source === "agent" in that case.
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
      const snapshot = agent.snapshot()
      push(`snapshot()\n${JSON.stringify(snapshot, null, 2)}`)
      await wait(STEP_PAUSE_MS)
      if (!stillRunning()) return

      for (const step of taskSteps) {
        const result = await agent.act({ steps: [step] })
        push(`act(${JSON.stringify({ steps: [step] }, null, 2)})\n${JSON.stringify(result, null, 2)}`)
        if (!result.ok) {
          push("Stopped. act() returned ok: false.")
          return
        }
        await wait(STEP_PAUSE_MS)
        if (!stillRunning()) return
      }

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
          Runs the task through the UI SDK bridge: snapshot(), then act()
          by label, with a pause between steps.
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
        A tiny form built with UI SDK components. An agent can read and
        change it through <code>window.agent</code> (snapshot, query, act).
      </p>

      {/* FieldLabel gives the Input an accessible name. The agent uses
          that name as a ref: act({ ref: "Project name", action: "setValue" }). */}
      <Field className="field">
        <FieldLabel>Project name</FieldLabel>
        <Input
          className="control"
          name="project-name"
          value={name}
          onValueChange={(value) => {
            setName(value)
            setSaved(null)
          }}
        />
      </Field>

      {/* Passing `items` lets the trigger show the label immediately, and
          lets agent.query({ within: "Region" }) list choices without
          opening the popup. */}
      <Select
        value={region}
        items={regions}
        onValueChange={(value) => {
          if (value) {
            setRegion(value)
            setSaved(null)
          }
        }}
      >
        <SelectLabel className="field-label">Region</SelectLabel>
        <SelectTrigger className="select-trigger">
          <SelectValue />
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </SelectTrigger>
        <SelectContent className="select-content">
          {regions.map((item) => (
            <SelectItem
              key={item.value}
              value={item.value}
              className="select-item"
            >
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* The agent's action for a Button is "press", using the label "Save". */}
      <Button
        className="save"
        onClick={() => setSaved(`Saved: ${name} · ${regionLabel}`)}
      >
        Save
      </Button>

      <p id="save-result" role="status">
        {saved ?? "Not saved yet."}
      </p>

      <h2 className="log-heading">Log</h2>
      <pre ref={logRef} className="demo-log">
        {log.length === 0
          ? 'Press "Let the agent do it". snapshot() and each act() result are written here.'
          : log.join("\n\n")}
      </pre>
    </main>
  )
}

export default App
