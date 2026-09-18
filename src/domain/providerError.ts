/**
 * Clases de error compartidas por los providers externos.
 *
 * La UI puede distinguir al menos timeout, sin conexión, respuesta inválida y
 * sin datos sin depender de mensajes técnicos crudos del runtime.
 */
export type ProviderErrorKind =
  | "timeout"
  | "offline"
  | "http"
  | "invalid-response"
  | "no-data"
  | "invalid-input";

export class ProviderError extends Error {
  readonly kind: ProviderErrorKind;
  readonly provider: string;
  readonly status?: number;

  constructor(
    provider: string,
    kind: ProviderErrorKind,
    message: string,
    status?: number
  ) {
    super(message);
    this.name = "ProviderError";
    this.provider = provider;
    this.kind = kind;
    this.status = status;
  }
}
