import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { ArrowLeft, Plus, Trash2, RotateCw } from "lucide-react";
import { listBatteries, createBattery, deleteBattery, incrementCycles } from "../../storage/repositories/batteryRepository";
import type { BatteryRecord } from "../../domain/logbook/types";
import { esCL as t } from "../../i18n/es-CL";

export function BatteryPage() {
  const [batteries, setBatteries] = useState<BatteryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
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

  async function handleAdd() {
    if (!newName.trim()) return;
    await createBattery({ name: newName.trim() });
    setNewName("");
    setShowAdd(false);
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
        <Button size="sm" className="ml-auto" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="mr-1 h-4 w-4" />
          {t.battery.addBattery}
        </Button>
      </div>

      {showAdd && (
        <Card>
          <CardContent className="flex gap-2 py-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t.battery.name}
              className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200"
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <Button size="sm" onClick={handleAdd}>{t.logbook.saveFlight}</Button>
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
              <CardContent className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-slate-200">{bat.name}</p>
                  <p className="text-xs text-slate-400">
                    {t.battery.cycles}: {bat.cycleCount}
                    {bat.notes ? ` · ${bat.notes}` : ""}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => handleCycle(bat.id)}>
                    <RotateCw className="h-4 w-4 text-sky-400" />
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
