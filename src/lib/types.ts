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
  content_score: number;
  delivery_score: number;
  language_score: number;
  time_score: number;
  overall_score: number;
  strengths: string;
  improvements: string;
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
  content_score: number;
  delivery_score: number;
  language_score: number;
  time_score: number;
  overall_score: number;
  strengths: string;
  improvements: string;
  comments: string;
}

export const SPEECH_TYPES = {
  prepared: 'Prepared Speech',
  table_topics: 'Table Topics',
} as const;

export const SCORE_LABELS = {
  1: 'Needs Work',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
} as const;

export const EVALUATION_DIMENSIONS = [
  {
    key: 'content_score',
    label: 'Content',
    description: 'Topic depth, structure, and value',
  },
  {
    key: 'delivery_score',
    label: 'Delivery',
    description: 'Voice, body language, eye contact',
  },
  {
    key: 'language_score',
    label: 'Language',
    description: 'Clarity, vocabulary, grammar',
  },
  {
    key: 'time_score',
    label: 'Time Control',
    description: 'Within time limits',
  },
  {
    key: 'overall_score',
    label: 'Overall',
    description: 'General impression',
  },
] as const;
