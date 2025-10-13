"use client";

import React, { useState } from "react";
import PasswordGate from "@/components/PasswordGate";

/**
 * Example page that demonstrates:
 * 1) Generating a page-specific password for a demo pageId ("demo-event")
 * 2) Gating a section using the reusable PasswordGate component
 *
 * Notes:
 * - This page is for demonstration only and should not be linked in navigation.
 * - Uses existing /api/page-passwords endpoints to generate and validate.
 */
export default function PasswordGateDemoPage() {
  const [generated, setGenerated] = useState<null | { url: string; password: string }>(null);
  const [generating, setGenerating] = useState(false);
  const pageId = "demo-event";
  const pageType = "stats" as const;

  async function generate() {
    setGenerating(true);
    setGenerated(null);
    try {
      const res = await fetch("/api/page-passwords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId, pageType }),
      });
      const data = await res.json();
      if (res.ok && data?.success) {
        setGenerated({ url: data?.shareableLink?.url, password: data?.pagePassword?.password });
      } else {
        alert(data?.error || "Failed to generate password");
      }
    } catch (e) {
      alert("Unexpected error while generating password");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="page-container admin-card">
      <h1>PasswordGate Demo</h1>
      <p>
        This page demonstrates creating a page password and gating sensitive content for pageId=<code>{pageId}</code> (type: <code>{pageType}</code>).
      </p>

      <div>
        <button className="btn btn-info" onClick={generate} disabled={generating}>
          {generating ? "Generating…" : "Generate demo password"}
        </button>
        {generated && (
          <div className="admin-card admin-card">
            <div><strong>Shareable URL:</strong> {generated.url}</div>
            <div><strong>Password:</strong> {generated.password}</div>
          </div>
        )}
      </div>

      <h2>Protected Section</h2>
      <PasswordGate pageId={pageId} pageType={pageType}>
        <div className="admin-card admin-card">
          <strong>Unlocked:</strong> You are now viewing protected content gated by PasswordGate.
        </div>
      </PasswordGate>
    </div>
  );
}