// Permit npm publishing only for a verified merged Changesets Release PR.
// Exit code 2 means "skip publishing"; malformed metadata/API failures throw
// so the caller fails closed instead of treating an unverifiable push as safe.
import process from "node:process";

const allowedBranches = new Set(["main", "master"]);
const expectedTitle = "chore: release packages";

async function main() {
  const eventName = process.env.GITHUB_EVENT_NAME;
  const ref = process.env.GITHUB_REF;
  const repository = process.env.GITHUB_REPOSITORY;
  const commitSha = process.env.GITHUB_SHA;

  if (eventName !== "push") {
    console.log("[biu] Skipping npm publish: this is not a push event.");
    return 2;
  }

  const branch = ref?.startsWith("refs/heads/") ? ref.slice("refs/heads/".length) : "";
  if (!allowedBranches.has(branch)) {
    console.log("[biu] Skipping npm publish: this push is not to main/master.");
    return 2;
  }

  if (!repository || !/^[^/]+\/[^/]+$/.test(repository) || !/^[\da-f]{40}$/i.test(commitSha ?? "")) {
    throw new Error("[biu] Refusing npm publish: GitHub repository or commit metadata is invalid.");
  }

  const apiBase = (process.env.GITHUB_API_URL ?? "https://api.github.com").replace(/\/$/, "");
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  const response = await globalThis.fetch(`${apiBase}/repos/${repository}/commits/${commitSha}/pulls?per_page=100`, {
    headers,
  });
  if (!response.ok) {
    throw new Error(`[biu] Refusing npm publish: GitHub could not verify the release PR (HTTP ${response.status}).`);
  }

  const pullRequests = await response.json();
  if (!Array.isArray(pullRequests)) {
    throw new Error("[biu] Refusing npm publish: GitHub returned an invalid pull request response.");
  }

  const expectedHead = `changeset-release/${branch}`;
  const releasePullRequest = pullRequests.find((pullRequest) => {
    const sameRepository = pullRequest.head?.repo?.full_name?.toLowerCase() === repository.toLowerCase();
    return (
      pullRequest.merged_at &&
      pullRequest.title === expectedTitle &&
      pullRequest.base?.ref === branch &&
      pullRequest.head?.ref === expectedHead &&
      sameRepository
    );
  });

  if (!releasePullRequest) {
    console.log("[biu] Skipping npm publish: this push is not a merged Changesets release PR.");
    return 2;
  }

  console.log(`[biu] Verified npm publish origin: merged Changesets release PR #${releasePullRequest.number}.`);
  return 0;
}

main()
  .then((result) => {
    process.exitCode = result;
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
