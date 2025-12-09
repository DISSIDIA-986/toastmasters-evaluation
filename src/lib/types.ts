export interface Meeting {
  id: number;
  name: string;
  date: string;
  created_at: string;
}

export interface Evaluation {
  id: number;
  meeting_id: number;
  evaluator_name: string;
  speaker_name: string;
  speech_type: 'prepared' | 'table_topics';
  commend_tags: string[];
  recommend_tags: string[];
  challenge_tags: string[];
  comments: string;
  created_at: string;
  // Joined fields
  meeting_name?: string;
  meeting_date?: string;
}

export interface EvaluationFormData {
  evaluator_name: string;
  speaker_name: string;
  speech_type: 'prepared' | 'table_topics';
  commend_tags: string[];
  recommend_tags: string[];
  challenge_tags: string[];
  comments: string;
}

export const SPEECH_TYPES = {
  prepared: 'Prepared Speech',
  table_topics: 'Table Topics',
} as const;

export const SCORE_LABELS = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
} as const;

// ============ Statistician Report Types ============

// Ah-Um Counter: tracks filler words per speaker
export interface AhUmEntry {
  speaker_name: string;
  ah_um: number;
  like: number;
  so: number;
  but: number;
  other: number;
}

export interface AhUmReport {
  id: number;
  meeting_id: number;
  reporter_name: string;
  entries: AhUmEntry[];
  created_at: string;
}

// Grammarian: tracks language usage
export interface GrammarEntry {
  speaker_name: string;
  phrase: string;
  is_positive: boolean; // true = good usage, false = needs correction
  comment: string;
}

export interface GrammarianReport {
  id: number;
  meeting_id: number;
  reporter_name: string;
  word_of_day: string;
  word_of_day_definition: string;
  entries: GrammarEntry[];
  created_at: string;
}

// Timer: tracks timing for meeting segments
export interface TimerEntry {
  role: string;
  speaker_name: string;
  title_topic: string;
  duration_seconds: number; // stored as seconds for easy calculation
  status: 'green' | 'yellow' | 'red' | 'over'; // timing status
}

export interface TimerReport {
  id: number;
  meeting_id: number;
  reporter_name: string;
  meeting_start: string;
  meeting_end: string;
  entries: TimerEntry[];
  created_at: string;
}

// Form data types
export interface AhUmReportFormData {
  reporter_name: string;
  entries: AhUmEntry[];
}

export interface GrammarianReportFormData {
  reporter_name: string;
  word_of_day: string;
  word_of_day_definition: string;
  entries: GrammarEntry[];
}

export interface TimerReportFormData {
  reporter_name: string;
  meeting_start: string;
  meeting_end: string;
  entries: TimerEntry[];
}

// Common role types for Timer
export const MEETING_ROLES = [
  'SAA',
  'Chair',
  'Secretary',
  'Timer',
  'Grammarian',
  'Ah-Um Counter',
  'Toastmaster',
  'Speaker 1',
  'Speaker 2',
  'Speaker 3',
  'Speaker 4',
  'Speaker 5',
  'General Evaluator',
  'Evaluator 1',
  'Evaluator 2',
  'Evaluator 3',
  'Evaluator 4',
  'Evaluator 5',
  'Table Topics Master',
  'TT Speaker 1',
  'TT Speaker 2',
  'TT Speaker 3',
  'TT Speaker 4',
  'TT Speaker 5',
  'TT Speaker 6',
  'Guest/Coordinator',
] as const;

// Filler word types for Ah-Um Counter
export const FILLER_WORDS = ['ah_um', 'like', 'so', 'but', 'other'] as const;

// ============ General Evaluator Report Types ============

// Evaluation of a Speech Evaluator
export interface EvaluatorFeedback {
  evaluator_name: string;
  speaker_evaluated: string; // who they evaluated
  rating: 1 | 2 | 3 | 4 | 5; // 1-5 scale
  strengths: string;
  areas_to_improve: string;
  comments: string;
}

// Evaluation of Meeting Functionaries (Timer, Grammarian, Ah-Um Counter)
export interface FunctionaryFeedback {
  role: 'Timer' | 'Grammarian' | 'Ah-Um Counter' | 'Table Topics Master' | 'Toastmaster' | 'Other';
  person_name: string;
  rating: 1 | 2 | 3 | 4 | 5;
  feedback: string;
}

// General Evaluator Report
export interface GeneralEvaluatorReport {
  id: number;
  meeting_id: number;
  reporter_name: string; // General Evaluator's name
  evaluator_feedbacks: EvaluatorFeedback[]; // Feedback for Speech Evaluators
  functionary_feedbacks: FunctionaryFeedback[]; // Feedback for Timer, Grammarian, etc.
  meeting_highlights: string; // What went well in the meeting
  meeting_improvements: string; // What could be improved
  overall_comments: string; // General observations
  created_at: string;
}

