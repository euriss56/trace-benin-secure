/**
 * Cache IndexedDB des derniers résultats de vérification IMEI.
 * Capacité : 50 entrées max (FIFO sur le timestamp).
 */
import type { VerificationResult } from "./verify-api";

const DB_NAME = "traceimei-bj";
const STORE = "verifications";
const VERSION = 1;
const MAX_ENTRIES = 50;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "imei" });
        store.createIndex("checkedAt", "checkedAt", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function cacheResult(result: VerificationResult): Promise<void> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(result);
    await new Promise<void>((res, rej) => {
      tx.oncomplete = () => res();
      tx.onerror = () => rej(tx.error);
    });
    await trimCache();
  } catch (err) {
    console.warn("[cache] échec d'écriture", err);
  }
}

export async function getCachedResult(imei: string): Promise<VerificationResult | null> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(imei);
    return await new Promise((res, rej) => {
      req.onsuccess = () => res((req.result as VerificationResult | undefined) ?? null);
      req.onerror = () => rej(req.error);
    });
  } catch {
    return null;
  }
}

export async function listCachedResults(): Promise<VerificationResult[]> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    return await new Promise((res, rej) => {
      req.onsuccess = () => res((req.result as VerificationResult[]) ?? []);
      req.onerror = () => rej(req.error);
    });
  } catch {
    return [];
  }
}

async function trimCache(): Promise<void> {
  const all = await listCachedResults();
  if (all.length <= MAX_ENTRIES) return;
  const sorted = [...all].sort((a, b) => b.checkedAt - a.checkedAt);
  const toDelete = sorted.slice(MAX_ENTRIES);
  const db = await openDb();
  const tx = db.transaction(STORE, "readwrite");
  const store = tx.objectStore(STORE);
  toDelete.forEach((r) => store.delete(r.imei));
}
