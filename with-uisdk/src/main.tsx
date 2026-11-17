// Import the bridge *before* rendering, so it sees each UI SDK component
// as it is created. https://ui-sdk.dev/docs/agents/connect-an-agent/guide
import "./agent"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import App from "./App"
import "./index.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