// Form data type
export interface GeneralEvaluatorReportFormData {
  reporter_name: string;
  evaluator_feedbacks: EvaluatorFeedback[];
  functionary_feedbacks: FunctionaryFeedback[];
  meeting_highlights: string;
  meeting_improvements: string;
  overall_comments: string;
}

// Roles that General Evaluator can evaluate
export const FUNCTIONARY_ROLES = [
  'Timer',
  'Grammarian',
  'Ah-Um Counter',
  'Table Topics Master',
  'Toastmaster',
  'Other',
] as const;

// ============ Type Guards for JSONB Validation (P1 Security) ============

// Type guard for AhUmEntry - validates JSONB data from database
export function isValidAhUmEntry(entry: unknown): entry is AhUmEntry {
  if (typeof entry !== 'object' || entry === null) return false;
  const e = entry as Record<string, unknown>;
  return (
    typeof e.speaker_name === 'string' &&
    typeof e.ah_um === 'number' &&
    typeof e.like === 'number' &&
    typeof e.so === 'number' &&
    typeof e.but === 'number' &&
    typeof e.other === 'number'
  );
}

// Type guard for GrammarEntry - validates JSONB data from database
export function isValidGrammarEntry(entry: unknown): entry is GrammarEntry {
  if (typeof entry !== 'object' || entry === null) return false;
  const e = entry as Record<string, unknown>;
  return (
    typeof e.speaker_name === 'string' &&
    typeof e.phrase === 'string' &&
    typeof e.is_positive === 'boolean' &&
    typeof e.comment === 'string'
  );
}

// Type guard for TimerEntry - validates JSONB data from database
export function isValidTimerEntry(entry: unknown): entry is TimerEntry {
  if (typeof entry !== 'object' || entry === null) return false;
  const e = entry as Record<string, unknown>;
  return (
    typeof e.role === 'string' &&
    typeof e.speaker_name === 'string' &&
    typeof e.title_topic === 'string' &&
    typeof e.duration_seconds === 'number' &&
    (e.status === 'green' || e.status === 'yellow' || e.status === 'red' || e.status === 'over')
  );
}

// Helper to validate and filter an array of entries
export function validateAhUmEntries(entries: unknown[]): AhUmEntry[] {
  if (!Array.isArray(entries)) return [];
  return entries.filter(isValidAhUmEntry);
}

export function validateGrammarEntries(entries: unknown[]): GrammarEntry[] {
  if (!Array.isArray(entries)) return [];
  return entries.filter(isValidGrammarEntry);
}

export function validateTimerEntries(entries: unknown[]): TimerEntry[] {
  if (!Array.isArray(entries)) return [];
  return entries.filter(isValidTimerEntry);
}

// Type guard for EvaluatorFeedback
export function isValidEvaluatorFeedback(entry: unknown): entry is EvaluatorFeedback {
  if (typeof entry !== 'object' || entry === null) return false;
  const e = entry as Record<string, unknown>;
  return (
    typeof e.evaluator_name === 'string' &&
    typeof e.speaker_evaluated === 'string' &&
    typeof e.rating === 'number' &&
    e.rating >= 1 && e.rating <= 5 &&
    typeof e.strengths === 'string' &&
    typeof e.areas_to_improve === 'string' &&
    typeof e.comments === 'string'
  );
}

// Type guard for FunctionaryFeedback
export function isValidFunctionaryFeedback(entry: unknown): entry is FunctionaryFeedback {
  if (typeof entry !== 'object' || entry === null) return false;
  const e = entry as Record<string, unknown>;
  const validRoles = ['Timer', 'Grammarian', 'Ah-Um Counter', 'Table Topics Master', 'Toastmaster', 'Other'];
  return (
    typeof e.role === 'string' &&
    validRoles.includes(e.role) &&
    typeof e.person_name === 'string' &&
    typeof e.rating === 'number' &&
    e.rating >= 1 && e.rating <= 5 &&
    typeof e.feedback === 'string'
  );
}

export function validateEvaluatorFeedbacks(entries: unknown[]): EvaluatorFeedback[] {
  if (!Array.isArray(entries)) return [];
  return entries.filter(isValidEvaluatorFeedback);
}

export function validateFunctionaryFeedbacks(entries: unknown[]): FunctionaryFeedback[] {
  if (!Array.isArray(entries)) return [];
  return entries.filter(isValidFunctionaryFeedback);
}
