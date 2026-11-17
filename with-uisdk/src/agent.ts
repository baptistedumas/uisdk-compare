// The agent bridge is the part of UI SDK that helps an AI (or a script)
// *use* the page: it lists components, their state, and the actions they
// support, then runs those actions through the component API.
// Docs: https://ui-sdk.dev/docs/agents/connect-an-agent
import { createAgent, registerTools } from "@ui-sdk/react/agent"

const agent = createAgent()

// Put the bridge on window so the Playwright runner (and the browser
// console) can call snapshot / query / act. No TypeScript Window
// declaration is required, per the official guide.
Object.assign(window, { agent })

// If the browser supports WebMCP (document.modelContext), this publishes
// the same three tools to the browser's built-in agent. In regular Chrome
// it is a no-op. allow is required by the API; this demo auto-approves.
registerTools(agent, { allow: () => true })

export { agent }
