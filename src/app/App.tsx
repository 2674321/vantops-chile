import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Plane, BookOpen } from "lucide-react";
import { HashRouter, NavLink, Navigate, Route, Routes } from "react-router-dom";
import { cn } from "../lib/utils";
import { esCL as t } from "../i18n/es-CL";
import { AboutPage } from "../features/about/AboutPage";
import DashboardPage from "../features/dashboard/DashboardPage";
import { LogbookPage } from "../features/logbook/LogbookPage";
import { FlightDetailPage } from "../features/logbook/FlightDetailPage";
import { FlightForm } from "../features/logbook/FlightForm";
import { BatteryPage } from "../features/logbook/BatteryPage";
import { ExportImportPage } from "../features/logbook/ExportImportPage";
import { ErrorBoundary } from "./ErrorBoundary";

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
      <ErrorBoundary>
        <HashRouter>
          <div className="flex min-h-dvh flex-col">
            <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
              <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-5 py-3 sm:px-6">
                <NavLink to="/" className={navLinkClass}>
                  <Plane aria-hidden className="h-4 w-4" />
                  {t.appName}
                </NavLink>
                <div className="flex gap-1">
                  <NavLink to="/bitacora" className={navLinkClass}>
                    <BookOpen aria-hidden className="h-4 w-4" />
                    {t.nav.logbook}
                  </NavLink>
                  <NavLink to="/acerca" className={navLinkClass}>
                    {t.nav.about}
                  </NavLink>
                </div>
              </div>
            </nav>

            <main className="flex-1">
              <div className="mx-auto w-full max-w-2xl px-5 py-6 sm:px-6">
                <Routes>
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/bitacora" element={<LogbookPage />} />
                  <Route path="/bitacora/nuevo" element={<FlightForm />} />
                  <Route path="/bitacora/:id" element={<FlightDetailPage />} />
                  <Route path="/bitacora/:id/editar" element={<FlightForm />} />
                  <Route path="/bitacora/baterias" element={<BatteryPage />} />
                  <Route path="/bitacora/exportar" element={<ExportImportPage />} />
                  <Route path="/acerca" element={<AboutPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
            </main>
          </div>
        </HashRouter>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
