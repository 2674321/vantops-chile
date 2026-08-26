import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { esCL as t } from "../../i18n/es-CL";
import { APP_VERSION } from "../../version";

function ExternalLink({ href, children }: { href: string; children: string }) {
  return (
    <a
      className="text-sky-400 underline underline-offset-2 hover:text-sky-300"
      href={href}
      target="_blank"
      rel="noreferrer"
    >
      {children}
    </a>
  );
}

export function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-xl space-y-6 px-4 py-8">
      <header>
        <h1 className="text-2xl font-bold">{t.about.title}</h1>
        <p className="mt-1 text-xs text-slate-500">v{APP_VERSION} · 🚧 Development</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Qué es</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-300">{t.about.whatIs}</CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.about.disclaimerTitle}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-warn/90">{t.about.disclaimer}</CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.about.sourcesTitle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-slate-300">
          <p>
            <ExternalLink href="https://open-meteo.com/">Open-Meteo</ExternalLink> — pronóstico
            meteorológico (CC BY 4.0)
          </p>
          <p>
            <ExternalLink href="https://www.openstreetmap.org/copyright">OpenStreetMap</ExternalLink>{" "}
            — mapas (ODbL) · próximamente con Leaflet
          </p>
          <p>METAR/SPECI DMC · IFIS DGAC / aviationweather.gov — Fase 1</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.about.privacyTitle}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-300">{t.about.privacy}</CardContent>
      </Card>

      <footer className="space-y-1 pt-2 text-center text-xs text-slate-500">
        <p>
          Código:{" "}
          <ExternalLink href="https://github.com/2674321/vantops-chile">github.com/2674321/vantops-chile</ExternalLink>{" "}
          · MIT
        </p>
        <p>
          Autor: Patricio Varela C. (CA2OPX) ·{" "}
          <ExternalLink href="https://github.com/2674321">github.com/2674321</ExternalLink>
        </p>
      </footer>
    </div>
  );
}
