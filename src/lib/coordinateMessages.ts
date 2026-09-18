import { esCL as t } from "../i18n/es-CL";
import type { CoordinateAxis, CoordinateInputError } from "../domain/coordinate";

export function coordinateInputMessage(axis: CoordinateAxis, error: CoordinateInputError): string {
  if (axis === "latitude") {
    if (error === "empty") return t.feedback.latitudeRequired;
    if (error === "not-a-number") return t.feedback.latitudeNotNumber;
    return t.feedback.latitudeOutOfRange;
  }
  if (error === "empty") return t.feedback.longitudeRequired;
  if (error === "not-a-number") return t.feedback.longitudeNotNumber;
  return t.feedback.longitudeOutOfRange;
}
