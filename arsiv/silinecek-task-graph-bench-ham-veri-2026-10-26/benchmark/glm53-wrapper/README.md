# GLM 5.3 Wrapper Benchmark

This harness compares Claude Code, Codex, OpenCode, and Kilocode when they drive the same GLM 5.3 model.

## Task

The fixture contains one deliberate bug:

- `index.js` returns `left - right`.
- `index.test.js` expects `sum(2, 3)` to equal `5`.

Each wrapper receives the same prompt:

```text
Fix the failing test in `index.js`, run `node --test index.test.js`, and report the result.
```

## Usage

```powershell
node benchmark/glm53-wrapper/run.mjs --offline
node benchmark/glm53-wrapper/run.mjs --live --timeout-ms 120000
```

`--offline` collects wrapper versions, startup latency, model identity, tool inventory, and configuration summaries without calling the model.
`--live` additionally runs the coding task in isolated per-wrapper copies and records the raw JSON event stream.
