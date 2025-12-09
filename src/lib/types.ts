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
