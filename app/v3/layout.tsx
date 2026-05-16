/**
 * v3 layout — Infographic visual variant.
 *
 * This is a separate top-level layout under `/v3/*` that does NOT mount the
 * legacy `AppShell` / `AppSidebar` / `AppHeader`. Instead it provides v3's
 * own sidebar shell + scoped v3 theme. The rest of the application (the
 * `(app)` route group) is untouched.
 *
 * Auth: this scaffold inherits the root `(AuthProvider | QueryProvider)`
 * tree from `app/layout.tsx`, so existing session state still works.
 * No middleware change — `middleware.ts` already covers `/v3/*`.
 */

import './theme.css';
import V3Sidebar from '@/components/v3/screens/Sidebar';

export default function V3Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="v3-root">
      <div className="v3-app">
        <V3Sidebar />
        <main className="v3-main">{children}</main>
      </div>
    </div>
  );
}
