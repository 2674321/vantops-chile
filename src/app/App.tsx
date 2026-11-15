import { Suspense, lazy, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Plane, BookOpen, ClipboardCheck, MapPin, WifiOff, Wifi, Settings2, Wrench, Map as MapIcon, Menu, Info } from "lucide-react";
import { HashRouter, NavLink, Navigate, Route, Routes, useLocation } from "react-router-dom";
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
const FlightPlansPage = lazy(() => import("../features/plans/FlightPlansPage").then((m) => ({ default: m.FlightPlansPage })));
const FlightPlanForm = lazy(() => import("../features/plans/FlightPlanForm").then((m) => ({ default: m.FlightPlanForm })));
const UtilitiesPage = lazy(() => import("../features/utilities/UtilitiesPage").then((m) => ({ default: m.UtilitiesPage })));
const OperationalMapPage = lazy(() => import("../features/utilities/map/OperationalMapPage").then((m) => ({ default: m.OperationalMapPage })));

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

const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[10px] font-medium leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
    isActive ? "bg-slate-800 text-sky-300" : "text-slate-400 hover:bg-slate-900 hover:text-slate-200",
  );

function PrimaryNavigation() {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const secondaryActive = ["/bitacora", "/lugares", "/ajustes", "/acerca"].some((path) => location.pathname.startsWith(path));
  return (
    <nav aria-label="Navegación principal" className="border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 pb-2 pt-3 sm:px-6">
        <NavLink to="/" className={brandLinkClass}><Plane aria-hidden className="h-4 w-4" />{t.appName}</NavLink>
        <OnlineIndicator />
      </div>
      <div className="mx-auto hidden w-full max-w-5xl flex-wrap items-center gap-1 px-6 pb-2 sm:flex">
        <NavLink to="/" end className={navLinkClass}><span aria-hidden>⌂</span>{t.nav.home}</NavLink>
        <NavLink to="/utilidades/mapa" className={navLinkClass}><MapIcon aria-hidden className="h-4 w-4" />Mapa</NavLink>
        <NavLink to="/operacion" className={navLinkClass}><ClipboardCheck aria-hidden className="h-4 w-4" />{t.nav.operation}</NavLink>
        <NavLink to="/bitacora" className={navLinkClass}><BookOpen aria-hidden className="h-4 w-4" />{t.nav.logbook}</NavLink>
        <NavLink to="/utilidades" end className={navLinkClass}><Wrench aria-hidden className="h-4 w-4" />{t.nav.utilities}</NavLink>
        <NavLink to="/lugares" className={navLinkClass}><MapPin aria-hidden className="h-4 w-4" />{t.nav.places}</NavLink>
        <NavLink to="/ajustes" className={navLinkClass}><Settings2 aria-hidden className="h-4 w-4" />{t.nav.settings}</NavLink>
        <NavLink to="/acerca" className={navLinkClass}><Info aria-hidden className="h-4 w-4" />{t.nav.about}</NavLink>
      </div>
      <div className="px-2 pb-2 sm:hidden">
        <div className="grid grid-cols-5 gap-1">
          <NavLink to="/" end className={mobileNavLinkClass}><span aria-hidden className="text-base">⌂</span>{t.nav.home}</NavLink>
          <NavLink to="/utilidades/mapa" className={mobileNavLinkClass}><MapIcon aria-hidden className="h-4 w-4" />Mapa</NavLink>
          <NavLink to="/operacion" className={mobileNavLinkClass}><ClipboardCheck aria-hidden className="h-4 w-4" />Operación</NavLink>
          <NavLink to="/utilidades" end className={mobileNavLinkClass}><Wrench aria-hidden className="h-4 w-4" />Utilidades</NavLink>
          <button type="button" aria-expanded={moreOpen} aria-controls="mobile-secondary-nav" onClick={() => setMoreOpen((value) => !value)} className={cn(mobileNavLinkClass({ isActive: secondaryActive || moreOpen }))}><Menu aria-hidden className="h-4 w-4" />Más</button>
        </div>
        {moreOpen && (
          <div id="mobile-secondary-nav" className="mt-1 grid grid-cols-4 gap-1 rounded-lg border border-slate-800 bg-slate-950 p-1">
            <NavLink to="/bitacora" onClick={() => setMoreOpen(false)} className={mobileNavLinkClass}><BookOpen aria-hidden className="h-4 w-4" />Bitácora</NavLink>
            <NavLink to="/lugares" onClick={() => setMoreOpen(false)} className={mobileNavLinkClass}><MapPin aria-hidden className="h-4 w-4" />Lugares</NavLink>
            <NavLink to="/ajustes" onClick={() => setMoreOpen(false)} className={mobileNavLinkClass}><Settings2 aria-hidden className="h-4 w-4" />Ajustes</NavLink>
            <NavLink to="/acerca" onClick={() => setMoreOpen(false)} className={mobileNavLinkClass}><Info aria-hidden className="h-4 w-4" />Acerca</NavLink>
          </div>
        )}
      </div>
    </nav>
  );
}

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
            <PrimaryNavigation />

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
                    <Route path="/operacion" element={<FlightPlansPage />} />
                    <Route path="/operacion/nueva" element={<FlightPlanForm />} />
                    <Route path="/operacion/:id" element={<FlightPlanForm />} />
                    <Route path="/lugares" element={<PlacesPage />} />
                    <Route path="/utilidades" element={<UtilitiesPage />} />
                    <Route path="/utilidades/mapa" element={<OperationalMapPage />} />
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
