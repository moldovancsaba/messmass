/**
 * Dashboard layout (#47) — SSO-protected analytics routes.
 * WHAT: Wraps /dashboard/* with minimal chrome; auth enforced in middleware.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-layout">
      {children}
    </div>
  );
}
