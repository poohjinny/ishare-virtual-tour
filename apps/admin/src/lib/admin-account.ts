"use client";

import { useCallback, useEffect, useState } from "react";

import { ADMIN_ACCOUNT_COPY } from "@/lib/authoring-copy";

export type AdminAccountIdentity = {
  name: string;
  email: string;
  phone: string;
};

export const DEFAULT_ADMIN_ACCOUNT_IDENTITY: AdminAccountIdentity = {
  name: ADMIN_ACCOUNT_COPY.name,
  email: ADMIN_ACCOUNT_COPY.email,
  phone: ADMIN_ACCOUNT_COPY.phone,
};

export function adminAccountInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.at(0) ?? "")
    .join("")
    .toUpperCase();
}

const ACCOUNT_IDENTITY_STORAGE_KEY = "ishare-admin-account-identity";
const ACCOUNT_IDENTITY_EVENT = "ishare-admin-account-identity-change";

function normalizeIdentity(
  value: Partial<AdminAccountIdentity>,
): AdminAccountIdentity | null {
  if (
    typeof value.name !== "string" ||
    value.name.trim().length === 0 ||
    value.name.length > ADMIN_ACCOUNT_COPY.form.name.maxLength ||
    typeof value.email !== "string" ||
    value.email.trim().length === 0 ||
    value.email.length > ADMIN_ACCOUNT_COPY.form.email.maxLength
  ) {
    return null;
  }

  const phone =
    typeof value.phone === "string" ? value.phone : (
      DEFAULT_ADMIN_ACCOUNT_IDENTITY.phone
    );
  if (phone.length > ADMIN_ACCOUNT_COPY.form.phone.maxLength) return null;

  return {
    name: value.name,
    email: value.email,
    phone,
  };
}

function readStoredIdentity() {
  try {
    const stored = window.localStorage.getItem(ACCOUNT_IDENTITY_STORAGE_KEY);
    if (!stored) return DEFAULT_ADMIN_ACCOUNT_IDENTITY;
    const parsed: unknown = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object") {
      return DEFAULT_ADMIN_ACCOUNT_IDENTITY;
    }
    return (
      normalizeIdentity(parsed as Partial<AdminAccountIdentity>) ??
      DEFAULT_ADMIN_ACCOUNT_IDENTITY
    );
  } catch {
    return DEFAULT_ADMIN_ACCOUNT_IDENTITY;
  }
}

function persistIdentity(identity: AdminAccountIdentity) {
  window.localStorage.setItem(
    ACCOUNT_IDENTITY_STORAGE_KEY,
    JSON.stringify(identity),
  );
  window.dispatchEvent(new Event(ACCOUNT_IDENTITY_EVENT));
}

export function useAdminAccountIdentity() {
  const [identity, setIdentity] = useState(DEFAULT_ADMIN_ACCOUNT_IDENTITY);

  useEffect(() => {
    const syncIdentity = () => setIdentity(readStoredIdentity());
    syncIdentity();
    window.addEventListener("storage", syncIdentity);
    window.addEventListener(ACCOUNT_IDENTITY_EVENT, syncIdentity);
    return () => {
      window.removeEventListener("storage", syncIdentity);
      window.removeEventListener(ACCOUNT_IDENTITY_EVENT, syncIdentity);
    };
  }, []);

  const saveIdentity = useCallback((nextIdentity: AdminAccountIdentity) => {
    persistIdentity(nextIdentity);
    setIdentity(nextIdentity);
  }, []);

  return { identity, saveIdentity };
}
