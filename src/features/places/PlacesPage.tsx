import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { ArrowLeft, Plus, Trash2, Edit, MapPin, Star } from "lucide-react";
import { listPlaces, createPlace, deletePlace, updatePlace } from "../../storage/repositories/placeRepository";
import type { SavedPlace } from "../../domain/logbook/types";
import type { Coordinate } from "../../domain/coordinate";
import { formatCoordinate } from "../../domain/coordinate";
import { cn } from "../../lib/utils";
import { esCL as t } from "../../i18n/es-CL";

export function PlacesPage() {
  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formLat, setFormLat] = useState("");
  const [formLon, setFormLon] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadPlaces();
  }, []);

  async function loadPlaces() {
    try {
      const p = await listPlaces();
      setPlaces(p);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormName("");
    setFormNotes("");
    setFormLat("");
    setFormLon("");
    setShowAdd(false);
    setEditId(null);
  }

  function startEdit(place: SavedPlace) {
    setEditId(place.id);
    setFormName(place.name);
    setFormNotes(place.notes ?? "");
    setFormLat(String(place.coordinate.latitude));
    setFormLon(String(place.coordinate.longitude));
    setShowAdd(false);
  }

  async function handleSubmit() {
    if (!formName.trim()) return;
    const coord: Coordinate = {
      latitude: Number.parseFloat(formLat) || 0,
      longitude: Number.parseFloat(formLon) || 0,
    };
    if (editId) {
      await updatePlace(editId, {
        name: formName.trim(),
        coordinate: coord,
        notes: formNotes || undefined,
      });
    } else {
      await createPlace({
        name: formName.trim(),
        coordinate: coord,
        notes: formNotes || undefined,
      });
    }
    resetForm();
    await loadPlaces();
  }

  async function handleDelete(id: string) {
    await deletePlace(id);
    setDeleteId(null);
    await loadPlaces();
  }

  async function handleToggleFavorite(id: string, current: boolean) {
    await updatePlace(id, { favorite: !current });
    await loadPlaces();
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
        <Button size="sm" variant="ghost" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold text-slate-100">{t.places.title}</h2>
        <Button size="sm" className="ml-auto" onClick={() => { setShowAdd(!showAdd); setEditId(null); }}>
          <Plus className="mr-1 h-4 w-4" />
          {t.places.addPlace}
        </Button>
      </div>

      {(showAdd || editId) && (
        <Card>
          <CardContent className="space-y-3 py-4">
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder={t.places.name}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={formLat}
                onChange={(e) => setFormLat(e.target.value)}
                placeholder={t.dashboard.latitude}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200"
              />
              <input
                type="text"
                value={formLon}
                onChange={(e) => setFormLon(e.target.value)}
                placeholder={t.dashboard.longitude}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200"
              />
            </div>
            <input
              type="text"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder={t.places.notes}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSubmit}>{editId ? t.places.savePlace : t.places.addPlace}</Button>
              <Button size="sm" variant="outline" onClick={resetForm}>{t.places.deleteCancel}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {places.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <MapPin className="mx-auto mb-2 h-8 w-8 text-slate-600" />
            <p className="text-sm text-slate-400">{t.places.noPlaces}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {places.map((place) => (
            <Card key={place.id}>
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="flex items-center gap-2 text-sm font-medium text-slate-200">
                      {place.name}
                      {place.favorite && <Star className="h-3 w-3 text-amber-400 fill-amber-400" />}
                    </p>
                    <p className="text-xs text-slate-400">{formatCoordinate(place.coordinate)}</p>
                    {place.notes && <p className="text-xs text-slate-500">{place.notes}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleToggleFavorite(place.id, !!place.favorite)}>
                      <Star className={cn("h-4 w-4", place.favorite ? "text-amber-400 fill-amber-400" : "text-slate-500")} />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => startEdit(place)}>
                      <Edit className="h-4 w-4 text-slate-400" />
                    </Button>
                    {deleteId === place.id ? (
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => setDeleteId(null)}>
                          {t.places.deleteCancel}
                        </Button>
                        <Button size="sm" onClick={() => handleDelete(place.id)}>
                          {t.places.deletePlace}
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => setDeleteId(place.id)}>
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
