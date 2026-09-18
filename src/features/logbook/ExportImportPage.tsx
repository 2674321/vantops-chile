import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { ArrowLeft, Download, Upload, FileSpreadsheet } from "lucide-react";
import { exportBackup, importBackup, inspectBackup, downloadBackup, countImportableSettings, CURRENT_BACKUP_VERSION, MAX_BACKUP_VERSION, BackupValidationError } from "../../storage/export";
import type { BackupData, ImportSummary } from "../../storage/export";
import { listFlights } from "../../storage/repositories/flightRepository";
import { flightsToCsv } from "../../storage/csvExport";
import { downloadTextFile } from "../../lib/download";
import { APP_VERSION } from "../../version";
import { useToast } from "../../components/toast/useToast";
import { esCL as t } from "../../i18n/es-CL";

export function ExportImportPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [preview, setPreview] = useState<BackupData | null>(null);
  const [importResult, setImportResult] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [csvMessage, setCsvMessage] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    if (exporting) return;
    setExporting(true);
    try {
      const backup = await exportBackup(APP_VERSION);
      downloadBackup(backup);
      toast.success(t.feedback.backupExported);
    } catch {
      setError(t.feedback.backupExportError);
    } finally {
      setExporting(false);
    }
  }

  async function handleCsvExport() {
    if (exportingCsv) return;
    setError(null);
    setCsvMessage(null);
    setExportingCsv(true);
    try {
      const flights = await listFlights(1000);
      if (flights.length === 0) {
        setCsvMessage(t.export.csvEmpty);
        return;
      }
      const csv = flightsToCsv(flights);
      downloadTextFile(
        `vantops-bitacora-${new Date().toISOString().slice(0, 10)}.csv`,
        csv,
        "text/csv;charset=utf-8"
      );
      toast.success(t.feedback.csvExported);
    } catch {
      setError(t.feedback.csvError);
    } finally {
      setExportingCsv(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        const inspection = inspectBackup(data);
        if (!inspection.ok) {
          setError(inspection.error);
          setPreview(null);
          return;
        }
        setPreview(inspection.data);
      } catch {
        setError(t.export.invalidFile);
        setPreview(null);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  async function handleImport() {
    if (!preview || importing) return;
    setImporting(true);
    try {
      const result = await importBackup(preview);
      setImportResult(result);
      setPreview(null);
      toast.success(t.feedback.backupImported);
    } catch (err) {
      setError(err instanceof BackupValidationError ? err.message : t.export.importError);
    } finally {
      setImporting(false);
    }
  }

  const settingsCount = preview ? countImportableSettings(preview.settings) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={() => navigate("/bitacora")} aria-label="Volver a la bitácora">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold text-slate-100">{t.export.title}</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Download className="h-4 w-4 text-sky-400" />
            {t.export.exportData}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-400">{t.export.privacyNote}</p>
          <Button onClick={handleExport} disabled={exporting}>
            <Download className="mr-2 h-4 w-4" />
            {exporting ? t.feedback.exporting : t.export.exportData}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileSpreadsheet className="h-4 w-4 text-sky-400" />
            {t.export.csvTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-400">{t.export.csvDescription}</p>
          <Button variant="outline" onClick={handleCsvExport} disabled={exportingCsv}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            {exportingCsv ? t.feedback.exporting : t.export.csvAction}
          </Button>
          {csvMessage && (
            <p className="text-sm text-slate-400">{csvMessage}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Upload className="h-4 w-4 text-sky-400" />
            {t.export.importData}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            {t.export.importData}
          </Button>

          {error && (
            <p role="alert" className="text-sm text-red-400">{error}</p>
          )}

          {preview && (
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
              <p className="mb-2 text-sm font-medium text-slate-200">{t.export.importPreview}</p>
              <div className="space-y-1 text-sm text-slate-400">
                <p>{t.export.flights(preview.flights.length)}</p>
                <p>{t.export.batteries(preview.batteries.length)}</p>
                {Array.isArray(preview.places) && preview.places.length > 0 && (
                  <p>{preview.places.length} lugares</p>
                )}
                {settingsCount > 0 && (
                  <p>
                    {settingsCount} configuraciones (límites de vuelo, aeronave activa, última ubicación)
                  </p>
                )}
                <p>{t.export.version(preview.appVersion)}</p>
                <p>{t.export.importedAt(new Date(preview.exportedAt).toLocaleDateString("es-CL"))}</p>
                {typeof preview.version === "number" && preview.version !== CURRENT_BACKUP_VERSION && (
                  <p className="text-amber-300">
                    Versión de formato respaldo: {preview.version} (compatible: hasta {MAX_BACKUP_VERSION})
                  </p>
                )}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                La importación reemplaza registros con fecha de actualización más reciente y restaura
                la configuración compatible. No elimina datos locales existentes.
              </p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={handleImport} disabled={importing}>
                  {importing ? t.feedback.importing : t.export.confirmImport}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setPreview(null)} disabled={importing}>
                  {t.export.cancelImport}
                </Button>
              </div>
            </div>
          )}

          {importResult && (
            <div className="rounded-lg border border-emerald-800/50 bg-emerald-950/30 p-3">
              <p className="text-sm text-emerald-300">
                Importados: {importResult.flights} vuelos · {importResult.batteries} baterías
                {importResult.places > 0 && ` · ${importResult.places} lugares`}
                {importResult.settings > 0 && ` · ${importResult.settings} configuraciones`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
