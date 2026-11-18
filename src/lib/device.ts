/**
 * Rough "weak device or slow connection" check, used to skip or slow down
 * purely decorative motion. Browser only; returns false on the server.
 */
export function isConstrainedDevice() {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };
  const cores = nav.hardwareConcurrency ?? 8;
  const memory = nav.deviceMemory ?? 8;
  const conn = nav.connection;
  return cores <= 4 || memory <= 4 || !!conn?.saveData || /(^|-)2g$/.test(conn?.effectiveType ?? "");
}
