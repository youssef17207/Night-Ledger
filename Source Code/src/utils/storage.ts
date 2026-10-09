import {
  Assignment,
  AssignmentCategoryType,
  AvailabilityWindow,
  CategorySpeedLearning,
  Course,
  TaskChunk,
  UserProfile,
} from '../types/scheduler';

const STORAGE_KEYS = {
  USER: 'plancraft_user_v1',
  WINDOWS: 'plancraft_windows_v1',
  COURSES: 'plancraft_courses_v1',
  ASSIGNMENTS: 'plancraft_assignments_v1',
  CHUNKS: 'plancraft_chunks_v1',
  LEARNING: 'plancraft_learning_v1',
};

export const INITIAL_COURSES: Course[] = [
  {
    id: 'course_cs_220',
    code: 'CS 220',
    name: 'Algorithms & Data Structures',
    color: '#10b981', // Emerald
    instructor: 'Prof. Donald Knuth',
    credits: 4,
    icon: 'code',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'course_math_215',
    code: 'MATH 215',
    name: 'Discrete Mathematics',
    color: '#6366f1', // Indigo
    instructor: 'Prof. Paul Erdős',
    credits: 3,
    icon: 'calculator',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'course_phys_150',
    code: 'PHYS 150',
    name: 'University Physics II',
    color: '#f59e0b', // Amber
    instructor: 'Prof. Richard Feynman',
    credits: 4,
    icon: 'atom',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'course_eng_302',
    code: 'ENG 302',
    name: 'Technical & Professional Writing',
    color: '#8b5cf6', // Violet
    instructor: 'Dr. Sarah Mitchell',
    credits: 3,
    icon: 'book',
    createdAt: '2026-09-01T08:00:00.000Z',
  },
];

export const INITIAL_USER: UserProfile = {
  id: 'usr_alex_chen',
  name: 'Alex Chen',
  email: 'alex.chen@university.edu',
  createdAt: '2026-09-01T08:00:00.000Z',
  chunkThresholdMinutes: 120, // Split tasks > 2 hours
  defaultBreakMinutes: 15,
  autoRebalanceOnDelay: true,
};

export const INITIAL_WINDOWS: AvailabilityWindow[] = [
  { id: 'w_mon_1', dayOfWeek: 1, startTime: '14:00', endTime: '17:30', label: 'Afternoon Deep Work' },
  { id: 'w_mon_2', dayOfWeek: 1, startTime: '19:30', endTime: '22:00', label: 'Evening Study Window' },
  { id: 'w_tue_1', dayOfWeek: 2, startTime: '15:00', endTime: '18:30', label: 'After-Class STEM Block' },
  { id: 'w_wed_1', dayOfWeek: 3, startTime: '13:00', endTime: '17:00', label: 'Library Deep Focus' },
  { id: 'w_wed_2', dayOfWeek: 3, startTime: '19:00', endTime: '21:30', label: 'Evening Review Block' },
  { id: 'w_thu_1', dayOfWeek: 4, startTime: '14:30', endTime: '18:30', label: 'Problem Solving Lab' },
  { id: 'w_fri_1', dayOfWeek: 5, startTime: '13:00', endTime: '16:30', label: 'Weekend Ramp-up' },
  { id: 'w_sat_1', dayOfWeek: 6, startTime: '10:00', endTime: '14:00', label: 'Weekend Deep Study' },
  { id: 'w_sun_1', dayOfWeek: 0, startTime: '14:00', endTime: '18:00', label: 'Week Ahead Preparation' },
];

export const INITIAL_LEARNING: Record<AssignmentCategoryType, CategorySpeedLearning> = {
  reading: {
    category: 'reading',
    completedCount: 5,
    totalEstimatedMinutes: 300,
    totalActualMinutes: 285,
    speedRatio: 0.95,
  },
  problem_set: {
    category: 'problem_set',
    completedCount: 6,
    totalEstimatedMinutes: 900,
    totalActualMinutes: 1035,
    speedRatio: 1.15,
  },
  lab_report: {
    category: 'lab_report',
    completedCount: 3,
    totalEstimatedMinutes: 630,
    totalActualMinutes: 693,
    speedRatio: 1.1,
  },
  essay: {
    category: 'essay',
    completedCount: 4,
    totalEstimatedMinutes: 1200,
    totalActualMinutes: 1260,
    speedRatio: 1.05,
  },
  coding_project: {
    category: 'coding_project',
    completedCount: 7,
    totalEstimatedMinutes: 1260,
    totalActualMinutes: 1450,
    speedRatio: 1.15,
  },
  exam_prep: {
    category: 'exam_prep',
    completedCount: 4,
    totalEstimatedMinutes: 960,
    totalActualMinutes: 960,
    speedRatio: 1.0,
  },
  presentation: {
    category: 'presentation',
    completedCount: 2,
    totalEstimatedMinutes: 180,
    totalActualMinutes: 165,
    speedRatio: 0.92,
  },
};

