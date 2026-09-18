import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { ArrowLeft, Plus, Trash2, RotateCw, Edit } from "lucide-react";
import { listBatteries, createBattery, deleteBattery, incrementCycles, updateBattery } from "../../storage/repositories/batteryRepository";
import type { BatteryRecord } from "../../domain/logbook/types";
import { useToast } from "../../components/toast/useToast";
import { esCL as t } from "../../i18n/es-CL";

function formatDate(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
}

export function BatteryPage() {
  const [batteries, setBatteries] = useState<BatteryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadBatteries();
  }, []);

  async function loadBatteries() {
    try {
      const b = await listBatteries();
      setBatteries(b);
    } catch {
      toast.error(t.feedback.loadError);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormName("");
    setFormNotes("");
    setNameError(null);
    setShowAdd(false);
    setEditId(null);
  }

  function startEdit(bat: BatteryRecord) {
    setEditId(bat.id);
    setFormName(bat.name);
    setFormNotes(bat.notes ?? "");
    setNameError(null);
    setShowAdd(false);
  }

  async function handleSubmit() {
    if (saving) return;
    if (!formName.trim()) {
      setNameError(t.feedback.nameRequired);
      return;
    }

    setSaving(true);
    try {
      if (editId) {
        await updateBattery(editId, {
          name: formName.trim(),
          notes: formNotes || undefined,
        });
        toast.success(t.feedback.batteryUpdated);
      } else {
        await createBattery({
          name: formName.trim(),
          notes: formNotes || undefined,
        });
        toast.success(t.feedback.batteryCreated);
      }
      resetForm();
      await loadBatteries();
    } catch {
      toast.error(t.feedback.batteryOperationError);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    try {
      await deleteBattery(id);
      setDeleteId(null);
      toast.success(t.feedback.batteryDeleted);
      await loadBatteries();
    } catch {
      toast.error(t.feedback.batteryOperationError);
    } finally {
      setBusyId(null);
    }
  }

  async function handleCycle(id: string) {
    if (busyId === id) return;
    setBusyId(id);
    try {
      await incrementCycles(id);
      toast.success(t.feedback.batteryCycleRegistered);
      await loadBatteries();
    } catch {
      toast.error(t.feedback.batteryOperationError);
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-slate-400">Cargando…</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={() => navigate("/bitacora")} aria-label="Volver a la bitácora">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold text-slate-100">{t.battery.title}</h2>
        <Button size="sm" className="ml-auto" onClick={() => { setShowAdd(!showAdd); setEditId(null); setNameError(null); }}>
          <Plus className="mr-1 h-4 w-4" />
          {t.battery.addBattery}
        </Button>
      </div>

      {(showAdd || editId) && (
        <Card>
          <CardContent className="space-y-3 py-4">
            <div>
              <label htmlFor="battery-name" className="mb-1 block text-xs text-slate-400">{t.battery.name}</label>
              <input
                id="battery-name"
                type="text"
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value);
                  setNameError(null);
                }}
                aria-invalid={Boolean(nameError)}
                aria-describedby={nameError ? "battery-name-error" : undefined}
                className={`w-full rounded-lg border bg-slate-950 px-3 py-2 text-sm text-slate-200 ${nameError ? "border-red-700" : "border-slate-700"}`}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
              {nameError && (
                <p id="battery-name-error" role="alert" className="mt-1 text-xs text-red-400">
                  {nameError}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="battery-notes" className="mb-1 block text-xs text-slate-400">{t.battery.notes}</label>
              <input
                id="battery-notes"
                type="text"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSubmit} disabled={saving}>
                {saving ? t.feedback.saving : editId ? t.battery.saveChanges : t.battery.addBattery}
              </Button>
              <Button size="sm" variant="outline" onClick={resetForm} disabled={saving}>
                {t.battery.deleteCancel}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {batteries.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-slate-400">{t.battery.noBatteries}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {batteries.map((bat) => (
            <Card key={bat.id}>
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-200">{bat.name}</p>
                    <p className="text-xs text-slate-400">
                      {t.battery.cycles}: {bat.cycleCount}
                      {bat.notes ? ` · ${bat.notes}` : ""}
                    </p>
                    <p className="text-xs text-slate-500">
                      {bat.lastUsedAt
                        ? `${t.battery.lastUsed}: ${formatDate(bat.lastUsedAt)}`
                        : t.battery.neverUsed}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCycle(bat.id)}
                      disabled={busyId === bat.id}
                      aria-label={t.battery.registerCycle}
                    >
                      <RotateCw className="h-4 w-4 text-sky-400" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEdit(bat)}
                      aria-label={t.battery.editBattery}
                    >
                      <Edit className="h-4 w-4 text-slate-400" />
                    </Button>
                    {deleteId === bat.id ? (
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => setDeleteId(null)} disabled={busyId === bat.id}>
                          {t.battery.deleteCancel}
                        </Button>
                        <Button size="sm" onClick={() => handleDelete(bat.id)} disabled={busyId === bat.id}>
                          {busyId === bat.id ? t.feedback.saving : t.battery.deleteBattery}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteId(bat.id)}
                        aria-label={t.battery.deleteBattery}
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
