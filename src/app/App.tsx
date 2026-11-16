import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BookOpen, ClipboardCheck, CloudSun, Info, Map as MapIcon, Menu, Settings2, Wifi, WifiOff } from "lucide-react";
import { Suspense, lazy, useState } from "react";
import { HashRouter, NavLink, Navigate, Route, Routes, useLocation } from "react-router-dom";
import brandMarkUrl from "../assets/brand/b1-symbol.svg";
import { ToastProvider } from "../components/toast/ToastProvider";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { esCL as t } from "../i18n/es-CL";
import { cn } from "../lib/utils";
import { ErrorBoundary } from "./ErrorBoundary";

const ConditionsPage = lazy(() => import("../features/dashboard/DashboardPage"));
const SettingsPage = lazy(() => import("../features/settings/SettingsPage").then((m) => ({ default: m.SettingsPage })));
const LogbookPage = lazy(() => import("../features/logbook/LogbookPage").then((m) => ({ default: m.LogbookPage })));
const FlightDetailPage = lazy(() => import("../features/logbook/FlightDetailPage").then((m) => ({ default: m.FlightDetailPage })));
const FlightForm = lazy(() => import("../features/logbook/FlightForm").then((m) => ({ default: m.FlightForm })));
const BatteryPage = lazy(() => import("../features/logbook/BatteryPage").then((m) => ({ default: m.BatteryPage })));
const AboutPage = lazy(() => import("../features/about/AboutPage").then((m) => ({ default: m.AboutPage })));
const ExportImportPage = lazy(() => import("../features/logbook/ExportImportPage").then((m) => ({ default: m.ExportImportPage })));
const FlightPlansPage = lazy(() => import("../features/plans/FlightPlansPage").then((m) => ({ default: m.FlightPlansPage })));
const FlightPlanForm = lazy(() => import("../features/plans/FlightPlanForm").then((m) => ({ default: m.FlightPlanForm })));
const OperationalMapPage = lazy(() => import("../features/utilities/map/OperationalMapPage").then((m) => ({ default: m.OperationalMapPage })));

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 5 * 60_000, retry: 1, refetchOnWindowFocus: false } } });

const navLinkClass = ({ isActive }: { isActive: boolean }) => cn("flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm transition-colors", isActive ? "bg-slate-800 text-sky-300" : "text-slate-400 hover:bg-slate-900 hover:text-slate-200");
const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) => cn("flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[10px] font-medium leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400", isActive ? "bg-slate-800 text-sky-300" : "text-slate-400");

export function LegacyMapRedirect() {
  const { search } = useLocation();
  return <Navigate to={{ pathname: "/", search }} replace />;
}

export function LegacyPlacesRedirect() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  params.set("panel", "pines");
  return <Navigate to={{ pathname: "/", search: `?${params.toString()}` }} replace />;
}

