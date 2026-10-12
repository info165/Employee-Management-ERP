// Generic Firestore persistence helpers used by AuthContext to mirror in-memory
// app state to/from the user's Firestore database once they are signed in.
//
// Design: reads are "live" (onSnapshot) so multiple tabs/devices stay in sync.
// Writes are best-effort and never throw into the UI — a signed-out user, an
// unauthorized account, or a transient network error should degrade to local
// (in-memory) state rather than crash the app. Errors are logged to console.
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';

/** Subscribe to every document in a collection. Calls back with the full list on every change. */
export function watchCollection<T>(collectionName: string, onData: (items: T[]) => void): Unsubscribe {
  return onSnapshot(
    collection(db, collectionName),
    (snap) => onData(snap.docs.map((d) => d.data() as T)),
    (err) => console.warn(`[firestore] watch "${collectionName}" failed:`, err.message)
  );
}

/** Subscribe to a single document (used for singleton config docs like system_settings). */
export function watchDoc<T>(
  collectionName: string,
  docId: string,
  onData: (item: T | null) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, collectionName, docId),
    (snap) => onData(snap.exists() ? (snap.data() as T) : null),
    (err) => console.warn(`[firestore] watch "${collectionName}/${docId}" failed:`, err.message)
  );
}

/**
 * Recursively removes keys whose value is `undefined`. Firestore rejects any
 * write containing an `undefined` field outright (it has no way to represent
 * "no value" other than omitting the key, or explicitly using deleteField());
 * our app code passes plenty of optional fields — e.g. "no rejection remarks
 * when verifying a document" — that end up as undefined. Dropping the key
 * entirely is also the semantically correct choice for a merge write: it
 * leaves whatever (if anything) was already there untouched, rather than
 * wiping it out.
 */
function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
    const cleaned: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (val !== undefined) cleaned[key] = stripUndefined(val);
    }
    return cleaned as T;
  }
  return value;
}

/** Upsert (create-or-merge) a document. Fire-and-forget: never throws, logs on failure. */
export function saveDoc(collectionName: string, docId: string, data: DocumentData): void {
  setDoc(doc(db, collectionName, docId), stripUndefined(data), { merge: true }).catch((err) => {
    console.warn(`[firestore] save "${collectionName}/${docId}" failed:`, err instanceof Error ? err.message : err);
  });
}
