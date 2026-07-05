export type ApiResult<T> = {
  success: boolean;
  data?: T;
  message?: string | string[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

type RequestOptions = RequestInit & {
  token?: string | null;
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}) {
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    cache: options.cache ?? "no-store",
    next: options.next ?? { revalidate: 0 },
    ...options,
    headers
  }).catch(() => {
    throw new Error("API server is not reachable. Start the backend on http://localhost:5000 and try again.");
  });
  const payload = (await response.json().catch(() => ({}))) as ApiResult<T>;

  if (!response.ok || payload.success === false) {
    const message = Array.isArray(payload.message)
      ? payload.message.join(" ")
      : payload.message ?? "Something went wrong.";

    throw new Error(message);
  }

  return payload.data as T;
}
