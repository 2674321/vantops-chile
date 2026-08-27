import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { ArrowLeft, Download, Upload } from "lucide-react";
import { exportBackup, importBackup, validateBackup, downloadBackup } from "../../storage/export";
import type { BackupData } from "../../storage/export";
import { APP_VERSION } from "../../version";
import { esCL as t } from "../../i18n/es-CL";

export function ExportImportPage() {
  const navigate = useNavigate();
  const [preview, setPreview] = useState<BackupData | null>(null);
  const [importResult, setImportResult] = useState<{ flights: number; batteries: number; places: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    const backup = await exportBackup(APP_VERSION);
    downloadBackup(backup);
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
        if (!validateBackup(data)) {
          setError(t.export.invalidFile);
          return;
        }
        setPreview(data);
      } catch {
        setError(t.export.invalidFile);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  async function handleImport() {
    if (!preview) return;
    try {
      const result = await importBackup(preview);
      setImportResult(result);
      setPreview(null);
    } catch {
      setError(t.export.importError);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={() => navigate("/bitacora")}>
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
          <Button onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            {t.export.exportData}
          </Button>
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
            <p className="text-sm text-red-400">{error}</p>
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
                <p>{t.export.version(preview.appVersion)}</p>
                <p>{t.export.importedAt(new Date(preview.exportedAt).toLocaleDateString("es-CL"))}</p>
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={handleImport}>
                  {t.export.confirmImport}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setPreview(null)}>
                  {t.export.cancelImport}
                </Button>
              </div>
            </div>
          )}

          {importResult && (
            <div className="rounded-lg border border-emerald-800/50 bg-emerald-950/30 p-3">
              <p className="text-sm text-emerald-300">
                {t.export.importSuccess(importResult.flights, importResult.batteries)}
                {importResult.places > 0 && ` · ${importResult.places} lugares`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
