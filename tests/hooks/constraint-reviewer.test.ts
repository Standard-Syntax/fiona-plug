// tests/hooks/constraint-reviewer.test.ts
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("constraint-reviewer formatConstraintContent", () => {
  it("should format constraint with rules", async () => {
    const { createConstraintReviewerHook } = await import("../../src/hooks/constraint-reviewer");

    const testDir = mkdtempSync(join(tmpdir(), "constraint-format-test-"));
    try {
      const mindmodelDir = join(testDir, ".mindmodel");
      mkdirSync(mindmodelDir, { recursive: true });

      writeFileSync(
        join(mindmodelDir, "manifest.yaml"),
        `name: test-project
version: 2
categories:
  - path: style.md
    description: Style constraints
`,
      );

      writeFileSync(
        join(mindmodelDir, "style.md"),
        `# Style Constraints

## Rules
- Use const for immutable bindings
- Use single quotes for strings
`,
      );

      const mockCtx = { directory: testDir, client: { session: {}, tui: {} } };

      let capturedPrompt = "";
      const mockReviewFn = async (prompt: string) => {
        capturedPrompt = prompt;
        return '{"status": "PASS", "violations": [], "summary": "OK"}';
      };

      const hook = createConstraintReviewerHook(mockCtx as any, mockReviewFn);

      await hook["tool.execute.after"](
        { tool: "Write", sessionID: "test", args: { file_path: join(testDir, "test.ts") } },
        { output: "const x = 'hello';" },
      );

      expect(capturedPrompt).toContain("## Project Constraints");
      expect(capturedPrompt).toContain("## Style Constraints");
      expect(capturedPrompt).toContain("### Rules");
      expect(capturedPrompt).toContain("- Use const for immutable bindings");
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it("should format constraint with examples", async () => {
    const testDir = mkdtempSync(join(tmpdir(), "constraint-examples-test-"));
    try {
      const mindmodelDir = join(testDir, ".mindmodel");
      mkdirSync(mindmodelDir, { recursive: true });

      writeFileSync(
        join(mindmodelDir, "manifest.yaml"),
        `name: test-project
version: 2
categories:
  - path: imports.md
    description: Import constraints
`,
      );

      writeFileSync(
        join(mindmodelDir, "imports.md"),
        `# Import Constraints

## Examples
### Absolute imports
\`\`\`typescript
import { Button } from "@/components/Button";
\`\`\`
`,
      );

      const mockCtx = { directory: testDir, client: { session: {}, tui: {} } };

      let capturedPrompt = "";
      const mockReviewFn = async (prompt: string) => {
        capturedPrompt = prompt;
        return '{"status": "PASS", "violations": [], "summary": "OK"}';
      };

      const { createConstraintReviewerHook } = await import("../../src/hooks/constraint-reviewer");
      const hook = createConstraintReviewerHook(mockCtx as any, mockReviewFn);

      await hook["tool.execute.after"](
        { tool: "Write", sessionID: "test", args: { file_path: join(testDir, "test.ts") } },
        { output: "import { Button } from '@/components/Button';" },
      );

      expect(capturedPrompt).toContain("### Examples");
      expect(capturedPrompt).toContain("#### Absolute imports");
      expect(capturedPrompt).toContain("```typescript");
      expect(capturedPrompt).toContain('import { Button } from "@/components/Button"');
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it("should format constraint with anti-patterns", async () => {
    const testDir = mkdtempSync(join(tmpdir(), "constraint-antipatterns-test-"));
    try {
      const mindmodelDir = join(testDir, ".mindmodel");
      mkdirSync(mindmodelDir, { recursive: true });

      writeFileSync(
        join(mindmodelDir, "manifest.yaml"),
        `name: test-project
version: 2
categories:
  - path: errors.md
    description: Error handling
`,
      );

      writeFileSync(
        join(mindmodelDir, "errors.md"),
        `# Error Handling

## Anti-patterns
### Silent catch
\`\`\`javascript
try {
  doSomething();
} catch (e) {
  // silent
}
\`\`\`
`,
      );

      const mockCtx = { directory: testDir, client: { session: {}, tui: {} } };

      let capturedPrompt = "";
      const mockReviewFn = async (prompt: string) => {
        capturedPrompt = prompt;
        return '{"status": "PASS", "violations": [], "summary": "OK"}';
      };

      const { createConstraintReviewerHook } = await import("../../src/hooks/constraint-reviewer");
      const hook = createConstraintReviewerHook(mockCtx as any, mockReviewFn);

      await hook["tool.execute.after"](
        { tool: "Write", sessionID: "test", args: { file_path: join(testDir, "test.js") } },
        { output: "try {} catch(e) {}" },
      );

      expect(capturedPrompt).toContain("### Anti-patterns");
      expect(capturedPrompt).toContain("#### Silent catch");
      expect(capturedPrompt).toContain("```javascript");
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it("should show 'No constraint files found' for empty constraints", async () => {
    const testDir = mkdtempSync(join(tmpdir(), "constraint-empty-test-"));
    try {
      const mindmodelDir = join(testDir, ".mindmodel");
      mkdirSync(mindmodelDir, { recursive: true });

      writeFileSync(
        join(mindmodelDir, "manifest.yaml"),
        `name: test-project
version: 2
categories:
  - path: empty.md
    description: Empty constraints
`,
      );

      // Write a constraint file with no rules, examples, or anti-patterns
      writeFileSync(
        join(mindmodelDir, "empty.md"),
        `# Empty Constraints

Just some text without any structured sections.
`,
      );

      const mockCtx = { directory: testDir, client: { session: {}, tui: {} } };

      let capturedPrompt = "";
      const mockReviewFn = async (prompt: string) => {
        capturedPrompt = prompt;
        return '{"status": "PASS", "violations": [], "summary": "OK"}';
      };

      const { createConstraintReviewerHook } = await import("../../src/hooks/constraint-reviewer");
      const hook = createConstraintReviewerHook(mockCtx as any, mockReviewFn);

      await hook["tool.execute.after"](
        { tool: "Write", sessionID: "test", args: { file_path: join(testDir, "test.ts") } },
        { output: "code" },
      );

      // Should still include the constraint file title even without sections
      expect(capturedPrompt).toContain("## Empty Constraints");
    } finally {
      rmSync(testDir, { recursive: true, force: true });
    }
  });
});

describe("createConstraintReviewerHook", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), "constraint-reviewer-test-"));
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
    mkdirSync(mindmodelDir, { recursive: true });

    writeFileSync(
      join(mindmodelDir, "manifest.yaml"),
      `name: test-project
version: 2
categories:
  - path: test.md
    description: Test constraints
`,
    );

    writeFileSync(
      join(mindmodelDir, "test.md"),
      `# Test Constraints

## Rules
- Always use internal apiClient for API calls
- Never swallow errors silently
`,
    );
  }

  it("should skip review when no mindmodel exists", async () => {
    const { createConstraintReviewerHook } = await import("../../src/hooks/constraint-reviewer");

    const mockCtx = createMockCtx(testDir);
    const mockReviewFn = async () => '{"status": "BLOCKED", "violations": []}';

    const hook = createConstraintReviewerHook(mockCtx as any, mockReviewFn);

    const output = { output: "some code" };
    await hook["tool.execute.after"]({ tool: "Write", sessionID: "test", args: { file_path: "test.ts" } }, output);

    // Should not modify output when no mindmodel
    expect(output.output).toBe("some code");
  });

  it("should skip review for non-Write/Edit tools", async () => {
    setupMindmodel(testDir);

    const { createConstraintReviewerHook } = await import("../../src/hooks/constraint-reviewer");

    let reviewCalled = false;
    const mockCtx = createMockCtx(testDir);
    const mockReviewFn = async () => {
      reviewCalled = true;
      return '{"status": "PASS", "violations": [], "summary": "OK"}';
    };

    const hook = createConstraintReviewerHook(mockCtx as any, mockReviewFn);

    const output = { output: "some result" };
    await hook["tool.execute.after"]({ tool: "Read", sessionID: "test", args: { file_path: "test.ts" } }, output);

    expect(reviewCalled).toBe(false);
  });

  it("should review Write operations when mindmodel exists", async () => {
    setupMindmodel(testDir);

    const { createConstraintReviewerHook } = await import("../../src/hooks/constraint-reviewer");

    let reviewCalled = false;
    const mockCtx = createMockCtx(testDir);
    const mockReviewFn = async () => {
      reviewCalled = true;
      return '{"status": "PASS", "violations": [], "summary": "OK"}';
    };

    const hook = createConstraintReviewerHook(mockCtx as any, mockReviewFn);

    const output = { output: "some code" };
    await hook["tool.execute.after"](
      {
        tool: "Write",
        sessionID: "test",
        args: { file_path: join(testDir, "test.ts") },
      },
      output,
    );

    expect(reviewCalled).toBe(true);
  });

  it("should review Edit operations when mindmodel exists", async () => {
    setupMindmodel(testDir);

    const { createConstraintReviewerHook } = await import("../../src/hooks/constraint-reviewer");

    let reviewCalled = false;
    const mockCtx = createMockCtx(testDir);
    const mockReviewFn = async () => {
      reviewCalled = true;
      return '{"status": "PASS", "violations": [], "summary": "OK"}';
    };

    const hook = createConstraintReviewerHook(mockCtx as any, mockReviewFn);

    const output = { output: "edited code" };
    await hook["tool.execute.after"](
      {
        tool: "Edit",
        sessionID: "test",
        args: { file_path: join(testDir, "test.ts") },
      },
      output,
    );

    expect(reviewCalled).toBe(true);
  });

  it("should not modify output when review passes", async () => {
    setupMindmodel(testDir);

    const { createConstraintReviewerHook } = await import("../../src/hooks/constraint-reviewer");

    const mockCtx = createMockCtx(testDir);
    const mockReviewFn = async () => '{"status": "PASS", "violations": [], "summary": "All good"}';

    const hook = createConstraintReviewerHook(mockCtx as any, mockReviewFn);

    const output = { output: "clean code" };
    await hook["tool.execute.after"](
      {
        tool: "Write",
        sessionID: "test",
        args: { file_path: join(testDir, "test.ts") },
      },
      output,
    );

    expect(output.output).toBe("clean code");
  });

  it("should append violations to output for retry when blocked", async () => {
    setupMindmodel(testDir);

    const { createConstraintReviewerHook } = await import("../../src/hooks/constraint-reviewer");

    const mockCtx = createMockCtx(testDir);
    const mockReviewFn = async () =>
      JSON.stringify({
        status: "BLOCKED",
        violations: [
          {
            file: "src/api.ts",
            line: 15,
            rule: "Use internal client",
            constraint_file: "patterns/api.md",
            found: "fetch()",
            expected: "apiClient.get()",
          },
        ],
        summary: "Found 1 violation",
      });

    const hook = createConstraintReviewerHook(mockCtx as any, mockReviewFn);

    const output = { output: "bad code" };
    await hook["tool.execute.after"](
      {
        tool: "Write",
        sessionID: "test-session",
        args: { file_path: join(testDir, "test.ts") },
      },
      output,
    );

    // First retry: should append violations to output
    expect(output.output).toContain("constraint-violations");
    expect(output.output).toContain("Use internal client");
  });

  it("should throw ConstraintViolationError after max retries", async () => {
    setupMindmodel(testDir);

    const { createConstraintReviewerHook, ConstraintViolationError } = await import(
      "../../src/hooks/constraint-reviewer"
    );

    const mockCtx = createMockCtx(testDir);
    const mockReviewFn = async () =>
      JSON.stringify({
        status: "BLOCKED",
        violations: [
          {
            file: "src/api.ts",
            line: 15,
            rule: "Use internal client",
            constraint_file: "patterns/api.md",
            found: "fetch()",
            expected: "apiClient.get()",
          },
        ],
        summary: "Found 1 violation",
      });

    const hook = createConstraintReviewerHook(mockCtx as any, mockReviewFn);

    // First call - increments retry count
    const output1 = { output: "bad code" };
    await hook["tool.execute.after"](
      {
        tool: "Write",
        sessionID: "test-session",
        args: { file_path: join(testDir, "test.ts") },
      },
      output1,
    );

    // Second call - should throw after max retries (default is 1)
    const output2 = { output: "still bad code" };
    try {
      await hook["tool.execute.after"](
        {
          tool: "Write",
          sessionID: "test-session",
          args: { file_path: join(testDir, "test.ts") },
        },
        output2,
      );
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error).toBeInstanceOf(ConstraintViolationError);
      expect((error as any).result.violations).toHaveLength(1);
    }
  });

  it("should detect override command in chat messages", async () => {
    setupMindmodel(testDir);

    const { createConstraintReviewerHook } = await import("../../src/hooks/constraint-reviewer");

    let reviewCalled = false;
    const mockCtx = createMockCtx(testDir);
    const mockReviewFn = async () => {
      reviewCalled = true;
      return JSON.stringify({
        status: "BLOCKED",
        violations: [
          {
            file: "test.ts",
            line: 1,
            rule: "test rule",
            constraint_file: "test.md",
            found: "x",
            expected: "y",
          },
        ],
        summary: "Blocked",
      });
    };

    const hook = createConstraintReviewerHook(mockCtx as any, mockReviewFn);

    // First, set override via chat message
    await hook["chat.message"](
      { sessionID: "test-session" },
      { parts: [{ type: "text", text: "override: testing exception case" }] },
    );

    // Now the next tool call should skip review
    const output = { output: "bad code that would normally be blocked" };
    await hook["tool.execute.after"](
      {
        tool: "Write",
        sessionID: "test-session",
        args: { file_path: join(testDir, "test.ts") },
      },
      output,
    );

    // Review should have been skipped due to override
    expect(reviewCalled).toBe(false);
    expect(output.output).toBe("bad code that would normally be blocked");
  });

  it("should reset override after one use", async () => {
    setupMindmodel(testDir);

    const { createConstraintReviewerHook } = await import("../../src/hooks/constraint-reviewer");

    let reviewCallCount = 0;
    const mockCtx = createMockCtx(testDir);
    const mockReviewFn = async () => {
      reviewCallCount++;
      return '{"status": "PASS", "violations": [], "summary": "OK"}';
    };

    const hook = createConstraintReviewerHook(mockCtx as any, mockReviewFn);

    // Set override
    await hook["chat.message"](
      { sessionID: "test-session" },
      { parts: [{ type: "text", text: "override: one-time exception" }] },
    );

    // First tool call - should skip review
    await hook["tool.execute.after"](
      {
        tool: "Write",
        sessionID: "test-session",
        args: { file_path: join(testDir, "test.ts") },
      },
      { output: "code 1" },
    );

    expect(reviewCallCount).toBe(0);

    // Second tool call - should review again
    await hook["tool.execute.after"](
      {
        tool: "Write",
        sessionID: "test-session",
        args: { file_path: join(testDir, "test2.ts") },
      },
      { output: "code 2" },
    );

    expect(reviewCallCount).toBe(1);
  });

  it("should skip review when args has no file_path", async () => {
    setupMindmodel(testDir);

    const { createConstraintReviewerHook } = await import("../../src/hooks/constraint-reviewer");

    let reviewCalled = false;
    const mockCtx = createMockCtx(testDir);
    const mockReviewFn = async () => {
      reviewCalled = true;
      return '{"status": "PASS", "violations": [], "summary": "OK"}';
    };

    const hook = createConstraintReviewerHook(mockCtx as any, mockReviewFn);

    const output = { output: "some code" };
    await hook["tool.execute.after"]({ tool: "Write", sessionID: "test", args: {} }, output);

    expect(reviewCalled).toBe(false);
  });

  it("should gracefully handle review function errors", async () => {
    setupMindmodel(testDir);

    const { createConstraintReviewerHook } = await import("../../src/hooks/constraint-reviewer");

    const mockCtx = createMockCtx(testDir);
    const mockReviewFn = async () => {
      throw new Error("Review service unavailable");
    };

    const hook = createConstraintReviewerHook(mockCtx as any, mockReviewFn);

    // Should not throw, should gracefully degrade
    const output = { output: "some code" };
    await hook["tool.execute.after"](
      {
        tool: "Write",
        sessionID: "test",
        args: { file_path: join(testDir, "test.ts") },
      },
      output,
    );

    // Output should be unchanged (graceful degradation)
    expect(output.output).toBe("some code");
  });

  it("should track retry count per file, not per session", async () => {
    setupMindmodel(testDir);

    const { createConstraintReviewerHook, ConstraintViolationError } = await import(
      "../../src/hooks/constraint-reviewer"
    );

    const mockCtx = createMockCtx(testDir);
    const mockReviewFn = async () =>
      JSON.stringify({
        status: "BLOCKED",
        violations: [{ file: "test", rule: "rule", constraint_file: "c.md", found: "x", expected: "y" }],
      });

    const hook = createConstraintReviewerHook(mockCtx as any, mockReviewFn);

    // First file - first retry
    const output1 = { output: "code" };
    await hook["tool.execute.after"](
      { tool: "Write", sessionID: "test-session", args: { file_path: join(testDir, "file1.ts") } },
      output1,
    );
    expect(output1.output).toContain("constraint-violations");

    // Second file - should also be first retry (not blocked), since retry count is per-file
    const output2 = { output: "code" };
    await hook["tool.execute.after"](
      { tool: "Write", sessionID: "test-session", args: { file_path: join(testDir, "file2.ts") } },
      output2,
    );
    expect(output2.output).toContain("constraint-violations");

    // First file again - should now be blocked (second retry)
    try {
      await hook["tool.execute.after"](
        { tool: "Write", sessionID: "test-session", args: { file_path: join(testDir, "file1.ts") } },
        { output: "code" },
      );
      expect(true).toBe(false); // Should throw
    } catch (error) {
      expect(error).toBeInstanceOf(ConstraintViolationError);
    }
  });

  it("should cleanup session state via cleanupSession", async () => {
    setupMindmodel(testDir);

    const { createConstraintReviewerHook } = await import("../../src/hooks/constraint-reviewer");

    const mockCtx = createMockCtx(testDir);
    const mockReviewFn = async () =>
      JSON.stringify({
        status: "BLOCKED",
        violations: [{ file: "test", rule: "rule", constraint_file: "c.md", found: "x", expected: "y" }],
      });

    const hook = createConstraintReviewerHook(mockCtx as any, mockReviewFn);

    // Build up some state
    await hook["tool.execute.after"](
      { tool: "Write", sessionID: "cleanup-test", args: { file_path: join(testDir, "test.ts") } },
      { output: "code" },
    );

    // Cleanup
    hook.cleanupSession("cleanup-test");

    // After cleanup, retry count should be reset - so first edit should be a retry, not a block
    const output = { output: "code" };
    await hook["tool.execute.after"](
      { tool: "Write", sessionID: "cleanup-test", args: { file_path: join(testDir, "test.ts") } },
      output,
    );
    // Should append violations (first retry), not throw
    expect(output.output).toContain("constraint-violations");
  });
});
