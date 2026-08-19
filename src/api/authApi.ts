// import { ApiError, mockResponse } from "./client";
import { request } from "./client";
import { UserRole } from "./types";
import type { AuthUser, LoginRequest, LoginResponse } from "./types";

const TOKEN_KEY = "trackflow.token";
const USER_KEY = "trackflow.user";

// interface MockAccount {
//   password: string;
//   user: AuthUser;
// }

// const ACCOUNTS: MockAccount[] = [
//   {
//     password: "trackflow",
//     user: {
//       id: "usr_001",
//       name: "Dana Whitfield",
//       email: "admin@trackflow.io",
//       role: UserRole.Admin,
//     },
//   },
//   {
//     password: "trackflow",
//     user: {
//       id: "usr_002",
//       name: "Marcus Okonkwo",
//       email: "operator@trackflow.io",
//       role: UserRole.Operator,
//     },
//   },
//   {
//     password: "trackflow",
//     user: {
//       id: "usr_003",
//       name: "Priya Rasmussen",
//       email: "merchant@trackflow.io",
//       role: UserRole.Merchant,
//       merchantId: "mer_001",
//     },
//   },
// ];

// export const DEMO_CREDENTIALS = { email: "admin@trackflow.io", password: "trackflow" };

function persist(response: LoginResponse, remember: boolean) {
  if (typeof window === "undefined") return;
  const storage = remember ? window.localStorage : window.sessionStorage;
  storage.setItem(TOKEN_KEY, response.token);
  storage.setItem(USER_KEY, JSON.stringify(response.user));
}

function readStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY) ?? window.sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}
//api
interface BackendAuthUser {
  id: number;
  merchantId: number | null;
  fullName: string;
  email: string;
  role: UserRole;
}

interface BackendLoginResponse {
  accessToken: string;
  expiresAt: string;
  user: BackendAuthUser;
}

export const authApi = {
  /** POST /api/auth/login */
  // async login(payload: LoginRequest): Promise<LoginResponse> {
  //   return mockResponse(() => {
  //     const account = ACCOUNTS.find((a) => a.user.email.toLowerCase() === payload.email.trim().toLowerCase());
  //     if (!account || account.password !== payload.password) {
  //       throw new ApiError("Invalid email or password. Please try again.", 401);
  //     }
  //     const response: LoginResponse = { token: `mock.${account.user.id}.token`, user: account.user };
  //     persist(response, Boolean(payload.rememberMe));
  //     return response;
  //   }, 700);
  // },

  async login(payload: LoginRequest): Promise<LoginResponse> {
    const response = await request<BackendLoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: payload.email,
        password: payload.password,
      }),
    });

    const result: LoginResponse = {
      token: response.accessToken,
      user: {
        id: String(response.user.id),
        name: response.user.fullName,
        email: response.user.email,
        role: response.user.role,
        merchantId:
          response.user.merchantId === null ? undefined : String(response.user.merchantId),
      },
    };

    persist(result, Boolean(payload.rememberMe));

    return result;
  },

  /** GET /api/auth/me */
  // async me(): Promise<AuthUser> {
  //   return mockResponse(() => {
  //     const user = readStoredUser();
  //     if (!user) throw new ApiError("Not authenticated", 401);
  //     return user;
  //   }, 150);
  // },

  async me(): Promise<AuthUser> {
    const response = await request<BackendAuthUser>("/auth/me");

    return {
      id: String(response.id),
      name: response.fullName,
      email: response.email,
      role: response.role,
      merchantId: response.merchantId === null ? undefined : String(response.merchantId),
    };
  },
  getCachedUser: readStoredUser,

  logout(): void {
    if (typeof window === "undefined") return;
    for (const storage of [window.localStorage, window.sessionStorage]) {
      storage.removeItem(TOKEN_KEY);
      storage.removeItem(USER_KEY);
    }
  },
};
