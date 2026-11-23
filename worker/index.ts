/** Cloudflare Worker entry point for the Design Studio website. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  ADMIN_EMAILS?: string;
  ADMIN_USERNAME?: string;
  ADMIN_PASSWORD?: string;
  ADMIN_DISPLAY_NAME?: string;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

function needsAdminAccess(request: Request, pathname: string) {
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) return true;
  if (!pathname.startsWith("/api/inquiries")) return false;
  return !(pathname === "/api/inquiries" && request.method === "POST");
}

function privateWorkspaceResponse() {
  return new Response("需要管理員帳號才能進入。", {
    status: 401,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
      "www-authenticate": 'Basic realm="Sam Design Studio 私人後台", charset="UTF-8"',
    },
  });
}

function requestWithAdminIdentity(request: Request, env: Env) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Basic ")) return null;

  let credentials = "";
  try {
    credentials = atob(authorization.slice(6));
  } catch {
    return null;
  }
  const separator = credentials.indexOf(":");
  if (separator < 0) return null;

  const username = credentials.slice(0, separator);
  const password = credentials.slice(separator + 1);
  if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD) return null;
  if (username !== env.ADMIN_USERNAME || password !== env.ADMIN_PASSWORD) return null;

  const email = env.ADMIN_EMAILS?.split(",")[0]?.trim() || "admin@samdesign.local";
  const displayName = env.ADMIN_DISPLAY_NAME?.trim() || username;
  const headers = new Headers(request.headers);
  headers.set("oai-authenticated-user-id", `cloudflare-basic:${username}`);
  headers.set("oai-authenticated-user-email", email);
  headers.set("oai-authenticated-user-full-name", encodeURIComponent(displayName));
  headers.set("oai-authenticated-user-full-name-encoding", "percent-encoded-utf-8");
  return new Request(request, { headers });
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (needsAdminAccess(request, url.pathname)) {
      const authenticatedRequest = requestWithAdminIdentity(request, env);
      if (!authenticatedRequest) return privateWorkspaceResponse();
      request = authenticatedRequest;
    }

    if (
      url.pathname === "/" ||
      url.pathname === "/index.html" ||
      url.pathname === "/作品案例.html" ||
      url.pathname.startsWith("/assets/")
    ) {
      const assetPath = url.pathname === "/" ? "/index.html" : url.pathname;
      return env.ASSETS.fetch(new Request(new URL(assetPath, request.url), request));
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
