"use client";

import { isUserRole, type UserRole } from "@/lib/auth/roles";
import { localSessionKey } from "@/lib/local/free-mode";

export type AuthUserFileRow = {
  username?: unknown;
  email?: unknown;
  password?: unknown;
  passwordHash?: unknown;
  fullName?: unknown;
  role?: unknown;
  active?: unknown;
  isActive?: unknown;
};

export type AuthUser = {
  username: string;
  email: string;
  password: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  active: boolean;
};

export type FileAuthSession = {
  source: "file-auth";
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  loginAt: string;
};

type AuthUsersFile = {
  users?: AuthUserFileRow[];
};

function getAuthUsersFileUrl() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return `${basePath}/auth-users.json`;
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeUser(row: AuthUserFileRow): AuthUser | null {
  const username = text(row.username);
  const email = text(row.email);
  const password = text(row.password);
  const passwordHash = text(row.passwordHash).toLowerCase();
  const fullName = text(row.fullName) || username || email || "Nguoi dung";
  const role = isUserRole(row.role) ? row.role : "admin";
  const active = row.active === false || row.isActive === false ? false : true;

  if (!username && !email) {
    return null;
  }

  if (!password && !passwordHash) {
    return null;
  }

  return {
    username: username || email,
    email,
    password,
    passwordHash,
    fullName,
    role,
    active,
  };
}

async function sha256(value: string) {
  const data = new TextEncoder().encode(value);
  const digest = await window.crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function loadAuthUsers() {
  const response = await fetch(getAuthUsersFileUrl(), { cache: "no-store" });

  if (!response.ok) {
    throw new Error("Khong doc duoc file public/auth-users.json.");
  }

  const file = (await response.json()) as AuthUsersFile;
  const users = Array.isArray(file.users)
    ? file.users.map(normalizeUser).filter((user): user is AuthUser => Boolean(user))
    : [];

  if (users.length === 0) {
    throw new Error("File auth-users.json chua co tai khoan hop le.");
  }

  return users;
}

async function matchesPassword(user: AuthUser, password: string) {
  if (user.passwordHash) {
    return (await sha256(password)) === user.passwordHash;
  }

  return user.password === password;
}

export async function authenticateFromFile(identifier: string, password: string) {
  const normalizedIdentifier = identifier.trim().toLowerCase();
  const users = await loadAuthUsers();
  const user = users.find(
    (item) =>
      item.active &&
      (item.username.toLowerCase() === normalizedIdentifier ||
        (Boolean(item.email) && item.email.toLowerCase() === normalizedIdentifier)),
  );

  if (!user || !(await matchesPassword(user, password))) {
    throw new Error("Tai khoan hoac mat khau khong dung.");
  }

  return createFileAuthSession(user);
}

export function createFileAuthSession(user: AuthUser): FileAuthSession {
  return {
    source: "file-auth",
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    loginAt: new Date().toISOString(),
  };
}

export function saveFileAuthSession(session: FileAuthSession) {
  window.localStorage.setItem(localSessionKey, JSON.stringify(session));
}

export function clearFileAuthSession() {
  window.localStorage.removeItem(localSessionKey);
}

export function getStoredFileAuthSession(): FileAuthSession | null {
  try {
    const raw = window.localStorage.getItem(localSessionKey);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<FileAuthSession>;

    if (
      parsed.source !== "file-auth" ||
      typeof parsed.username !== "string" ||
      typeof parsed.fullName !== "string" ||
      !isUserRole(parsed.role)
    ) {
      return null;
    }

    return {
      source: "file-auth",
      username: parsed.username,
      email: typeof parsed.email === "string" ? parsed.email : "",
      fullName: parsed.fullName,
      role: parsed.role,
      loginAt: typeof parsed.loginAt === "string" ? parsed.loginAt : "",
    };
  } catch {
    return null;
  }
}
