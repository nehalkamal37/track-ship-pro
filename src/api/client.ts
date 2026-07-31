// Central API client configuration.
// Today every service resolves against the in-memory mock store; swapping the
// mock helpers below for `request()` calls is the only change needed to talk to
// the real ASP.NET Core API.

export const API_BASE_URL = import.meta.env["VITE_API_BASE_URL"] ?? "/api";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Simulated network latency for the mock implementation. */
export function delay(ms = 450) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function mockResponse<T>(factory: () => T, ms?: number): Promise<T> {
  await delay(ms);
  return factory();
}

/** Reserved for the real HTTP implementation. */
export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!response.ok) {
    throw new ApiError(await response.text(), response.status);
  }
  return (await response.json()) as T;
}
