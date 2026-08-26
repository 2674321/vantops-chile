import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Plane } from "lucide-react";
import { HashRouter, NavLink, Navigate, Route, Routes } from "react-router-dom";
import { cn } from "../lib/utils";
import { esCL as t } from "../i18n/es-CL";
import { AboutPage } from "../features/about/AboutPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors",
    isActive ? "bg-slate-800 text-sky-300" : "text-slate-400 hover:bg-slate-900 hover:text-slate-200",
  );

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <div className="flex min-h-dvh flex-col">
          <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
            <div className="mx-auto flex w-full max-w-xl items-center justify-between px-4 py-3">
              <NavLink to="/" className={navLinkClass}>
                <Plane aria-hidden className="h-4 w-4" />
                {t.appName}
              </NavLink>
              <NavLink to="/acerca" className={navLinkClass}>
                {t.nav.about}
              </NavLink>
            </div>
          </nav>

          <main className="flex-1">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/acerca" element={<AboutPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </HashRouter>
    </QueryClientProvider>
  );
}
