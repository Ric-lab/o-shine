import { Preferences } from '@capacitor/preferences';

export function createJSONStorage(preferences = Preferences) {
  const queues = new Map();
  const pending = new Map();
  let sequence = Date.now();
  const journalKey = key => `journal:${key}`;

  async function loadJSON(key) {
    let journal;
    let journalError;
    try {
      journal = JSON.parse(globalThis.localStorage?.getItem(journalKey(key)) || 'null');
      if (journal && (journal.__record !== 1 || !Number.isSafeInteger(journal.sequence) || !Object.hasOwn(journal, 'value'))) {
        throw new Error('Registro local inválido.');
      }
    } catch (error) { journal = null; journalError = error; }
    let stored;
    try {
      const { value } = await preferences.get({ key });
      stored = value ? JSON.parse(value) : null;
      if (stored?.__record === 1 && (!Number.isSafeInteger(stored.sequence) || !Object.hasOwn(stored, 'value'))) {
        stored = null;
        throw new Error('Registro nativo inválido.');
      }
    } catch (error) {
      if (!journal) throw error;
    }
    if (!stored && !journal && journalError) throw journalError;
    const nativeRecord = stored?.__record === 1 ? stored : null;
    const newest = journal && (!nativeRecord || journal.sequence >= nativeRecord.sequence) ? journal : nativeRecord;
    if (newest) { sequence = Math.max(sequence, newest.sequence || 0); return newest.value; }
    return stored;
  }

  // Journal synchronously before starting a serialized native write.
  function saveJSON(key, data) {
    const record = { __record: 1, sequence: ++sequence, value: JSON.parse(JSON.stringify(data)) };
    pending.set(key, record);
    try { globalThis.localStorage?.setItem(journalKey(key), JSON.stringify(record)); } catch { /* native write below */ }
    const write = (queues.get(key) || Promise.resolve()).catch(() => {}).then(async () => {
      const current = pending.get(key);
      if (!current) return;
      await preferences.set({ key, value: JSON.stringify(current) });
      if (pending.get(key) === current) pending.delete(key);
    });
    queues.set(key, write);
    return write;
  }

  async function flushStorage() {
    await Promise.all([...pending].map(([key, record]) => saveJSON(key, record.value)));
  }

  return { loadJSON, saveJSON, flushStorage };
}

export const { loadJSON, saveJSON, flushStorage } = createJSONStorage();
