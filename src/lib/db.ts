import Dexie, { type Table } from "dexie";

// Offline task for local storage
export interface OfflineTask {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  category?: string;
  start_date?: string;
  due_date?: string;
  estimated_cost: number;
  actual_cost: number;
  position: number;
  syncPending: boolean;
  syncAction?: "create" | "update" | "delete";
  lastModified: number;
}

// Offline guest for local storage
export interface OfflineGuest {
  id: string;
  project_id: string;
  name: string;
  phone?: string;
  email?: string;
  group_name?: string;
  rsvp_status: "pending" | "confirmed" | "declined";
  rsvp_count: number;
  table_number?: string;
  checked_in: boolean;
  checked_in_at?: string;
  qr_code?: string;
  syncPending: boolean;
  syncAction?: "create" | "update" | "delete";
  lastModified: number;
}

// Offline project for caching
export interface OfflineProject {
  id: string;
  name: string;
  description?: string;
  type: "wedding" | "house" | "travel" | "event";
  start_date?: string;
  end_date?: string;
  owner_id: string;
  lastModified: number;
}

export class TaskManagerDB extends Dexie {
  tasks!: Table<OfflineTask>;
  guests!: Table<OfflineGuest>;
  projects!: Table<OfflineProject>;

  constructor() {
    super("TaskManagerDB");
    this.version(1).stores({
      tasks: "id, project_id, syncPending, lastModified",
      guests: "id, project_id, syncPending, lastModified, qr_code",
      projects: "id, owner_id, lastModified",
    });
  }
}

export const db = new TaskManagerDB();

// Helper functions for offline operations
export async function cacheProjects(projects: OfflineProject[]) {
  const now = Date.now();
  const projectsWithTimestamp = projects.map((p) => ({
    ...p,
    lastModified: now,
  }));
  await db.projects.bulkPut(projectsWithTimestamp);
}

export async function cacheTasks(tasks: Omit<OfflineTask, "syncPending" | "lastModified">[]) {
  const now = Date.now();
  const tasksWithMeta = tasks.map((t) => ({
    ...t,
    syncPending: false,
    lastModified: now,
  }));
  await db.tasks.bulkPut(tasksWithMeta);
}

export async function cacheGuests(guests: Omit<OfflineGuest, "syncPending" | "lastModified">[]) {
  const now = Date.now();
  const guestsWithMeta = guests.map((g) => ({
    ...g,
    syncPending: false,
    lastModified: now,
  }));
  await db.guests.bulkPut(guestsWithMeta);
}

export async function getOfflineProjects(userId: string) {
  return db.projects.where("owner_id").equals(userId).toArray();
}

export async function getOfflineTasks(projectId: string) {
  return db.tasks.where("project_id").equals(projectId).toArray();
}

export async function getOfflineGuests(projectId: string) {
  return db.guests.where("project_id").equals(projectId).toArray();
}

export async function getPendingSyncItems() {
  const tasks = await db.tasks.filter((t) => t.syncPending === true).toArray();
  const guests = await db.guests.filter((g) => g.syncPending === true).toArray();
  return { tasks, guests };
}

export async function markTaskSynced(id: string) {
  await db.tasks.update(id, { syncPending: false, syncAction: undefined });
}

export async function markGuestSynced(id: string) {
  await db.guests.update(id, { syncPending: false, syncAction: undefined });
}
