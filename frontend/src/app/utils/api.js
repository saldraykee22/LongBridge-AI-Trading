"use client";

const DEFAULT_BACKEND_URL = "http://127.0.0.1:8000";

export function apiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const configuredBase = process.env.NEXT_PUBLIC_API_URL;
  if (configuredBase) {
    return `${configuredBase.replace(/\/$/, "")}${normalizedPath}`;
  }

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return `${DEFAULT_BACKEND_URL}${normalizedPath}`;
    }
  }

  return normalizedPath;
}
