# Button loading + browser translation

Standalone reproduction using the public Udir design-system Button. No application
code, credentials, API calls, or PostHog setup is required.

## Run

Requires Node.js 22.12+ (or 20.19+) and pnpm 10.

```sh
pnpm install
pnpm dev
```

Open the localhost URL printed by Vite. Validate the production bundle with
`pnpm build`.

## Reproduce with Chrome translation

1. Open `/?wrapped=false` in Chrome.
2. Right-click and translate the page from Norwegian to English. If Chrome does not
   offer translation, use its translation menu and select Norwegian as the source.
3. Click "Fortsett til oppgaven" (or its translated label).
4. Observe the React error boundary and browser console.
5. Open `/?wrapped=true`, translate the fresh page, and repeat.
6. The wrapped variant should show a spinner, then finish after 1.5 seconds.

Reload between attempts. Do not combine real translation and the simulation in the
same attempt. Translation behavior can vary with Chrome version and language.
Record your Chrome version and source/target languages when reporting results.

## Deterministic simulation

On a fresh page, click "Simulate translation", then the design-system button.
Repeat with the other variant.

The simulation replaces the label's React-owned text node with a `<font>` element
containing translated text. It models the DOM mutation responsible for the crash;
it is not an end-to-end test of Chrome's translation service.

| Label | Without mutation | After simulated translation |
| --- | --- | --- |
| Direct text child | Loading starts and stops | `NotFoundError` from `insertBefore` |
| Text inside a span | Loading starts and stops | Loading starts and stops |

The error boundary intentionally keeps instructions visible when React fails.
It reports the exception rather than suppressing it.

## Verification performed

- `pnpm build`: passed. Vite reports dependency `"use client"` directive warnings;
  this is a client-only application.
- Browser automation in VS Code's integrated Chromium browser (Chrome
  150.0.7871.250 / Electron 43.8.6): all four cases in the table above matched
  their expected outcomes. The failing case produced the exact `NotFoundError`
  from `insertBefore`, while the other three completed a loading cycle.
- Chrome's actual translation UI: not verified here. Use the manual steps above
  to confirm separately; the automated checks used the deterministic simulation.

## Why it happens

The underlying Button inserts its loading spinner before the label. Translation
can replace the original text node outside React. React then tries to insert the
spinner before a reference node that is no longer a child of the button.

```jsx
// Vulnerable when translation replaces the direct text node:
<Button loading={loading}>Fortsett til oppgaven</Button>

// Stable element boundary for this static-label/loading case:
<Button loading={loading}>
  <span>Fortsett til oppgaven</span>
</Button>
```

This workaround addresses this structural failure, not every translation issue
(for example, translated dynamic text becoming stale).

## Suggested report to the design team

**Title:** Button loading crashes after Chrome translates a direct-text label

**Environment:** React/React DOM 19.2.8, `@udir-design/react` 1.3.0,
`@udir-design/theme` 1.3.0. See the lockfile for transitive versions.
Add the tested Chrome version, OS, and translation language pair.

**Reproduction:** Share this repository or a ZIP, run the steps above, and attach
the console exception and a short recording. Clearly distinguish simulated
results from results verified with Chrome's actual translation.

**Expected:** Enabling loading after translation displays the spinner without
crashing React.

**Actual:** With a direct-text label replaced by translation, changing loading
from false to true causes `NotFoundError: Failed to execute 'insertBefore' on
'Node': The node before which the new node is to be inserted is not a child of
this node.`

**Comparison:** Wrapping the same label in a span avoids this failure.

**Request:** Could Button provide a stable element boundary for ordinary text
labels, or document this limitation and the recommended workaround? Please
consider `asChild`, icon-only buttons, custom children, styling, and accessibility
before applying a general wrapper. The underlying implementation comes from
`@digdir/designsystemet-react`, so this may also warrant an upstream report.

**Context:** This is a known React/external-DOM-mutation interoperability issue,
not evidence that the design system is solely responsible:
https://github.com/react/react/issues/11538

Prefer a focused component workaround over globally patching DOM methods or
disabling translation.