// Anchor dates relative to current date (2026-10-05 is Monday)
export function getInitialAssignments(): Assignment[] {
  const base = new Date();
  
  // Format dates relative to today
  const dWed = new Date(base);
  dWed.setDate(base.getDate() + 2); // Wednesday Oct 7
  dWed.setHours(23, 59, 0, 0);

  const dThu = new Date(base);
  dThu.setDate(base.getDate() + 3); // Thursday Oct 8
  dThu.setHours(23, 59, 0, 0);

  const dFri = new Date(base);
  dFri.setDate(base.getDate() + 4); // Friday Oct 9
  dFri.setHours(17, 0, 0, 0);

  const dSun = new Date(base);
  dSun.setDate(base.getDate() + 6); // Sunday Oct 11
  dSun.setHours(23, 59, 0, 0);

  return [
    {
      id: 'asg_math_215',
      userId: 'usr_alex_chen',
      courseId: 'course_math_215',
      title: 'Graph Theory & Induction Proofs',
      courseName: 'Discrete Mathematics',
      courseCode: 'MATH 215',
      courseColor: '#6366f1', // Indigo
      category: 'problem_set',
      dueDate: dWed.toISOString(),
      totalEstimatedMinutes: 120,
      actualMinutesSpent: 0,
      status: 'Pending',
      notes: 'Problems 4.1 to 4.9. Focus on induction base cases and bipartite graphs.',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'asg_cs_220',
      userId: 'usr_alex_chen',
      courseId: 'course_cs_220',
      title: 'Dynamic Programming Optimization',
      courseName: 'Algorithms & Data Structures',
      courseCode: 'CS 220',
      courseColor: '#10b981', // Emerald
      category: 'coding_project',
      dueDate: dThu.toISOString(),
      totalEstimatedMinutes: 240,
      actualMinutesSpent: 0,
      status: 'In Progress',
      notes: 'Implement Knapsack 0/1 and Longest Common Subsequence in C++ with unit tests.',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'asg_phys_150',
      userId: 'usr_alex_chen',
      courseId: 'course_phys_150',
      title: 'Thermodynamics & Heat Capacity Report',
      courseName: 'University Physics II',
      courseCode: 'PHYS 150',
      courseColor: '#f59e0b', // Amber
      category: 'lab_report',
      dueDate: dFri.toISOString(),
      totalEstimatedMinutes: 210,
      actualMinutesSpent: 0,
      status: 'Pending',
      notes: 'Plot calorimeter curves and calculate experimental error vs theoretical values.',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'asg_eng_302',
      userId: 'usr_alex_chen',
      courseId: 'course_eng_302',
      title: 'Ethical Autonomous Systems Essay',
      courseName: 'Technical & Professional Writing',
      courseCode: 'ENG 302',
      courseColor: '#8b5cf6', // Violet
      category: 'essay',
      dueDate: dSun.toISOString(),
      totalEstimatedMinutes: 180,
      actualMinutesSpent: 0,
      status: 'Pending',
      notes: 'Draft 1,500 words on algorithmic bias and verification protocols in robotics.',
      createdAt: new Date().toISOString(),
    },
  ];
}

// Generate pre-populated initial chunks for today and this week
export function getInitialChunks(assignments: Assignment[]): TaskChunk[] {
  const base = new Date();
  const yyyy = base.getFullYear();
  const mm = (base.getMonth() + 1).toString().padStart(2, '0');
  const dd = base.getDate().toString().padStart(2, '0');
  const todayKey = `${yyyy}-${mm}-${dd}`;

  const tomorrow = new Date(base);
  tomorrow.setDate(base.getDate() + 1);
  const tomKey = `${tomorrow.getFullYear()}-${(tomorrow.getMonth() + 1).toString().padStart(2, '0')}-${tomorrow.getDate().toString().padStart(2, '0')}`;

  const wed = new Date(base);
  wed.setDate(base.getDate() + 2);
  const wedKey = `${wed.getFullYear()}-${(wed.getMonth() + 1).toString().padStart(2, '0')}-${wed.getDate().toString().padStart(2, '0')}`;

  const thu = new Date(base);
  thu.setDate(base.getDate() + 3);
  const thuKey = `${thu.getFullYear()}-${(thu.getMonth() + 1).toString().padStart(2, '0')}-${thu.getDate().toString().padStart(2, '0')}`;

  return [
    {
      id: 'chunk_math_part1',
      assignmentId: 'asg_math_215',
      chunkLabel: 'Graph Theory & Induction Proofs - Part 1',
      chunkIndex: 1,
      totalChunks: 2,
      scheduledDate: todayKey,
      scheduledStartTime: '14:30',
      scheduledEndTime: '15:30',
      durationMinutes: 60,
      status: 'Scheduled',
      isManualOverride: false,
    },
    {
      id: 'chunk_cs_part1',
      assignmentId: 'asg_cs_220',
      chunkLabel: 'Dynamic Programming Optimization - Part 1',
      chunkIndex: 1,
      totalChunks: 2,
      scheduledDate: todayKey,
      scheduledStartTime: '16:00',
      scheduledEndTime: '17:30',
      durationMinutes: 90,
      status: 'Scheduled',
      isManualOverride: false,
    },
    {
      id: 'chunk_math_part2',
      assignmentId: 'asg_math_215',
      chunkLabel: 'Graph Theory & Induction Proofs - Part 2',
      chunkIndex: 2,
      totalChunks: 2,
      scheduledDate: todayKey,
      scheduledStartTime: '20:00',
      scheduledEndTime: '21:00',
      durationMinutes: 60,
      status: 'Scheduled',
      isManualOverride: false,
    },
    {
      id: 'chunk_cs_part2',
      assignmentId: 'asg_cs_220',
      chunkLabel: 'Dynamic Programming Optimization - Part 2',
      chunkIndex: 2,
      totalChunks: 2,
      scheduledDate: tomKey,
      scheduledStartTime: '15:30',
      scheduledEndTime: '17:30',
      durationMinutes: 120,
      status: 'Scheduled',
      isManualOverride: false,
    },
    {
      id: 'chunk_phys_part1',
      assignmentId: 'asg_phys_150',
      chunkLabel: 'Thermodynamics & Heat Capacity Report - Part 1',
      chunkIndex: 1,
      totalChunks: 2,
      scheduledDate: wedKey,
      scheduledStartTime: '13:30',
      scheduledEndTime: '15:15',
      durationMinutes: 105,
      status: 'Scheduled',
      isManualOverride: false,
    },
    {
      id: 'chunk_phys_part2',
      assignmentId: 'asg_phys_150',
      chunkLabel: 'Thermodynamics & Heat Capacity Report - Part 2',
      chunkIndex: 2,
      totalChunks: 2,
      scheduledDate: thuKey,
      scheduledStartTime: '15:00',
      scheduledEndTime: '16:45',
      durationMinutes: 105,
      status: 'Scheduled',
      isManualOverride: false,
    },
  ];
}

