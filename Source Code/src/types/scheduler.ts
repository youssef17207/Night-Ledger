export type AssignmentStatus = 'Pending' | 'In Progress' | 'Completed';
export type ChunkStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Missed';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  chunkThresholdMinutes: number; // Duration above which assignments get split (default 120)
  defaultBreakMinutes: number;   // Rest break between chunks (default 15)
  autoRebalanceOnDelay: boolean;
}

export interface AvailabilityWindow {
  id: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: string; // "HH:MM" 24h format e.g. "14:00"
  endTime: string;   // "HH:MM" 24h format e.g. "17:00"
  label: string;     // e.g. "Afternoon Free Study", "Evening Block"
}

export type AssignmentCategoryType = 
  | 'reading'
  | 'problem_set'
  | 'lab_report'
  | 'essay'
  | 'coding_project'
  | 'exam_prep'
  | 'presentation';

export interface Course {
  id: string;
  code: string;       // e.g. "CS 220"
  name: string;       // e.g. "Algorithms & Data Structures"
  color: string;      // hex color code e.g. "#6366f1"
  instructor?: string;
  credits?: number;
  icon?: string;      // e.g. "code", "atom", "calculator", "book"
  createdAt: string;
}

export interface CategoryPreset {
  id: AssignmentCategoryType;
  label: string;
  defaultMinutes: number;
  description: string;
}

export interface CategorySpeedLearning {
  category: AssignmentCategoryType;
  completedCount: number;
  totalEstimatedMinutes: number;
  totalActualMinutes: number;
  speedRatio: number; // actual / estimated (e.g. 1.15 means takes 15% longer)
}

export interface Assignment {
  id: string;
  userId: string;
  courseId: string;   // Reference to Course.id
  title: string;
  courseName: string; // Synced from Course
  courseCode: string; // Synced from Course
  courseColor: string; // Synced from Course
  category: AssignmentCategoryType;
  dueDate: string; // ISO string "YYYY-MM-DDTHH:mm:ss"
  totalEstimatedMinutes: number;
  actualMinutesSpent: number;
  status: AssignmentStatus;
  notes?: string;
  createdAt: string;
}

export interface TaskChunk {
  id: string;
  assignmentId: string;
  chunkLabel: string; // e.g. "Physics Paper - Part 1"
  chunkIndex: number; // 1, 2, ...
  totalChunks: number;
  scheduledDate: string; // "YYYY-MM-DD"
  scheduledStartTime: string; // "HH:MM"
  scheduledEndTime: string;   // "HH:MM"
  durationMinutes: number;
  status: ChunkStatus;
  isManualOverride: boolean; // Preserves user manual drag/reschedule during auto-rebalance
  completedAt?: string;
  actualDurationMinutes?: number;
}

export interface HardCapCheckResult {
  hasCapacity: boolean;
  requiredMinutes: number;
  availableMinutes: number;
  deficitMinutes: number;
  earliestAvailableDate: string;
  dueDate: string;
  assignmentTitle: string;
  recommendations: Array<{
    type: 'extend_window' | 'reduce_duration' | 'split_further';
    title: string;
    description: string;
    suggestedMinutes?: number;
    targetDayOfWeek?: number;
  }>;
}

export interface ScheduleRebalanceResult {
  rebalancedCount: number;
  shiftedChunks: Array<{
    chunkId: string;
    label: string;
    oldSlot: string;
    newSlot: string;
  }>;
  unresolvedMinutes: number;
}
