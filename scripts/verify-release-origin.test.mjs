import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:http";
import process from "node:process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const guardPath = resolve(projectRoot, "scripts/verify-release-origin.mjs");
const releaseSha = "a".repeat(40);

function releasePullRequest(overrides = {}) {
  const pullRequest = {
    number: 6,
    title: "chore: release packages",
    merged_at: "2026-10-08T01:27:15Z",
    base: { ref: "main" },
    head: { ref: "changeset-release/main", repo: { full_name: "biugle/biu" } },
    user: { login: "release-automation[bot]" },
  };
  return {
    ...pullRequest,
    ...overrides,
    base: { ...pullRequest.base, ...overrides.base },
    head: {
      ...pullRequest.head,
      ...overrides.head,
      repo: { ...pullRequest.head.repo, ...overrides.head?.repo },
    },
  };
}

async function runGuard({ pullRequests = [], eventName = "push", status = 200 } = {}) {
  const server = createServer((_request, response) => {
    response.writeHead(status, { "content-type": "application/json" });
    response.end(JSON.stringify(pullRequests));
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();

  const result = await new Promise((resolveResult, rejectResult) => {
    const child = spawn(process.execPath, [guardPath], {
      cwd: projectRoot,
      env: {
        PATH: process.env.PATH,
        GITHUB_EVENT_NAME: eventName,
        GITHUB_REF: "refs/heads/main",
        GITHUB_REPOSITORY: "biugle/biu",
        GITHUB_SHA: releaseSha,
        GITHUB_API_URL: `http://127.0.0.1:${address.port}`,
        GITHUB_TOKEN: "test-token",
      },
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8").on("data", (chunk) => (stdout += chunk));
    child.stderr.setEncoding("utf8").on("data", (chunk) => (stderr += chunk));
    child.once("error", rejectResult);
    child.once("close", async (code) => {
      await new Promise((resolveClose) => server.close(resolveClose));
      resolveResult({ code, stdout, stderr });
    });
  });

  return result;
}

test("allows a merged same-repository Changesets PR regardless of token owner", async () => {
  const result = await runGuard({ pullRequests: [releasePullRequest()] });
  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout, /Verified npm publish origin: merged Changesets release PR #6/);
});

test("skips a direct main push without an associated release PR", async () => {
  const result = await runGuard();
  assert.equal(result.code, 2);
  assert.match(result.stdout, /Skipping npm publish: this push is not a merged Changesets release PR/);
});

test("refuses PRs that do not match the Changesets release contract", async (context) => {
  const invalidCases = [
    ["not merged", { merged_at: null }],
    ["wrong title", { title: "feat: release packages" }],
    ["wrong target branch", { base: { ref: "master" } }],
    ["wrong source branch", { head: { ref: "feature/release" } }],
    ["fork source", { head: { repo: { full_name: "fork/biu" } } }],
  ];

  for (const [name, overrides] of invalidCases) {
    await context.test(name, async () => {
      const result = await runGuard({ pullRequests: [releasePullRequest(overrides)] });
      assert.equal(result.code, 2);
      assert.match(result.stdout, /Skipping npm publish/);
    });
  }
});

test("fails closed outside a main-branch push event", async () => {
  const result = await runGuard({ eventName: "pull_request" });
  assert.equal(result.code, 2);
  assert.match(result.stdout, /Skipping npm publish: this is not a push event/);
});

test("fails closed when GitHub cannot verify the PR association", async () => {
  const result = await runGuard({ status: 403 });
  assert.notEqual(result.code, 0);
  assert.match(result.stderr, /HTTP 403/);
});