function PrimaryNavigation() {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const secondaryActive = ["/ajustes", "/acerca"].some((path) => location.pathname.startsWith(path));
  return <>
    <nav aria-label="Navegación principal" className="relative z-[900] shrink-0 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-[1600px] items-center gap-2 px-3 sm:px-5">
        <NavLink to="/" className="mr-auto flex items-center gap-2 rounded-lg text-sm font-semibold text-slate-100 focus-visible:ring-2 focus-visible:ring-sky-400" aria-label={`${t.appName} · Mapa`}>
          <img src={brandMarkUrl} width="28" height="28" alt="" aria-hidden /><span className="hidden min-[360px]:inline">{t.appName}</span>
        </NavLink>
        <div className="hidden items-center gap-1 sm:flex">
          <NavLink to="/" end className={navLinkClass}><MapIcon aria-hidden className="h-4 w-4" />Mapa</NavLink>
          <NavLink to="/operacion" className={navLinkClass}><ClipboardCheck aria-hidden className="h-4 w-4" />Mi operación</NavLink>
          <NavLink to="/bitacora" className={navLinkClass}><BookOpen aria-hidden className="h-4 w-4" />Bitácora</NavLink>
          <NavLink to="/condiciones" className={navLinkClass}><CloudSun aria-hidden className="h-4 w-4" />Condiciones</NavLink>
          <div className="relative">
            <button type="button" aria-expanded={moreOpen} aria-controls="desktop-more-menu" onClick={() => setMoreOpen((value) => !value)} className={navLinkClass({ isActive: secondaryActive || moreOpen })}><Menu aria-hidden className="h-4 w-4" />Más</button>
            {moreOpen && <div id="desktop-more-menu" className="absolute right-0 top-11 w-48 rounded-xl border border-slate-700 bg-slate-950 p-1 shadow-xl">
              <NavLink to="/ajustes" onClick={() => setMoreOpen(false)} className={navLinkClass}><Settings2 className="h-4 w-4" />Ajustes</NavLink>
              <NavLink to="/acerca" onClick={() => setMoreOpen(false)} className={navLinkClass}><Info className="h-4 w-4" />Acerca y contacto</NavLink>
            </div>}
          </div>
        </div>
        <OnlineIndicator />
      </div>
    </nav>
    <nav aria-label="Navegación móvil" className="fixed inset-x-0 bottom-0 z-[1000] border-t border-slate-800 bg-slate-950/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden">
      {moreOpen && <div className="absolute inset-x-2 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] grid grid-cols-3 gap-1 rounded-xl border border-slate-700 bg-slate-950 p-1 shadow-xl">
        <NavLink to="/condiciones" onClick={() => setMoreOpen(false)} className={mobileNavLinkClass}><CloudSun className="h-4 w-4" />Condiciones</NavLink>
        <NavLink to="/ajustes" onClick={() => setMoreOpen(false)} className={mobileNavLinkClass}><Settings2 className="h-4 w-4" />Ajustes</NavLink>
        <NavLink to="/acerca" onClick={() => setMoreOpen(false)} className={mobileNavLinkClass}><Info className="h-4 w-4" />Acerca</NavLink>
      </div>}
      <div className="grid grid-cols-4 gap-1">
        <NavLink to="/" end className={mobileNavLinkClass}><MapIcon className="h-4 w-4" />Mapa</NavLink>
        <NavLink to="/operacion" className={mobileNavLinkClass}><ClipboardCheck className="h-4 w-4" />Operación</NavLink>
        <NavLink to="/bitacora" className={mobileNavLinkClass}><BookOpen className="h-4 w-4" />Bitácora</NavLink>
        <button type="button" aria-expanded={moreOpen} onClick={() => setMoreOpen((value) => !value)} className={mobileNavLinkClass({ isActive: secondaryActive || moreOpen })}><Menu className="h-4 w-4" />Más</button>
      </div>
    </nav>
  </>;
}

function LoadingFallback() {
  return <div className="flex min-h-60 items-center justify-center"><p className="text-sm text-slate-400">Cargando…</p></div>;
}

function AppShell() {
  const location = useLocation();
  const isWorkspace = location.pathname === "/";
  return <div className={cn("flex flex-col", isWorkspace ? "h-dvh overflow-hidden" : "min-h-dvh")}>
    <PrimaryNavigation />
    <main className={cn("min-h-0 flex-1 pb-14 sm:pb-0", isWorkspace && "flex overflow-hidden")}>
      <div className={cn("w-full", isWorkspace ? "min-h-0 flex-1" : "mx-auto max-w-2xl px-5 py-6 sm:px-6")}>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<OperationalMapPage />} />
            <Route path="/condiciones" element={<ConditionsPage />} />
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
            <Route path="/lugares" element={<LegacyPlacesRedirect />} />
            <Route path="/utilidades" element={<LegacyMapRedirect />} />
            <Route path="/utilidades/mapa" element={<LegacyMapRedirect />} />
            <Route path="/acerca" element={<AboutPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
    </main>
    {!isWorkspace && <footer className="border-t border-slate-900 px-4 py-4 text-center text-xs text-slate-500"><a className="hover:text-sky-400" href="https://github.com/2674321" target="_blank" rel="noopener noreferrer">GitHub</a><span aria-hidden> · </span><a className="hover:text-sky-400" href="mailto:pvc.devno@gmail.com">pvc.devno@gmail.com</a></footer>}
  </div>;
}

export function App() {
  return <QueryClientProvider client={queryClient}><ErrorBoundary><ToastProvider><HashRouter><AppShell /></HashRouter></ToastProvider></ErrorBoundary></QueryClientProvider>;
}

function OnlineIndicator() {
  const online = useOnlineStatus();
  return <span className="flex shrink-0 items-center gap-1 rounded px-2 py-1 text-xs" title={online ? t.offline.online : t.offline.offline}>{online ? <Wifi className="h-3 w-3 text-emerald-400" /> : <WifiOff className="h-3 w-3 text-red-400" />}<span className={cn("hidden min-[420px]:inline", online ? "text-emerald-400" : "text-red-400")}>{online ? t.offline.online : t.offline.offline}</span></span>;
}
