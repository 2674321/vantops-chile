import { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Plane, BookOpen, MapPin, WifiOff, Wifi, Settings2 } from "lucide-react";
import { HashRouter, NavLink, Navigate, Route, Routes } from "react-router-dom";
import { cn } from "../lib/utils";
import { esCL as t } from "../i18n/es-CL";
import { ErrorBoundary } from "./ErrorBoundary";
import { ToastProvider } from "../components/toast/ToastProvider";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

const DashboardPage = lazy(() => import("../features/dashboard/DashboardPage"));
const SettingsPage = lazy(() => import("../features/settings/SettingsPage").then((m) => ({ default: m.SettingsPage })));
const LogbookPage = lazy(() => import("../features/logbook/LogbookPage").then((m) => ({ default: m.LogbookPage })));
const FlightDetailPage = lazy(() => import("../features/logbook/FlightDetailPage").then((m) => ({ default: m.FlightDetailPage })));
const FlightForm = lazy(() => import("../features/logbook/FlightForm").then((m) => ({ default: m.FlightForm })));
const BatteryPage = lazy(() => import("../features/logbook/BatteryPage").then((m) => ({ default: m.BatteryPage })));
const PlacesPage = lazy(() => import("../features/places/PlacesPage").then((m) => ({ default: m.PlacesPage })));
const AboutPage = lazy(() => import("../features/about/AboutPage").then((m) => ({ default: m.AboutPage })));
const ExportImportPage = lazy(() => import("../features/logbook/ExportImportPage").then((m) => ({ default: m.ExportImportPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const brandLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold transition-colors",
    isActive ? "text-sky-300" : "text-slate-200 hover:text-sky-300",
  );

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors",
    isActive
      ? "bg-slate-800 text-sky-300"
      : "text-slate-400 hover:bg-slate-900 hover:text-slate-200",
  );

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-slate-400">Cargando…</p>
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <ToastProvider>
          <HashRouter>
          <div className="flex min-h-dvh flex-col">
            <nav aria-label="Navegación principal" className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
              <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-5 pb-2 pt-3 sm:px-6">
                <NavLink to="/" className={brandLinkClass}>
                  <Plane aria-hidden className="h-4 w-4" />
                  {t.appName}
                </NavLink>
                <OnlineIndicator />
              </div>
              <div className="mx-auto w-full max-w-2xl px-5 pb-2 sm:px-6">
                <div className="no-scrollbar flex items-center gap-1 overflow-x-auto whitespace-nowrap">
                  <NavLink to="/" end className={navLinkClass}>
                    <span aria-hidden>⌂</span>
                    {t.nav.home}
                  </NavLink>
                  <NavLink to="/bitacora" className={navLinkClass}>
                    <BookOpen aria-hidden className="h-4 w-4" />
                    {t.nav.logbook}
                  </NavLink>
                  <NavLink to="/lugares" className={navLinkClass}>
                    <MapPin aria-hidden className="h-4 w-4" />
                    {t.nav.places}
                  </NavLink>
                  <NavLink to="/ajustes" className={navLinkClass}>
                    <Settings2 aria-hidden className="h-4 w-4" />
                    {t.nav.settings}
                  </NavLink>
                  <NavLink to="/acerca" className={navLinkClass}>
                    {t.nav.about}
                  </NavLink>
                </div>
              </div>
            </nav>

            <main className="flex-1">
              <div className="mx-auto w-full max-w-2xl px-5 py-6 sm:px-6">
                <Suspense fallback={<LoadingFallback />}>
                  <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/ajustes" element={<SettingsPage />} />
                    <Route path="/bitacora" element={<LogbookPage />} />
                    <Route path="/bitacora/nuevo" element={<FlightForm />} />
                    <Route path="/bitacora/:id" element={<FlightDetailPage />} />
                    <Route path="/bitacora/:id/editar" element={<FlightForm />} />
                    <Route path="/bitacora/baterias" element={<BatteryPage />} />
                    <Route path="/bitacora/exportar" element={<ExportImportPage />} />
                    <Route path="/lugares" element={<PlacesPage />} />
                    <Route path="/acerca" element={<AboutPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </div>
            </main>
          </div>
        </HashRouter>
        </ToastProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

function OnlineIndicator() {
  const online = useOnlineStatus();
  return (
    <span
      className="flex shrink-0 items-center gap-1 rounded px-2 py-1 text-xs"
      title={online ? t.offline.online : t.offline.offline}
    >
      {online ? (
        <Wifi className="h-3 w-3 text-emerald-400" />
      ) : (
        <WifiOff className="h-3 w-3 text-red-400" />
      )}
      <span className={online ? "text-emerald-400" : "text-red-400"}>
        {online ? t.offline.online : t.offline.offline}
      </span>
    </span>
  );
}