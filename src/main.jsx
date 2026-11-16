import React, { Component, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Button } from "@udir-design/react";
import "@udir-design/theme";
import "@udir-design/react/style.css";
import "./style.css";

const wrapped = new URLSearchParams(location.search).get("wrapped") === "true";

class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Button reproduction caught a render error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div role="alert">
          <h2>React render failed</h2>
          <pre>{String(this.state.error)}</pre>
          <p>Reload the page to reset the reproduction.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function Example() {
  const [loading, setLoading] = useState(false);
  const [simulated, setSimulated] = useState(false);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, [loading]);

  function simulateTranslation() {
    const label = buttonRef.current.querySelector("[data-label]") ?? buttonRef.current;
    const text = [...label.childNodes].find(
      (node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim(),
    );
    if (!text) {
      throw new Error("No direct label text node found. Reload before simulating translation.");
    }

    // Model the relevant translator mutation: replace a React-owned text node.
    const replacement = document.createElement("font");
    replacement.textContent = "Continue to the assignment";
    text.replaceWith(replacement);
    setSimulated(true);
  }

  return (
    <>
      <p>
        <button type="button" disabled={simulated || loading} onClick={simulateTranslation}>
          Simulate translation
        </button>
        {simulated && " Text node replaced. Now click the design-system button below."}
      </p>
      <div className="example">
        <Button
          ref={buttonRef}
          type="button"
          loading={loading}
          onClick={() => setLoading(true)}
        >
          {wrapped ? <span data-label>Fortsett til oppgaven</span> : "Fortsett til oppgaven"}
        </Button>
      </div>
      <p role="status">Loading: {String(loading)}</p>
    </>
  );
}

function App() {
  return (
    <main>
      <h1>Button loading + browser translation</h1>
      <p>
        Variant: <strong>{wrapped ? "span-wrapped label (workaround)" : "bare text label (broken)"}</strong>
      </p>
      <nav aria-label="Reproduction variants">
        <a href="/?wrapped=false">Bare text</a>{" | "}
        <a href="/?wrapped=true">Span-wrapped text</a>{" | "}
        <a href={location.search || "/"}>Reload / reset</a>
      </nav>
      <ol>
        <li>In Chrome, translate this Norwegian-language page to English.</li>
        <li>Alternatively, click "Simulate translation" below on a fresh page.</li>
        <li>Click the design-system button to change loading from false to true.</li>
      </ol>
      <p>
        Without translation, both variants work. After text-node replacement, the bare-text
        variant should fail with insertBefore; the span variant should complete loading.
        The simulation models DOM replacement, not the full Chrome translation service.
      </p>
      <ErrorBoundary>
        <Example />
      </ErrorBoundary>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
