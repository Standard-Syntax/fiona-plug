---
name: opencode-plugin-audit
description: >
  Audit, validate, debug, and scaffold TypeScript plugins for opencode.ai. Use this skill
  whenever the user mentions an opencode plugin or custom tool, asks to check plugin wiring,
  wants to create a new plugin, sees hooks not firing, or pastes plugin code for review.
  Covers all wiring layers: file location, package.json/tsconfig, TypeScript types, export
  shape, hook names, tool definitions, and npm plugin registration. Even if the user just
  says "check my plugin" or "why isn't my hook firing", use this skill.
---

# opencode Plugin Audit

Validates and debugs TypeScript plugins for opencode.ai. Covers plugins (hooks + tools
inside `.opencode/plugins/`) and standalone custom tools (`.opencode/tools/`).

---

## Audit Checklist (run top-to-bottom)

### 1. File Location

Plugins auto-load at startup — **no opencode.json registration required**:

```
.opencode/plugins/           ← project-level plugins  (note the 's')
~/.config/opencode/plugins/  ← global plugins
```

Custom tools (standalone, no hooks):

```
.opencode/tools/             ← project-level tools
~/.config/opencode/tools/    ← global tools
```

> ⚠️ Common mistake: `.opencode/plugin/` (no `s`) — files here are silently ignored.

For npm-published plugins, add to `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-helicone-session", "@my-org/custom-plugin"]
}
```

---

### 2. package.json / Dependencies

For local plugins needing external packages, add `.opencode/package.json`:

```json
{
  "dependencies": {
    "shescape": "^2.1.0"
  }
}
```

- opencode runs `bun install` automatically at startup.
- Packages cached in `~/.cache/opencode/node_modules/`.

**Verify:**

```bash
ls .opencode/node_modules/@opencode-ai/plugin && echo "✓" || echo "✗ run: cd .opencode && bun install"
```

---

### 3. TypeScript Types

```typescript
import type { Plugin } from "@opencode-ai/plugin";
import { tool } from "@opencode-ai/plugin";
```

- `Plugin` — type for the plugin factory function
- `tool` — helper for custom tool definitions with Zod-based schema
- `tool.schema.*` — `.string()`, `.number()`, `.boolean()`, `.enum([...])`, `.optional()`

Type-check:

```bash
cd .opencode && bunx tsc --noEmit 2>&1
```

---

### 4. Plugin Export Shape

```typescript
import type { Plugin } from "@opencode-ai/plugin";

export const MyPlugin: Plugin = async ({
  project,
  client,
  $,
  directory,
  worktree,
}) => {
  return {
    // hook implementations
  };
};
```

Context fields: `project`, `directory`, `worktree`, `client` (opencode SDK), `$` (Bun shell).

**Common mistakes:**

```typescript
// ✗ default export (must be named export)
export default async (ctx) => { ... }

// ✗ not async
export const MyPlugin: Plugin = ({ directory }) => { ... }

// ✗ missing return
export const MyPlugin: Plugin = async (ctx) => { /* no return */ }
```

**Logging** — use `client.app.log()`, not `console.log`:

```typescript
await client.app.log({
  body: { service: "my-plugin", level: "info", message: "Plugin initialized" },
});
```

Levels: `debug`, `info`, `warn`, `error`.

---

### 5. Hook Registration

Return hooks as keys in the object from the plugin factory.

#### Tool Hooks

```typescript
// Before a tool runs — can modify args or throw to block execution
"tool.execute.before": async (input, output) => {
  if (input.tool === "read" && output.args.filePath.includes(".env")) {
    throw new Error("Do not read .env files")
  }
},

// After a tool runs
"tool.execute.after": async (input) => {
  const toolName = input.tool as string
  const args = input.args as Record<string, unknown>
},
```

#### Shell / Environment Hooks

```typescript
"shell.env": async (input, output) => {
  output.env.MY_API_KEY = "secret"
  output.env.PROJECT_ROOT = input.cwd
},
```

#### Session / Compaction Hooks

```typescript
"experimental.session.compacting": async (input, output) => {
  output.context.push("## Custom Context\nState to preserve across compaction...")
  // OR replace the entire prompt:
  // output.prompt = "You are generating a continuation prompt..."
},
```

#### Event Hook (catch-all)

```typescript
event: async ({ event }) => {
  if (event.type === "session.idle") {
    await $`osascript -e 'display notification "Done!" with title "opencode"'`
  }
},
```

**Full event list:**

- Tool: `tool.execute.before`, `tool.execute.after`
- Shell: `shell.env`
- Session: `session.created`, `session.compacted`, `session.deleted`, `session.diff`, `session.error`, `session.idle`, `session.status`, `session.updated`
- File: `file.edited`, `file.watcher.updated`
- Message: `message.part.removed`, `message.part.updated`, `message.removed`, `message.updated`
- LSP: `lsp.client.diagnostics`, `lsp.updated`
- Permission: `permission.asked`, `permission.replied`
- TUI: `tui.prompt.append`, `tui.command.execute`, `tui.toast.show`
- Other: `command.executed`, `installation.updated`, `server.connected`, `todo.updated`

**Debugging hooks not firing:**

1. Confirm directory is `.opencode/plugins/` (with `s`) — not `plugin/`
2. Add `client.app.log()` call at top of hook body and restart opencode
3. Run `cd .opencode && bun install` if deps were added
4. Check `bunx tsc --noEmit` for compile errors

---

### 6. Tool Definitions (inside a plugin)

```typescript
import { type Plugin, tool } from "@opencode-ai/plugin";

export const MyPlugin: Plugin = async (ctx) => {
  return {
    tool: {
      my_tool_name: tool({
        description:
          "Clear description the LLM reads to decide when to call this.",
        args: {
          query: tool.schema.string().describe("The search query"),
          limit: tool.schema.number().optional().describe("Max results"),
          category: tool.schema.enum(["a", "b", "c"]).optional(),
        },
        async execute(args, context) {
          const { directory, worktree, agent, sessionID } = context;
          return "result string or serializable value";
        },
      }),
    },
  };
};
```

**Tool naming rules:**

- Must be `snake_case` (no hyphens or spaces)
- Plugin tool names override built-in tool names of the same name
- For standalone files in `.opencode/tools/`: filename = tool name; multiple named exports become `<filename>_<exportname>`

**Common mistakes:**

- `execute` not `async` → silent failures
- Returning `undefined` → always return a string or serializable value
- Vague `description` → LLM won't know when to call it

---

## Audit Report Format

```
## opencode Plugin Audit: <filename>

### ✅ Passing
- <item>

### ⚠️ Warnings (won't break, but should fix)
- <item>

### ❌ Errors (will prevent plugin from working)
- <item>: <explanation> → Fix: <specific fix>

### Corrected Code
<full corrected plugin file>
```

---

## Scaffolding a New Plugin

Ask:

1. What should it do? (tool / hook / event listener)
2. Does it need external npm packages?
3. Project-level (`.opencode/plugins/`) or global?

Produce:

- Complete, type-correct `.opencode/plugins/<name>.ts`
- `.opencode/package.json` update if deps needed
- No `opencode.json` entry needed (auto-loaded)

Produce working code — no `// TODO` placeholders.
