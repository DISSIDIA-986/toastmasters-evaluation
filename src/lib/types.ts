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
