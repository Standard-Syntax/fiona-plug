// tests/hooks/mindmodel-injector.test.ts
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("mindmodel-injector hook", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), "mindmodel-injector-test-"));
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  function createMockCtx(directory: string) {
    return {
      directory,
      client: {
        session: {},
        tui: {},
      },
    };
  }

  function setupMindmodel(dir: string) {
    const mindmodelDir = join(dir, ".mindmodel");
    mkdirSync(join(mindmodelDir, "components"), { recursive: true });

    writeFileSync(
      join(mindmodelDir, "manifest.yaml"),
      `
name: test-project
version: 1
categories:
  - path: components/button.md
    description: Button component patterns
  - path: components/form.md
    description: Form patterns
`,
    );

    writeFileSync(
      join(mindmodelDir, "components/button.md"),
      "# Button\n\nUse this pattern for buttons.\n\n```tsx\n<Button>Click</Button>\n```",
    );
    writeFileSync(
      join(mindmodelDir, "components/form.md"),
      "# Form\n\nUse this pattern for forms.\n\n```tsx\n<Form onSubmit={...} />\n```",
    );
  }

  // Helper to simulate the two-hook flow
  async function runInjectionFlow(
    hook: ReturnType<typeof import("../../src/hooks/mindmodel-injector").createMindmodelInjectorHook>,
    sessionID: string,
    messages: Array<{ info: { role: string }; parts: Array<{ type: string; text?: string }> }>,
  ): Promise<string[]> {
    // Step 1: Extract task from messages
    const messagesOutput = { messages };
    await hook["experimental.chat.messages.transform"]({ sessionID }, messagesOutput);

    // Step 2: Inject into system prompt
    const systemOutput = { system: ["existing system prompt"] };
    await hook["experimental.chat.system.transform"]({ sessionID }, systemOutput);

    return systemOutput.system;
  }

  it("should not inject if no .mindmodel directory exists", async () => {
    const { createMindmodelInjectorHook } = await import("../../src/hooks/mindmodel-injector");

    const ctx = createMockCtx(testDir);
    const hook = createMindmodelInjectorHook(ctx as any);

    const system = await runInjectionFlow(hook, "test", [
      { info: { role: "user" }, parts: [{ type: "text", text: "Hello" }] },
    ]);

    expect(system).toEqual(["existing system prompt"]);
  });

  it("should inject examples when keyword matches category", async () => {
    setupMindmodel(testDir);

    const { createMindmodelInjectorHook } = await import("../../src/hooks/mindmodel-injector");

    const ctx = createMockCtx(testDir);
    const hook = createMindmodelInjectorHook(ctx as any);

    // "form" keyword should match components/form.md
    const system = await runInjectionFlow(hook, "test", [
      { info: { role: "user" }, parts: [{ type: "text", text: "Add a contact form" }] },
    ]);

    expect(system.length).toBe(2);
    expect(system[0]).toContain("mindmodel-examples");
    expect(system[0]).toContain("Form");
    expect(system[0]).toContain("<Form onSubmit");
  });

  it("should not inject if no keywords match", async () => {
    setupMindmodel(testDir);

    const { createMindmodelInjectorHook } = await import("../../src/hooks/mindmodel-injector");

    const ctx = createMockCtx(testDir);
    const hook = createMindmodelInjectorHook(ctx as any);

    // No keywords match
    const system = await runInjectionFlow(hook, "test", [
      { info: { role: "user" }, parts: [{ type: "text", text: "What time is it?" }] },
    ]);

    expect(system).toEqual(["existing system prompt"]);
  });

  it("should extract task from multimodal message content", async () => {
    setupMindmodel(testDir);

    const { createMindmodelInjectorHook } = await import("../../src/hooks/mindmodel-injector");

    const ctx = createMockCtx(testDir);
    const hook = createMindmodelInjectorHook(ctx as any);

    // "button" keyword should match components/button.md
    const system = await runInjectionFlow(hook, "test", [
      {
        info: { role: "user" },
        parts: [
          { type: "image" }, // No text field for image
          { type: "text", text: "Add a button component" },
        ],
      },
    ]);

    expect(system.length).toBe(2);
    expect(system[0]).toContain("mindmodel-examples");
    expect(system[0]).toContain("Button");
  });

  it("should cache results for repeated tasks", async () => {
    setupMindmodel(testDir);

    const { createMindmodelInjectorHook } = await import("../../src/hooks/mindmodel-injector");

    const ctx = createMockCtx(testDir);
    const hook = createMindmodelInjectorHook(ctx as any);

    // First call with "button" keyword
    const system1 = await runInjectionFlow(hook, "test1", [
      { info: { role: "user" }, parts: [{ type: "text", text: "Add a button" }] },
    ]);

    // Second call with same text
    const system2 = await runInjectionFlow(hook, "test2", [
      { info: { role: "user" }, parts: [{ type: "text", text: "Add a button" }] },
    ]);

    // Both should have injected content
    expect(system1.length).toBe(2);
    expect(system2.length).toBe(2);
    expect(system1[0]).toContain("mindmodel-examples");
    expect(system2[0]).toContain("mindmodel-examples");
  });

  it("should keep injections separate for concurrent sessions", async () => {
    setupMindmodel(testDir);

    const { createMindmodelInjectorHook } = await import("../../src/hooks/mindmodel-injector");

    const ctx = createMockCtx(testDir);
    const hook = createMindmodelInjectorHook(ctx as any);

    // Simulate concurrent sessions by running both flows "simultaneously"
    // In real scenario they'd be interleaved, but we verify each session
    // gets its own injection by using different sessionIDs

    // Session A: "button" keyword
    const sessionA = "session-a";
    const messagesA = [{ info: { role: "user" }, parts: [{ type: "text", text: "Add a button" }] }];

    // Session B: "form" keyword
    const sessionB = "session-b";
    const messagesB = [{ info: { role: "user" }, parts: [{ type: "text", text: "Add a form" }] }];

    // Run both message transforms
    await hook["experimental.chat.messages.transform"]({ sessionID: sessionA }, { messages: messagesA });
    await hook["experimental.chat.messages.transform"]({ sessionID: sessionB }, { messages: messagesB });

    // Run both system transforms
    const systemA = { system: ["existing"] };
    const systemB = { system: ["existing"] };

    await hook["experimental.chat.system.transform"]({ sessionID: sessionA }, systemA);
    await hook["experimental.chat.system.transform"]({ sessionID: sessionB }, systemB);

    // Verify each session got its own injection
    expect(systemA.system[0]).toContain("Button");
    expect(systemA.system[0]).not.toContain("Form");

    expect(systemB.system[0]).toContain("Form");
    expect(systemB.system[0]).not.toContain("Button");
  });
});
