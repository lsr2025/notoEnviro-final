'use client';

import { ActivityLog, OfflineRecord } from './types';

const DB_NAME = 'notoenviro-offline';
const DB_VERSION = 1;
const LOGS_STORE = 'activity_logs';
const QUEUE_STORE = 'queue';

let db: IDBDatabase | null = null;

export const initDB = async (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      if (!database.objectStoreNames.contains(LOGS_STORE)) {
        const logsStore = database.createObjectStore(LOGS_STORE, { keyPath: 'id' });
        logsStore.createIndex('log_date', 'log_date', { unique: false });
        logsStore.createIndex('worker_id', 'worker_id', { unique: false });
        logsStore.createIndex('offline_id', 'offline_id', { unique: true });
      }

      if (!database.objectStoreNames.contains(QUEUE_STORE)) {
        database.createObjectStore(QUEUE_STORE, { keyPath: 'id' });
      }
    };
  });
};

export const ensureDB = async (): Promise<IDBDatabase> => {
  if (db) return db;
  return initDB();
};

export const saveLog = async (log: ActivityLog): Promise<string> => {
  const database = await ensureDB();
  const id = log.offline_id || `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const logToSave = {
    ...log,
    id,
    offline_id: id,
    created_at: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([LOGS_STORE], 'readwrite');
    const store = transaction.objectStore(LOGS_STORE);
    const request = store.put(logToSave);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(id);
  });
};

export const getLogs = async (workerId?: string): Promise<ActivityLog[]> => {
  const database = await ensureDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([LOGS_STORE], 'readonly');
    const store = transaction.objectStore(LOGS_STORE);

    let request;
    if (workerId) {
      const index = store.index('worker_id');
      request = index.getAll(workerId);
    } else {
      request = store.getAll();
    }

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
};

export const getLogByDate = async (workerId: string, logDate: string): Promise<ActivityLog | null> => {
  const database = await ensureDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([LOGS_STORE], 'readonly');
    const store = transaction.objectStore(LOGS_STORE);
    const index = store.index('worker_id');
    const request = index.getAll(workerId);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const logs = request.result || [];
      const log = logs.find(l => l.log_date === logDate);
      resolve(log || null);
    };
  });
};

export const saveToQueue = async (item: OfflineRecord): Promise<void> => {
  const database = await ensureDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([QUEUE_STORE], 'readwrite');
    const store = transaction.objectStore(QUEUE_STORE);
    const request = store.put(item);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export const getQueue = async (): Promise<OfflineRecord[]> => {
  const database = await ensureDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([QUEUE_STORE], 'readonly');
    const store = transaction.objectStore(QUEUE_STORE);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
};

export const removeFromQueue = async (id: string): Promise<void> => {
  const database = await ensureDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([QUEUE_STORE], 'readwrite');
    const store = transaction.objectStore(QUEUE_STORE);
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export const getPendingCount = async (): Promise<number> => {
  const queue = await getQueue();
  return queue.filter(item => !item.synced).length;
};

export const clearQueue = async (): Promise<void> => {
  const database = await ensureDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([QUEUE_STORE], 'readwrite');
    const store = transaction.objectStore(QUEUE_STORE);
    const request = store.clear();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export const getMonthlyStats = async (workerId: string, year: number, month: number): Promise<{ logged: Set<number>; totalDays: number }> => {
  const logs = await getLogs(workerId);
  const logged = new Set<number>();

  logs.forEach(log => {
    const logDate = new Date(log.log_date);
    if (logDate.getFullYear() === year && logDate.getMonth() === month) {
      logged.add(logDate.getDate());
    }
  });

  const totalDays = new Date(year, month + 1, 0).getDate();
  return { logged, totalDays };
};
