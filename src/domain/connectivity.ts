export function detectReconnection(previous: boolean | null, current: boolean): boolean {
  return previous === false && current === true;
}
