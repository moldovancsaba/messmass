"use client";

import React, { useState, useMemo } from "react";
import { PageType } from '@/lib/pagePassword';

/**
 * PasswordGate
 *
 * What:
 * - A reusable client-side gate component that renders a small password prompt
 *   until the provided page-specific password is validated (or an admin session is present).
 * - On success, it renders its children.
 *
 * Why:
 * - Implements the zero-trust rule consistently across pages/sections by reusing
 *   the existing API endpoints (/api/page-passwords) and admin session bypass.
 * - Uses our design system classes (.form-input, .btn) to match UI standards.
 */
export default function PasswordGate({
  pageId,
  pageType,
  children,
  onSuccess,
  className,
  inputPlaceholder = "Enter page password",
  label = "This content is protected.",
  buttonLabel = "Unlock",
}: {
  pageId: string;
  pageType: PageType;
  children?: React.ReactNode;
  onSuccess?: () => void;
  className?: string;
  inputPlaceholder?: string;
  label?: string;
  buttonLabel?: string;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  const buttonDisabled = useMemo(() => loading || password.trim().length === 0, [loading, password]);

  async function validate() {
    setError("");
    setLoading(true);
    try {
      // Security rationale: we never store secrets in client storage.
      // We simply send the provided password to the server for validation.
      const res = await fetch("/api/page-passwords", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId, pageType, password }),
      });
      const data = await res.json();

      if (res.ok && data?.success && data?.isValid) {
        setUnlocked(true);
        if (onSuccess) onSuccess();
      } else {
        setError(data?.error || "Invalid password");
      }
    } catch (e) {
      setError("Unable to validate password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (unlocked) return <>{children ?? null}</>;

  return (
    <div className={className}>
      {/* Functional: Prompt UI for page-specific password */}
      {/* Strategic: Minimal UX, leveraging design system classes for consistency */}
      <div className="mb-2">{label}</div>
      <div className="flex-row-sm">
        <input
          className="form-input"
          type="password"
          placeholder={inputPlaceholder}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-label="Protected content password"
        />
        <button className="btn btn-primary" onClick={validate} disabled={buttonDisabled}>
          {loading ? "…" : buttonLabel}
        </button>
      </div>
      {error && <div className="text-error-red mt-2">{error}</div>}
    </div>
  );
}