// Local Storage Wrappers
export function loadUser(): UserProfile {
  if (typeof window === 'undefined') return INITIAL_USER;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    return raw ? JSON.parse(raw) : INITIAL_USER;
  } catch {
    return INITIAL_USER;
  }
}

export function saveUser(user: UserProfile) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
}

export function loadWindows(): AvailabilityWindow[] {
  if (typeof window === 'undefined') return INITIAL_WINDOWS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WINDOWS);
    return raw ? JSON.parse(raw) : INITIAL_WINDOWS;
  } catch {
    return INITIAL_WINDOWS;
  }
}

export function saveWindows(windows: AvailabilityWindow[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.WINDOWS, JSON.stringify(windows));
}

export function loadCourses(): Course[] {
  if (typeof window === 'undefined') return INITIAL_COURSES;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COURSES);
    if (!raw) {
      saveCourses(INITIAL_COURSES);
      return INITIAL_COURSES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_COURSES;
  }
}

export function saveCourses(courses: Course[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.COURSES, JSON.stringify(courses));
}

// Sync course information into assignments if course was renamed or color changed
export function syncAssignmentsWithCourses(assignments: Assignment[], courses: Course[]): Assignment[] {
  const courseMap = new Map(courses.map((c) => [c.id, c]));
  return assignments.map((a) => {
    const c = courseMap.get(a.courseId);
    if (!c) return a;
    return {
      ...a,
      courseCode: c.code,
      courseName: c.name,
      courseColor: c.color,
    };
  });
}

export function loadAssignments(): Assignment[] {
  if (typeof window === 'undefined') return getInitialAssignments();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
    if (!raw) {
      const initial = getInitialAssignments();
      saveAssignments(initial);
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return getInitialAssignments();
  }
}

export function saveAssignments(assignments: Assignment[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(assignments));
}

export function loadChunks(): TaskChunk[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CHUNKS);
    if (!raw) {
      const initialAssignments = loadAssignments();
      const initialChunks = getInitialChunks(initialAssignments);
      saveChunks(initialChunks);
      return initialChunks;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveChunks(chunks: TaskChunk[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.CHUNKS, JSON.stringify(chunks));
}

export function loadLearning(): Record<AssignmentCategoryType, CategorySpeedLearning> {
  if (typeof window === 'undefined') return INITIAL_LEARNING;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LEARNING);
    return raw ? JSON.parse(raw) : INITIAL_LEARNING;
  } catch {
    return INITIAL_LEARNING;
  }
}

export function saveLearning(learning: Record<AssignmentCategoryType, CategorySpeedLearning>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.LEARNING, JSON.stringify(learning));
}

export function resetAllDataToDefault() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.USER);
  localStorage.removeItem(STORAGE_KEYS.WINDOWS);
  localStorage.removeItem(STORAGE_KEYS.COURSES);
  localStorage.removeItem(STORAGE_KEYS.ASSIGNMENTS);
  localStorage.removeItem(STORAGE_KEYS.CHUNKS);
  localStorage.removeItem(STORAGE_KEYS.LEARNING);
  window.location.reload();
}
