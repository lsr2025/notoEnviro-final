'use client';

import { supabase } from './supabase';
import type { ProgrammeStream } from './roles';

// One-to-one with the public.field_reports table (the Microsoft Supervisor
// Daily/Weekly form). site_id + stream + supervisor_id are filled automatically.
export interface FieldReportInput {
  site_id: string;
  stream: ProgrammeStream;
  supervisor_id: string;
  report_date: string;
  participants_scheduled: number | null;
  participants_present: number | null;
  brief_update: string;
  absentees_count: number | null;
  absentee_names: string;
  absentee_reasons: string;
  exact_location: string;
  teams_assigned: string;
  task_description: string;
  work_completed: string;
  tools_used: string;
  incident: boolean;
  incident_detail: string;
  challenges_risks: string;
  support_required: string;
  attendance_concerns: string;
  decisions_required: string;
  additional_comments: string;
  gps_lat: number | null;
  gps_lng: number | null;
}

interface QueuedReport {
  id: string;          // client-generated offline id
  data: FieldReportInput;
  queued_at: number;
}

const DB_NAME = 'notoenviro-reports';
const DB_VERSION = 1;
const QUEUE = 'pending_reports';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(QUEUE)) {
        db.createObjectStore(QUEUE, { keyPath: 'id' });
      }
    };
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await openDB();
  return new Promise<T>((resolve, reject) => {
    const store = db.transaction([QUEUE], mode).objectStore(QUEUE);
    const req = fn(store);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result as T);
  });
}

const enqueue = (r: QueuedReport) => tx('readwrite', (s) => s.put(r));
const dequeue = (id: string) => tx('readwrite', (s) => s.delete(id));
export const getPending = () => tx<QueuedReport[]>('readonly', (s) => s.getAll());
export const pendingCount = async () => (await getPending()).length;

async function insertReport(data: FieldReportInput): Promise<void> {
  const { error } = await supabase.from('field_reports').insert(data);
  if (error) throw error;
}

export type SubmitResult = { status: 'synced' } | { status: 'queued'; reason: string };

// Always persist locally first, then try to sync. Never lose a submission —
// the old reports were full of network failures, so offline is the default path.
export async function submitReport(data: FieldReportInput): Promise<SubmitResult> {
  const id = `rpt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  await enqueue({ id, data, queued_at: Date.now() });
  try {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return { status: 'queued', reason: 'offline' };
    }
    await insertReport(data);
    await dequeue(id);
    return { status: 'synced' };
  } catch (err: any) {
    return { status: 'queued', reason: err?.message || 'network error' };
  }
}

// Flush any queued reports; safe to call repeatedly (on reconnect / app load).
// A module-level lock prevents concurrent runs (e.g. React effect double-invoke
// or a reconnect event firing mid-flush) from inserting the same report twice.
let syncing = false;
export async function syncPending(): Promise<{ synced: number; remaining: number }> {
  if (syncing) return { synced: 0, remaining: (await getPending()).length };
  syncing = true;
  let synced = 0;
  try {
    for (const item of await getPending()) {
      // Claim the item by removing it first, so a concurrent path can't re-insert
      // it; re-queue if the insert fails.
      await dequeue(item.id);
      try {
        await insertReport(item.data);
        synced++;
      } catch {
        await enqueue(item);
      }
    }
  } finally {
    syncing = false;
  }
  return { synced, remaining: (await getPending()).length };
}
