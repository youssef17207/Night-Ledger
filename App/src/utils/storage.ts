import {
  ActivityEntry,
  Assignment,
  AvailabilityWindow,
  Course,
  LearningHistory,
  TaskChunk,
  UserProfile,
} from '../types/scheduler';

/**
 * Everything lives in this browser's localStorage under a per-student key set.
 * There are deliberately NO pre-populated classes, assignments, free hours or
 * learned pace: a fresh visitor starts with a blank ledger.
 *
 * When accounts arrive, swap the read/write helpers below for an API client;
 * the rest of the app only talks to the load and save functions.
 */
export const STORAGE_KEYS = {
  USER: 'nightledger_user_v1',
  WINDOWS: 'nightledger_windows_v1',
  COURSES: 'nightledger_courses_v1',
  ASSIGNMENTS: 'nightledger_assignments_v1',
  CHUNKS: 'nightledger_chunks_v1',
  LEARNING: 'nightledger_learning_v1',
  ACTIVITY: 'nightledger_activity_v1',
} as const;

const ACTIVITY_CAP = 2000;

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked (private mode); the app keeps working in memory.
  }
}

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 7)}`;
}

export function createDefaultUser(): UserProfile {
  return {
    id: newId('usr'),
    name: '',
    email: '',
    createdAt: new Date().toISOString(),
    chunkThresholdMinutes: 120, // split tasks longer than 2 hours
    defaultBreakMinutes: 15,
    autoRebalanceOnDelay: true,
  };
}

export function loadUser(): UserProfile {
  const stored = read<UserProfile | null>(STORAGE_KEYS.USER, null);
  if (stored) return stored;
  const fresh = createDefaultUser();
  saveUser(fresh);
  return fresh;
}
export const saveUser = (user: UserProfile) => write(STORAGE_KEYS.USER, user);

export const loadWindows = (): AvailabilityWindow[] => read(STORAGE_KEYS.WINDOWS, []);
export const saveWindows = (w: AvailabilityWindow[]) => write(STORAGE_KEYS.WINDOWS, w);

export const loadCourses = (): Course[] => read(STORAGE_KEYS.COURSES, []);
export const saveCourses = (c: Course[]) => write(STORAGE_KEYS.COURSES, c);

export const loadAssignments = (): Assignment[] => read(STORAGE_KEYS.ASSIGNMENTS, []);
export const saveAssignments = (a: Assignment[]) => write(STORAGE_KEYS.ASSIGNMENTS, a);

export const loadChunks = (): TaskChunk[] => read(STORAGE_KEYS.CHUNKS, []);
export const saveChunks = (c: TaskChunk[]) => write(STORAGE_KEYS.CHUNKS, c);

export const loadLearning = (): LearningHistory => read(STORAGE_KEYS.LEARNING, {});
export const saveLearning = (l: LearningHistory) => write(STORAGE_KEYS.LEARNING, l);

export const loadActivity = (): ActivityEntry[] => read(STORAGE_KEYS.ACTIVITY, []);

/** Record something the student did, with a timestamp. Capped so storage never fills up. */
export function logActivity(type: string, data?: ActivityEntry['data']) {
  const log = loadActivity();
  log.push({ at: new Date().toISOString(), type, data });
  write(STORAGE_KEYS.ACTIVITY, log.slice(-ACTIVITY_CAP));
}

// Keep course name/code/colour copied onto assignments in step with the course list.
export function syncAssignmentsWithCourses(assignments: Assignment[], courses: Course[]): Assignment[] {
  const courseMap = new Map(courses.map((c) => [c.id, c]));
  return assignments.map((a) => {
    const c = courseMap.get(a.courseId);
    if (!c) return a;
    return { ...a, courseCode: c.code, courseName: c.name, courseColor: c.color };
  });
}

export interface BackupFile {
  app: 'night-ledger';
  version: 1;
  exportedAt: string;
  user: UserProfile;
  courses: Course[];
  windows: AvailabilityWindow[];
  assignments: Assignment[];
  chunks: TaskChunk[];
  learningHistory: LearningHistory;
  activity: ActivityEntry[];
}

export function isBackupFile(value: unknown): value is BackupFile {
  const v = value as Partial<BackupFile> | null;
  return (
    !!v &&
    typeof v === 'object' &&
    Array.isArray(v.courses) &&
    Array.isArray(v.assignments) &&
    Array.isArray(v.chunks) &&
    Array.isArray(v.windows)
  );
}

export function restoreBackup(b: BackupFile) {
  if (b.user) saveUser(b.user);
  saveCourses(b.courses);
  saveWindows(b.windows);
  saveAssignments(b.assignments);
  saveChunks(b.chunks);
  saveLearning(b.learningHistory ?? {});
  write(STORAGE_KEYS.ACTIVITY, b.activity ?? []);
}

export function resetAllData() {
  if (typeof window === 'undefined') return;
  Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  window.location.reload();
}
