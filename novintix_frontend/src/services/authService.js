import api from "./api";

export async function login(credentials) {
  const response = await api.post(
    "/auth/login",
    credentials
  );

  const { accessToken, user, expiresIn } = response.data;

  // Temporary storage for our local prototype.
  // Production should preferably use a secure,
  // HttpOnly cookie-based authentication design.
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("user", JSON.stringify(user));

  localStorage.setItem(
    "tokenExpiresAt",
    String(Date.now() + expiresIn)
  );

  return user;
}

export function logout() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
  localStorage.removeItem("tokenExpiresAt");
}

export function getCurrentUser() {
  const token = localStorage.getItem("accessToken");
  const expiry = Number(
    localStorage.getItem("tokenExpiresAt")
  );

  if (!token || !expiry || Date.now() >= expiry) {
    logout();
    return null;
  }

  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    logout();
    return null;
  }
}