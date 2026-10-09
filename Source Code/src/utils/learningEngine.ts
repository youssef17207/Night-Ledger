import { AssignmentCategoryType, CategoryPreset, CategorySpeedLearning } from '../types/scheduler';

export const CATEGORY_PRESETS: CategoryPreset[] = [
  {
    id: 'problem_set',
    label: 'Math / Problem Sheet',
    defaultMinutes: 60,
    description: 'Worksheet questions, math exercises, practice problems',
  },
  {
    id: 'reading',
    label: 'Reading & Chapters',
    defaultMinutes: 45,
    description: 'Textbook reading, articles, novel chapters, review',
  },
  {
    id: 'essay',
    label: 'Essay / Writing',
    defaultMinutes: 90,
    description: 'Paragraphs, research essay, book report, journal',
  },
  {
    id: 'lab_report',
    label: 'Science Project / Lab',
    defaultMinutes: 90,
    description: 'Science report, experiment results, poster board',
  },
  {
    id: 'coding_project',
    label: 'Computer / Tech Task',
    defaultMinutes: 60,
    description: 'Coding assignment, computer research, slide deck',
  },
  {
    id: 'exam_prep',
    label: 'Quiz / Test Review',
    defaultMinutes: 60,
    description: 'Flashcards, study guide, reviewing class notes',
  },
  {
    id: 'presentation',
    label: 'Presentation / Speech',
    defaultMinutes: 45,
    description: 'Slides, practicing speech, visual project',
  },
];

export const COURSE_PALETTES = [
  { name: 'Blue', bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-900', bar: 'bg-blue-500', hex: '#2563eb' },
  { name: 'Green', bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-900', bar: 'bg-emerald-500', hex: '#059669' },
  { name: 'Orange', bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-900', bar: 'bg-amber-500', hex: '#ea580c' },
  { name: 'Purple', bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-900', bar: 'bg-purple-500', hex: '#7c3aed' },
  { name: 'Pink', bg: 'bg-rose-100', border: 'border-rose-300', text: 'text-rose-900', bar: 'bg-rose-500', hex: '#e11d48' },
  { name: 'Sky', bg: 'bg-sky-100', border: 'border-sky-300', text: 'text-sky-900', bar: 'bg-sky-500', hex: '#0284c7' },
  { name: 'Teal', bg: 'bg-teal-100', border: 'border-teal-300', text: 'text-teal-900', bar: 'bg-teal-500', hex: '#0d9488' },
  { name: 'Yellow', bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-900', bar: 'bg-yellow-500', hex: '#ca8a04' },
];

export function getSmartDurationSuggestion(
  category: AssignmentCategoryType,
  learningHistory: Record<AssignmentCategoryType, CategorySpeedLearning>
): {
  baseMinutes: number;
  suggestedMinutes: number;
  speedRatio: number;
  sampleCount: number;
  insight: string;
} {
  const preset = CATEGORY_PRESETS.find((p) => p.id === category) || CATEGORY_PRESETS[0];
  const history = learningHistory[category];

  if (!history || history.completedCount === 0) {
    return {
      baseMinutes: preset.defaultMinutes,
      suggestedMinutes: preset.defaultMinutes,
      speedRatio: 1.0,
      sampleCount: 0,
      insight: `Standard benchmark for ${preset.label} is ${(preset.defaultMinutes / 60).toFixed(1)} hrs.`,
    };
  }

  // Calculate refined estimate
  const ratio = history.speedRatio;
  // Round to nearest 15 minutes
  const rawSuggested = preset.defaultMinutes * ratio;
  const suggestedMinutes = Math.max(15, Math.round(rawSuggested / 15) * 15);

  let insight = '';
  if (ratio > 1.08) {
    const pct = Math.round((ratio - 1) * 100);
    insight = `Based on your past ${history.completedCount} completed items, you usually take ${pct}% longer than baseline. Adjusted to ${(suggestedMinutes / 60).toFixed(1)} hrs.`;
  } else if (ratio < 0.92) {
    const pct = Math.round((1 - ratio) * 100);
    insight = `Based on your past ${history.completedCount} completed items, you work ${pct}% faster than baseline! Suggested ${(suggestedMinutes / 60).toFixed(1)} hrs.`;
  } else {
    insight = `Your actual pace aligns closely with the ${(suggestedMinutes / 60).toFixed(1)} hrs baseline across ${history.completedCount} items.`;
  }

  return {
    baseMinutes: preset.defaultMinutes,
    suggestedMinutes,
    speedRatio: ratio,
    sampleCount: history.completedCount,
    insight,
  };
}

export function recordCompletedPace(
  currentHistory: Record<AssignmentCategoryType, CategorySpeedLearning>,
  category: AssignmentCategoryType,
  estimatedMinutes: number,
  actualMinutes: number
): Record<AssignmentCategoryType, CategorySpeedLearning> {
  const existing = currentHistory[category] || {
    category,
    completedCount: 0,
    totalEstimatedMinutes: 0,
    totalActualMinutes: 0,
    speedRatio: 1.0,
  };

  const newCount = existing.completedCount + 1;
  const newEstTotal = existing.totalEstimatedMinutes + estimatedMinutes;
  const newActTotal = existing.totalActualMinutes + actualMinutes;
  const newRatio = Number((newActTotal / Math.max(1, newEstTotal)).toFixed(2));

  return {
    ...currentHistory,
    [category]: {
      category,
      completedCount: newCount,
      totalEstimatedMinutes: newEstTotal,
      totalActualMinutes: newActTotal,
      speedRatio: newRatio,
    },
  };
}
