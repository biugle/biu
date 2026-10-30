import type { IncomingMessage, ServerResponse } from "node:http";

/** Serve the update baseline before Rsbuild's SPA fallback rewrites the URL. */
export function createDevManifestMiddleware(source: string) {
  return (request: IncomingMessage, response: ServerResponse, next: () => void) => {
    if (
      request.url?.split("?", 1)[0] !== "/manifest/routes.json" ||
      (request.method !== "GET" && request.method !== "HEAD")
    ) {
      next();
      return;
    }
    response.statusCode = 200;
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("Content-Length", Buffer.byteLength(source));
    response.end(request.method === "HEAD" ? undefined : source);
  };
}
