import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { ArrowLeft, Plus, Trash2, Edit, MapPin, Star } from "lucide-react";
import { listPlaces, createPlace, deletePlace, updatePlace } from "../../storage/repositories/placeRepository";
import type { SavedPlace } from "../../domain/logbook/types";
import { parseCoordinateFields } from "../../domain/coordinate";
import { formatCoordinate } from "../../domain/coordinate";
import { coordinateInputMessage } from "../../lib/coordinateMessages";
import { useToast } from "../../components/toast/useToast";
import { cn } from "../../lib/utils";
import { esCL as t } from "../../i18n/es-CL";

interface FormErrors {
  name?: string;
  latitude?: string;
  longitude?: string;
}

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
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadPlaces();
  }, []);

  async function loadPlaces() {
    try {
      const p = await listPlaces();
      setPlaces(p);
    } catch {
      toast.error(t.feedback.loadError);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormName("");
    setFormNotes("");
    setFormLat("");
    setFormLon("");
    setErrors({});
    setShowAdd(false);
    setEditId(null);
  }

  function startEdit(place: SavedPlace) {
    setEditId(place.id);
    setFormName(place.name);
    setFormNotes(place.notes ?? "");
    setFormLat(String(place.coordinate.latitude));
    setFormLon(String(place.coordinate.longitude));
    setErrors({});
    setShowAdd(false);
  }

  function clearError(key: keyof FormErrors) {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  async function handleSubmit() {
    if (saving) return;

    const nextErrors: FormErrors = {};
    if (!formName.trim()) nextErrors.name = t.feedback.nameRequired;
    const coordinateResult = parseCoordinateFields(formLat, formLon);
    if (!coordinateResult.ok) {
      if (coordinateResult.errors.latitude) {
        nextErrors.latitude = coordinateInputMessage("latitude", coordinateResult.errors.latitude);
      }
      if (coordinateResult.errors.longitude) {
        nextErrors.longitude = coordinateInputMessage("longitude", coordinateResult.errors.longitude);
      }
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !coordinateResult.ok) return;

    setSaving(true);
    try {
      if (editId) {
        await updatePlace(editId, {
          name: formName.trim(),
          coordinate: coordinateResult.coordinate,
          notes: formNotes || undefined,
        });
        toast.success(t.feedback.placeUpdated);
      } else {
        await createPlace({
          name: formName.trim(),
          coordinate: coordinateResult.coordinate,
          notes: formNotes || undefined,
        });
        toast.success(t.feedback.placeCreated);
      }
      resetForm();
      await loadPlaces();
    } catch {
      toast.error(t.feedback.placeOperationError);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    try {
      await deletePlace(id);
      setDeleteId(null);
      toast.success(t.feedback.placeDeleted);
      await loadPlaces();
    } catch {
      toast.error(t.feedback.placeOperationError);
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleFavorite(id: string, current: boolean) {
    setBusyId(id);
    try {
      await updatePlace(id, { favorite: !current });
      toast.info(current ? t.feedback.favoriteRemoved : t.feedback.favoriteAdded);
      await loadPlaces();
    } catch {
      toast.error(t.feedback.placeOperationError);
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

  const invalidClass = "border-red-700";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={() => navigate("/")} aria-label="Volver al panel">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold text-slate-100">{t.places.title}</h2>
        <Button size="sm" className="ml-auto" onClick={() => { setShowAdd(!showAdd); setEditId(null); setErrors({}); }}>
          <Plus className="mr-1 h-4 w-4" />
          {t.places.addPlace}
        </Button>
      </div>

      {(showAdd || editId) && (
        <Card>
          <CardContent className="space-y-3 py-4">
            <div>
              <label htmlFor="place-name" className="mb-1 block text-xs text-slate-400">{t.places.name}</label>
              <input
                id="place-name"
                type="text"
                value={formName}
                onChange={(e) => {
                  setFormName(e.target.value);
                  clearError("name");
                }}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "place-name-error" : undefined}
                className={`w-full rounded-lg border bg-slate-950 px-3 py-2 text-sm text-slate-200 ${errors.name ? invalidClass : "border-slate-700"}`}
              />
              {errors.name && (
                <p id="place-name-error" role="alert" className="mt-1 text-xs text-red-400">
                  {errors.name}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="place-lat" className="mb-1 block text-xs text-slate-400">{t.dashboard.latitude}</label>
                <input
                  id="place-lat"
                  type="text"
                  inputMode="decimal"
                  value={formLat}
                  onChange={(e) => {
                    setFormLat(e.target.value);
                    clearError("latitude");
                  }}
                  aria-invalid={Boolean(errors.latitude)}
                  aria-describedby={errors.latitude ? "place-latitude-error" : undefined}
                  className={`w-full rounded-lg border bg-slate-950 px-3 py-2 text-sm text-slate-200 ${errors.latitude ? invalidClass : "border-slate-700"}`}
                />
                {errors.latitude && (
                  <p id="place-latitude-error" role="alert" className="mt-1 text-xs text-red-400">
                    {errors.latitude}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="place-lon" className="mb-1 block text-xs text-slate-400">{t.dashboard.longitude}</label>
                <input
                  id="place-lon"
                  type="text"
                  inputMode="decimal"
                  value={formLon}
                  onChange={(e) => {
                    setFormLon(e.target.value);
                    clearError("longitude");
                  }}
                  aria-invalid={Boolean(errors.longitude)}
                  aria-describedby={errors.longitude ? "place-longitude-error" : undefined}
                  className={`w-full rounded-lg border bg-slate-950 px-3 py-2 text-sm text-slate-200 ${errors.longitude ? invalidClass : "border-slate-700"}`}
                />
                {errors.longitude && (
                  <p id="place-longitude-error" role="alert" className="mt-1 text-xs text-red-400">
                    {errors.longitude}
                  </p>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="place-notes" className="mb-1 block text-xs text-slate-400">{t.places.notes}</label>
              <input
                id="place-notes"
                type="text"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSubmit} disabled={saving}>
                {saving ? t.feedback.saving : editId ? t.places.savePlace : t.places.addPlace}
              </Button>
              <Button size="sm" variant="outline" onClick={resetForm} disabled={saving}>
                {t.places.deleteCancel}
              </Button>
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
                      {place.favorite && <Star className="h-3 w-3 text-amber-400 fill-amber-400" aria-hidden />}
                    </p>
                    <p className="text-xs text-slate-400">{formatCoordinate(place.coordinate)}</p>
                    {place.notes && <p className="text-xs text-slate-500">{place.notes}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleFavorite(place.id, !!place.favorite)}
                      disabled={busyId === place.id}
                      aria-label={place.favorite ? t.feedback.favoriteRemoved : t.feedback.favoriteAdded}
                    >
                      <Star className={cn("h-4 w-4", place.favorite ? "text-amber-400 fill-amber-400" : "text-slate-500")} />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => startEdit(place)} aria-label={t.places.editPlace}>
                      <Edit className="h-4 w-4 text-slate-400" />
                    </Button>
                    {deleteId === place.id ? (
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => setDeleteId(null)} disabled={busyId === place.id}>
                          {t.places.deleteCancel}
                        </Button>
                        <Button size="sm" onClick={() => handleDelete(place.id)} disabled={busyId === place.id}>
                          {busyId === place.id ? t.feedback.saving : t.places.deletePlace}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteId(place.id)}
                        aria-label={t.places.deletePlace}
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
