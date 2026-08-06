import { openDB } from 'idb';

const DB_NAME = 'ChemLabAI_OfflineStore';
const DB_VERSION = 1;
const STORE_TRIALS = 'experiment_sessions';

/**
 * Initializes IndexedDB Database for offline trial persistence
 */
async function getDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_TRIALS)) {
        db.createObjectStore(STORE_TRIALS, { keyPath: 'experiment_id' });
      }
    }
  });
}

/**
 * Saves current experiment session state to IndexedDB
 */
export async function saveSessionToDb(experimentId, sessionData) {
  if (!experimentId) return;
  try {
    const db = await getDb();
    await db.put(STORE_TRIALS, {
      experiment_id: experimentId,
      updated_at: new Date().toISOString(),
      ...sessionData
    });
  } catch (err) {
    console.warn('IndexedDB save failed:', err);
  }
}

/**
 * Loads saved experiment session state from IndexedDB
 */
export async function loadSessionFromDb(experimentId) {
  if (!experimentId) return null;
  try {
    const db = await getDb();
    return await db.get(STORE_TRIALS, experimentId);
  } catch (err) {
    console.warn('IndexedDB load failed:', err);
    return null;
  }
}

/**
 * Clears saved experiment session from IndexedDB
 */
export async function clearSessionFromDb(experimentId) {
  if (!experimentId) return;
  try {
    const db = await getDb();
    await db.delete(STORE_TRIALS, experimentId);
  } catch (err) {
    console.warn('IndexedDB delete failed:', err);
  }
}
