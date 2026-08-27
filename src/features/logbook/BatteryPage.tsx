import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { ArrowLeft, Plus, Trash2, RotateCw, Edit } from "lucide-react";
import { listBatteries, createBattery, deleteBattery, incrementCycles, updateBattery } from "../../storage/repositories/batteryRepository";
import type { BatteryRecord } from "../../domain/logbook/types";
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
  const navigate = useNavigate();

  useEffect(() => {
    loadBatteries();
  }, []);

  async function loadBatteries() {
    try {
      const b = await listBatteries();
      setBatteries(b);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormName("");
    setFormNotes("");
    setShowAdd(false);
    setEditId(null);
  }

  function startEdit(bat: BatteryRecord) {
    setEditId(bat.id);
    setFormName(bat.name);
    setFormNotes(bat.notes ?? "");
    setShowAdd(false);
  }

  async function handleSubmit() {
    if (!formName.trim()) return;
    if (editId) {
      await updateBattery(editId, {
        name: formName.trim(),
        notes: formNotes || undefined,
      });
    } else {
      await createBattery({
        name: formName.trim(),
        notes: formNotes || undefined,
      });
    }
    resetForm();
    await loadBatteries();
  }

  async function handleDelete(id: string) {
    await deleteBattery(id);
    setDeleteId(null);
    await loadBatteries();
  }

  async function handleCycle(id: string) {
    await incrementCycles(id);
    await loadBatteries();
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
        <Button size="sm" variant="ghost" onClick={() => navigate("/bitacora")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold text-slate-100">{t.battery.title}</h2>
        <Button size="sm" className="ml-auto" onClick={() => { setShowAdd(!showAdd); setEditId(null); }}>
          <Plus className="mr-1 h-4 w-4" />
          {t.battery.addBattery}
        </Button>
      </div>

      {(showAdd || editId) && (
        <Card>
          <CardContent className="space-y-3 py-4">
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder={t.battery.name}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
            <input
              type="text"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder={t.battery.notes}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSubmit}>{editId ? t.battery.saveChanges : t.battery.addBattery}</Button>
              <Button size="sm" variant="outline" onClick={resetForm}>{t.battery.deleteCancel}</Button>
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
                    <Button size="sm" variant="ghost" onClick={() => handleCycle(bat.id)} title={t.battery.registerCycle}>
                      <RotateCw className="h-4 w-4 text-sky-400" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => startEdit(bat)}>
                      <Edit className="h-4 w-4 text-slate-400" />
                    </Button>
                    {deleteId === bat.id ? (
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => setDeleteId(null)}>
                          {t.battery.deleteCancel}
                        </Button>
                        <Button size="sm" onClick={() => handleDelete(bat.id)}>
                          {t.battery.deleteBattery}
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => setDeleteId(bat.id)}>
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
