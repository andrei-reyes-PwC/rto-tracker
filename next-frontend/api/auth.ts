export type LoginCredentials = {
  email: string;
  password: string;
};

type ApiErrorResponse = {
  message?: string;
  details?: string[];
};

export type LoginResult =
  | { success: true }
  | { success: false; message: string };

export async function login(credentials: LoginCredentials): Promise<LoginResult> {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(credentials),
    });

    if (response.ok) {
      return { success: true };
    }

    const error = (await response.json().catch(() => null)) as ApiErrorResponse | null;
    return {
      success: false,
      message:
        error?.details?.join(" ") ||
        error?.message ||
        "Sign-in failed. Check your email and password.",
    };
  } catch {
    return {
      success: false,
      message: "Could not connect to the sign-in service. Please try again.",
    };
  }
}
