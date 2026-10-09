import { AssignmentCategoryType, CategoryPreset, LearningHistory } from '../types/scheduler';

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

/**
 * Class colours. The first five are the Night Ledger highlighter pastels from the
 * palette sheet; the rest extend it in the same family so a student with more than
 * five classes never has to reuse a colour. All take ink (#15121A) text.
 */
export const COURSE_PALETTES = [
  { name: 'Lilac', hex: '#AA92FF' },
  { name: 'Rose', hex: '#FF8AB0' },
  { name: 'Pistachio', hex: '#A9E67E' },
  { name: 'Aqua', hex: '#5ED9CB' },
  { name: 'Tangerine', hex: '#FF9650' },
  { name: 'Butter', hex: '#F4DE7B' },
  { name: 'Sky', hex: '#82C7FF' },
  { name: 'Orchid', hex: '#E49BFF' },
  { name: 'Coral', hex: '#FF7A7A' },
];

export function getSmartDurationSuggestion(
  category: AssignmentCategoryType,
  learningHistory: LearningHistory
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
      insight: `Typical ${preset.label.toLowerCase()} takes about ${(preset.defaultMinutes / 60).toFixed(1)} hrs. Time a few sessions and this will learn your pace.`,
    };
  }

  const ratio = history.speedRatio;
  const rawSuggested = preset.defaultMinutes * ratio;
  const suggestedMinutes = Math.max(15, Math.round(rawSuggested / 15) * 15);

  let insight = '';
  if (ratio > 1.08) {
    const pct = Math.round((ratio - 1) * 100);
    insight = `Across ${history.completedCount} timed sessions you run ${pct}% over the estimate, so we suggest ${(suggestedMinutes / 60).toFixed(1)} hrs.`;
  } else if (ratio < 0.92) {
    const pct = Math.round((1 - ratio) * 100);
    insight = `Across ${history.completedCount} timed sessions you finish ${pct}% faster than the estimate. Suggested ${(suggestedMinutes / 60).toFixed(1)} hrs.`;
  } else {
    insight = `Your real pace matches the ${(suggestedMinutes / 60).toFixed(1)} hr baseline across ${history.completedCount} timed sessions.`;
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
  currentHistory: LearningHistory,
  category: AssignmentCategoryType,
  estimatedMinutes: number,
  actualMinutes: number
): LearningHistory {
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
